import { subjectKey, type Incident, type IncidentCause, type IncidentEvent, type IncidentSubjectRecord } from '../../src/contracts/incidents';
import { boundedEvidence } from './bounded-evidence';
import { eventId } from './event-id';
import { fingerprint, incidentId } from './fingerprint';
import type { IncidentLedger } from './incident-ledger';
import { normalizeCause } from './normalize-cause';
import { researchReason } from './research-threshold';
import { failureDigest, FailureEvent, RUNNER_PROJECT, type FailureReceipt } from './runner-report';

/** The one cause the runner reports: it could not read the Office's health. A harness cause, so every outage is the same incident. */
export const RUNNER_CAUSE: IncidentCause = { source: 'runner', provider: 'overseer', stage: 'health', kind: 'service-down', text: normalizeCause('the Office service did not answer the Overseer runner'), author: 'harness' };
export const RUNNER_SUBJECT = { projectId: RUNNER_PROJECT, kind: 'runner', id: 'office-service' } as const;
export const RUNNER_FINGERPRINT = fingerprint(RUNNER_CAUSE, RUNNER_SUBJECT);
export const RUNNER_INCIDENT = incidentId(RUNNER_FINGERPRINT);

export type RunnerFailureResult = { status: 'recorded' | 'replayed'; receipt: FailureReceipt } | { status: 'occupied'; reason: string };

const EPISODES_KEPT = 20, KEY = subjectKey(RUNNER_SUBJECT);

/** Order UTC instants at wire precision, even beyond the millisecond precision of Date. */
function newer(a: FailureEvent, b: IncidentSubjectRecord): boolean {
    const instant = (at: string) => {
        const [seconds, fraction = ''] = at.slice(0, -1).split('.');
        return { seconds: Date.parse(`${seconds}Z`), fraction: fraction.replace(/0+$/, '') };
    };
    const start = instant(a.at), previous = instant(b.stop?.at ?? b.openedAt);
    if (start.seconds !== previous.seconds) return start.seconds > previous.seconds;
    if (start.fraction !== previous.fraction) return start.fraction > previous.fraction;
    return a.episode > b.episode;
}

function isRestoration(saved: IncidentEvent | null, episode: string): boolean {
    return saved?.incident === RUNNER_INCIDENT && saved.kind === 'runner-failure' &&
        saved.body.failure === 'service-restored' && saved.body.episode === episode;
}

/** A saved event under this ID: the same failure sent again, or an ID that belongs to something else. */
function classify(saved: IncidentEvent, digest: string): RunnerFailureResult {
    if (saved.incident === RUNNER_INCIDENT && saved.kind === 'runner-failure' && saved.body.digest === digest)
        return { status: 'replayed', receipt: { eventId: saved.id, incidentId: saved.incident, digest, revision: Number(saved.body.revision) } };
    return { status: 'occupied', reason: `Incident event ${saved.id} is already recorded with other content` };
}

/** Retain only the diagnostics produced by the runner, with their expected types. */
function typedEvidence(evidence: FailureEvent['evidence']): FailureEvent['evidence'] {
    const saved: FailureEvent['evidence'] = {};
    for (const key of ['since', 'cachedHealthAt', 'serviceInstanceId', 'loadedHash']) {
        const value = evidence[key];
        if (typeof value === 'string') saved[key] = boundedEvidence(value, 199);
        else if (value === null && key !== 'since') saved[key] = null;
    }
    if (typeof evidence.failures === 'number' && Number.isSafeInteger(evidence.failures) && evidence.failures > 0)
        saved.failures = evidence.failures;
    return saved;
}

/**
 * Records one failure the runner journaled and forwarded, under its journal ID, together with what
 * it changes on the runner's incident: one transaction, one revision. The ID is looked up first: the
 * same failure sent again returns its original receipt, even after the incident has moved on, and
 * an ID held by another event or other content is occupied. Only the runner incident is changed.
 *
 * The subject `office-overseer/runner/office-service` stands for the newest outage: open from its
 * `service-down` until the `service-restored` of the same episode is recorded. A restoration that
 * arrives first is kept, so its outage stays cleared when its start arrives; an older outage that
 * arrives late is history only.
 */
