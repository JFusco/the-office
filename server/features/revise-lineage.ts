import type { Feature } from '../../src/contracts/features';
/** Keep evidence and publication identities; only unstarted authorization is superseded. */
export function reviseLineage(feature: Feature) {
    feature.revision++; feature.confirmedBrief = undefined; feature.phase = 'discovery'; feature.manifest = undefined;
    if (feature.review) feature.reviewHistory.push(feature.review);
    feature.review = undefined;
    if (feature.baseline) (feature.baselineHistory ??= []).push(feature.baseline);
    feature.baseline = undefined;
}
