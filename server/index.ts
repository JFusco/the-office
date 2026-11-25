import { runtimeRevision } from './office/revision';
import { ITSpecialist } from './it/it-specialist';
import { ServiceHealthChecks } from './office/service-health';
import { serve } from '@hono/node-server';
import type { Server } from 'node:http';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'vite';
import { Offices } from './scheduling/offices';
import { DATA, ROOT, PORT, CEC, HOLDS } from './office/config';
import { PROJECTS, PROJECT_BINDINGS, PROJECT_POLICY_INPUTS } from './office/projects';
import { safeOrigin, sanitize } from './office/security';
import { acquireServiceLock } from './office/service-lock';
import { json } from './office/http/responses';
import { apiRoute } from './office/http/api-routes';
import { commandRoute } from './office/http/commands';
import { staticRoute } from './office/http/static-files';
import { preferencesRoute } from './office/http/preferences';
import { officeConfigRoute } from './office/http/office-config';
import { telemetryRoute } from './telemetry/telemetry-route';
import { deploymentFenceRoute } from './office/http/deployment-fence-route';
import { deploymentFenceGate } from './office/http/deployment-fence-gate';
import { keepAliveThroughStalls } from './office/http/keep-alive';
import { startServiceTicks } from './office/service-ticks';
import { snapshotText } from './office/http/snapshot-text';
import { loopDelay } from './office/loop-delay';
import { incidentsRoute } from './incidents/routes';
import { sweepStaleSessionSnapshots } from './workers/session-snapshot-cleanup';
mkdirSync(DATA, { recursive: true, mode: 0o700 });
const releaseLock = acquireServiceLock(DATA);
process.on('exit', releaseLock);
// A capture directory a service that died left behind may hold a named clone of a session log.
sweepStaleSessionSnapshots();
const offices = new Offices();
const loadedRevision = runtimeRevision();
// The GitHub login probe is metered with the Office's other GitHub calls; public status and other probes keep the base runner.
const serviceHealth = new ServiceHealthChecks(undefined, offices.githubCalls.run);
const itSpecialist = new ITSpecialist(offices, serviceHealth);
for (const entry of offices.entries.values())
    entry.conversations.checkIT = () => itSpecialist.tick(new Date(), true);
const built = existsSync(resolve(ROOT, 'dist/index.html')) && process.env.OFFICE_DEV !== '1';
const vite = built ? null : await createServer({ configFile: resolve(ROOT, 'vite.config.ts'), server: { host: '127.0.0.1', port: PORT + 1, strictPort: true, hmr: { clientPort: PORT + 1 } } });
if (vite)
    await vite.listen();
const config = { projects: PROJECTS, cec: CEC, holds: HOLDS, bindings: PROJECT_BINDINGS, policies: PROJECT_POLICY_INPUTS };
/** One project's snapshot as the browser receives it: redacted text. The unredacted object is never handed to a route. */
function snapshot(project: string, purpose: 'a request' | 'a push') { return snapshotText(offices.get(project).store, () => offices.snapshot(project), purpose); }
// Started once the stores are open, so startup itself is not counted as a late main thread.
const watchedLoop = loopDelay();
let shutdown = false;
const server = serve({ hostname: '127.0.0.1', port: PORT,
    // A request's `gh` calls go to the Office's metered runner (server/github/call-scope.ts).
    fetch: req => offices.githubCalls.bind(() => respond(req)) }) as Server;
async function respond(req: Request): Promise<Response> {
    if (!safeOrigin(req))
        return json({ error: 'Only same-origin local office requests are accepted' }, 403);
    const url = new URL(req.url);
    let endWrite: (() => void) | undefined;
    try {
        // Office-wide routes run before project resolution: they need no project query.
        const service = { offices, serviceHealth, itSpecialist, loadedRevision, snapshotText: snapshot, vite, config, loopDelay: watchedLoop, preferences: offices.preferences, serviceInstanceId: offices.serviceInstanceId };
        // The fence's own endpoints, then its gate: while a deployment holds it, every other write is refused.
        for (const route of [deploymentFenceRoute, deploymentFenceGate]) {
            const response = await route(req, url, service);
            if (response) return response;
        }
        // A write that passed the open gate keeps health busy until it ends, so a fence taken meanwhile waits for it.
        endWrite = req.method === 'GET' || req.method === 'HEAD' ? undefined : offices.operations.begin();
        for (const route of [preferencesRoute, officeConfigRoute, telemetryRoute, incidentsRoute]) {
            const response = await route(req, url, service);
            if (response) return response;
        }
        const project = url.searchParams.get('project') || offices.entries.keys().next().value || 'cec';
        const { store, engine, conversations, coordinator } = offices.get(project);
        const context = { ...service, project, store, engine, conversations, coordinator };
        for (const route of [apiRoute, commandRoute, staticRoute]) {
            const response = await route(req, url, context);
            if (response) return response;
        }
        return json({ error: 'Not found' }, 404);
    }
    catch (e) {
        return json({ error: sanitize(e instanceof Error ? e.message : String(e)) }, 409);
    }
    finally { endWrite?.(); }
}
await new Promise<void>((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
server.requestTimeout = 255000;
keepAliveThroughStalls(server);
for (const { store } of offices.entries.values())
    store.emit('office-opened', `${store.project.name} office is open. Saved work has been recovered; remote evidence still needs current verification.`);
console.log(`\n  The Office is open → http://127.0.0.1:${PORT}\n  ${built ? 'Production build' : 'Development preview'} · Local only\n`);
// Timers started here keep the binding, so their `gh` calls go to the Office's metered runner.
const stopTicks = offices.githubCalls.bind(() => startServiceTicks({ offices, itSpecialist, loadedRevision }));
async function close() {
    if (shutdown)
        return;
    shutdown = true;
    stopTicks();
    for (const { engine } of offices.entries.values()) {
        engine.features.pause();
        engine.agents.pause();
        engine.ctoAgents.pause();
        engine.itAgents.pause();
        engine.knowledgeAgents.pause();
    }
    server.close();
    server.closeAllConnections();
    await Promise.all([...offices.entries.values()].flatMap(({ engine }) => [engine.features.review.waitForIdle(), engine.agents.waitForIdle(), engine.ctoAgents.waitForIdle(), engine.itAgents.waitForIdle(), engine.knowledgeAgents.waitForIdle()]));
    await vite?.close();
    for (const { store } of offices.entries.values())
        store.close();
    offices.dispose();
    offices.control.close();
    releaseLock();
    process.exit(0);
}
process.on('SIGINT', () => void close());
process.on('SIGTERM', () => void close());
