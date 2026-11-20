import { z } from 'zod';
import { declaredWithin } from '../office/http/declared-length';
import { command } from '../workers/process';
import { readFix } from './fix-identity';
import type { IncidentLedger } from './incident-ledger';
import { recordIncidentEvent, REPAIR_SUBJECTS, replayed, SubjectFixSchema, type WriteRequest } from './record-event';
import { readRepairIssue } from './repair-issue';
import { json } from '../office/http/responses';
import { sanitizeObject } from '../office/security';

export interface IncidentsRouteContext { offices: { incidents: IncidentLedger }; execute?: typeof command; now?: () => Date }

const LIMIT = 1024 * 1024;
const Write = z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('repair-started'), eventId: z.string(), expectedRevision: z.number().int().min(1), issue: z.number().int().min(1) }).strict(),
    z.object({ kind: z.literal('fix-bound'), eventId: z.string(), expectedRevision: z.number().int().min(1), reference: z.string().trim().min(1).max(200), bindings: z.array(SubjectFixSchema).max(REPAIR_SUBJECTS) }).strict(),
]);

/**
 * `POST /api/incidents/<id>/events`: records that a repair started, or binds a fix. The request is
 * checked against the ledger first, so a repeated send returns what was saved without reading
 * GitHub again. Then the issue, commit or pull request is read back, and the event is recorded
 * with what GitHub reported. Returns the saved event, the revision it produced and the incident;
 * on a repeated send the incident is as it stands now.
 */
async function writeEvent(req: Request, id: string, context: IncidentsRouteContext): Promise<Response> {
    if (!declaredWithin(req, LIMIT)) return json({ error: `Incident events need a Content-Length of 1 to ${LIMIT} bytes` }, req.headers.get('content-length') === null ? 411 : 413);
    const body = await req.text(), parsed = Write.safeParse((() => { try { return JSON.parse(body); } catch { return undefined; } })());
    if (!parsed.success) return json({ error: 'Expected repair-started {eventId, expectedRevision, issue} or fix-bound {eventId, expectedRevision, reference, bindings}' }, 400);
    const { incidents } = context.offices, execute = context.execute ?? command, write = parsed.data;
    if (!incidents.get(id)) return json({ error: 'No such incident' }, 404);
    const request: WriteRequest = write.kind === 'repair-started' ? { kind: write.kind, issue: write.issue } : { kind: write.kind, reference: write.reference, bindings: write.bindings };
    const saved = replayed(incidents, id, write.eventId, write.expectedRevision, request)
        ?? recordIncidentEvent(incidents, id, write.eventId, write.expectedRevision, request.kind === 'repair-started' ? { kind: request.kind, request, issue: await readRepairIssue(request.issue, execute) } : { kind: request.kind, request, fix: await readFix(request.reference, execute) }, (context.now ?? (() => new Date()))());
    return json(sanitizeObject(saved));
}

/**
 * `/api/incidents` lists the ledger; `open=1` keeps incidents with a subject still stopped and
 * `research=1` those eligible for investigation. `/api/incidents/<id>` returns one incident with
 * its event history. Both only read. `/api/incidents/<id>/events` accepts the two events a person
 * or the repair runner may record; nothing else about an incident can be written from outside.
 */
export async function incidentsRoute(req: Request, url: URL, context: IncidentsRouteContext): Promise<Response | undefined> {
    if (url.pathname !== '/api/incidents' && !url.pathname.startsWith('/api/incidents/')) return undefined;
    const events = /^\/api\/incidents\/(inc-[0-9a-f]{16})\/events$/.exec(url.pathname);
    if (events) return req.method === 'POST' ? writeEvent(req, events[1], context) : json({ error: 'POST required' }, 405);
    if (req.method !== 'GET') return json({ error: 'GET required' }, 405);
    const { incidents } = context.offices;
    if (url.pathname === '/api/incidents') {
        const open = url.searchParams.get('open') === '1', research = url.searchParams.get('research') === '1';
        return json(sanitizeObject({ incidents: incidents.list().filter(incident => (!open || incident.subjects.some(subject => subject.status === 'open')) && (!research || incident.research.eligible)) }));
    }
    const id = url.pathname.slice('/api/incidents/'.length), incident = /^inc-[0-9a-f]{16}$/.test(id) ? incidents.get(id) : null;
    return incident ? json(sanitizeObject({ incident, events: incidents.events(id) })) : json({ error: 'No such incident' }, 404);
}
