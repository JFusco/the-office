import type { DailyGoalUpdate, GoalEvidenceRef } from '../../src/shared';

type Fact = { started: boolean; accepted: boolean };

/** Why a cited reference was left out of an applied goal review. */
export const NOT_CURRENT = 'not a current provider observation of this pull request';

/**
 * The references a goal review may rest on, as the Office reads them now (`resolve` is `workEvidence`). A pull
 * request observation that no longer resolves (out of the provider's latest read, cited from an old read, or read
 * while the provider reports an error) is left out and listed: an observation never decides a goal's status, so a
 * stale one does not veto it either. Any other reference that does not resolve refuses the review, and so does a
 * review whose every reference was such an observation.
 */
export function currentCitations(update: Pick<DailyGoalUpdate, 'evidence' | 'linkedWork'>, resolve: (ref: GoalEvidenceRef) => Fact | null) {
    const read = (refs: GoalEvidenceRef[]) => refs.map(ref => ({ ref, fact: resolve(ref) }));
    const evidence = read(update.evidence), linkedWork = read(update.linkedWork), all = [...evidence, ...linkedWork];
    if (all.some(({ ref, fact }) => !fact && ref.kind !== 'pr') || all.length && all.every(({ fact }) => !fact))
        throw new Error('Goal evidence identity or version is stale or unsupported');
    const kept = (items: typeof all) => items.filter(item => item.fact).map(item => item.ref);
    const dropped = [...new Map(all.filter(item => !item.fact).map(({ ref }) => [JSON.stringify(ref), { ref, reason: NOT_CURRENT }])).values()];
    return { evidence: kept(evidence), linkedWork: kept(linkedWork), facts: all.flatMap(item => item.fact ? [item.fact] : []), dropped };
}
