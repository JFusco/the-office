import type { AssignmentReview } from '../../src/shared';
import type { Store } from '../store/store';

export class AssignmentTransitionRefused extends Error {}

/**
 * Requeues a stopped assignment review for the Office's repair resume. Returns the detail of the
 * receipt; the caller emits the event. Throws, changing nothing, for a review that is queued or
 * working, and for one whose ticket a delivery job holds in any status but `cancelled`, a
 * completed one included.
 *
 * Writes only the review's status and `queuedAt`, from the store's clock. Its IT recovery count
 * and its read-retry record stay as they are, a spent budget included: this is no recheck, and the
 * ordinary retry planner and IT's ownership recovery keep their own limits. The operator's
 * `recheck` (operator-commands.ts) is not this: it picks the latest review for the key, resets the
 * IT count and emits its own event.
 */
export function requeueAssignmentReview(store: Store, review: AssignmentReview): string {
    if (['queued', 'working'].includes(review.status)) throw new AssignmentTransitionRefused(`The assignment review of ${review.key} is already ${review.status}`);
    const job = store.state.coordination?.jobs?.find(job => job.key === review.key && job.status !== 'cancelled');
    if (job) throw new AssignmentTransitionRefused(`Delivery already holds ${review.key} (${job.status}); its review is not run again`);
    review.status = 'queued';
    review.queuedAt = store.clock.now().toISOString();
    return `${review.key} queued for PM ownership read-back; recovery counts and retry history kept.`;
}
