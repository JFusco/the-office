import { METADATA_FINDING, type MetadataDecision } from '../publication/metadata-admission';
import { parkUnadmittedMetadata } from '../parking/park-unadmitted-metadata';
import { conflictOnlyAssessment } from '../repairs/conflict-repair';
import { harnessDelivers } from '../harness/scope';
import type { GitHubDelivery } from './github-delivery';
import type { StageResult, TicketJob } from '../../../src/shared';

/**
 * Acts on a readiness assessment the harness accepted: a CI repair, a source or conflict repair, or the
 * ordinary close of the review. One place, so the first dispatch and a later one of the same saved
 * assessment do the same thing. An open reserved metadata finding parks only on the current `human-edit`
 * decision the first dispatch evaluated (`metadata-admission.ts`); a later dispatch carries none and stops.
 * False when a CI repair took the job, or it parked, which record their own outcome.
 */
export async function dispatchLeadAssessment(delivery: GitHubDelivery, job: TicketJob, result: StageResult, root: string, metadata?: MetadataDecision): Promise<boolean> {
    if (result.findings.some(f => f.id === METADATA_FINDING && f.status === 'open')) {
        if (metadata?.route !== 'human-edit' || !harnessDelivers(delivery.store, job))
            throw new Error('Unadmitted reserved PR metadata finding requires reconciliation; no source or CI repair');
        await parkUnadmittedMetadata(delivery, job, result, metadata);
        return false;
    }
    if (harnessDelivers(delivery.store, job) && !conflictOnlyAssessment(result) && ['blocked', 'failed'].includes(result.outcome)) {
        job.status = 'watching';
        if (await delivery.queueCIRepair(job)) return false;
        job.status = 'working';
    }
    if ((!conflictOnlyAssessment(result) || job.existingPR && !job.worktree && harnessDelivers(delivery.store, job)) && await delivery.queueSourceRepair(job, result, root)) return true;
    await delivery.finishLeadReview(job, result);
    return true;
}
