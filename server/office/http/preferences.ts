import { z } from 'zod';
import type { PreferencesStore } from '../preferences-store';
import { json } from './responses';

export interface PreferencesRouteContext { preferences: PreferencesStore; serviceInstanceId: string }
const LIMIT = 4096;

/** GET/POST /api/preferences: office-wide preferences, independent of any project. */
export async function preferencesRoute(req: Request, url: URL, context: PreferencesRouteContext): Promise<Response | undefined> {
    if (url.pathname !== '/api/preferences') return undefined;
    const respond = () => json({ ...context.preferences.read(), serviceInstanceId: context.serviceInstanceId });
    if (req.method === 'GET') return respond();
    if (req.method !== 'POST') return json({ error: 'GET or POST required' }, 405);
    if (Number(req.headers.get('content-length') || 0) > LIMIT) return json({ error: 'Preferences are too large' }, 413);
    const bytes = new Uint8Array(await req.arrayBuffer());
    if (bytes.byteLength > LIMIT) return json({ error: 'Preferences are too large' }, 413);
    let body: unknown;
    try { body = JSON.parse(new TextDecoder().decode(bytes)); }
    catch { return json({ error: 'Preferences must be JSON' }, 400); }
    try { context.preferences.patch(body); }
    catch (error) {
        if (error instanceof z.ZodError) return json({ error: 'Invalid preferences: ' + error.issues.map(issue => issue.message).join('; ') }, 400);
        throw error;
    }
    return respond();
}
