import type { FeatureQuestionProjection } from '../../contracts/features';
/** Explicit project even for the default CEC project; query parameters never become part of the ID. */
export function questionUrl(round: Pick<FeatureQuestionProjection, 'featureId' | 'projectId'>) {
    return '/api/features/' + encodeURIComponent(round.featureId) + '?' + new URLSearchParams({ project: round.projectId, officeWide: '1' });
}
