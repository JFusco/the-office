import type { Store } from '../store/store';
import { validTicket } from '../office/projects';
import { json } from '../office/http/responses';
import { sanitizeObject } from '../office/security';
import { telemetryReport, type TelemetryQuery } from '../../src/telemetry/report';

/**
 * GET /api/telemetry?scope=office|project&projectId=<id>&ticket=<key>&days=7|30|all
 * Office-wide: it runs before project resolution and reads every project's store.
 */
export async function telemetryRoute(req: Request, url: URL, context: { offices: { stores(): Map<string, Store> } }): Promise<Response | undefined> {
    if (url.pathname !== '/api/telemetry') return undefined;
    if (req.method !== 'GET') return json({ error: 'GET required' }, 405);
    const scope = url.searchParams.get('scope') || 'office', projectId = url.searchParams.get('projectId'), ticket = url.searchParams.get('ticket'), daysParam = url.searchParams.get('days') || '30';
    if (scope !== 'office' && scope !== 'project') return json({ error: 'scope must be office or project' }, 400);
    if (!['7', '30', 'all'].includes(daysParam)) return json({ error: 'days must be 7, 30 or all' }, 400);
    const stores = context.offices.stores();
    if (scope === 'project' && (!projectId || !stores.has(projectId))) return json({ error: 'Unknown project' }, 400);
    if (ticket) {
        if (scope !== 'project') return json({ error: 'A ticket filter needs project scope' }, 400);
        const store = stores.get(projectId!)!;
        if (!validTicket(store.project, ticket)) return json({ error: 'Invalid ticket key' }, 400);
        if (!(store.state.workLog || []).some(work => work.ticket === ticket) && !store.state.coordination?.time?.entries.some(entry => entry.key === ticket))
            return json({ error: 'Ticket has no recorded work in this project' }, 400);
    }
    const query: TelemetryQuery = { scope, projectId, ticket, days: daysParam === 'all' ? 'all' : Number(daysParam) as 7 | 30 };
    const projects = [...stores.values()].map(store => ({ id: store.project.id, name: store.project.name, provider: store.project.provider, workLog: store.state.workLog || [], time: store.state.coordination?.time, hasBoard: !!store.project.githubProject }));
    return json(sanitizeObject(telemetryReport(projects, query)));
}
