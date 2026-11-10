import type { Feature, FeatureRound, FeatureRoundAuthor } from '../../../src/contracts/features';

export function roundAuthor(round: FeatureRound): FeatureRoundAuthor {
    return round.author ?? (round.reviewRevision !== undefined ? 'review' : 'product');
}
export function pendingRound(feature: Feature, round: FeatureRound): boolean {
    if (round.revision !== feature.revision || round.resolvedAt) return false;
    const author = roundAuthor(round);
    if (author === 'harness') return true;
    if (author === 'review' && (!feature.review || round.reviewRun !== feature.review.run || round.reviewRevision !== feature.review.revision)) return false;
    return round.questions.some(q => !round.answers[q.id]);
}
export function pendingRounds(feature: Feature, author?: FeatureRoundAuthor) {
    return feature.rounds.filter(r => (!author || roundAuthor(r) === author) && pendingRound(feature, r));
}
