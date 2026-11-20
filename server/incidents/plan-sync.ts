import { subjectKey, type ExpectedWait, type Incident, type IncidentEvent, type IncidentSource, type IncidentSubjectRecord } from '../../src/contracts/incidents';
import type { ObservedIncident } from './candidates';
import { eventId } from './event-id';
import { incidentId } from './fingerprint';
import type { IncidentChange } from './incident-ledger';
import { researchReason } from './research-threshold';

const EPISODES_KEPT = 20, CLEARED_KEPT = 100;

/** What a later observation may correct without it being a new episode. */
const details = (subject: { stage: string; stop: unknown; lastWorker: string; head: string; unsettledEffect: boolean }, sources: readonly string[], evidence: string, expected: ExpectedWait | null) =>
    JSON.stringify([subject.stage, subject.stop, subject.lastWorker, subject.head, subject.unsettledEffect, sources, evidence, expected]);

/** The explanation every open subject shares, or null. */
function shared(subjects: readonly IncidentSubjectRecord[]): ExpectedWait | null {
    const open = subjects.filter(subject => subject.status === 'open');
    return open.length && open.every(subject => subject.expected === open[0].expected) ? open[0].expected : null;
}

/** A source that could not be seen for a project, as `project/source`; `project/*` is every source of it. */
export const frozenKey = (projectId: string, source: IncidentSource | '*') => `${projectId}/${source}`;

export interface SyncContext {
    /** Sources that could not be seen; their subjects are not cleared. */
    frozen?: ReadonlySet<string>;
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
 * cause outlived whatever resumed the work. A subject is never cleared while a source that
 * reported it is frozen for its project: a signal that could not be seen has not gone away.
 */
export function planSync(current: readonly Incident[], observed: ReadonlyMap<string, ObservedIncident>, now: Date, { frozen = new Set(), history }: SyncContext = {}): IncidentChange {
    const at = now.toISOString(), events: IncidentEvent[] = [], incidents: Incident[] = [];
    const stored = new Map(current.map(incident => [incident.fingerprint, incident]));
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
        for (const [key, { subject, sources, evidence, expected }] of seen?.subjects ?? []) {
            const saved = known.get(key);
            if (!saved) {
                // The projection keeps only recent history; the events remember a subject it dropped.
                const past = before ? history?.(id, key) ?? null : null, episodeCount = (past?.episodes ?? 0) + 1;
                incident.subjects.push({ ...subject, status: 'open', expected, sources, evidence, firstObservedAt: past?.firstObservedAt ?? at, lastObservedAt: at, openedAt: at, clearedAt: null, episodes: [subject.episode], episodeCount });
                record('subject-observed', { subject: key, episode: subject.episode, episodes: episodeCount, stage: subject.stage, head: subject.head, sources, expected }, key);
                incident.lastObservedAt = at;
                continue;
            }
            // What a source that cannot be seen now had contributed to this subject stays until it can be read again.
            const hidden = saved.sources.filter(source => !sources.includes(source) && (frozen.has(frozenKey(saved.projectId, source)) || frozen.has(frozenKey(saved.projectId, '*'))));
            const now = hidden.length ? { subject: { ...subject, unsettledEffect: subject.unsettledEffect || saved.unsettledEffect }, sources: [...sources, ...hidden], expected: expected ?? saved.expected } : { subject, sources, expected };
            const returned = saved.status === 'cleared', again = returned || saved.episode !== subject.episode;
            if (!again && details(saved, saved.sources, saved.evidence, saved.expected) === details(now.subject, now.sources, evidence, now.expected)) continue;
            if (again) {
                // Every episode starts its own clock: how long a wait has stood is counted from its latest stop.
                Object.assign(saved, { episodes: [...saved.episodes, subject.episode].slice(-EPISODES_KEPT), episodeCount: saved.episodeCount + 1, lastObservedAt: at, openedAt: at, status: 'open', clearedAt: null });
                record(returned ? 'subject-observed' : 'episode-observed', { subject: key, episode: subject.episode, episodes: saved.episodeCount, stage: subject.stage, head: subject.head, sources: now.sources, expected: now.expected }, key);
                incident.lastObservedAt = at;
            }
            Object.assign(saved, now.subject, { sources: now.sources, evidence, expected: now.expected });
            changed = true;
        }
        for (const [key, saved] of known) {
            if (saved.status !== 'open' || seen?.subjects.has(key)) continue;
            if (frozen.has(frozenKey(saved.projectId, '*')) || saved.sources.some(source => frozen.has(frozenKey(saved.projectId, source)))) continue;
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
