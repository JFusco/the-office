import type { Store } from '../../store/store';
import { json } from '../../office/http/responses';
import { validTicket } from '../../office/projects';
import { sanitize } from '../../office/security';
import { inspectClosedQAPlan } from './inspect-closed-plan';
export async function qaPlanRetryRoute(req: Request, url: URL, store: Store, dataRoot: string) {
    if (url.pathname !== '/api/cec/incomplete-qa-plan') return;
    if (req.method !== 'GET') return json({ error: 'GET required' }, 405);
    const key = url.searchParams.get('ticket') || '';
    if (store.project.id !== 'cec' || !validTicket(store.project, key)) return json({ error: 'Ticket does not belong to this project' }, 400);
    try { return json({ available: true, proof: await inspectClosedQAPlan(store, key, dataRoot) }); }
    catch (error) { return json({ available: false, reason: sanitize(error instanceof Error ? error.message : 'QA history needs reconciliation') }); }
}
