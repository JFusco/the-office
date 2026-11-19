import { METADATA_FINDING } from '../publication/metadata-admission';
import { conflictOnlyAssessment } from '../repairs/conflict-repair';
import { harnessDelivers } from '../harness/scope';
import type { GitHubDelivery } from './github-delivery';
import type { StageResult, TicketJob } from '../../../src/shared';

/**
 * Acts on a readiness assessment the harness accepted: a CI repair, a source or conflict repair, or the
 * ordinary close of the review. One place, so the first dispatch and a later one of the same saved
 * assessment do the same thing. False when a CI repair took the job, which records its own outcome.
 */
export async function dispatchLeadAssessment(delivery: GitHubDelivery, job: TicketJob, result: StageResult, root: string): Promise<boolean> {
    if (result.findings.some(f => f.id === METADATA_FINDING && f.status === 'open'))
        throw new Error('Unadmitted reserved PR metadata finding requires reconciliation; no source or CI repair');
    if (harnessDelivers(delivery.store, job) && !conflictOnlyAssessment(result) && ['blocked', 'failed'].includes(result.outcome)) {
        job.status = 'watching';
        if (await delivery.queueCIRepair(job)) return false;
        job.status = 'working';
    }
    if ((!conflictOnlyAssessment(result) || job.existingPR && !job.worktree && harnessDelivers(delivery.store, job)) && await delivery.queueSourceRepair(job, result, root)) return true;
    await delivery.finishLeadReview(job, result);
    return true;
}
