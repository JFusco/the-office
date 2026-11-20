import { z } from 'zod';
import type { Incident } from '../../src/contracts/incidents';
import { DATA, ROOT } from '../office/config';
import { declaredWithin } from '../office/http/declared-length';
import { releaseIdentity, type ReleaseIdentity } from '../office/release-identity';
import { command } from '../workers/process';
import { CitationSchema, sourceVersions } from './cited-sources';
import { DISMISSAL_CITATIONS, dismissalRequest } from './dismissal';
import { evidencePacket, PACKET_EVENTS } from './evidence-packet';
import { readFix } from './fix-identity';
import type { IncidentLedger } from './incident-ledger';
import { recordIncidentEvent, REPAIR_SUBJECTS, replayed, SubjectFixSchema, type ResolvedWrite, type WriteRequest } from './record-event';
import { readRepairIssue } from './repair-issue';
import { json } from '../office/http/responses';
import { sanitizeObject } from '../office/security';

export interface IncidentsRouteContext {
    offices: { incidents: IncidentLedger };
    /** The code this service loaded at start-up: its hash and every file's hash. */
    loadedRevision?: { hash: string; manifest: readonly { path: string; hash: string }[] };
    /** The release identity as it reads now; the service's own records when not given. */
    release?: () => ReleaseIdentity;
    execute?: typeof command;
    now?: () => Date;
}

/** The evidence packet of an incident as the ledger and the running release stand now. */
function packetOf(incident: Incident, context: IncidentsRouteContext) {
    const loadedHash = context.loadedRevision?.hash ?? '';
    return evidencePacket({ incident, history: context.offices.incidents.history(incident.id, PACKET_EVENTS), loadedHash, release: context.release?.() ?? releaseIdentity({ root: ROOT, dataRoot: DATA, loadedHash }) });
}

const LIMIT = 1024 * 1024;
const Write = z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('repair-started'), eventId: z.string(), expectedRevision: z.number().int().min(1), issue: z.number().int().min(1) }).strict(),
    z.object({ kind: z.literal('fix-bound'), eventId: z.string(), expectedRevision: z.number().int().min(1), reference: z.string().trim().min(1).max(200), bindings: z.array(SubjectFixSchema).max(REPAIR_SUBJECTS) }).strict(),
    z.object({ kind: z.literal('dismissed'), eventId: z.string(), expectedRevision: z.number().int().min(1), reason: z.string().min(1).max(4000).refine(reason => reason.trim().length > 0), packet: z.string().regex(/^[0-9a-f]{64}$/), cited: z.array(CitationSchema).min(1).max(DISMISSAL_CITATIONS) }).strict(),
]);

/**
 * `POST /api/incidents/<id>/events`: records that a repair started, binds a fix, or dismisses the
 * incident as a false positive. The request is checked against the ledger first, so a repeated
 * send returns what was saved without reading GitHub again. Then the issue, commit or pull request
 * is read back, or, for a dismissal, the evidence packet and the cited files are compared with
 * what the Office holds and runs now; the event is recorded with what was established. Returns
 * the saved event, the revision it produced and the incident; on a repeated send the incident is
 * as it stands now.
 */
async function writeEvent(req: Request, id: string, context: IncidentsRouteContext): Promise<Response> {
    if (!declaredWithin(req, LIMIT)) return json({ error: `Incident events need a Content-Length of 1 to ${LIMIT} bytes` }, req.headers.get('content-length') === null ? 411 : 413);
    const body = await req.text(), parsed = Write.safeParse((() => { try { return JSON.parse(body); } catch { return undefined; } })());
    if (!parsed.success) return json({ error: 'Expected repair-started {eventId, expectedRevision, issue}, fix-bound {eventId, expectedRevision, reference, bindings} or dismissed {eventId, expectedRevision, reason, packet, cited}' }, 400);
    const { incidents } = context.offices, execute = context.execute ?? command, write = parsed.data;
    const incident = incidents.get(id);
    if (!incident) return json({ error: 'No such incident' }, 404);
    // A dismissal's reason is kept as evidence only, in its stored form; the digest of what was sent tells a repeat from a different verdict.
    const request: WriteRequest = write.kind === 'repair-started' ? { kind: write.kind, issue: write.issue }
        : write.kind === 'fix-bound' ? { kind: write.kind, reference: write.reference, bindings: write.bindings }
        : { kind: write.kind, ...dismissalRequest(write) };
    const resolve = async (): Promise<ResolvedWrite> => request.kind === 'repair-started' ? { kind: request.kind, request, issue: await readRepairIssue(request.issue, execute) }
        : request.kind === 'fix-bound' ? { kind: request.kind, request, fix: await readFix(request.reference, execute) }
        : { kind: request.kind, request, facts: { loadedHash: context.loadedRevision?.hash ?? '', versions: sourceVersions(context.loadedRevision?.manifest ?? []), packet: packetOf(incident, context).digest } };
    const saved = replayed(incidents, id, write.eventId, write.expectedRevision, request)
        ?? recordIncidentEvent(incidents, id, write.eventId, write.expectedRevision, await resolve(), (context.now ?? (() => new Date()))());
    return json(sanitizeObject(saved));
}

/**
 * `/api/incidents` lists the ledger; `open=1` keeps incidents with a subject still stopped and
 * `research=1` those eligible for investigation and not dismissed. `/api/incidents/<id>` returns
 * one incident with its event history, `/api/incidents/<id>/evidence` its evidence packet. All
 * three only read. `/api/incidents/<id>/events` accepts the three events a person or the repair
 * runner may record; nothing else about an incident can be written from outside.
 */
export async function incidentsRoute(req: Request, url: URL, context: IncidentsRouteContext): Promise<Response | undefined> {
    if (url.pathname !== '/api/incidents' && !url.pathname.startsWith('/api/incidents/')) return undefined;
    const events = /^\/api\/incidents\/(inc-[0-9a-f]{16})\/events$/.exec(url.pathname);
    if (events) return req.method === 'POST' ? writeEvent(req, events[1], context) : json({ error: 'POST required' }, 405);
    if (req.method !== 'GET') return json({ error: 'GET required' }, 405);
    const { incidents } = context.offices;
    if (url.pathname === '/api/incidents') {
        const open = url.searchParams.get('open') === '1', research = url.searchParams.get('research') === '1';
        return json(sanitizeObject({ incidents: incidents.list().filter(incident => (!open || incident.subjects.some(subject => subject.status === 'open')) && (!research || (incident.research.eligible && incident.state !== 'dismissed'))) }));
    }
    const evidence = /^\/api\/incidents\/(inc-[0-9a-f]{16})\/evidence$/.exec(url.pathname);
    if (evidence) {
        const incident = incidents.get(evidence[1]);
        // Returned as hashed: the packet has already had credentials removed from every string.
        return incident ? json({ packet: packetOf(incident, context) }) : json({ error: 'No such incident' }, 404);
    }
    const id = url.pathname.slice('/api/incidents/'.length), incident = /^inc-[0-9a-f]{16}$/.test(id) ? incidents.get(id) : null;
    return incident ? json(sanitizeObject({ incident, events: incidents.events(id) })) : json({ error: 'No such incident' }, 404);
}
