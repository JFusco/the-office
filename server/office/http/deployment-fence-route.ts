import { z } from 'zod';
import type { DeploymentFence } from '../deployment-fence';
import { json } from './responses';
import { declaredWithin } from './declared-length';

const LIMIT = 4096;
const Action = z.discriminatedUnion('action', [
    z.object({ action: z.literal('acquire'), token: z.string(), deployment: z.string() }).strict(),
    z.object({ action: z.literal('release'), token: z.string() }).strict(),
    z.object({ action: z.literal('clear-invalid') }).strict(),
]);

export interface DeploymentFenceRouteContext { offices: { fence: DeploymentFence } }

/** `/api/deployment-fence`: reads, acquires, releases or clears the fence. Everything else passes through. */
export async function deploymentFenceRoute(req: Request, url: URL, context: DeploymentFenceRouteContext): Promise<Response | undefined> {
    if (url.pathname !== '/api/deployment-fence') return undefined;
    const { fence } = context.offices;
    if (req.method === 'GET') return json({ fence: fence.read() });
    if (req.method !== 'POST') return json({ error: 'GET or POST required' }, 405);
    // The body is read only when it declares a byte length within the limit.
    if (!declaredWithin(req, LIMIT)) return json({ error: `Fence requests need a Content-Length of 1 to ${LIMIT} bytes` }, req.headers.get('content-length') === null ? 411 : 413);
    const text = await req.text();
    const parsed = Action.safeParse((() => { try { return JSON.parse(text); } catch { return undefined; } })());
    if (!parsed.success) return json({ error: 'Expected acquire {token, deployment}, release {token} or clear-invalid' }, 400);
    const body = parsed.data;
    const state = body.action === 'acquire' ? fence.acquire(body.token, body.deployment) : body.action === 'release' ? fence.release(body.token) : fence.clearInvalid();
    return json({ fence: state });
}
