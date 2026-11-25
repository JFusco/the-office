import { assertDeliveryMayMutate } from '../harness/guards';
import { decisionMarker } from './decision-marker';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';
import type { MetadataParkBinding } from '../../../src/contracts/metadata-park';

/** A park the harness words itself: its reason and how to resume, posted under its decision marker, and what it was decided on. */
export interface HarnessPark { reason: string; instruction: string; metadata: MetadataParkBinding }

/**
 * Saves a harness-worded metadata park once, before any provider write: its words, its marker and its binding.
 * Entering the same park again keeps the original time, marker, reason, instruction and binding; any other park
 * already on the job refuses, writing nothing.
 */
export function recordMetadataPark(delivery: GitHubDelivery, job: TicketJob, harness: HarnessPark): NonNullable<TicketJob['parked']> {
    const { store } = delivery;
    assertDeliveryMayMutate(store, delivery.jobs, job, job.head);
    if (job.parked) {
        if (job.parked.published || job.parked.marker !== decisionMarker(job) || !job.parked.metadata) throw new Error('Another park is already recorded for this job; nothing was written');
        return job.parked;
    }
    const reason = harness.reason.trim();
    job.parked = { stage: job.stage, reason, at: store.clock.now().toISOString(), published: false, instruction: harness.instruction, marker: decisionMarker(job), metadata: structuredClone(harness.metadata) };
    job.detail = `Decision needed: ${reason}`;
    store.save();
    return job.parked;
}
