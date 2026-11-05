import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../../../server/store/store';
import { Engine } from '../../../server/scheduling/engine';
import { Coordinator } from '../../../server/scheduling/coordination';
import { projectById } from '../../../server/office/projects';
import { CEC, HOLDS } from '../../../server/office/config';
import { MISSING_INTAKE, reconcileMailbox } from '../../../server/cec/reconcile-mailbox';
import { ingest } from '../../../server/cec/workflow';
import { projectOutbox } from '../../../server/conversations/outbox';
import type { Ticket } from '../../../src/shared';

const roots: string[] = [], stores: Store[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });
function setup() {
    const root = mkdtempSync(join(tmpdir(), 'office-mailbox-')); roots.push(root);
    const store = new Store(':memory:', projectById('cec'), root); stores.push(store);
    const execute = vi.fn(async () => JSON.stringify({ ok: true, data: { issues: [] } }));
    const coordinator = new Coordinator(store, new Engine(store), execute);
    coordinator.state.enabled = true;
    const ticket: Ticket = { key: 'CEC-120', summary: 'Deferred intake fixture', url: 'https://example.invalid/CEC-120',
        assignee: CEC.account, status: 'Blocked', statusId: '10107', updated: '', type: 'New Feature', subtask: false,
        boardMember: false, stage: 'mailbox', activity: 'blocked', blocker: MISSING_INTAKE, runId: '', attempt: 0,
        commit: '', branch: '', worktree: '', previewUrl: '', prId: 0, results: {}, findings: [], evidence: [], pilot: false, observedAt: '' };
    store.state.tickets.push(ticket);
    store.emit('fixture', 'Synthetic stale intake');
    return { store, ticket, coordinator, execute };
}

test('a complete assignment read retires an unassigned placeholder and preserves its history and readiness hold', async () => {
    const { store, ticket, coordinator, execute } = setup();
    const hold = HOLDS[ticket.key], original = structuredClone(ticket);
    expect(projectOutbox(store.state).find(item => item.id === 'ticket:CEC-120:mailbox')?.status).toBe('open');
    await coordinator.poll();
    expect(execute).toHaveBeenCalledOnce();
    expect(execute.mock.calls[0]).toEqual(expect.arrayContaining(['twg']));
    expect(ticket).toEqual({ ...original, activity: 'idle' });
    expect(projectOutbox(store.state).find(item => item.id === 'ticket:CEC-120:mailbox')?.status).toBe('resolved');
    expect(store.state.outbox.find(item => item.id === 'ticket:CEC-120:mailbox')?.status).toBe('resolved');
    expect(HOLDS[ticket.key]).toBe(hold);
    expect(coordinator.state.jobs).toEqual([]);
    expect(coordinator.state.listener.reviews).toEqual([]);
    // A later mailbox check must not recreate the resolved reminder.
    ingest(store.state, []);
    expect(ticket.activity).toBe('idle');
    expect(projectOutbox(store.state).find(item => item.id === 'ticket:CEC-120:mailbox')?.status).toBe('resolved');
});

test('failed or incomplete assignment reads never clear a reminder', async () => {
    const { store, ticket, coordinator, execute } = setup();
    for (const response of [{ ok: false, error: 'unavailable' }, { ok: true, data: {} }, { ok: true, data: { issues: Array(100).fill({}) } }]) {
        execute.mockResolvedValueOnce(JSON.stringify(response));
        await coordinator.poll();
        expect(coordinator.state.listener.error).toBeTruthy();
        expect(ticket.blocker).toBe(MISSING_INTAKE);
        expect(projectOutbox(store.state).find(item => item.id === 'ticket:CEC-120:mailbox')?.status).toBe('open');
    }
});

test('mailbox absence is quiet for unused records but preserves genuine blockers and delivery evidence', () => {
    const { store, ticket } = setup();
    const original = structuredClone(ticket);
    for (const patch of [{ pilot: true }, { runId: 'run' }, { prId: 42 }, { commit: 'a'.repeat(40) },
        { worktree: '/synthetic' }, { branch: 'retained' }, { attempt: 1 }, { activity: 'working' as const },
        { blocker: 'Uncertain Jira write requires read-back' }, { stage: 'qa' as const }]) {
        Object.assign(ticket, original, patch);
        const before = structuredClone(ticket);
        expect(reconcileMailbox(store.state, new Set()).size).toBe(0);
        expect(ticket).toEqual(before);
    }
    Object.assign(ticket, original, { blocker: 'Epic requires decomposition into development tickets.' });
    ingest(store.state, []);
    expect(ticket.blocker).toBe('Epic requires decomposition into development tickets.');
    Object.assign(ticket, original, { blocker: '', activity: 'waiting' });
    ingest(store.state, []);
    expect(ticket).toMatchObject({ activity: 'idle', blocker: MISSING_INTAKE });
});

test('retirement keeps the dispatch gate until a fresh eligible intake re-admits the ticket', () => {
    const { store, ticket } = setup();
    Object.assign(ticket, { key: 'CEC-999', status: 'To Do', statusId: '10000', boardMember: true });
    ingest(store.state, []);
    expect(ticket).toMatchObject({ activity: 'idle', blocker: MISSING_INTAKE });
    ingest(store.state, [{ ...ticket }]);
    expect(ticket).toMatchObject({ activity: 'waiting', blocker: '' });
});

test('queued delivery and a current eligible assignment remain protected', async () => {
    const { store, ticket, coordinator, execute } = setup();
    store.state.deliveryQueue = [{ key: ticket.key, status: 'queued' } as any];
    expect(reconcileMailbox(store.state, new Set()).size).toBe(0);
    store.state.deliveryQueue = [];
    execute.mockResolvedValueOnce(JSON.stringify({ ok: true, data: { issues: [{ key: ticket.key, summary: ticket.summary,
        assignee: { accountId: CEC.account }, status: { name: 'To Do', id: '10000' }, issuetype: { name: 'New Feature', subtask: false } }] } }));
    await coordinator.poll();
    expect(ticket.blocker).toBe(MISSING_INTAKE);
});
