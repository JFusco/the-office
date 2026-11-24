import type { DailyGoalUpdate, GoalEvidenceRef } from '../../src/shared';

type Fact = { started: boolean; accepted: boolean };

/** Why a cited reference was left out of an applied goal review. */
export const NOT_CURRENT = 'not a current provider observation of this pull request';
export const PROVIDER_ERROR = 'the provider read reported an error when the review was applied';

/**
 * Keeps the references that resolve (`resolve` is `workEvidence`) and lists the ones that do not but may be left
 * out: `dropReason` says why, or false when such a reference must refuse the review. A review whose every citation
 * fails to resolve is refused too.
 */
export function currentCitations(
    update: Pick<DailyGoalUpdate, 'evidence' | 'linkedWork'>,
    resolve: (ref: GoalEvidenceRef) => Fact | null,
    dropReason: (ref: GoalEvidenceRef) => string | false,
) {
    const read = (refs: GoalEvidenceRef[]) => refs.map(ref => ({ ref, fact: resolve(ref) }));
    const evidence = read(update.evidence), linkedWork = read(update.linkedWork), all = [...evidence, ...linkedWork];
    if (all.some(({ ref, fact }) => !fact && !dropReason(ref)) || all.length && all.every(({ fact }) => !fact))
        throw new Error('Goal evidence identity or version is stale or unsupported');
    const kept = (items: typeof all) => items.filter(item => item.fact).map(item => item.ref);
    const dropped = [...new Map(all.filter(item => !item.fact).map(({ ref }) => [JSON.stringify(ref), { ref, reason: dropReason(ref) as string }])).values()];
    return { evidence: kept(evidence), linkedWork: kept(linkedWork), facts: all.flatMap(item => item.fact ? [item.fact] : []), dropped };
}
