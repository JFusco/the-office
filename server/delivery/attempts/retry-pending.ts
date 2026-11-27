import { RETRY_PLAN_GRACE_MS, readRetryPending } from '../../scheduling/read-retries';
import { decidedFor, type DeliveryRetryDecision } from './delivery-retry';
import { queuedRetry } from './retry-binding';
import type { TicketJob } from '../../../src/shared';

/** Reads the owning store's current delivery retry decision for a job, or nothing for a job the reader has no decision for. */
export type RetryReads = (job: TicketJob) => DeliveryRetryDecision | undefined;

/**
 * True while the Office will retry this stop by itself, so it is not a person's to act on. With the owning store's
 * decision: a positive decision for this exact stop, stage and head, scheduled or queued, or within the planner's
 * grace after the stop. Without one (a reader of a saved snapshot alone), the saved timer and the review-stage
 * reading stand as before.
 */
export function deliveryRetryPending(job: TicketJob, at: Date, reads?: RetryReads): boolean {
    if (!reads) return !!job.retry?.nextAt && !job.retry.exhausted || readRetryPending(job, at);
    const decision = reads(job);
    if (!decidedFor(decision, job) || decision!.state !== 'pending') return false;
    if (job.retry?.nextAt || queuedRetry(job)) return true;
    const stopped = Date.parse(job.stop?.at || ''), age = at.getTime() - stopped;
    return Number.isFinite(stopped) && age >= 0 && age <= RETRY_PLAN_GRACE_MS;
}
