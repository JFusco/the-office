import { validTicket } from '../../office/projects';
import { sanitize } from '../../office/security';
import { json } from '../../office/http/responses';
import { implementationPreview } from './intent';
import type { Store } from '../../store/store';

export async function implementationContinuationRoute(req: Request, url: URL, store: Store) {
    if (url.pathname !== '/api/cec/saved-implementation') return;
    if (req.method !== 'GET') return json({ error: 'GET required' }, 405);
    const key = url.searchParams.get('ticket') || '';
    if (store.project.id !== 'cec' || !validTicket(store.project, key)) return json({ error: 'Ticket does not belong to this project' }, 400);
    try { return json({ available: true, proof: await implementationPreview(store, key) }); }
    catch (error) { return json({ available: false, reason: sanitize(error instanceof Error ? error.message : 'Office must reconcile the saved implementation') }); }
}
