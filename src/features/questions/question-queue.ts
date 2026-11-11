import type { FeatureQuestionProjection } from '../../contracts/features';
export function questionKey(round: Pick<FeatureQuestionProjection, 'projectId' | 'featureId' | 'roundId'>) {
    return [round.projectId, round.featureId, round.roundId].map(encodeURIComponent).join(':');
}
export function orderedQuestions(rounds: FeatureQuestionProjection[]) {
    return [...rounds].sort((a,b) => a.createdAt.localeCompare(b.createdAt) || a.projectId.localeCompare(b.projectId) || a.featureId.localeCompare(b.featureId) || a.roundId.localeCompare(b.roundId));
}
/** Retain an open round. Removal closes it before a later selection can open another. */
export function nextQuestion(rounds: FeatureQuestionProjection[], suppressed: ReadonlySet<string>, current?: FeatureQuestionProjection) {
    if (current) return rounds.find(r => questionKey(r) === questionKey(current) && r.revision === current.revision);
    return orderedQuestions(rounds).find(r => !suppressed.has(questionKey(r)));
}
