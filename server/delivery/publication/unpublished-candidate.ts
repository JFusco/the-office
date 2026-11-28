import type { ReturnPublication } from '../../../src/contracts/release-marker';
import { workKey, type TicketJob } from '../../../src/shared';
import type { Store } from '../../store/store';
import { verifyRepairCandidate } from '../repairs/delivery-repairs';
import { remoteRefs } from './marker-publication';
import type { Execute } from './original-git';
import { indeterminate } from './release-marker-stop';

type Candidate = Readonly<{ head: string; branch: string; worktree: string }>;

/**
 * Proof that a local candidate was never published, read the way the saved-prerequisite handoff and implementation
 * recovery read it: the verified origin, branch and clean checkout; the live refs, with the candidate branch absent;
 * no pull request for the branch in any state; and no publication or unsettled write in the job's own Effects history.
 * Anything else is a typed stop, never a return.
 */
export async function unpublishedCandidate(store: Store, execute: Execute, job: TicketJob, candidate: Candidate): Promise<ReturnPublication> {
    try { await verifyRepairCandidate(store.project, candidate, execute); }
    catch (error) { throw indeterminate(`the checkout moved: ${String(error).replace(/^Error:\s*/, '').slice(0, 200)}`); }
    if (job.pr || job.existingPR) throw indeterminate(`published suffix: the job already publishes PR #${job.pr}`);
    const refs = await remoteRefs(execute, candidate, store.project.target);
    if (refs.candidate) throw indeterminate(`published suffix: ${candidate.branch} is already on the remote at ${refs.candidate}`);
    const prs = JSON.parse(await execute('gh', ['pr', 'list', '--repo', store.project.repository, '--head', candidate.branch, '--state', 'all', '--json', 'number'], { cwd: store.project.repo, timeout: 60000, readOnly: true }));
    if (!Array.isArray(prs) || prs.length) throw indeterminate(`published suffix: ${candidate.branch} already has a pull request`);
    const effects = (store.db.prepare('SELECT body FROM effects WHERE work_key=?').all(workKey({ projectId: store.project.id, kind: 'delivery', id: job.id })) as { body: string }[]).map(row => JSON.parse(row.body));
    if (effects.some(effect => ['prepared', 'dispatching', 'uncertain'].includes(effect.status)))
        throw indeterminate('incomplete proof: a write of this job is still unsettled in the Effects ledger');
    if (effects.some(effect => ['git-push', 'github-pr-create'].includes(effect.operation) && (effect.status === 'verified' || effect.dispatchedAt)))
        throw indeterminate('published suffix: the job has a saved publication');
    return { candidate: refs.candidate, target: refs.target, pullRequests: 0, observedAt: store.clock.now().toISOString() };
}

/**
 * The remote still shows what a return was proven against: the same target and an absent candidate branch. Movement
 * of either is a typed stop at `moment`, before any dispatch, ref update or spent return.
 */
export function samePublication(saved: ReturnPublication, observed: ReturnPublication, moment: string): void {
    if (observed.candidate !== saved.candidate || observed.target !== saved.target)
        throw indeterminate(`the remote refs moved ${moment}: target ${saved.target} → ${observed.target || '(absent)'}, candidate ${saved.candidate || '(absent)'} → ${observed.candidate || '(absent)'}; nothing was written`);
}
