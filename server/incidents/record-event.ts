import { z } from 'zod';
import type { Incident, IncidentEvent, IncidentRepair, SubjectFix } from '../../src/contracts/incidents';
import { canonical } from './canonical-json';
import { dismiss, type DismissalFacts, type DismissalRequest } from './dismissal';
import type { FixIdentity } from './fix-identity';
import type { IncidentLedger } from './incident-ledger';
import { repairSubject } from './subject-digest';
import { nextState } from './transitions';

const PAYLOAD_LIMIT = 4096;
const text = (max: number) => z.string().trim().min(1).max(max);
const Payload = z.custom<Record<string, unknown>>(
    value => value !== null && typeof value === 'object' && !Array.isArray(value),
    'A route payload must be an object',
).refine(payload => {
    try {
        const json = JSON.stringify(payload);
        return json !== undefined && json.length <= PAYLOAD_LIMIT;
    } catch {
        return false;
    }
}, `A route payload is at most ${PAYLOAD_LIMIT} characters of JSON`)
    // The record parser would silently drop this key.
    .refine(payload => !Object.hasOwn(payload, '__proto__'), 'A route payload cannot contain a top-level __proto__ key')
    .pipe(z.record(z.string(), z.unknown()));
const Route = z.object({
    action: text(100), expectedStage: text(100),
    payload: Payload,
}).strict();
const Boundary = z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('stage-result-passed'), stage: text(100) }).strict(),
    z.object({ kind: z.literal('stage-left'), stage: text(100) }).strict(),
    z.object({ kind: z.literal('record-settled') }).strict(),
]);
const bound = { subject: z.string().min(1), digest: z.string().regex(/^[0-9a-f]{64}$/) };
/** What a fix declares for one subject; the closed list of boundaries is the only way to claim a repair can be observed. */
export const SubjectFixSchema = z.discriminatedUnion('disposition', [
    z.object({ ...bound, disposition: z.literal('route'), route: Route, boundary: Boundary }).strict(),
    z.object({ ...bound, disposition: z.literal('undeclared-boundary'), route: Route, reason: text(500) }).strict(),
    z.object({ ...bound, disposition: z.literal('no-route'), reason: text(500) }).strict(),
]);

/** IDs the caller chooses. Observation names its own events after the incident, so those are refused here. */
export const EVENT_ID = /^(?!inc-)[A-Za-z0-9][A-Za-z0-9._:-]{7,99}$/;

/** The part of a write the caller sent: what makes a second send the same request or a different one. */
export type WriteRequest =
    | { kind: 'repair-started'; issue: number }
    | { kind: 'fix-bound'; reference: string; bindings: SubjectFix[] }
    | ({ kind: 'dismissed' } & DismissalRequest);
/** A write with what GitHub reported for it, or, for a dismissal, what the Office established about its own code and evidence. */
export type ResolvedWrite =
    | { kind: 'repair-started'; request: Extract<WriteRequest, { kind: 'repair-started' }>; issue: IncidentRepair['issue'] }
    | { kind: 'fix-bound'; request: Extract<WriteRequest, { kind: 'fix-bound' }>; fix: FixIdentity }
    | { kind: 'dismissed'; request: Extract<WriteRequest, { kind: 'dismissed' }>; facts: DismissalFacts };

/** The most subjects one repair can be for: a fix must state something for each, in one bounded request. */
export const REPAIR_SUBJECTS = 1000;

/** `revision` is the one this event produced; on a repeated send `incident` is the incident as it is now, which may have moved on. */
export interface Recorded { event: IncidentEvent; revision: number; incident: Incident; replayed: boolean }


/**
 * The saved result of an event ID already recorded, when this is the same request sent again; null
 * when the ID is new. The same ID for another incident or another request is refused. Checked
 * before GitHub is read, so a retry after a lost response costs no provider call and cannot be
 * turned into a different event by what GitHub says now.
 */
