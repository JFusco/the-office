import { TimeClassificationInput } from './time/time-classification';
import { DiscoveryResumeInput, bindDiscoveryResume } from './delivery/recovery/implementation/discovery-recovery';
import { runtimeRevision } from './office/revision';
import { projectReadiness } from './office/readiness';
import { goalHistory } from './leadership/goal-reviews';
import { reconcileGoalReportCommand } from './leadership/goal-reporting';
import { enqueueRequest, enqueueSourceAmendment, enqueueCloseoutReconciliation } from './scheduling/requests';
import { ITSpecialist } from './it/it-specialist';
import { ServiceHealthChecks } from './office/service-health';
import { reconcileReadRetries } from './scheduling/read-retries';
import { GitHubDelivery } from './delivery/pipeline/github-delivery';
import { configureNotices, retryRecipientLookup } from './conversations/notifications';
import { timeLedger, TimeLedger } from './time/time-ledger';
import { serve } from '@hono/node-server';
import type { Server } from 'node:http';
import { existsSync, realpathSync, mkdirSync, openSync, closeSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { createServer } from 'vite';
import { Offices } from './scheduling/offices';
import { validTicket } from './office/projects';
import { saveGoal } from './leadership/goals';
import { timeReport } from '../src/timing';
import { DATA, ROOT, PORT, CEC } from './office/config';
import { containedFile } from './cec/workflow';
import { safeOrigin, sanitize, sanitizeObject } from './office/security';
mkdirSync(DATA, { recursive: true, mode: 0o700 });
const lockPath = resolve(DATA, 'service.pid');
try {
    const fd = openSync(lockPath, 'wx', 0o600);
    writeFileSync(fd, String(process.pid));
    closeSync(fd);
}
catch {
    const pid = Number(readFileSync(lockPath, 'utf8'));
    let alive = false;
    try {
        process.kill(pid, 0);
        alive = true;
    }
    catch (error) {
        alive = (error as NodeJS.ErrnoException).code === 'EPERM';
    }
    if (alive)
        throw new Error(`Office service already owns this state (PID ${pid}). Stop that service before starting another Office.`);
    unlinkSync(lockPath);
    writeFileSync(lockPath, String(process.pid), { mode: 0o600, flag: 'wx' });
}
function releaseLock() {
    try {
        if (Number(readFileSync(lockPath, 'utf8')) === process.pid)
            unlinkSync(lockPath);
    }
    catch { }
}
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
function json(body: unknown, status = 200) { return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } }); }
function fileResponse(path: string, headers: Record<string, string> = {}) {
    const types: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
    return new Response(new Uint8Array(readFileSync(path)), { headers: { 'Content-Type': types[extname(path)] || 'application/octet-stream', ...(extname(path) === '.html' ? { 'Cache-Control': 'no-store' } : {}), ...headers } });
}
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
            if (url.pathname === '/api/service-health') {
                if (req.method !== 'GET')
                    return json({ error: 'GET required' }, 405);
                const report = await serviceHealth.report([...offices.entries.values()].map(e => e.store.state)), inventory = offices.sessions.forProject(store);
                return json({ ...report, loadedHash: loadedRevision.hash, readiness: [...offices.entries.values()].map(entry => projectReadiness(entry, offices.projection(entry), Date.now(), offices.sessions.forProject(entry.store))), dailyCTO: offices.control.summaries()[0] || null, services: [...report.services, ...inventory.sources.map((source, index) => ({ id: `sessions:${index}`, name: source.name, status: source.ok && inventory.fresh ? 'connected' : 'unknown', detail: source.detail, checkedAt: inventory.observedAt || report.checkedAt, nextStep: 'Ellis checks session visibility; Morgan investigates a persistent inventory failure. This is separate from your login. Implementation ownership remains unverified until the inventory succeeds.' }))], it: store.state.it });
            }
            if (url.pathname === '/api/projects')
                return json({ projects: offices.summaries() });
            if (url.pathname === '/api/health')
                return json({ ok: true, loadedHash: loadedRevision.hash, serviceInstanceId: offices.serviceInstanceId, startedAt: store.state.startedAt, readiness: [...offices.entries.values()].map(entry => projectReadiness(entry, offices.projection(entry), Date.now(), offices.sessions.forProject(entry.store))), dailyCTO: offices.control.summaries()[0] || null, mode: store.state.paused ? 'paused' : 'running', pid: process.pid, uptime: process.uptime(), busy: [...offices.entries.values()].some(e => e.engine.busy || e.engine.agents.active.size || e.engine.ctoAgents.active.size || e.engine.itAgents.active.size || e.coordinator?.polling), projects: [...offices.entries.values()].map(e => ({ id: e.store.project.id, busy: e.engine.busy, workers: e.store.state.workLog?.filter(w => w.status === 'running').length || 0, polling: !!e.coordinator?.polling })) });
            if (url.pathname === '/api/office')
                return json(snapshot(project));
            if (url.pathname === '/api/sessions') {
                if (req.method !== 'GET')
                    return json({ error: 'GET required' }, 405);
                const key = url.searchParams.get('ticket') || '';
                if (key && !validTicket(store.project, key))
                    return json({ error: 'Invalid ticket key' }, 400);
                await offices.sessions.refresh();
                return json(sanitizeObject(offices.sessions.forProject(store, key, url.searchParams.get('requestId') || '')));
            }
            if (url.pathname === '/api/time') {
                const ticket = url.searchParams.get('ticket') || '';
                if (ticket && !validTicket(store.project, ticket))
                    return json({ error: 'Invalid ticket key' }, 400);
                return json(sanitizeObject({ summary: timeReport(store.state, ticket), workers: (store.state.workLog || []).filter(w => !ticket || w.ticket === ticket), builds: (store.state.ciHistory || []).filter(b => !ticket || b.linkedTickets?.includes(ticket)) }));
            }
            if (url.pathname === '/api/goals/history') {
                if (req.method !== 'GET')
                    return json({ error: 'GET required' }, 405);
                return json({ applications: goalHistory(store, url.searchParams.get('goalId') || '', Number(url.searchParams.get('limit') || 50), url.searchParams.get('before') || '') });
            }
            if (url.pathname === '/api/daily-cto') {
                if (req.method !== 'GET')
                    return json({ error: 'GET required' }, 405);
                const id = url.searchParams.get('id');
                return json(id ? { report: offices.control.get(id) || null } : { reports: offices.control.list(Number(url.searchParams.get('limit') || 50), url.searchParams.get('before') || '') });
            }
            if (url.pathname === '/api/goals') {
                if (req.method !== 'POST')
                    return json({ error: 'POST required' }, 405);
                const text = await req.text();
                if (text.length > 30000)
                    return json({ error: 'Goal is too large' }, 413);
                return json(saveGoal(store, JSON.parse(text)));
            }
            if (url.pathname === '/api/events') {
                let timer: ReturnType<typeof setInterval>;
                let listener: () => void;
                const stream = new ReadableStream({ start(c) {
                        const send = () => {
                            try {
                                c.enqueue(new TextEncoder().encode(`id: ${store.state.revision}\nevent: snapshot\ndata: ${JSON.stringify(snapshot(project))}\n\n`));
                            }
                            catch {
                                clearInterval(timer);
                                store.listeners.delete(listener);
                            }
                        };
                        const after = Number(req.headers.get('last-event-id') || 0);
                        for (const event of store.replay(after))
                            c.enqueue(new TextEncoder().encode(`id: ${event.id}\nevent: office-event\ndata: ${JSON.stringify(event)}\n\n`));
                        listener = send;
                        store.listeners.add(listener);
                        send();
                        timer = setInterval(send, 10000);
                        req.signal.addEventListener('abort', () => {
                            clearInterval(timer);
                            store.listeners.delete(listener);
                            try {
                                c.close();
                            }
                            catch { }
                        }, { once: true });
                    }, cancel() { clearInterval(timer); store.listeners.delete(listener); } });
                return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' } });
            }
            if (url.pathname === '/api/artifact') {
                const p = url.searchParams.get('path') || '';
                if (!containedFile(p, resolve(store.dataRoot, 'runs')))
                    return json({ error: 'Artifact is not inside a recorded office run' }, 403);
                if (!['.png', '.jpg', '.jpeg', '.webp', '.md', '.json', '.txt'].includes(extname(p)))
                    return json({ error: 'Unsupported artifact type' }, 415);
                return fileResponse(p, { 'Cache-Control': 'private, max-age=30', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox" });
            }
            if (url.pathname === '/api/messages') {
                if (req.method === 'GET')
                    return json({ messages: store.state.messages, outbox: store.state.outbox });
                if (req.method !== 'POST')
                    return json({ error: 'POST required' }, 405);
                if (Number(req.headers.get('content-length') || 0) > 30000)
                    return json({ error: 'Message is too large' }, 413);
                const body = await req.text();
                if (body.length > 30000)
                    return json({ error: 'Message is too large' }, 413);
                const message = conversations.enqueue(JSON.parse(body));
                return json({ accepted: true, id: message.id, status: message.status }, 202);
            }
            if (url.pathname === '/api/commands') {
                if (req.method !== 'POST')
                    return json({ error: 'POST required' }, 405);
                if (Number(req.headers.get('content-length') || 0) > 4096)
                    return json({ error: 'Command is too large' }, 413);
                const body = await req.text();
                if (body.length > 4096)
                    return json({ error: 'Command is too large' }, 413);
                const { action, key, scheduled, authorization, pickup, notifications, time, merges, replacementProject, replacementId, messageId, checkpointId, head, amendment, timeClassification, discovery, closeoutSupervisionProof } = JSON.parse(body);
                if (key && (typeof key !== 'string' || !validTicket(store.project, key)))
                    return json({ error: 'Issue key does not belong to this project' }, 400);
                switch (action) {
                    case 'authorize-source-amendment': return json({ accepted: true, id: enqueueSourceAmendment(store, amendment).id }, 202);
                    case 'reconcile-goal-report': return json(reconcileGoalReportCommand(store, messageId), 202);
                    case 'reconcile-conversation':
                        offices.reconcileConversation(store.project.id, messageId, replacementProject, replacementId);
                        break;
                    case 'check-it': return json({ accepted: true, id: enqueueRequest(store, 'check-it', '', '', 'it').id }, 202);
                    case 'activate-checkpoints':
                        coordinator!.activate();
                        break;
                    case 'retry-checkpoint': return json({ accepted: true, id: enqueueRequest(store, action, checkpointId, head || '').id }, 202);
                    case 'retry-notice-recipient':
                        retryRecipientLookup(store, key);
                        break;
                    case 'configure-notifications':
                        void coordinator!.state;
                        configureNotices(store, notifications);
                        break;
                    case 'reconcile-read-retries':
                        reconcileReadRetries(store);
                        break;
                    case 'defer-non-ready': return json({ accepted: true, id: enqueueRequest(store, action, key, head || '').id }, 202);
                    case 'reconcile-time': return json({ accepted: true, id: enqueueRequest(store, action, key, head || '').id }, 202);
                    case 'configure-time': {
                        void coordinator!.state;
                        if (typeof time?.enabled !== 'boolean' || typeof time?.githubField !== 'boolean')
                            throw new Error('Invalid time settings');
                        const ledger = timeLedger(store);
                        if (ledger.enabled && !time.enabled)
                            ledger.disabledSince = new Date().toISOString();
                        if (!ledger.enabled && time.enabled && ledger.disabledSince) {
                            (ledger.disabledPeriods ??= []).push({ start: ledger.disabledSince, end: new Date().toISOString() });
                            ledger.disabledSince = undefined;
                        }
                        ledger.enabled = time.enabled;
                        ledger.githubField = time.githubField;
                        if (typeof time.jira === 'boolean')
                            ledger.jiraEnabled = time.jira;
                        if (time.jira === true && !ledger.jiraActivatedAt) {
                            ledger.jiraActivatedAt = new Date().toISOString();
                            ledger.jiraConnection = `twg:${CEC.site}`;
                        }
                        store.save();
                        break;
                    }
                    case 'configure-merges': {
                        if (store.project.provider !== 'github' || typeof merges?.enabled !== 'boolean')
                            throw new Error('Invalid GitHub merge setting');
                        coordinator!.state.merges = { enabled: merges.enabled, authorizedAt: new Date().toISOString() };
                        store.emit('merge-policy', merges.enabled ? 'Sam may merge linked issue PRs after current-head review and required checks, then Morgan closes out the issue and board.' : 'Automatic PR merging disabled.', 'pm');
                        break;
                    }
                    case 'configure-pickup':
                        coordinator!.configurePickup(pickup);
                        break;
                    case 'start-assigned':
                        coordinator!.requestWork(key);
                        break;
                    case 'retry-daily-cto': {
                        if (typeof checkpointId !== 'string' || !checkpointId) return json({ error: 'Daily CTO report ID is required' }, 400);
                        const report = offices.dailyCTO.queueRecovery(checkpointId);
                        return json({ accepted: true, id: report.id, status: report.status }, 202);
                    }
                    case 'correct-recovery-time': {
                        const input = TimeClassificationInput.parse(timeClassification);
                        const prior = store.state.coordination!.requests?.find(request => request.action === action && request.head === input.expectedSha256 && request.status === 'completed');
                        if (prior) return json({ accepted: true, id: prior.id, status: prior.status }, 202);
                        const request = store.transaction(() => { const request = enqueueRequest(store, action, '', input.expectedSha256); request.timeClassification = input; store.save(); return request; });
                        return json({ accepted: true, id: request.id }, 202);
                    }
                    case 'resume-discovery': {
                        const input = DiscoveryResumeInput.parse(discovery);
                        const previous = store.state.coordination!.requests?.find(request => request.action === action && request.key === key && request.head === head && request.discoveryResume?.noteId === input.noteId && ['queued', 'working', 'completed'].includes(request.status));
                        if (previous) return json({ accepted: true, id: previous.id, status: previous.status }, 202);
                        const binding = bindDiscoveryResume(store, key, head, discovery);
                        const request = store.transaction(() => {
                            const request = enqueueRequest(store, action, key, head);
                            if (request.discoveryResume && JSON.stringify(request.discoveryResume) !== JSON.stringify(binding)) throw new Error('Queued discovery scope differs');
                            request.discoveryResume = binding; store.save(); return request;
                        });
                        return json({ accepted: true, id: request.id }, 202);
                    }
                    case 'reconcile-validation':
                    case 'reconcile-implementation': return json({ accepted: true, id: enqueueRequest(store, action, key, head || '').id }, 202);
                    case 'adopt-candidate': return json({ accepted: true, id: enqueueRequest(store, action, key).id }, 202);
                    case 'reconcile-scope-repair':
                    case 'reconcile-preparation': return json({ accepted: true, id: enqueueRequest(store, action, key, head || '').id }, 202);
                    case 'approve-merge': return json({ accepted: true, id: enqueueRequest(store, action, key, head || '').id }, 202);
                    case 'reconcile-activation':
                    case 'reconcile-review': return json({ accepted: true, id: enqueueRequest(store, action, key, head || '').id }, 202);
                    case 'reconcile-base-update': return json({ accepted: true, id: enqueueRequest(store, action, key, head || '').id }, 202);
                    case 'reconcile-closeout': return json({ accepted: true, id: enqueueCloseoutReconciliation(store, key, head || '', closeoutSupervisionProof).id }, 202);
                    case 'prepare-pr':
                        coordinator!.preparePR(key);
                        break;
                    case 'repair-pr-conflicts': return json({ accepted: true, id: enqueueRequest(store, action, key, head || '').id }, 202);
                    case 'reconcile-pr-link': return json({ accepted: true, id: enqueueRequest(store, action, key, head || '').id }, 202);
                    case 'update-candidate-base':
                        coordinator!.updateCandidateBase(key);
                        break;
                    case 'review-candidate':
                        coordinator!.recheckCandidate(key);
                        break;
                    case 'review-pr':
                        coordinator!.recheckPR(key);
                        break;
                    case 'review-assignment':
                        coordinator!.recheck(key);
                        break;
                    case 'maintenance': return json({ accepted: true, run: engine.requestMaintenance(scheduled === true) }, 202);
                    case 'check-mail':
                        engine.requestMail(scheduled === true);
                        break;
                    case 'drain':
                        store.state.draining = true;
                        store.emit('draining', 'New dispatch paused; existing workers may finish.');
                        break;
                    case 'pause':
                        engine.pause();
                        break;
                    case 'resume':
                        engine.unpause();
                        break;
                    case 'start-pilot': return json({ accepted: true, request: engine.requestDelivery(key, 'start-pilot') }, 202);
                    case 'resume-ticket': return json({ accepted: true, request: engine.requestDelivery(key, 'resume-ticket') }, 202);
                    case 'refresh-azure': return json({ accepted: true, id: enqueueRequest(store, 'refresh').id }, 202);
                    case 'activate-nightly':
                        engine.enableNightly(authorization);
                        break;
                    default: return json({ error: 'Unknown office command' }, 400);
                }
                store.emit('command-recorded', `${action} recorded by the harness.`);
                return json({ accepted: true, id: store.state.events[0]?.id, action }, 202);
            }
            if (url.pathname.startsWith('/api/'))
                return json({ error: 'Not found' }, 404);
            if (vite) {
                return fetch(`http://127.0.0.1:${PORT + 1}${url.pathname}${url.search}`, { method: req.method, headers: { Accept: req.headers.get('accept') || '*/*' } });
            }
            const file = resolve(ROOT, 'dist', '.' + decodeURIComponent(url.pathname));
            if (containedFile(file, resolve(ROOT, 'dist')) && existsSync(file))
                return fileResponse(file);
            if (url.pathname.includes('.') && url.pathname !== '/')
                return json({ error: 'Not found' }, 404);
            return fileResponse(resolve(ROOT, 'dist/index.html'));
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
const conversationTick = setInterval(() => { void offices.pump().catch(e => console.error(sanitize(String(e)))); }, 2000);
const checkpointTick = setInterval(() => {
    if (process.env.OFFICE_NO_POLL !== '1')
        void offices.tick().catch(e => console.error(sanitize(String(e))));
}, 15000);
const itTick = setInterval(() => {
    if (process.env.OFFICE_NO_POLL !== '1')
        void itSpecialist.tick().catch(e => console.error(sanitize(String(e))));
}, 15000);
const lastPoll = new Map<string, number>();
const tick = setInterval(() => {
    if (process.env.OFFICE_NO_POLL === '1')
        return;
    for (const [id, { store, engine }] of offices.entries) {
        const active = store.state.tickets.some(t => t.pilot && t.stage !== 'complete');
        const interval = store.project.provider === 'github' ? (store.state.github?.prs.some(p => p.state === 'open') || store.state.coordination?.jobs?.some(j => !['completed', 'cancelled'].includes(j.status)) ? 60000 : 120000) : active ? 30000 : 120000;
        if (Date.now() - (lastPoll.get(id) || 0) >= interval) {
            lastPoll.set(id, Date.now());
            enqueueRequest(store, 'refresh');
        }
    }
}, 5000);
async function close() {
    if (shutdown)
        return;
    shutdown = true;
    clearInterval(tick);
    clearInterval(itTick);
    clearInterval(checkpointTick);
    clearInterval(conversationTick);
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
