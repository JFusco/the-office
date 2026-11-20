import { expect, test, vi } from 'vitest';
import { syncInvestigations } from '../../../../server/it/investigations/ledger';
import { investigationReady } from '../../../../server/it/investigations/readiness';
import { investigationFixture } from './fixture';
import { markAwaitingRepair, unmark } from '../../incidents/repair/mark-fixture';

test('the original group, worker state, active claim and project controls all fence diagnosis', () => {
    const f = investigationFixture(); try {
        syncInvestigations(f.store); const entry = f.store.state.it!.investigations![0], dead = vi.fn(() => false);
        expect(investigationReady(f.store, entry, dead)).toBe(true);
        expect(investigationReady(f.store, entry, () => true)).toBe(false);
        for (const pid of [undefined, 0, -1, NaN]) { f.worker.processId = pid; expect(investigationReady(f.store, entry, dead)).toBe(false); }
        f.worker.processId = 2147483600; f.worker.status = 'stopping'; expect(investigationReady(f.store, entry, dead)).toBe(false); f.worker.status = 'failed';
        const claim = f.store.claimWork({ projectId: 'brain', kind: 'notice', id: 'notice' }, 'owner', 'send')!;
        expect(investigationReady(f.store, entry, dead)).toBe(false); f.store.finishClaim(claim.id, 'completed');
        f.store.state.paused = true; expect(investigationReady(f.store, entry, dead)).toBe(false); f.store.state.paused = false;
        f.store.state.draining = true; expect(investigationReady(f.store, entry, dead)).toBe(false);
    } finally { f.close(); }
});

test('a marked notice with an authentication failure stays ready for diagnosis', () => {
    const f = investigationFixture();
    try {
        const at = f.store.clock.now().toISOString(), dead = () => false;
        f.store.state.coordination!.notices = { entries: [{ id: f.worker.requestId, status: 'blocked', createdAt: at, detail: 'Recipient lookup stopped' }] } as any;
        f.store.state.slackDeliveries = [];
        f.worker.stage = 'slack-recipient';
        f.worker.failure!.category = 'authentication';
        syncInvestigations(f.store);
        const entry = f.store.state.it!.investigations!.find(item => item.source.kind === 'worker')!;
        markAwaitingRepair(f.store.state, 'brain', { kind: 'notice', id: f.worker.requestId }, 'notice', { since: at, progressAt: at });
        expect(investigationReady(f.store, entry, dead)).toBe(true);
        f.worker.failure!.category = 'timeout';
        expect(investigationReady(f.store, entry, dead)).toBe(false);
    } finally { f.close(); }
});

test('a blocked delivery request freezes its worker investigation unless the worker still has a permission failure', () => {
    const f = investigationFixture();
    try {
        const { store, worker } = f;
        const at = store.clock.now().toISOString(), dead = () => false;
        const action = 'continue-saved-implementation';
        const id = 'delivery-request';
        store.state.slackDeliveries = [];
        store.state.deliveryQueue = [{ id, action, key: 'CEC-9', requestedAt: at, status: 'blocked', error: 'Read-back stopped' }];
        Object.assign(worker, { requestId: id, ticket: 'CEC-9', stage: 'implementation-readback' });
        worker.failure!.category = 'timeout';
        syncInvestigations(store);
        const entry = store.state.it!.investigations![0];

        expect(investigationReady(store, entry, dead)).toBe(true);
        markAwaitingRepair(store.state, 'brain', { kind: 'delivery', id }, action, { since: at, progressAt: at });
        expect(investigationReady(store, entry, dead)).toBe(false);
        worker.failure!.category = 'permission';
        expect(investigationReady(store, entry, dead)).toBe(true);
        worker.failure!.category = 'timeout';
        expect(investigationReady(store, entry, dead)).toBe(false);
        unmark(store.state);
        expect(investigationReady(store, entry, dead)).toBe(true);
    } finally { f.close(); }
});