export function replayed(ledger: IncidentLedger, incident: string, eventId: string, expectedRevision: number, request: WriteRequest): Recorded | null {
    if (!EVENT_ID.test(eventId)) throw new Error('An event ID is 8 to 100 letters, digits, dots, colons, dashes or underscores, and does not start with inc-');
    const saved = ledger.event(eventId);
    if (!saved) return null;
    if (saved.incident !== incident || saved.kind !== request.kind || canonical(saved.body.request) !== canonical({ ...request, expectedRevision })) throw new Error(`Incident event ${eventId} was already recorded with different content`);
    const current = ledger.get(incident);
    if (!current) throw new Error(`Incident ${incident} is gone`);
    return { event: saved, revision: Number(saved.body.revision), incident: current, replayed: true };
}

/**
 * Records one event a person or the repair runner sent. The incident must be at the revision the
 * caller read, the event must be legal from its state, a fix must account for exactly the
 * subjects its repair recorded, each unchanged, and a dismissal must name the evidence and the
 * code as they stand (see dismissal.ts). The event and the new projection are saved together or
 * not at all.
 */
export function recordIncidentEvent(ledger: IncidentLedger, incidentId: string, eventId: string, expectedRevision: number, write: ResolvedWrite, now: Date): Recorded {
    const again = replayed(ledger, incidentId, eventId, expectedRevision, write.request);
    if (again) return again;
    const incident = ledger.get(incidentId);
    if (!incident) throw new Error(`No such incident: ${incidentId}`);
    if (incident.revision !== expectedRevision) throw new Error(`Incident ${incidentId} is at revision ${incident.revision}, not ${expectedRevision}; read it again`);
    const at = now.toISOString(), request = { ...write.request, expectedRevision };
    let next: Incident, body: Record<string, unknown>;
    if (write.kind === 'repair-started') {
        const state = nextState(incident.state, 'repair-started');
        const repair: IncidentRepair = { event: eventId, issue: write.issue, startedAt: at, subjects: incident.subjects.filter(subject => subject.status === 'open').map(repairSubject) };
        // A fix must state something for every one of these in a single request; a repair that could never be bound is not started.
        if (repair.subjects.length > REPAIR_SUBJECTS) throw new Error(`Incident ${incidentId} has ${repair.subjects.length} open subjects; a repair covers at most ${REPAIR_SUBJECTS}`);
        // Fixes bound to an earlier repair of the same incident stay on record.
        next = { ...incident, state, repair, fixes: incident.fixes ?? [] };
        body = { request, issue: write.issue, subjects: repair.subjects, from: incident.state, to: state };
    } else if (write.kind === 'dismissed') {
        const { kind: _, ...dismissal } = write.request;
        const dismissed = dismiss(incident, eventId, dismissal, write.facts, at);
        next = dismissed.next;
        body = { request, ...dismissed.body };
    } else {
        const state = nextState(incident.state, 'fix-bound', write.fix.onMain), repair = incident.repair;
        if (!repair) throw new Error(`Incident ${incidentId} has no repair to bind a fix to`);
        const bindings = z.array(SubjectFixSchema).max(REPAIR_SUBJECTS).parse(write.request.bindings), recorded = new Map(repair.subjects.map(subject => [subject.subject, subject.digest]));
        const seen = new Set<string>();
        for (const binding of bindings) {
            if (!recorded.has(binding.subject)) throw new Error(`${binding.subject} is not a subject of this repair`);
            if (seen.has(binding.subject)) throw new Error(`${binding.subject} is bound twice`);
            if (recorded.get(binding.subject) !== binding.digest) throw new Error(`The binding for ${binding.subject} does not carry the digest recorded when the repair started; it names another episode, stage, stop or head`);
            seen.add(binding.subject);
        }
        const missing = repair.subjects.filter(subject => !seen.has(subject.subject)).map(subject => subject.subject);
        if (missing.length) throw new Error(`A fix states a route, an undeclared boundary or no route for every subject of its repair; missing: ${missing.slice(0, 10).join(', ')}`);
        const fix = { event: eventId, ...write.fix, boundAt: at, bindings };
        next = { ...incident, state, fixes: [...incident.fixes ?? [], fix] };
        body = { request, fix: write.fix, from: incident.state, to: state };
    }
    next.revision = incident.revision + 1;
    // The revision this event produced is part of the event, so a repeated send can still report it after the incident has moved on.
    const event: IncidentEvent = { id: eventId, incident: incidentId, at, kind: write.kind, body: { ...body, revision: next.revision } };
    ledger.record({ events: [event], incidents: [next] });
    return { event, revision: next.revision, incident: next, replayed: false };
}
