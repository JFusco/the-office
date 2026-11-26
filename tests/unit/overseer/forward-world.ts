import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { IncidentLedger } from '../../../server/incidents/incident-ledger';
import { incidentsRoute } from '../../../server/incidents/routes';
import type { FailureEvent } from '../../../server/incidents/runner-report';
import { RunnerReports } from '../../../server/incidents/runner-reports';
import { DeploymentFence } from '../../../server/office/deployment-fence';
import { deploymentFenceGate } from '../../../server/office/http/deployment-fence-gate';
import { json } from '../../../server/office/http/responses';
import { safeOrigin } from '../../../server/office/security';
import { ForwardingState } from '../../../server/overseer/forwarding-state';
import { OVERSEER_PROJECT } from '../../../server/overseer/runner-store';
import { Effects } from '../../../server/store/effects';
import { Store } from '../../../server/store/store';
import { tempDir } from './runner-world';

/**
 * Test support: an Office with its real origin check, deployment fence gate and incident routes
 * over a control database of its own, reached through an injected `fetch`, and the runner's
 * private Store with its Effects, both isolated. Nothing listens on a port.
 */

export const ORIGIN = 'http://127.0.0.1:4318';
export const TOKEN = 'deploy-token-0123456789';

export interface Hooks {
    /** Runs before the Office handles a request; it may take the fence, for instance. */
    before?: (method: string, path: string) => void;
    /** After the Office handled it, the reply is lost: the caller sees a reset connection. */
    lose?: (method: string, path: string) => boolean;
    /** Answers instead of the Office (an older Office without these routes, for instance). */
    answer?: (method: string, path: string) => Response | undefined;
}

export function officeWorld(hooks: Hooks = {}, now = () => new Date('2026-11-26T12:00:00.000Z')) {
    const db = new DatabaseSync(join(tempDir(), 'control.sqlite'));
    const incidents = new IncidentLedger(db), runnerReports = new RunnerReports(db), fence = new DeploymentFence(db);
    const requests: string[] = [];
    const offices = { incidents, runnerReports, fence };
    const request: typeof fetch = async (input, init) => {
        const req = new Request(String(input), init), url = new URL(req.url), method = req.method, path = `${url.pathname}${url.search}`;
        requests.push(`${method} ${path}`);
        hooks.before?.(method, path);
        const substitute = hooks.answer?.(method, path);
        let response: Response;
        if (substitute) response = substitute;
        else if (!safeOrigin(req)) response = json({ error: 'Only same-origin local office requests are accepted' }, 403);
        else if (url.pathname === '/api/health') response = json({ ok: true, loadedHash: 'a'.repeat(64), serviceInstanceId: 'service-1', pid: 42, busy: false, fence: fence.read(), release: { status: 'unknown' } });
        else {
            response = await deploymentFenceGate(req, url, { offices }) ?? await (async () => {
                try { return await incidentsRoute(req, url, { offices, now }) ?? json({ error: 'not found' }, 404); }
                catch (error) { return json({ error: String(error) }, 409); }
            })();
        }
        if (hooks.lose?.(method, path)) throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNRESET' } });
        return response;
    };
    return { db, incidents, runnerReports, fence, requests, request, posts: () => requests.filter(line => line.startsWith('POST ')) };
}
export type OfficeWorld = ReturnType<typeof officeWorld>;

/** The runner's private Store: a Store for its own project, its Effects, and the forwarding records beside them. */
export function runnerStore(directory = tempDir()) {
    mkdirSync(join(directory, 'runner-data'), { recursive: true });
    const store = new Store(join(directory, 'runner.sqlite'), OVERSEER_PROJECT, join(directory, 'runner-data'));
    const effects = Object.assign(new Effects(store), { readIntent: (id: string) => store.getEffect<Record<string, unknown>>(id) });
    let closed = false;
    return { store, effects, state: new ForwardingState(store.db), close: () => { if (!closed) { closed = true; store.db.close(); } } };
}

/** A failure event as the runner journals it. */
export function failure(kind: FailureEvent['kind'], episode: string = randomUUID(), at = '2026-11-26T11:00:00.000Z', detail = 'The Office could not be read: fetch failed'): FailureEvent {
    return { version: 1, id: `overseer:${kind}:${episode}`, kind, at, episode, detail, evidence: { passes: 2 } };
}
