import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { runtimeRevision } from '../../office/revision';
import { currentAssignment } from '../../workers/assignment-context';
import type { command } from '../../workers/process';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

const executingRevision = runtimeRevision().hash;
type Read = 'pull-request' | 'issue-links' | 'issue-comments' | 'viewer';

/** The same fixed constructor is used to validate original command provenance during recovery. */
export function publicationReadArgs(repository: string, read: Read, number?: number): string[] {
    if (!/^[\w.-]+\/[\w.-]+$/.test(repository) || !['pull-request', 'issue-links', 'issue-comments', 'viewer'].includes(read) ||
        read !== 'viewer' && (!Number.isSafeInteger(number) || number! <= 0))
        throw new Error('Exact publication read identity is required');
    return read === 'issue-links' ? ['pr', 'view', String(number), '--repo', repository, '--json', 'closingIssuesReferences'] :
        ['api', read === 'viewer' ? 'user' : `repos/${repository}/${read === 'pull-request' ? `pulls/${number}` : `issues/${number}/comments?per_page=100`}`,
            '--method', 'GET', ...(read === 'issue-comments' ? ['--paginate', '--slurp'] : [])];
}

/** Fixed GETs only. A transport error never turns a caller-supplied command into a retryable read. */
export async function readPublication(store: Store, execute: typeof command, job: TicketJob, root: string, read: Read, number = job.pr): Promise<any> {
    const repository = store.project.repository, args = publicationReadArgs(repository, read, number);
    const id = `publication-read-${randomUUID()}`, path = resolve(root, `${id}.json`);
    const assignment = currentAssignment(), claim = structuredClone(assignment?.claim || null);
    const original = claim && store.db.prepare("SELECT body FROM work_claims WHERE id=? AND status='running'").get(claim.id) as { body: string } | undefined;
    const assignedDraft = job.stage === 'draft' && assignment?.lane === 'delivery' && claim?.lane === 'delivery' && claim.stage === 'draft' &&
        claim.work.projectId === store.project.id && claim.work.kind === 'delivery' && claim.work.id === job.id && original && isDeepStrictEqual(JSON.parse(original.body), claim);
    const proof = { protocol: 'draft-publication-read-v1', revision: executingRevision, repository, issue: Number(job.key.slice(3)),
        jobId: job.id, head: job.head, pr: job.pr, key: job.key, claim, lane: assignment?.lane || null,
        read, program: 'gh', args, readOnly: true, attempts: [] as { at: string; outcome: string }[] };
    const save = () => {
        const body = JSON.stringify(proof, null, 2);
        writeFileSync(path, body, { mode: 0o600 });
        // Original execution ledger, not a later scan of arbitrary files. Only a live stored
        // draft assignment can bind this record to a claim; terminated claims cannot be backfilled.
        store.db.prepare('INSERT INTO attempts(id,ticket,stage,status,session,body) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,body=excluded.body')
            .run(id, job.key, 'publication-read', proof.attempts.at(-1)!.outcome, assignedDraft ? claim!.id : '', body);
    };
    for (let attempt = 0; attempt < 2; attempt++) {
        proof.attempts.push({ at: store.clock.now().toISOString(), outcome: 'started' }); save();
        let raw: string;
        try {
            raw = await execute('gh', args, { cwd: store.project.repo, timeout: 60000, readOnly: true });
        } catch (error) {
            // Deliberately excludes auth, validation, arbitrary timeouts and unknown command failures.
            const diagnostic = error instanceof Error ? error.message : String(error);
            const match = diagnostic.match(/(?:\bgh: HTTP (408|429|499|502|503|504)\b|\bgh: [^\n]*\(HTTP (408|429|499|502|503|504)\)|(?:^|\bgh exited \d+: |\n)HTTP (408|429|499|502|503|504): )/m);
            const status = match?.slice(1).find(Boolean);
            proof.attempts.at(-1)!.outcome = status ? `http-${status}` : 'unclassified-error'; save();
            if (attempt === 0 && status) continue;
            throw error;
        }
        try {
            const value = JSON.parse(raw);
            proof.attempts.at(-1)!.outcome = 'completed'; save();
            return value;
        } catch (error) {
            proof.attempts.at(-1)!.outcome = 'invalid-json'; save(); throw error;
        }
    }
}
