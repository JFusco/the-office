import type { AssignedIssue, AssignmentReview } from '../../../src/shared';

export interface SettleInputs {
    /** A complete read of the open tickets assigned to the Office. */
    assigned: readonly AssignedIssue[];
    /** True when the Office holds a delivery for the ticket: its review is that delivery's history. */
    hasDelivery: (key: string) => boolean;
    /** A configured hold keeps its review as it is. */
    held: (key: string) => boolean;
    now: Date;
}

/**
 * A stopped assignment review is never run again, so without this it stays in the blocked list whatever
 * happens to its ticket. After a complete assignment read, the latest review of each ticket is closed as
 * history once that ticket is no longer assigned or no longer open. A review of a ticket that is still
 * assigned keeps its status, and with it the read-back a blocked review requires before any new work.
 * Reviews in flight, tickets the Office is delivering and configured holds are left alone, and an empty
 * read settles nothing: it is far likelier a provider fault than every ticket leaving at once.
 * Returns the keys it closed. No model run and no provider write.
 */
export function settleStoppedReviews(reviews: AssignmentReview[], inputs: SettleInputs): string[] {
    if (!inputs.assigned.length) return [];
    const assigned = new Set(inputs.assigned.map(issue => issue.key)), at = inputs.now.toISOString(), closed: string[] = [];
    for (const review of new Map(reviews.map(review => [review.key, review])).values()) {
        if (!['owned', 'blocked', 'held'].includes(review.status) || assigned.has(review.key) || inputs.hasDelivery(review.key) || inputs.held(review.key)) continue;
        review.status = 'cancelled';
        review.endedAt = at;
        review.detail = `No longer assigned to the Office or no longer open; this review is kept as history.\nEarlier intake: ${review.detail}`;
        closed.push(review.key);
    }
    return closed;
}