test('a failed run whose record awaits a harness repair is not diagnosed again while the wait holds, and no attempt is spent', () => {
    const f = investigationFixture(); try {
        const dead = () => false, at = f.store.clock.now().toISOString();
        // A stopped delivery job and the run that failed working it.
        f.store.state.coordination!.jobs = [{ id: 'job-1', key: 'GH-350', status: 'blocked', stage: 'review', detail: 'Error: Worktree is missing', head: 'abc1234', requestedAt: 'r', updatedAt: 'u', steps: [], stop: { kind: 'unclassified', at: 't1' } }] as any;
        f.store.state.workLog!.push({ id: 'reviewer', requestId: 'job-1', stage: 'github-review', role: 'lead', status: 'failed', processId: 2147483601, ticket: 'GH-350', startedAt: '2026-11-08T02:00:00Z', endedAt: '2026-11-08T02:01:00Z', failure: { category: 'timeout', dispatched: true, detail: 'no output' } } as any);
        const entry = { id: 'investigation:brain:worker:reviewer:timeout', source: { kind: 'worker', id: 'reviewer', requestId: 'job-1', ticket: 'GH-350', failureKind: 'timeout', workerIds: ['reviewer'] }, status: 'queued', createdAt: at, updatedAt: at, attempts: 1, nextAt: '', lastError: '' } as any;
        const before = JSON.stringify(entry);
        expect(investigationReady(f.store, entry, dead)).toBe(true);
        markAwaitingRepair(f.store.state, 'brain', { kind: 'delivery', id: 'job-1' }, 'review', { since: at, progressAt: at });
        expect(investigationReady(f.store, entry, dead)).toBe(false);
        expect(JSON.stringify(entry)).toBe(before);
        // The Slack delivery investigation in the same project is about no stopped record and is not held.
        syncInvestigations(f.store);
        const slack = f.store.state.it!.investigations!.find(item => item.source.kind === 'slack')!;
        expect(investigationReady(f.store, slack, dead)).toBe(true);
        // A stronger cause on the record, a write for it unsettled now, the wait running out, or the marker going: ready as before.
        f.store.state.coordination!.jobs![0].stop = { kind: 'uncertain-effect', at: 't1' };
        markAwaitingRepair(f.store.state, 'brain', { kind: 'delivery', id: 'job-1' }, 'review', { since: at, progressAt: at });
        expect(investigationReady(f.store, entry, dead)).toBe(true);
        f.store.state.coordination!.jobs![0].stop = { kind: 'unclassified', at: 't1' };
        markAwaitingRepair(f.store.state, 'brain', { kind: 'delivery', id: 'job-1' }, 'review', { since: at, progressAt: at });
        expect(investigationReady(f.store, entry, dead)).toBe(false);
        f.store.db.prepare("INSERT INTO effects(id, work_key, status, body) VALUES('e1', 'brain:delivery:job-1', 'uncertain', '{}')").run();
        expect(investigationReady(f.store, entry, dead)).toBe(true);
        f.store.db.prepare("DELETE FROM effects WHERE id='e1'").run();
        expect(investigationReady(f.store, entry, dead)).toBe(false);
        f.advance(49 * 60 * 60 * 1000);
        expect(investigationReady(f.store, entry, dead)).toBe(true);
        unmark(f.store.state);
        expect(investigationReady(f.store, entry, dead)).toBe(true);
    } finally { f.close(); }
});

test('a failed read-back of a request that mirrors its ticket is held by the ticket\'s marker, and is ready again when the wait ends', () => {
    const f = investigationFixture(); try {
        const { store, worker } = f, at = store.clock.now().toISOString(), dead = () => false;
        store.state.project = store.project;
        store.state.slackDeliveries = [];
        store.state.tickets = [{ key: 'CEC-9', title: 't', summary: 't', url: '', stage: 'develop', activity: 'blocked', blocker: 'Read-back stopped', stop: { kind: 'unclassified', at: 't1' }, results: {}, commit: '', runId: 'r1', attempt: 1, pilot: true, status: 'open' }] as any;
        store.state.deliveryQueue = [{ id: 'delivery-request', action: 'continue-saved-implementation', key: 'CEC-9', requestedAt: at, status: 'interrupted', error: 'Read-back stopped' }] as any;
        Object.assign(worker, { requestId: 'delivery-request', ticket: 'CEC-9', stage: 'implementation-readback' });
        worker.failure!.category = 'timeout';
        syncInvestigations(store);
        const entry = store.state.it!.investigations![0], before = JSON.stringify(entry);
        expect(investigationReady(store, entry, dead)).toBe(true);
        // The marker is the ticket's: the request has none of its own.
        markAwaitingRepair(store.state, 'brain', { kind: 'delivery', id: 'ticket:CEC-9' }, 'develop', { since: at, progressAt: at });
        expect(Object.keys(store.state.coordination!.repairWaits!)).toEqual(['delivery/ticket:CEC-9']);
        expect(investigationReady(store, entry, dead)).toBe(false);
        expect(JSON.stringify(entry)).toBe(before);
        // An earlier read-back run of the same request failed for permission. The ticket's own record does not read that run,
        // so only the investigation's own judgement of its runs keeps diagnosis ready.
        const denied = { ...worker, id: 'earlier-readback', processId: 2147483602, failure: { category: 'permission', dispatched: true, detail: 'denied' } };
        store.state.workLog!.unshift(denied as any);
        expect(investigationReady(store, entry, dead)).toBe(true);
        (denied as any).completionAccepted = true;
        expect(investigationReady(store, entry, dead)).toBe(false);
        unmark(store.state);
        expect(investigationReady(store, entry, dead)).toBe(true);
    } finally { f.close(); }
});
