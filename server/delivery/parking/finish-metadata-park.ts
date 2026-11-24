import { harnessDelivers } from '../harness/scope';
import { decisionMarker } from './decision-marker';
import { advanceMetadataPark } from './advance-metadata-park';
import { advanceHistoricalPark } from './historical-metadata-park';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

/**
 * Whether the job holds an unpublished harness-worded park of its saved review step, head and pull request: the
 * park a pass at the readiness review finishes instead of reviewing again.
 */
export function activeMetadataPark(store: Store, job: TicketJob): boolean {
    const parked = job.parked, step = job.steps.at(-1);
    return !!parked && !parked.published && !!parked.instruction && parked.marker === decisionMarker(job) && parked.stage === 'lead-pr' && job.stage === 'lead-pr' &&
        step?.stage === 'lead-pr' && step.result.commit === job.head && step.result.prId === job.pr && harnessDelivers(store, job) &&
        (!parked.metadata || parked.metadata.step === job.steps.length - 1);
}

/**
 * Finishes a harness-worded park (`park-unadmitted-metadata.ts`) that stopped before it was published, on the
 * job's next pass at its readiness review, in place of another review. A park with its binding is advanced
 * (`advance-metadata-park.ts`); one saved before parks kept one is only read back (`historical-metadata-park.ts`).
 * A write already sent is settled by read-back under its original intent and never sent again. True when the
 * park took the pass.
 */
export async function finishMetadataPark(delivery: GitHubDelivery, job: TicketJob): Promise<boolean> {
    if (!activeMetadataPark(delivery.store, job)) return false;
    try { await (job.parked!.metadata ? advanceMetadataPark(delivery, job) : advanceHistoricalPark(delivery, job)); }
    finally { job.status = 'blocked'; delivery.store.save(); }
    return true;
}
