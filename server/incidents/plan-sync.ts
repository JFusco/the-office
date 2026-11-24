import { subjectKey, type ExpectedWait, type Incident, type IncidentEvent, type IncidentSource, type IncidentSubjectRecord } from '../../src/contracts/incidents';
import type { ObservedIncident } from './candidates';
import { eventId } from './event-id';
import { incidentId } from './fingerprint';
import type { IncidentChange } from './incident-ledger';
import { researchReason } from './research-threshold';
import { hasHiddenSources, standing, type Standing } from './subject-contributions';

const EPISODES_KEPT = 20, CLEARED_KEPT = 100;

type Provenance = Pick<Standing, 'contributions' | 'carried'>;

/** What a later observation may correct without it being a new episode: the bindings, the explanation and who said what. */
const details = (subject: { stage: string; stop: unknown; lastWorker: string; head: string; unsettledEffect: boolean; mailCheckOutcomeId?: number }, sources: readonly string[], evidence: string, expected: ExpectedWait | null, provenance: Provenance) =>
    JSON.stringify([subject.stage, subject.stop, subject.lastWorker, subject.head, subject.unsettledEffect, sources, evidence, expected, provenance.contributions ?? null, provenance.carried ?? null, subject.mailCheckOutcomeId ?? null]);

/** Records who said what on a subject, including any legacy aggregate kept separately. */
function setProvenance(subject: IncidentSubjectRecord, { contributions, carried }: Provenance) {
    if (contributions) subject.contributions = contributions; else delete subject.contributions;
    if (carried) subject.carried = carried; else delete subject.carried;
}

/** The explanation every open subject shares, or null. */
function shared(subjects: readonly IncidentSubjectRecord[]): ExpectedWait | null {
    const open = subjects.filter(subject => subject.status === 'open');
    return open.length && open.every(subject => subject.expected === open[0].expected) ? open[0].expected : null;
}

/** A source that could not be seen for a project, as `project/source`; `project/*` is every source of it. */
export const frozenKey = (projectId: string, source: IncidentSource | '*') => `${projectId}/${source}`;

const sourceHidden = (frozen: ReadonlySet<string>, projectId: string, source: IncidentSource) =>
    frozen.has(frozenKey(projectId, source)) || frozen.has(frozenKey(projectId, '*'));

/** Full keys the planner keeps when an outage prevents a fresh observation. */
export function retainedSubjectKeys(current: readonly Incident[], frozen: ReadonlySet<string>): Set<string> {
    const retained = new Set<string>();
    for (const incident of current) for (const subject of incident.subjects) {
        if (subject.status !== 'open') continue;
        const key = subjectKey(subject), hidden = (source: IncidentSource) => sourceHidden(frozen, subject.projectId, source);
        if (frozen.has(key) || hidden(incident.cause.source) || hasHiddenSources(subject, hidden)) retained.add(key);
    }
    return retained;
}

export interface SyncContext {
    /** Sources that could not be seen, as `frozenKey`s, and single subjects, by subject key; what they hold is not cleared. */
    frozen?: ReadonlySet<string>;
    /** Subjects shown to be another record's in this pass: cleared even while their own source cannot be seen. */
    released?: ReadonlySet<string>;
    /** What the event history says of a subject the projection no longer holds: its episodes and when it was first seen. */
    history?: (incident: string, subject: string) => { episodes: number; firstObservedAt: string } | null;
}

/**
 * Compares what is stopped now with what the ledger holds and returns the difference: new
 * incidents, new subjects, new episodes of a known subject, subjects whose signal is gone, and
 * incidents that became, or stopped being, eligible for research. Pure, and empty when nothing
 * changed, so an unchanged office costs no write.
 *
 * A subject that returns after it cleared, or whose stop marker changed, is a new episode: the
 * cause outlived whatever resumed the work. A subject is open in one incident at a time: observed
 * under another cause, it leaves the incident that held it in the same change, whatever cannot be
 * seen. Otherwise a subject is not cleared while it cannot be seen: while its owner's source, its
 * project or the subject itself is frozen. While another of its sources cannot be read, that source
 * keeps exactly what it had contributed (`subject-contributions.ts`), wherever the subject now is,
 * and an owner that was read and reported nothing withdraws its own part. Two saved copies of one
 * subject that cannot be observed are both kept until an observation says where it belongs.
 */
