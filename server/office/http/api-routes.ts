import { projectReadiness } from '../readiness';
import { goalHistory } from '../../leadership/goal-reviews';
import { resolve, extname } from 'node:path';
import { validTicket } from '../projects';
import { saveGoal } from '../../leadership/goals';
import { timeReport } from '../../../src/timing/timing';
import { containedFile } from '../../cec/workflow';
import { sanitizeObject } from '../security';
import type { ServiceContext, RequestContext } from './context';
import { json, fileResponse } from './responses';

/** Read and write API routes other than office commands. */
export async function apiRoute(req: Request, url: URL, context: ServiceContext & RequestContext): Promise<Response | undefined> {
    const { offices, serviceHealth, itSpecialist, loadedRevision, snapshot, vite, project, store, engine, conversations, coordinator } = context;
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
    return undefined;
}
