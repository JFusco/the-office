import type { TicketJob } from '../../src/shared';
import { hasUncertainEffects } from '../delivery/pipeline/uncertain-effects';
import { assertHarnessMayMerge } from '../delivery/readiness/merge-ceiling';
import type { Store } from '../store/store';

/**
 * Requeues a stopped candidate review: a job at `review` that is blocked or interrupted, none of
 * whose steps left an uncertain effect. Returns the detail it set. Throws, changing nothing, for any
 * other job. Emits nothing: the operator's command and the Office's repair resume each say who acted.
 */
export function requeueCandidateReview(job: TicketJob): string {
    if (job.stage !== 'review' || !['blocked', 'interrupted'].includes(job.status) || job.steps.some(s => hasUncertainEffects(s.stage, s.result)))
        throw new Error('A certain inactive read-only candidate review is required');
    job.status = 'queued';
    job.detail = 'Independent candidate review requeued; prior provider failures retained. No source work replayed.';
    return job.detail;
}

/**
 * Requeues a stopped PR review, a merge preflight that sent no merge, or a post-merge CI recovery.
 * A merge preflight is requeued only while the harness may merge. A job any of whose steps left an
 * uncertain effect is refused: its effects are reconciled first. Returns the detail it set; throws,
 * changing nothing, otherwise. Emits nothing, as above.
 */
export function requeuePRReview(store: Store, job: TicketJob): string {
    // A published park waits for its issue card to come back (`server/delivery/parking/resume.ts`): a new review would
    // leave the decision unanswered. A park that stopped part way may be rechecked, which finishes it first.
    if (job.parked?.published)
        throw new Error('Parked for a decision on the issue: do what its comment asks, then move the issue card back to the pickup lane to resume it. A new review does not resume a parked job');
    const mergePreflight = job.stage === 'merge' && !job.mergeAttempt && job.status === 'blocked';
    const mergeRecovery = job.stage === 'ci-recovery' && ['blocked', 'interrupted'].includes(job.status) && !!job.mergeCommit && !job.ciFollowupKey;
    if (!mergePreflight && !mergeRecovery && (job.stage !== 'lead-pr' || !['blocked', 'interrupted', 'watching'].includes(job.status)))
        throw new Error('Only an inactive PR review or a merge preflight with no attempted write can be rechecked');
    if (mergePreflight) assertHarnessMayMerge(store);
    if (job.steps.some(s => hasUncertainEffects(s.stage, s.result)))
        throw new Error('Original effects must be reconciled before a new review');
    job.status = 'queued';
    job.detail = mergeRecovery ? 'Post-merge CI recovery queued; the harness verifies the original failure and bounded retry state before effects.' : ['apply', 'publish'].includes(job.ciRepairs?.at(-1)?.phase || '') ? 'Saved CI repair requeued for guarded reconciliation; diagnosis and prior evidence retained.' : mergePreflight ? 'Merge preflight queued; no prior merge request was sent. Current head and checks will be verified again.' : 'Read-only PR reassessment queued. Prior sessions and results retained; source/publication stages will not replay.';
    return job.detail;
}
