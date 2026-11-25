import type { RepairBoundary } from '../../../src/contracts/incidents';
import type { RepairResume } from '../../../src/contracts/work';
import type { AssignmentReview, OfficeSnapshot } from '../../../src/shared';
import type { Crossing } from './boundary-crossed';

const STAGE = 'assignment-review';
/** The review's own decisions: ready for delivery, owned by other work, or held for a condition. */
const DECIDED: readonly AssignmentReview['status'][] = ['ready', 'owned', 'held'];

/** What an assignment review's resume is judged from: the bound review's status, absent once the project no longer holds it, and whether the boundary was crossed. */
export interface ReviewProgress { status?: AssignmentReview['status']; crossing: Crossing }

/**
 * Whether an assignment review got past the boundary a fix declared, since its resume was
 * admitted. Read on the exact review the binding names, by its ID, and on delivery of the
 * receipt's ticket, each on its own: a later review of the same ticket is not this one.
 * The scheduler can still change the review's decision while its intake claim is active.
 *
 * - `stage-left` for `assignment-review`: the review is `ready`, or a delivery job that is not
 *   cancelled holds the ticket. The job proves the ticket left intake even once the review was
 *   cancelled or is gone; admission is refused while one holds it, so it came after. Another
 *   stage, or a baseline at another stage, cannot be judged.
 * - `record-settled`: the review reached a decision of its own, `ready`, `owned` or `held`. A
 *   later review, a delivery job or the receipt alone is no such decision.
 * - `stage-result-passed`: a review saves no stage results, so it cannot be judged.
 *
 * Not crossed otherwise. Pure.
 */
export function reviewProgress(state: Pick<OfficeSnapshot, 'coordination'>, id: string, key: string, boundary: RepairBoundary, stood: NonNullable<RepairResume['stood']>, claimActive: boolean): ReviewProgress {
    const review = state.coordination?.listener.reviews.find(saved => saved.id === id);
    const read = (crossing: Crossing): ReviewProgress => ({ ...(review ? { status: review.status } : {}), crossing });
    if (boundary.kind === 'stage-result-passed') return read({ unjudged: 'An assignment review saves no stage results; only stage-left and record-settled can be judged for it.' });
    if (boundary.kind === 'record-settled') return read(!claimActive && review && DECIDED.includes(review.status) ? { crossed: true, detail: `The review reached its decision (${review.status}) after its resume.` } : { crossed: false });
    if (boundary.stage !== STAGE) return read({ unjudged: `An assignment review has only ${STAGE} to leave, not ${boundary.stage}.` });
    if (stood.stage !== STAGE) return read({ unjudged: `The review was at ${stood.stage}, not ${STAGE}, when it was resumed.` });
    if (!claimActive && review?.status === 'ready') return read({ crossed: true, detail: `The review left ${STAGE} ready for delivery after its resume.` });
    const job = state.coordination?.jobs?.find(job => job.key === key && job.status !== 'cancelled');
    return read(job ? { crossed: true, detail: `Delivery took ${key} after its resume (job ${job.id}, ${job.stage}).` } : { crossed: false });
}
