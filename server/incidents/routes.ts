import type { IncidentLedger } from './incident-ledger';
import { json } from '../office/http/responses';
import { sanitizeObject } from '../office/security';

export interface IncidentsRouteContext { offices: { incidents: IncidentLedger } }

/**
 * `/api/incidents` lists the ledger; `open=1` keeps incidents with a subject still stopped and
 * `research=1` those eligible for investigation. `/api/incidents/<id>` returns one incident with
 * its event history. Read-only: an incident is changed by observation, never through this route.
 */
export async function incidentsRoute(req: Request, url: URL, context: IncidentsRouteContext): Promise<Response | undefined> {
    if (url.pathname !== '/api/incidents' && !url.pathname.startsWith('/api/incidents/')) return undefined;
    if (req.method !== 'GET') return json({ error: 'GET required' }, 405);
    const { incidents } = context.offices;
    if (url.pathname === '/api/incidents') {
        const open = url.searchParams.get('open') === '1', research = url.searchParams.get('research') === '1';
        return json(sanitizeObject({ incidents: incidents.list().filter(incident => (!open || incident.subjects.some(subject => subject.status === 'open')) && (!research || incident.research.eligible)) }));
    }
    const id = url.pathname.slice('/api/incidents/'.length), incident = /^inc-[0-9a-f]{16}$/.test(id) ? incidents.get(id) : null;
    return incident ? json(sanitizeObject({ incident, events: incidents.events(id) })) : json({ error: 'No such incident' }, 404);
}
