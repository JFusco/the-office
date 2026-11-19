import type { DeploymentFence } from '../deployment-fence';
import { json } from './responses';
import { declaredWithin } from './declared-length';

const LIMIT = 4096;
/** Commands that only stop work stay available to an operator during a deployment. */
const STOPPING_COMMANDS = new Set(['pause', 'drain']);

export interface DeploymentFenceGateContext { offices: { fence: DeploymentFence } }

/**
 * Peeks at a cloned body so the command route still reads the original. Only a body that declares a
 * Content-Length within the limit is read; an undeclared or oversized one is refused unread.
 */
async function stoppingCommand(req: Request, url: URL): Promise<boolean> {
    if (url.pathname !== '/api/commands' || req.method !== 'POST' || !declaredWithin(req, LIMIT)) return false;
    try {
        return STOPPING_COMMANDS.has(JSON.parse(await req.clone().text())?.action);
    } catch { return false; }
}

/**
 * While a deployment holds the fence, every write other than the fence's own endpoints (served before this)
 * and the `pause` and `drain` commands is refused, so nothing admits new work through HTTP. Reads pass.
 */
export async function deploymentFenceGate(req: Request, url: URL, context: DeploymentFenceGateContext): Promise<Response | undefined> {
    if (req.method === 'GET' || req.method === 'HEAD') return undefined;
    const fence = context.offices.fence.read();
    if (fence.status === 'open' || await stoppingCommand(req, url)) return undefined;
    return json({ error: 'A deployment holds the Office fence; no new work is admitted until it is released.', fence }, 409);
}
