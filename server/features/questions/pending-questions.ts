import type { FeatureQuestionProjection } from '../../../src/contracts/features';
import type { Store } from '../../store/store';
import { FEATURE_PLANNING } from '../../office/config';
import { featurePolicy, type FeaturePlanningBindings } from '../progression/policy';
import { pendingRounds, roundAuthor } from './pending-round';
import { normalizeQuestion } from '../../../src/features/questions/normalize-question';
/** Never expose persisted answers or executable descriptors. */
export function pendingQuestions(stores: Iterable<Store>, bindings: FeaturePlanningBindings = FEATURE_PLANNING): FeatureQuestionProjection[] {
    const result: FeatureQuestionProjection[] = [];
    for (const store of stores) {
        const policy = featurePolicy(store.project.id, bindings);
        if (!policy.assessment.enabled && policy.progression !== 'automatic') continue;
        const state = store.state;
        if (state.paused) continue;
        for (const feature of state.features || []) {
            if (feature.paused || feature.status !== 'waiting') continue;
            for (const round of pendingRounds(feature)) {
                try {
                    const questions = round.questions.map(question => normalizeQuestion(question, question.id));
                    const options = round.options?.map(({ id, label, tradeoff }) => ({ id, label, tradeoff }));
                    result.push({
                        projectId: store.project.id,
                        projectName: store.project.name,
                        ticket: feature.sourceTicket || undefined,
                        featureId: feature.id,
                        title: feature.title,
                        asker: roundAuthor(round),
                        revision: feature.revision,
                        roundId: round.id,
                        createdAt: round.createdAt,
                        ...(round.reviewRun ? { reviewRun: round.reviewRun, reviewRevision: round.reviewRevision } : {}),
                        questions,
                        options,
                    });
                } catch {
                    // Keep other rounds available when a saved question cannot be displayed.
                }
            }
        }
    }
    return result.sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.projectId.localeCompare(b.projectId)||a.featureId.localeCompare(b.featureId)||a.roundId.localeCompare(b.roundId));
}
