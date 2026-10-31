import { runtimeRevision } from './office/revision';
import { ITSpecialist } from './it/it-specialist';
import { ServiceHealthChecks } from './office/service-health';
import { serve } from '@hono/node-server';
import type { Server } from 'node:http';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'vite';
import { Offices } from './scheduling/offices';
import { DATA, ROOT, PORT } from './office/config';
import { safeOrigin, sanitize, sanitizeObject } from './office/security';
import { acquireServiceLock } from './office/service-lock';
import { json } from './office/http/responses';
import { apiRoute } from './office/http/api-routes';
import { commandRoute } from './office/http/commands';
import { staticRoute } from './office/http/static-files';
import { startServiceTicks } from './office/service-ticks';
mkdirSync(DATA, { recursive: true, mode: 0o700 });
const releaseLock = acquireServiceLock(DATA);
process.on('exit', releaseLock);
const offices = new Offices();
const loadedRevision = runtimeRevision();
const serviceHealth = new ServiceHealthChecks();
const itSpecialist = new ITSpecialist(offices, serviceHealth);
for (const entry of offices.entries.values())
    entry.conversations.checkIT = () => itSpecialist.tick(new Date(), true);
const built = existsSync(resolve(ROOT, 'dist/index.html')) && process.env.OFFICE_DEV !== '1';
const vite = built ? null : await createServer({ configFile: resolve(ROOT, 'vite.config.ts'), server: { host: '127.0.0.1', port: PORT + 1, strictPort: true, hmr: { clientPort: PORT + 1 } } });
if (vite)
    await vite.listen();
function snapshot(project = 'cec') { return sanitizeObject(offices.snapshot(project)); }
let shutdown = false;
const server = serve({ hostname: '127.0.0.1', port: PORT,
    async fetch(req) {
        if (!safeOrigin(req))
            return json({ error: 'Only same-origin local office requests are accepted' }, 403);
        const url = new URL(req.url);
        try {
            const project = url.searchParams.get('project') || offices.entries.keys().next().value || 'cec';
            const { store, engine, conversations, coordinator } = offices.get(project);
            const context = { offices, serviceHealth, itSpecialist, loadedRevision, snapshot, vite, project, store, engine, conversations, coordinator };
            for (const route of [apiRoute, commandRoute, staticRoute]) {
                const response = await route(req, url, context);
                if (response) return response;
            }
            return json({ error: 'Not found' }, 404);
        }
        catch (e) {
            return json({ error: sanitize(e instanceof Error ? e.message : String(e)) }, 409);
        }
    } }) as Server;
await new Promise<void>((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
server.requestTimeout = 255000;
for (const { store } of offices.entries.values())
    store.emit('office-opened', `${store.project.name} office is open. Saved work has been recovered; remote evidence still needs current verification.`);
console.log(`\n  The Office is open → http://127.0.0.1:${PORT}\n  ${built ? 'Production build' : 'Development preview'} · Local only\n`);
const stopTicks = startServiceTicks({ offices, itSpecialist });
async function close() {
    if (shutdown)
        return;
    shutdown = true;
    stopTicks();
    for (const { engine } of offices.entries.values()) {
        engine.agents.pause();
        engine.ctoAgents.pause();
        engine.itAgents.pause();
    }
    server.close();
    server.closeAllConnections();
    await Promise.all([...offices.entries.values()].flatMap(({ engine }) => [engine.agents.waitForIdle(), engine.ctoAgents.waitForIdle(), engine.itAgents.waitForIdle()]));
    await vite?.close();
    for (const { store } of offices.entries.values())
        store.close();
    offices.control.close();
    releaseLock();
    process.exit(0);
}
process.on('SIGINT', () => void close());
process.on('SIGTERM', () => void close());
