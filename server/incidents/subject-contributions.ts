import { INCIDENT_SOURCES, type ExpectedWait, type IncidentContribution, type IncidentLegacyCarry, type IncidentSource, type IncidentSubjectRecord } from '../../src/contracts/incidents';

export type Contributions = Partial<Record<IncidentSource, IncidentContribution>>;
/** What the readable sources said of a subject in this pass, with the owner listed first. */
export interface Reported { sources: IncidentSource[]; contributions: Contributions }
/** What a subject stands on after a pass. */
export interface Standing { sources: IncidentSource[]; unsettledEffect: boolean; expected: ExpectedWait | null; contributions?: Contributions; carried?: IncidentSubjectRecord['carried'] }

const NOTHING: IncidentContribution = { unsettledEffect: false, expected: null };
const carriesOf = (prior: IncidentSubjectRecord): IncidentLegacyCarry[] => {
    if (prior.carried) return Array.isArray(prior.carried) ? prior.carried : [prior.carried];
    return !prior.contributions && prior.sources.length > 1
        ? [{ unsettledEffect: prior.unsettledEffect, expected: prior.expected, sources: prior.sources }]
        : [];
};

/** A neutral contribution also keeps a missing subject standing while its source is hidden. */
export function hasHiddenSources(prior: IncidentSubjectRecord, hidden: (source: IncidentSource) => boolean): boolean {
    return prior.sources.some(hidden) || carriesOf(prior).some(carry => carry.sources.some(hidden));
}

const rank = (source: IncidentSource) => INCIDENT_SOURCES.indexOf(source);
/** Sources in the order their reports are trusted, the owner's first. */
const ordered = (owner: IncidentSource | undefined, sources: Iterable<IncidentSource>) => [...new Set(sources)].sort((a, b) => a === owner ? -1 : b === owner ? 1 : rank(a) - rank(b));

/** A subject's facts from what its sources said: an unsettled write any of them knows of, and the first explanation in trust order. */
export function combine(owner: IncidentSource | undefined, parts: Contributions): Omit<Standing, 'contributions' | 'carried'> {
    const sources = ordered(owner, Object.keys(parts) as IncidentSource[]);
    return { sources, unsettledEffect: sources.some(source => parts[source]!.unsettledEffect), expected: sources.map(source => parts[source]!.expected).find(Boolean) ?? null };
}

/** Contributions as stored: in trust order, and none when a single source reported the subject. */
export function storedContributions(parts: Contributions, sources: readonly IncidentSource[]): Contributions | undefined {
    return sources.length > 1 ? Object.fromEntries(sources.map(source => [source, parts[source] ?? NOTHING])) : undefined;
}

/**
 * What a subject stands on after a pass, from its earlier open copies (`priors`) and what readable sources said
 * now (`seen`, null when its owner was read and reported nothing). A readable source's earlier part is
 * replaced by what it says now, and one that says nothing withdraws it; a source that cannot be read
 * now (`hidden`) keeps exactly its own saved part. A subject saved before parts were recorded keeps its
 * whole saved aggregate and every source it had while any of them is hidden, and records parts from
 * the first pass that reads all of them. Null when nothing hidden keeps an unseen subject standing.
 */
export function standing(priors: readonly IncidentSubjectRecord[], seen: Reported | null, hidden: (source: IncidentSource) => boolean): Standing | null {
    const now = seen?.contributions ?? {}, parts: Contributions = { ...now };
    const unseen = (source: IncidentSource) => hidden(source) && !(source in now);
    const carried = new Map<string, IncidentLegacyCarry>();
    for (const prior of priors) {
        const legacy = carriesOf(prior);
        for (const carry of legacy) {
            if (carry.sources.some(unseen)) carried.set(JSON.stringify(carry), carry);
        }
        const known: Contributions = prior.contributions ?? (legacy.length ? {} : { [prior.sources[0]]: prior });
        for (const source of prior.sources) {
            const saved = known[source];
            if (!saved || !unseen(source)) continue;
            // The destination's known wait wins a conflict. An unsettled write on any copy still stands.
            parts[source] = {
                unsettledEffect: !!parts[source]?.unsettledEffect || saved.unsettledEffect,
                expected: parts[source]?.expected ?? saved.expected,
            };
        }
    }
    const carries = [...carried.values()], owner = seen?.sources[0];
    if (!carries.length) {
        const facts = combine(owner, parts);
        return facts.sources.length ? { ...facts, contributions: storedContributions(parts, facts.sources) } : null;
    }
    // An unread legacy aggregate with no new facts can stay in its original form.
    const [prior] = priors;
    if (!seen && priors.length === 1 && !prior.carried && !prior.contributions)
        return { sources: prior.sources, unsettledEffect: prior.unsettledEffect, expected: prior.expected };
    const facts = combine(owner, parts);
    return {
        sources: ordered(owner, [...facts.sources, ...carries.flatMap(carry => carry.sources.filter(unseen))]),
        unsettledEffect: facts.unsettledEffect || carries.some(carry => carry.unsettledEffect),
        expected: facts.expected ?? carries.find(carry => carry.expected !== null)?.expected ?? null,
        contributions: facts.sources.length ? Object.fromEntries(facts.sources.map(source => [source, parts[source]])) : undefined,
        carried: carries.length === 1 ? carries[0] : carries,
    };
}
