import type { AssignmentReview, OfficeSnapshot } from '../../src/shared';

/** The latest intake review of each ticket, as the assignment listener saved them. */
export function latestReviews(state: OfficeSnapshot): AssignmentReview[] {
    return [...new Map((state.coordination?.listener.reviews || []).map(review => [review.key, review])).values()];
}

/**
 * Of the latest reviews, those blocked because the Office worker cannot read current session ownership:
 * one Office capability blocker, shown to Joe once for all of them. A review with a retry planned, one
 * whose ticket already has a linked pull request, and one a repair in progress covers are not in it.
 */
export function capabilityBlockedReviews(state: OfficeSnapshot, latest: readonly AssignmentReview[], awaitingRepair: (reviewId: string) => boolean): AssignmentReview[] {
    return latest.filter(r => r.status === 'blocked' && !r.retry?.nextAt && !state.coordination?.jobs?.some(j => j.key === r.key && j.pr && j.status !== 'cancelled') && /session.*(?:inventory|read|visibility)|task.claim/i.test(r.detail) && /unavailable|missing|lacks|not available/i.test(r.detail) && !awaitingRepair(r.id));
}