export function recordRunnerFailure(ledger: IncidentLedger, input: unknown, now: Date): RunnerFailureResult {
    const event = FailureEvent.parse(input), digest = failureDigest(event);
    const saved = ledger.event(event.id);
    if (saved) return classify(saved, digest);
    let before = ledger.get(RUNNER_INCIDENT);
    for (let retry = 0; ; retry++) {
        try { return record(ledger, event, digest, now, before); }
        catch (error) {
            const raced = ledger.event(event.id);
            if (raced) return classify(raced, digest);
            const current = ledger.get(RUNNER_INCIDENT);
            if (retry >= 2 || !current || current.revision <= (before?.revision ?? 0)) throw error;
            before = current;
        }
    }
}

function record(ledger: IncidentLedger, failure: FailureEvent, digest: string, now: Date, before: Incident | null): RunnerFailureResult {
    const at = now.toISOString();
    const incident: Incident = before ? structuredClone(before) : {
        id: RUNNER_INCIDENT, fingerprint: RUNNER_FINGERPRINT, state: 'observed', revision: 0, cause: RUNNER_CAUSE, expected: null,
        research: { eligible: false, reason: '', at: null }, firstObservedAt: at, lastObservedAt: at, subjects: [],
    };
    const next = incident.revision + 1, events: IncidentEvent[] = [];
    const observe = (kind: IncidentEvent['kind'], body: Record<string, unknown>, subject = '') =>
        events.push({ id: eventId(RUNNER_INCIDENT, kind, subject, `r${next}`), incident: RUNNER_INCIDENT, at, kind, body });
    if (!before) observe('incident-observed', { fingerprint: RUNNER_FINGERPRINT, cause: RUNNER_CAUSE });

    const detail = boundedEvidence(failure.detail), saved = incident.subjects.find(subject => subjectKey(subject) === KEY);
    const clear = (subject: IncidentSubjectRecord) => {
        Object.assign(subject, { status: 'cleared', clearedAt: at });
        observe('subject-cleared', { subject: KEY, episode: subject.episode }, KEY);
    };
    if (failure.kind === 'service-down' && (!saved || newer(failure, saved))) {
        const restored = isRestoration(ledger.event(`overseer:service-restored:${failure.episode}`), failure.episode);
        const facts = { stage: 'health', stop: { kind: 'service-down', at: failure.at }, lastWorker: '', head: '', unsettledEffect: false, expected: null, sources: ['runner' as const], evidence: detail };
        const opened = (subject: IncidentSubjectRecord, returned: boolean) => {
            observe(returned ? 'subject-observed' : 'episode-observed', { subject: KEY, episode: subject.episode, episodes: subject.episodeCount, stage: subject.stage, head: subject.head, sources: subject.sources, expected: subject.expected }, KEY);
            incident.lastObservedAt = at;
        };
        if (!saved) {
            const added: IncidentSubjectRecord = { ...RUNNER_SUBJECT, episode: failure.episode, ...facts, status: 'open', firstObservedAt: at, lastObservedAt: at, openedAt: at, clearedAt: null, episodes: [failure.episode], episodeCount: 1 };
            incident.subjects.push(added);
            opened(added, true);
            if (restored) clear(added);
        } else {
            // A newer outage began: every outage is an episode of the one subject.
            const returned = saved.status === 'cleared';
            Object.assign(saved, { episode: failure.episode, ...facts, status: 'open', lastObservedAt: at, openedAt: at, clearedAt: null, episodes: [...saved.episodes, failure.episode].slice(-EPISODES_KEPT), episodeCount: saved.episodeCount + 1 });
            opened(saved, returned);
            if (restored) clear(saved);
        }
    } else if (failure.kind === 'service-restored' && saved?.status === 'open' && saved.episode === failure.episode) clear(saved);
    // Eligibility is about now, as observation decides it: earned when a reason holds, withdrawn when none does.
    const reason = researchReason(incident, now);
    if (reason && !incident.research.eligible) { incident.research = { eligible: true, reason, at }; observe('research-promoted', { reason }); }
    else if (!reason && incident.research.eligible) { incident.research = { eligible: false, reason: '', at: null }; observe('research-withdrawn', { reason: incident.subjects.some(subject => subject.status === 'open') ? 'the stop is an expected wait below every threshold' : 'no subject is stopped' }); }
    else if (reason && reason !== incident.research.reason) incident.research.reason = reason;

    incident.revision = next;
    events.push({
        id: failure.id, incident: RUNNER_INCIDENT, at, kind: 'runner-failure',
        body: { failure: failure.kind, episode: failure.episode, sourceAt: failure.at, digest, revision: next, detail, evidence: typedEvidence(failure.evidence) },
    });
    ledger.record({ events, incidents: [incident] });
    return { status: 'recorded', receipt: { eventId: failure.id, incidentId: RUNNER_INCIDENT, digest, revision: next } };
}
