import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { runtimeRevision } from '../../office/revision';
import { currentAssignment } from '../../workers/assignment-context';
import { CARD_STATUS_QUERY, cardStatusFrom } from '../board/project-graphql';
import type { command } from '../../workers/process';
import type { Store } from '../../store/store';
import type { BoardUpdate, TicketJob, WorkClaim } from '../../../src/shared';

const executingRevision = runtimeRevision().hash;
/** The fixed command of a draft's recorded card read; its query and variables travel on stdin. */
export const CARD_READ_ARGS = ['api', 'graphql', '--input', '-'] as const;
const OUTCOMES = /^(?:started|completed|missing-field|incomplete|graphql-error|unclassified-error|http-\d{3})$/;
const saved = (update: BoardUpdate) => ({ stage: update.stage, head: update.head, project: update.project, item: update.item, field: update.field, option: update.option, at: update.at });

/**
 * Reads one saved card move of a draft back with the fixed item-field query, recorded the way a draft's publication
 * reads are (`read-command.ts`): in the original attempts ledger under the live draft claim, matched to an owned
 * artifact, so a later first issue comment can prove what this claim did. `pr` is the pull request the move was for,
 * saved when the job had none yet. Returns the option the card shows for the saved field, or undefined when it has
 * none. Coverage and provider failures throw, and leave the move unresolved.
 */
export async function readSavedCard(store: Store, execute: typeof command, job: TicketJob, root: string, update: BoardUpdate, pr = job.pr): Promise<string | undefined> {
    const repository = store.project.repository, id = `publication-read-${randomUUID()}`, path = resolve(root, `${id}.json`);
    const assignment = currentAssignment(), claim = structuredClone(assignment?.claim || null);
    const original = claim && store.db.prepare("SELECT body FROM work_claims WHERE id=? AND status='running'").get(claim.id) as { body: string } | undefined;
    const assignedDraft = job.stage === 'draft' && assignment?.lane === 'delivery' && claim?.lane === 'delivery' && claim.stage === 'draft' &&
        claim.work.projectId === store.project.id && claim.work.kind === 'delivery' && claim.work.id === job.id && original && isDeepStrictEqual(JSON.parse(original.body), claim);
    const input = { query: CARD_STATUS_QUERY, variables: { item: update.item } };
    const proof = { protocol: 'draft-card-read-v1', revision: executingRevision, repository, issue: Number(job.key.slice(3)), jobId: job.id, head: job.head,
        pr: job.pr, boundPr: pr, key: job.key, claim, lane: assignment?.lane || null, read: 'card-status', program: 'gh', args: [...CARD_READ_ARGS], input,
        update: saved(update), readOnly: true, attempts: [] as { at: string; outcome: string }[] };
    const save = () => {
        const body = JSON.stringify(proof, null, 2);
        writeFileSync(path, body, { mode: 0o600 });
        store.db.prepare('INSERT INTO attempts(id,ticket,stage,status,session,body) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,body=excluded.body')
            .run(id, job.key, 'publication-read', proof.attempts.at(-1)!.outcome, assignedDraft ? claim!.id : '', body);
    };
    proof.attempts.push({ at: store.clock.now().toISOString(), outcome: 'started' }); save();
    let data: any;
    try {
        const result = JSON.parse(await execute('gh', [...CARD_READ_ARGS], { input: JSON.stringify(input), cwd: store.project.repo, timeout: 60000, readOnly: true }));
        if (result.errors?.length) { proof.attempts.at(-1)!.outcome = 'graphql-error'; save(); throw new Error(result.errors.map((e: any) => e.message).join('; ')); }
        data = result.data;
    } catch (error) {
        if (proof.attempts.at(-1)!.outcome === 'started') {
            const status = String(error instanceof Error ? error.message : error).match(/\bHTTP (\d{3})\b/)?.[1];
            proof.attempts.at(-1)!.outcome = status ? `http-${status}` : 'unclassified-error'; save();
        }
        throw error;
    }
    let option: string | undefined;
    try { option = cardStatusFrom(data, update.item, update.field); }
    catch (error) { proof.attempts.at(-1)!.outcome = 'incomplete'; save(); throw error; }
    proof.attempts.at(-1)!.outcome = option === undefined ? 'missing-field' : 'completed'; save();
    return option;
}

/**
 * True when a ledger record is this job's recorded card read under `claim`: the fixed command, query and variables, a
 * saved draft move of this head, this repository, issue and job, and the original live claim with in-window times.
 * A read made before the job had its pull request proves it only with the exact pull request it was bound to.
 */
export function validCardRead(store: Store, job: TicketJob, claim: WorkClaim, proof: any): boolean {
    const update = proof?.update;
    return proof?.protocol === 'draft-card-read-v1' && /^[a-f0-9]{64}$/.test(proof.revision) && proof.repository === store.project.repository &&
        proof.jobId === job.id && proof.key === job.key && proof.issue === Number(job.key.slice(3)) && proof.head === job.head && proof.read === 'card-status' &&
        job.pr > 0 && (proof.pr === job.pr || proof.pr === 0 && proof.boundPr === job.pr) &&
        proof.lane === 'delivery' && isDeepStrictEqual(proof.claim, { ...claim, status: 'running', endedAt: '' }) && proof.program === 'gh' && proof.readOnly === true &&
        isDeepStrictEqual(proof.args, [...CARD_READ_ARGS]) && isDeepStrictEqual(proof.input, { query: CARD_STATUS_QUERY, variables: { item: update?.item } }) &&
        update?.stage === 'draft' && update.head === job.head && (job.boardUpdates || []).some(saved => isDeepStrictEqual({ stage: saved.stage, head: saved.head, project: saved.project, item: saved.item, field: saved.field, option: saved.option, at: saved.at }, update)) &&
        Array.isArray(proof.attempts) && proof.attempts.length === 1 && proof.attempts.every((attempt: any) => Date.parse(attempt.at) >= Date.parse(claim.claimedAt) &&
            Date.parse(attempt.at) <= Date.parse(claim.endedAt) && OUTCOMES.test(attempt.outcome));
}
