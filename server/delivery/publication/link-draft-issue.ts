import { assertDeliveryMayMutate } from '../harness/guards';
import { activeEffectId, harnessEffect } from '../harness/effect';
import { currentAssignment } from '../../workers/assignment-context';
import { workKey, type TicketJob, type WorkClaim, type EffectIntent } from '../../../src/shared';
import { isDeepStrictEqual } from 'node:util';
import { resolve } from 'node:path';
import { artifact } from '../../store/readback-evidence';
import { readBoundedNoFollowSync } from '../../store/owned-artifact';
import type { Store } from '../../store/store';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import { publicationReadArgs, readPublication } from './read-command';

/** Trust only the ledger written during the original live assignment, matched byte for byte
 * to its owned artifact. Neither current source/revision nor a newly supplied file proves history. */
function protectedOriginalClaim(store: Store, job: TicketJob, root: string, claim: WorkClaim): boolean {
    if (!['completed', 'interrupted'].includes(claim.status) || claim.stage !== 'draft' || claim.lane !== 'delivery' ||
        !isDeepStrictEqual(claim.work, { projectId: store.project.id, kind: 'delivery', id: job.id }) ||
        !Number.isFinite(Date.parse(claim.claimedAt)) || !(Date.parse(claim.endedAt) >= Date.parse(claim.claimedAt))) return false;
    const records = store.db.prepare("SELECT id,body FROM attempts WHERE ticket=? AND stage='publication-read' AND session=?").all(job.key, claim.id) as { id: string; body: string }[];
    return records.some(record => {
        try {
            if (!/^publication-read-[a-f0-9-]{36}$/.test(record.id)) return false;
            const path = resolve(root, `${record.id}.json`);
            artifact(store, path); // Includes owned, non-symlink directory checks.
            const file = readBoundedNoFollowSync(path, 64 * 1024);
            if (!('text' in file) || file.text !== record.body) return false;
            const proof = JSON.parse(record.body);
            return proof.protocol === 'draft-publication-read-v1' && /^[a-f0-9]{64}$/.test(proof.revision) &&
                proof.repository === store.project.repository && proof.jobId === job.id && proof.key === job.key &&
                proof.issue === Number(job.key.slice(3)) && (proof.pr === job.pr || proof.read === 'viewer' && proof.pr === 0) && proof.head === job.head &&
                proof.lane === 'delivery' && isDeepStrictEqual(proof.claim, { ...claim, status: 'running', endedAt: '' }) &&
                proof.program === 'gh' && proof.readOnly === true &&
                isDeepStrictEqual(proof.args, publicationReadArgs(proof.repository, proof.read, proof.read === 'issue-comments' ? proof.issue : proof.pr)) &&
                Array.isArray(proof.attempts) && proof.attempts.length >= 1 && proof.attempts.length <= 2 &&
                proof.attempts.every((attempt: any, index: number) => Date.parse(attempt.at) >= Date.parse(claim.claimedAt) &&
                    Date.parse(attempt.at) <= Date.parse(claim.endedAt) && (index === 0 || Date.parse(attempt.at) >= Date.parse(proof.attempts[index - 1].at)) &&
                    /^(?:started|completed|invalid-json|unclassified-error|http-(?:408|429|499|502|503|504))$/.test(attempt.outcome)) &&
                (proof.attempts.length === 1 || /^http-(?:408|429|499|502|503|504)$/.test(proof.attempts[0].outcome));
        } catch { return false; }
    });
}

