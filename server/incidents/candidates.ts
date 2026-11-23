import { subjectKey, type IncidentCandidate, type IncidentCause, type IncidentSource, type ExpectedWait, type IncidentSubject } from '../../src/contracts/incidents';
import { fingerprint } from './fingerprint';

export interface ObservedSubject { subject: IncidentSubject; sources: IncidentSource[]; evidence: string; expected: ExpectedWait | null }
export interface ObservedIncident { fingerprint: string; cause: IncidentCause; subjects: Map<string, ObservedSubject> }

/**
 * Turns what the sources reported into one entry per cause. A stop two sources both saw is one
 * subject: a record that another candidate says it covers is folded into that candidate, and of two
 * candidates for the same subject the first reported wins. Candidates arrive in source order, so
 * the source that knows the work best is listed first. A folded report still tells what it knew:
 * an unsettled write, and an explanation where the owner has none. A candidate reported as
 * `foldedOnly` is nothing by itself: where no other candidate covers it, it is left out. A record
 * in `attributed` already belongs to a subject whose own source could not be read this time, and
 * is left with it.
 */
export function groupCandidates(candidates: readonly IncidentCandidate[], attributed: ReadonlySet<string> = new Set()): Map<string, ObservedIncident> {
    const absorbed = new Map<string, string>();
    for (const candidate of candidates) for (const key of candidate.absorbs ?? []) if (!absorbed.has(key)) absorbed.set(key, subjectKey(candidate.subject));
    const subjects = new Map<string, { candidate: IncidentCandidate } & ObservedSubject>(), folded: [string, IncidentCandidate][] = [];
    for (const candidate of candidates) {
        const key = subjectKey(candidate.subject), owner = absorbed.get(key);
        if (attributed.has(key)) continue;
        if (owner && owner !== key) { folded.push([owner, candidate]); continue; }
        if (candidate.foldedOnly) continue;
        const seen = subjects.get(key);
        if (seen) folded.push([key, candidate]);
        else subjects.set(key, { candidate, subject: { ...candidate.subject }, sources: [candidate.cause.source], evidence: candidate.evidence, expected: candidate.expected });
    }
    for (const [owner, other] of folded) {
        const seen = subjects.get(owner);
        if (!seen) continue;
        if (!seen.sources.includes(other.cause.source)) seen.sources.push(other.cause.source);
        seen.subject.unsettledEffect ||= other.subject.unsettledEffect;
        seen.expected ??= other.expected;
    }
    const incidents = new Map<string, ObservedIncident>();
    for (const [key, { candidate, subject, sources, evidence, expected }] of subjects) {
        const print = fingerprint(candidate.cause, candidate.subject);
        let incident = incidents.get(print);
        if (!incident) incidents.set(print, incident = { fingerprint: print, cause: candidate.cause, subjects: new Map() });
        incident.subjects.set(key, { subject, sources, evidence, expected });
    }
    return incidents;
}
