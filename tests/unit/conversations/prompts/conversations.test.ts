import { syncOutbox, projectOutbox } from '../../../../server/conversations/outbox';
import { readFile } from 'node:fs/promises';
import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../../server/store/store';
import { Engine } from '../../../../server/scheduling/engine';
import { Conversations } from '../../../../server/conversations/conversations';
import { CEC, DATA } from '../../../../server/office/config';
import type { Ticket } from '../../../../src/shared';
const cleanup: string[] = [];
afterEach(() => {
    for (const p of cleanup.splice(0))
        rmSync(p, { recursive: true, force: true });
});
function setup(path = ':memory:') { const artifacts = mkdtempSync(resolve(tmpdir(), 'office-messages-')); cleanup.push(artifacts); const store = new Store(path), engine = new Engine(store), chat = new Conversations(store, engine, artifacts); chat.archive = () => { }; return { store, engine, chat }; }
function input(body = 'Synthetic conversation test', extra: Record<string, unknown> = {}) { return { id: crypto.randomUUID(), role: 'pm' as const, ticket: '', actionId: '', body, recheck: false, ...extra }; }
function ticket(extra: Partial<Ticket> = {}): Ticket { return { key: 'CEC-999', summary: 'Unit fixture only', type: 'Bug', status: 'QA', statusId: '10300', assignee: CEC.account, subtask: false, boardMember: true, url: 'https://example.org/CEC-999', updated: '', stage: 'qa', activity: 'blocked', blocker: 'Need lower-environment access', runId: 'unit', attempt: 0, commit: 'a'.repeat(40), branch: 'unit', worktree: '', previewUrl: '', prId: 0, results: {}, findings: [], evidence: [], pilot: true, observedAt: '', ...extra }; }
const response = { handoffProject: '', pickupChange: null, reply: 'Synthetic reply; not a live model result.', notifyRoles: [] as ('developer' | 'lead' | 'qa')[], question: '', goalChanges: [], slackRequests: [], notes: [], receipts: [] };
test('outbox reconciles one item per blocker, and a human reply cannot mark the blocker resolved', async () => {
    const { store, engine, chat } = setup();
    store.state.tickets = [ticket()];
    store.save();
    syncOutbox(store.state);
    const action = store.state.outbox[0];
    expect(action.ticket).toBe('CEC-999');
    store.save();
    expect(store.state.outbox).toHaveLength(1);
    engine.agents.followup = async () => response;
    chat.enqueue(input('I think it is fixed', { ticket: 'CEC-999', actionId: action.id }));
    await chat.pump();
    expect(action.status).toBe('open');
    store.state.tickets[0].activity = 'working';
    store.state.tickets[0].blocker = '';
    store.save();
    syncOutbox(store.state);
    expect(store.state.outbox[0].status).toBe('resolved');
    store.state.tickets[0].activity = 'blocked';
    store.state.tickets[0].blocker = 'A different access failure';
    store.save();
    syncOutbox(store.state);
    expect(store.state.outbox[0].status).toBe('open');
    expect(store.state.outbox).toHaveLength(1);
    store.close();
});
test('idempotent message delivery invokes PM and each selected teammate once', async () => {
    const { store, engine, chat } = setup();
    const calls: string[] = [];
    engine.agents.followup = async (role, _m, brief) => {
        calls.push(role);
        if (role === 'pm')
            return { ...response, notifyRoles: ['developer', 'qa'] };
        expect(brief).toBe(response.reply);
        return response;
    };
    const data = input();
    const m = chat.enqueue(data);
    expect(chat.enqueue(data)).toBe(m);
    await chat.pump();
    await chat.pump();
    expect(calls).toEqual(['pm', 'developer', 'qa']);
    expect(m.status).toBe('answered');
    expect(store.state.messages).toHaveLength(4);
    expect(store.state.lastHandoff?.to).toBe('qa');
    expect(() => chat.enqueue({ ...data, body: 'different' })).toThrow('different request');
    store.close();
});
test('queued replies survive restart; running replies become interrupted and never replay', async () => {
    const dir = mkdtempSync(resolve(tmpdir(), 'office-conversation-'));
    cleanup.push(dir);
    const path = resolve(dir, 'state.sqlite');
    const a = setup(path);
    const queued = a.chat.enqueue(input());
    const interrupted = a.chat.enqueue(input('Other message'));
    interrupted.status = 'working';
    a.store.save();
    a.store.close();
    const b = setup(path);
    b.store.recover();
    let calls = 0;
    b.engine.agents.followup = async () => { calls++; return response; };
    await b.chat.pump();
    await b.chat.pump();
    expect(calls).toBe(1);
    expect(b.store.state.messages.find(m => m.id === queued.id)?.status).toBe('answered');
    expect(b.store.state.messages.find(m => m.id === interrupted.id)?.status).toBe('interrupted');
    expect(b.store.state.outbox.some(a => a.id === `message:${interrupted.id}`)).toBe(true);
    b.store.close();
});
test('paused or occupied office queues messages; uncertain Jira writes stop relay and recheck', async () => {
    const { store, engine, chat } = setup();
    let calls = 0, rechecks = 0;
    engine.observe = async () => { rechecks++; };
    engine.agents.followup = async () => { calls++; return { ...response, notifyRoles: ['qa'], receipts: [{ id: 'uncertain', action: 'jira-update', target: 'CEC-999', verified: false, uncertain: true, detail: 'Timeout after submit' }] }; };
    const m = chat.enqueue(input('Synthetic update', { recheck: true }));
    store.state.paused = true;
    await chat.pump();
    expect(calls).toBe(0);
    store.state.paused = false;
    engine.busy = true;
    await chat.pump();
    expect(calls).toBe(0);
    engine.busy = false;
    await chat.pump();
    expect(m.status).toBe('failed');
    expect(calls).toBe(1);
    expect(rechecks).toBe(0);
    await chat.pump();
    expect(calls).toBe(1);
    store.close();
});
test('send and recheck uses the normal live resume guard and retains blocked work on failure', async () => {
    const { store, engine, chat } = setup();
    store.state.tickets = [ticket()];
    store.save();
    engine.agents.followup = async () => response;
    let resumed = 0;
    engine.resume = async (key) => { expect(key).toBe('CEC-999'); resumed++; throw new Error('Live read-back still shows an access hold'); };
    chat.enqueue(input('Access is available now', { ticket: 'CEC-999', recheck: true }));
    await chat.pump();
    expect(resumed).toBe(0);
    expect(store.state.deliveryQueue?.[0]).toMatchObject({ key: 'CEC-999', status: 'queued', action: 'resume-ticket' });
    await engine.drainDelivery();
    expect(resumed).toBe(1);
    expect(store.state.outbox[0].status).toBe('open');
    expect(store.state.deliveryQueue?.[0].status).toBe('blocked');
    store.close();
});
test('PM follow-up uses ticket-scoped write authority and forwards context to real worker entrypoint', async () => {
    const { store, engine, chat } = setup();
    store.state.tickets = [ticket()];
    let prompt = '', readOnly: boolean | undefined;
    engine.agents.run = async (_role, task, _schema, opts) => { prompt = task; readOnly = opts?.readOnly; return response as any; };
    const message = chat.enqueue(input());
    await engine.agents.followup('pm', message);
    expect(readOnly).toBe(true);
    expect(prompt).toContain('must never change external services');
    message.ticket = 'CEC-999';
    await engine.agents.followup('pm', message);
    expect(readOnly).toBe(false);
    expect(prompt).toContain('concurrent edits');
    expect(prompt).toContain('ONLY for the explicitly linked ticket');
    await engine.agents.followup('qa', message, 'Morgan’s saved instruction');
    expect(readOnly).toBe(true);
    expect(prompt).toContain('Morgan’s saved instruction');
    store.close();
});
test('reply validation rejects unknown ticket/action and empty messages', () => { const { store, chat } = setup(); expect(() => chat.enqueue(input(' '))).toThrow(); expect(() => chat.enqueue(input('test', { ticket: 'CEC-999' }))).toThrow('Ticket not found'); expect(() => chat.enqueue(input('test', { actionId: 'unknown' }))).toThrow('does not match'); store.close(); });
test('the PM records project decisions as durable notes and a verified local receipt', async () => {
    const { store, engine, chat } = setup();
    engine.agents.followup = async () => ({ ...response, notes: [{ summary: 'Synthetic test decision', detail: 'Unit fixture; never live project requirements.' }] });
    const path = resolve(chat.artifactsRoot, 'project-notes.md');
    try {
        const m = chat.enqueue(input());
        await chat.pump();
        expect(store.state.projectNotes).toHaveLength(1);
        expect(store.state.projectNotes[0].requestId).toBe(m.id);
        expect(store.state.messages.find(r => r.from === 'pm')?.receipts.some(r => r.action === 'project-note' && r.verified)).toBe(true);
        expect(await readFile(path, 'utf8')).toContain('Synthetic test decision');
    }
    finally {
        store.close();
    }
});
test('scheduled mail waits for a conversation without losing the scheduled dispatch intent', async () => {
    const { store, engine } = setup();
    const checks: boolean[] = [];
    engine.checkMail = async (scheduled) => { checks.push(!!scheduled); };
    engine.busy = true;
    engine.requestMail(true);
    engine.requestMail(false);
    expect(checks).toHaveLength(0);
    expect(store.state.pendingMail?.scheduled).toBe(true);
    expect(await engine.drainMail()).toBe(false);
    engine.busy = false;
    expect(await engine.drainMail()).toBe(true);
    expect(checks).toEqual([true]);
    expect(store.state.pendingMail).toBeUndefined();
    expect(await engine.drainMail()).toBe(false);
    store.close();
});
test('a queued stale intake reply for Backlog is deferred without a model, approval question or team handoff', async () => {
    const { store, engine, chat } = setup();
    store.state.coordination = { enabled: true, listener: { assigned: [{ key: 'CEC-999', status: 'Backlog' }], reviews: [{ id: 'r', key: 'CEC-999', status: 'held' }] } } as any;
    store.state.tickets = [ticket({ pilot: false, activity: 'waiting' })];
    store.state.outbox = [{ id: 'assignment:r', ticket: 'CEC-999', status: 'open' }] as any;
    const m = { ...input('go ahead Morgan'), from: 'human', to: 'pm', requestId: crypto.randomUUID(), ticket: 'CEC-999', actionId: 'assignment:r', status: 'queued', recipients: [], receipts: [], error: '', sessionId: '', recheck: false, createdAt: new Date().toISOString() } as any;
    store.state.messages.push(m); /* already queued before lane changed */
    engine.agents.followup = async () => { throw new Error('Must not invoke a model for a deferred intake reply'); };
    await chat.pump();
    expect(m.status).toBe('answered');
    expect(store.state.messages.at(-1)?.question).toBe('');
    expect(store.state.messages.at(-1)?.body).toContain('No approval or new team work is due');
    store.close();
});
test('maintenance recheck performs one reconciliation without a preliminary discussion worker', async () => {
    const { store, engine, chat } = setup();
    const run: any = { id: 'original', status: 'blocked', stage: 'follow-up', error: 'Unknown', steps: [] };
    store.state.maintenance = { runs: [run], lastDaily: '', lastWeekly: '', ledger: '' };
    store.save();
    engine.agents.followup = async () => { throw new Error('An extra discussion worker must not run'); };
    let reads = 0;
    engine.maintenance.reconcile = async (id) => { expect(id).toBe('original'); reads++; run.status = 'reconciled'; run.error = ''; run.steps.push({ result: { summary: 'Original effect verified.', receipts: [] } }); return run; };
    const m = chat.enqueue(input('Read back this original run', { actionId: 'maintenance:original', recheck: true }));
    await chat.pump();
    expect(reads).toBe(1);
    expect(m.status).toBe('answered');
    expect(store.state.outbox.find(a => a.id === 'maintenance:original')?.status).toBe('resolved');
    expect(store.state.messages.at(-1)?.body).toContain('does not claim checkpoint completion');
    store.close();
});
test('Ellis uses durable chat, deduplicates requests and reports through Morgan', async () => {
    const { store, engine, chat } = setup();
    const calls: string[] = [];
    engine.itAgents.followup = async () => { calls.push('it'); return { ...response, reply: 'Operational evidence verified; Morgan owns the delivery follow-up.', notifyRoles: ['pm'] }; };
    engine.agents.followup = async (role, _message) => { calls.push(role); expect(_message.body).toContain('Operational evidence verified'); return response; };
    const request = input('Explain the current connection failures and report the next owner', { role: 'it' }), m = chat.enqueue(request);
    expect(chat.enqueue(request)).toBe(m);
    await chat.pump();
    await chat.pump();
    expect(calls).toEqual(['it', 'pm']);
    expect(m.status).toBe('answered');
    expect(store.state.messages.some(m => m.from === 'it' && m.recipients.includes('pm'))).toBe(true);
    store.close();
});
test('Ellis recheck invokes operational recovery once without resuming ticket delivery', async () => {
    const { store, engine, chat } = setup();
    let checks = 0;
    chat.checkIT = async () => { checks++; };
    engine.itAgents.followup = async () => response;
    engine.observe = async () => { throw new Error('IT chat must not resume delivery'); };
    const m = chat.enqueue(input('Check connections', { role: 'it', recheck: true }));
    await chat.pump();
    expect(checks).toBe(1);
    expect(m.status).toBe('answered');
    store.close();
});
test('IT chat rejects delivery configuration and direct teammate dispatch', async () => {
    for (const extra of [{ notifyRoles: ['developer'] }, { goalChanges: [{ id: 'unauthorized' }] }, { notes: [{ summary: 'Not a PM decision', detail: 'test' }] }]) {
        const { store, engine, chat } = setup();
        engine.itAgents.followup = async () => ({ ...response, ...extra }) as any;
        const m = chat.enqueue(input('Explain a connection', { role: 'it' }));
        await chat.pump();
        expect(m.status).toBe('failed');
        expect(m.error).toContain('IT chat');
        expect(store.state.projectNotes).toHaveLength(0);
        expect(store.state.messages.some(m => m.from === 'it')).toBe(false);
        store.close();
    }
});
test('Ellis receives live IT context under read-only chat authority', async () => {
    const { store, engine, chat } = setup();
    store.state.it = { status: 'retrying', reports: [], services: [], recoveries: {}, checkedAt: '2026-10-28T22:00:00Z', nextCheckAt: '' };
    let prompt = '';
    engine.agents.run = async (role, task, _schema, opts) => { expect(role).toBe('it'); expect(opts?.readOnly).toBe(true); prompt = task; return response as any; };
    await engine.agents.followup('it', chat.enqueue(input('Why is a connection unknown?', { role: 'it' })));
    expect(prompt).toContain('Ellis');
    expect(prompt).toContain('CURRENT IT STATE');
    expect(prompt).toContain('"status":"retrying"');
    expect(prompt).toContain('no source edits');
    store.close();
});
