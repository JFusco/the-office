import { harnessDelivers } from '../harness/scope';
import { decisionMarker, park } from './park';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';

/**
 * Finishes a harness-worded park (`park-unadmitted-metadata.ts`) that stopped before it was published, on the
 * job's next pass at its readiness review, in place of another review. The park is entered again with its
 * stored words, under the same decision marker and lane operation, so a comment or card move already sent is
 * settled by read-back and never sent again. Only the park of the job's saved review step, head and pull
 * request qualifies. True when the park was entered again.
 */
export async function finishMetadataPark(delivery: GitHubDelivery, job: TicketJob): Promise<boolean> {
    const parked = job.parked, step = job.steps.at(-1);
    if (!parked || parked.published || !parked.instruction || parked.marker !== decisionMarker(job) || parked.stage !== 'lead-pr' || job.stage !== 'lead-pr' ||
        step?.stage !== 'lead-pr' || step.result.commit !== job.head || step.result.prId !== job.pr || !harnessDelivers(delivery.store, job))
        return false;
    await park(delivery, job, step.result, { reason: parked.reason, instruction: parked.instruction });
    return true;
}