export function planSync(current: readonly Incident[], observed: ReadonlyMap<string, ObservedIncident>, now: Date, { frozen = new Set(), released = new Set(), history }: SyncContext = {}): IncidentChange {
    const at = now.toISOString(), events: IncidentEvent[] = [], incidents: Incident[] = [];
    const stored = new Map(current.map(incident => [incident.fingerprint, incident]));
    const hiddenIn = (projectId: string) => (source: IncidentSource) => sourceHidden(frozen, projectId, source);
    const retained = retainedSubjectKeys(current, frozen);
    const observedIn = new Set([...observed.values()].flatMap(incident => [...incident.subjects.keys()]));
    const openCopies = new Map<string, { fingerprint: string; subject: IncidentSubjectRecord }[]>();
    for (const incident of [...current].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) {
        for (const subject of incident.subjects) {
            if (subject.status !== 'open') continue;
            const key = subjectKey(subject), copies = openCopies.get(key) ?? [];
            copies.push({ fingerprint: incident.fingerprint, subject });
            openCopies.set(key, copies);
        }
    }
    for (const print of new Set([...stored.keys(), ...observed.keys()])) {
        const seen = observed.get(print), before = stored.get(print), id = before?.id ?? incidentId(print);
        const incident: Incident = before ? structuredClone(before) : {
            id, fingerprint: print, state: 'observed', revision: 0, cause: seen!.cause, expected: null,
            research: { eligible: false, reason: '', at: null }, firstObservedAt: at, lastObservedAt: at, subjects: [],
        };
        // An event is named by the revision it produces, so no later observation can reuse its ID.
        let changed = false;
        const next = `r${incident.revision + 1}`;
        const record = (kind: IncidentEvent['kind'], body: Record<string, unknown>, subject = '') => { events.push({ id: eventId(id, kind, subject, next), incident: id, at, kind, body }); changed = true; };
        if (!before) record('incident-observed', { fingerprint: print, cause: incident.cause });

        const known = new Map(incident.subjects.map(subject => [subjectKey(subject), subject]));
        for (const [key, { subject, sources, evidence, contributions }] of seen?.subjects ?? []) {
            const saved = known.get(key);
            // Keep the destination's facts first, then bring over hidden facts from every losing copy.
            const priors = (openCopies.get(key) ?? []).filter(copy => copy.fingerprint !== print).map(copy => copy.subject);
            if (saved?.status === 'open') priors.unshift(saved);
            const stands = standing(priors, { sources, contributions }, hiddenIn(subject.projectId))!;
            const now = { subject: { ...subject, unsettledEffect: stands.unsettledEffect }, sources: stands.sources, expected: stands.expected, provenance: { contributions: stands.contributions, carried: stands.carried } };
            if (!saved) {
                // The projection keeps only recent history; the events remember a subject it dropped.
                const past = before ? history?.(id, key) ?? null : null, episodeCount = (past?.episodes ?? 0) + 1;
                const added: IncidentSubjectRecord = { ...now.subject, status: 'open', expected: now.expected, sources: now.sources, evidence, firstObservedAt: past?.firstObservedAt ?? at, lastObservedAt: at, openedAt: at, clearedAt: null, episodes: [subject.episode], episodeCount };
                setProvenance(added, now.provenance);
                incident.subjects.push(added);
                record('subject-observed', { subject: key, episode: subject.episode, episodes: episodeCount, stage: subject.stage, head: subject.head, sources: now.sources, expected: now.expected }, key);
                incident.lastObservedAt = at;
                continue;
            }
            const returned = saved.status === 'cleared', again = returned || saved.episode !== subject.episode;
            if (!again && details(saved, saved.sources, saved.evidence, saved.expected, saved) === details(now.subject, now.sources, evidence, now.expected, now.provenance)) continue;
            if (again) {
                // Every episode starts its own clock: how long a wait has stood is counted from its latest stop.
                Object.assign(saved, { episodes: [...saved.episodes, subject.episode].slice(-EPISODES_KEPT), episodeCount: saved.episodeCount + 1, lastObservedAt: at, openedAt: at, status: 'open', clearedAt: null });
                record(returned ? 'subject-observed' : 'episode-observed', { subject: key, episode: subject.episode, episodes: saved.episodeCount, stage: subject.stage, head: subject.head, sources: now.sources, expected: now.expected }, key);
                incident.lastObservedAt = at;
            }
            Object.assign(saved, now.subject, { sources: now.sources, evidence, expected: now.expected });
            if (subject.mailCheckOutcomeId === undefined) delete saved.mailCheckOutcomeId;
            setProvenance(saved, now.provenance);
            changed = true;
        }
        for (const [key, saved] of known) {
            if (saved.status !== 'open' || seen?.subjects.has(key)) continue;
            // Observed under another cause, or shown to be another record's, the subject has left this incident whatever else cannot be seen.
            if (!observedIn.has(key) && !released.has(key)) {
                const hidden = hiddenIn(saved.projectId);
                // Its owner, its project or the subject itself cannot be seen: it stands as saved.
                if (frozen.has(key) || hidden(incident.cause.source)) continue;
                if ((openCopies.get(key)?.length ?? 0) > 1 && retained.has(key)) continue;
                // Its owner was read and reported nothing: only what a source that cannot be seen had said keeps it open.
                const stands = standing([saved], null, hidden);
                if (stands) {
                    const provenance = { contributions: stands.contributions, carried: stands.carried }, facts = { ...saved, unsettledEffect: stands.unsettledEffect };
                    if (details(saved, saved.sources, saved.evidence, saved.expected, saved) !== details(facts, stands.sources, saved.evidence, stands.expected, provenance)) {
                        Object.assign(saved, { unsettledEffect: stands.unsettledEffect, sources: stands.sources, expected: stands.expected });
                        setProvenance(saved, provenance);
                        changed = true;
                    }
                    continue;
                }
            }
            Object.assign(saved, { status: 'cleared', clearedAt: at });
            record('subject-cleared', { subject: key, episode: saved.episode }, key);
        }
        // History of subjects long gone is bounded here; the events keep it all. Done first, so what is saved is what the research state was derived from.
        const dropped = new Set(incident.subjects.filter(subject => subject.status === 'cleared').sort((a, b) => String(b.clearedAt).localeCompare(String(a.clearedAt))).slice(CLEARED_KEPT));
        if (dropped.size && changed) incident.subjects = incident.subjects.filter(subject => !dropped.has(subject));
        const explanation = shared(incident.subjects);
        if (explanation !== incident.expected) { incident.expected = explanation; changed = true; }
        // Eligibility is about now: earned when a reason holds, withdrawn when none does. Events mark only the turn.
        const reason = researchReason(incident, now);
        if (reason && !incident.research.eligible) { incident.research = { eligible: true, reason, at }; record('research-promoted', { reason }); }
        else if (!reason && incident.research.eligible) { incident.research = { eligible: false, reason: '', at: null }; record('research-withdrawn', { reason: incident.subjects.some(subject => subject.status === 'open') ? 'the stop is an expected wait below every threshold' : 'no subject is stopped' }); }
        else if (reason && reason !== incident.research.reason) { incident.research.reason = reason; changed = true; }
        if (!changed) continue;
        incident.revision += 1;
        incidents.push(incident);
    }
    return { events, incidents };
}
