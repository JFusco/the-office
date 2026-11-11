import type { Store } from '../../store/store';
import { failCapture, type CaptureRequest } from './capture-store';
import { assessmentEpisode, closeAssessment } from './disposition-store';
import { recoveryQuestion } from '../questions/recovery-question';
import { stageBudget } from '../progression/attempt-budget';
/** Exhaustion fails intake open, while an enrolled feature retains ownership and asks once. */
export function failEvidenceCapture(store: Store, request: CaptureRequest, error: unknown) {
    if (!failCapture(store, request, error)) return;
    const episode = request.target.startsWith('assessment:') ? assessmentEpisode(store, request.target.slice(11)) : undefined;
    if (episode && !episode.closedAt) closeAssessment(store, episode, 'ordinary-by-unavailable', store.clock.now(), String(error));
    for (const feature of store.state.features || []) {
        const target = feature.handoff ? 'assessment:' + feature.handoff.episodeId : 'feature:' + feature.id;
        if (target !== request.target || feature.phase === 'complete') continue;
        const budget = stageBudget(feature, feature.phase); budget.wait = 'questions'; budget.nextAt = null;
        recoveryQuestion(feature, store.clock.now(), 'Provider evidence capture exhausted its recovery budget: ' + String(error), false, 'capture:' + request.target);
    }
}