/** One issue-link comment per original job/issue/PR. Historical uncertain writers are never replayed. */
export async function linkDraftIssue(delivery: GitHubDelivery, job: TicketJob, issue: any, root: string): Promise<void> {
    const { store, execute } = delivery, repository = store.project.repository;
    const identity = { id: job.id, key: job.key, pr: job.pr, head: job.head, branch: job.branch, worktree: job.worktree };
    const number = Number(job.key.slice(3)), url = `https://github.com/${repository}/issues/${number}`, prUrl = `https://github.com/${repository}/pull/${job.pr}`;
    if (issue.number !== number || issue.html_url !== url || job.prUrl !== prUrl || !job.pr) throw new Error('Exact native issue/PR binding is required');
    const guard = () => {
        assertDeliveryMayMutate(store, delivery.jobs, job, identity.head);
        if (JSON.stringify(identity) !== JSON.stringify({ id: job.id, key: job.key, pr: job.pr, head: job.head, branch: job.branch, worktree: job.worktree }))
            throw new Error('Draft comment identity changed');
    };
    const linked = await readPublication(store, execute, job, root, 'issue-links'); guard();
    if (!linked.closingIssuesReferences?.some((item: any) => item.url === url)) throw new Error('GitHub has not confirmed the native issue-to-PR link');
    const viewer = await readPublication(store, execute, job, root, 'viewer'); guard();
    if (typeof viewer.login !== 'string' || !viewer.login) throw new Error('Authenticated comment author is unavailable');
    const marker = `Office delivery ${job.id}`;
    const suffix = 'Sam will check PR readiness; maintainer merge and release gates still apply.';
    const prefix = `${marker}: Draft PR ${prUrl} is linked to this issue. `;
    const body = prefix + suffix;
    const knownHeads = new Set([job.head, ...job.steps.map(step => step.result.commit)]);
    const findComment = async () => {
        const pages = await readPublication(store, execute, job, root, 'issue-comments', number); guard();
        if (!Array.isArray(pages) || !pages.length || pages.some(page => !Array.isArray(page) || page.length > 100)) throw new Error('Complete issue comment pages are required');
        const matches = pages.flat().filter(comment => typeof comment.body === 'string' && comment.body.includes(marker));
        if (!matches.length) return null;
        if (matches.length !== 1) throw new Error('Duplicate historical draft comments require read-back');
        const comment = matches[0];
        // Coverage is historical context only. Require either entire former template,
        // including its retained-review sentence or nonempty review/validation reason.
        const legacy = comment.body.slice(prefix.length, -suffix.length).match(/^Team-selected checks cover ([a-f0-9]{40}); (?:the retained independent review and validation apply\.|review=(?:none|focused|full), validation=(?:developer-checks|independent-checks|browser)\. \S(?:[\s\S]{0,2998}\S)?) $/);
        if (!Number.isSafeInteger(comment.id) || comment.id <= 0 || comment.user?.login !== viewer.login || comment.html_url !== `${url}#issuecomment-${comment.id}` ||
            !(comment.body === body || comment.body.startsWith(prefix) && legacy && knownHeads.has(legacy[1]) && comment.body.endsWith(suffix)))
            throw new Error('Historical draft comment identity/content is unverified');
        return { id: comment.id as number, url: comment.html_url as string };
    };
    const key = `draft-link-comment:${job.pr}`, effectId = activeEffectId(store, `harness:${job.id}:${key}`), prior = store.getEffect(effectId);
    const payload = { issue: number, pr: job.pr, marker, body, author: viewer.login };
    if (prior && (prior.target !== url || prior.operation !== 'github-issue-comment' || prior.work.projectId !== store.project.id || prior.work.id !== job.id ||
        prior.work.kind !== 'delivery' || prior.attemptId !== job.id || JSON.stringify(prior.payload) !== JSON.stringify(payload))) throw new Error('Saved draft comment intent changed');
    const existing = await findComment();
    if (prior?.status === 'verified' && !existing) throw new Error('Previously verified draft comment is no longer observable');
    if (!existing && (!prior || prior.status === 'prepared')) {
        const current = currentAssignment()?.claim.id;
        const claims = store.db.prepare('SELECT body FROM work_claims WHERE work_key=?').all(workKey({ projectId: store.project.id, kind: 'delivery', id: job.id })) as { body: string }[];
        const prefix = `harness:${job.id}:draft-link-comment:`;
        const history = store.db.prepare('SELECT body FROM effects WHERE substr(id,1,?)=?').all(prefix.length, prefix) as { body: string }[];
        const neverDispatched = history.every(row => {
            const intent: EffectIntent = JSON.parse(row.body);
            return intent.status === 'rejected' && intent.dispatchedAt === '' && intent.operation === 'github-issue-comment' &&
                isDeepStrictEqual(intent.work, { projectId: store.project.id, kind: 'delivery', id: job.id }) && intent.attemptId === job.id;
        });
        if (!neverDispatched || claims.some(row => {
            const claim: WorkClaim = JSON.parse(row.body);
            return claim.id !== current && claim.stage === 'draft' && !protectedOriginalClaim(store, job, root, claim);
        }))
            throw new Error('Earlier draft claim has no certain comment receipt; read back its original execution before another write');
    }
    await harnessEffect(store, job, { key, operation: 'github-issue-comment', target: url, payload, guard,
        dispatch: async () => {
            if (!existing) await execute('gh', ['api', `repos/${repository}/issues/${number}/comments`, '--method', 'POST', '-f', `body=${body}`], { cwd: store.project.repo, timeout: 60000 });
            return await findComment() as { id: number; url: string };
        }, readBack: findComment });
}
