import type { AssignmentReview } from '../../../src/shared';
import type { Store } from '../../store/store';
import { assessmentEnabled } from './disposition-store';
import { intakeDisposition } from './intake-disposition';

/** Called before model intake and again after asynchronous read-back. */
export function holdAssessmentIntake(store: Store, review: AssignmentReview): boolean {
    const decision = intakeDisposition(store, review.key, review.featureBinding);
    if (decision.kind === 'proceed') return false;
    review.status = 'held'; review.detail = decision.reason; review.owner = '';
    review.assessmentHold = decision;
    return true;
}
/** Only rows held by this router are requeued; unrelated product holds remain intact. */
export function resumeAssessmentIntake(store: Store) {
    if (!assessmentEnabled(store)) return;
    for (const review of new Map((store.state.coordination?.listener.reviews || []).map(r => [r.key, r])).values()) {
        if (review.status !== 'held' || !review.assessmentHold) continue;
        const decision = intakeDisposition(store, review.key, review.featureBinding);
        if (decision.kind !== 'proceed') { review.assessmentHold = decision; review.detail = decision.reason; continue; }
        review.status = 'queued'; review.queuedAt = store.clock.now().toISOString();
        review.detail = 'Assessment settled; ordinary intake will recheck its existing gates'; delete review.assessmentHold;
    }
}
