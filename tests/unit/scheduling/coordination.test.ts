import { initializeLanes } from '../../fixtures/scheduler';
import { pinLegacyRoute } from '../../fixtures/legacy-route';
import { GitHubDelivery } from '../../../server/delivery/pipeline/github-delivery';
import { MergeNotifications } from '../../../server/conversations/notifications';
import { Offices } from '../../../server/scheduling/offices';
import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { Engine } from '../../../server/scheduling/engine';
import { projectById, officeCapacity } from '../../../server/office/projects';
import { Coordinator, checkpointWindow, dueAt } from '../../../server/scheduling/coordination';
import type { AssignedIssue, StageResult } from '../../../src/shared';
const stores: Store[] = [], roots: string[] = [];
afterEach(() => { stores.splice(0).forEach(s => s.close()); roots.splice(0).forEach(r => rmSync(r, { recursive: true, force: true })); });
function setup(project = 'brain', capacity = officeCapacity(), execute?: any) {
    // The Brain fixture exercises the model-intake (legacy) route; hands-off intake has its own tests.
    if (project === 'brain') pinLegacyRoute();
    const root = mkdtempSync(resolve(tmpdir(), 'office-coordination-'));
    roots.push(root);
    const store = new Store(':memory:', projectById(project), root);
    stores.push(store);
    const engine = new Engine(store, capacity), c = new Coordinator(store, engine, execute);
    c.activate(new Date('2026-10-28T12:00:00Z'));
    return { store, engine, c };
}
/** Synthetic GitHub for hands-off intake: no open PRs; anything else is unexpected. */
const noOpenPRs = async (bin: string, args: string[]) => { if (bin === 'gh' && args[1]?.includes('/pulls?state=open')) return '[[]]'; throw new Error(`Unexpected synthetic command ${bin} ${args.join(' ')}`); };
const issue = (key = 'GH-255'): AssignedIssue => ({ key, summary: 'Synthetic assignment', url: 'https://example.invalid/issue', assignee: 'JFusco', status: 'open', pickupStatus: 'Ready', statusId: '', updated: '', type: 'Issue', subtask: false });
test('checkpoint windows use Eastern wall time, DST and CEC weekdays; activation never replays an earlier run', () => {
    expect(dueAt('2026-10-28', 17)).toBe('2026-10-28T21:00:00.000Z');
    expect(dueAt('2026-11-02', 17)).toBe('2026-11-02T22:00:00.000Z');
    expect(checkpointWindow('cec', new Date('2026-10-31T18:00:00Z'), '2026-10-28T12:00:00Z').due?.date).toBe('2026-10-30');
    expect(checkpointWindow('cec', new Date('2026-10-28T14:00:00Z'), '2026-10-28T13:30:00Z').due).toBeUndefined();
    expect(checkpointWindow('brain', new Date('2026-11-03T23:00:00Z'), '2026-10-28T12:00:00Z').due?.date).toBe('2026-11-03');
});
test('daily checkpoints are durable once per date, pause-aware and coalesce missed days', async () => {
    const { c, engine, store } = setup('cec');
    c.readAssignments = async () => [];
    let calls = 0;
    engine.checkMail = async (scheduled) => { expect(scheduled).toBe(false); calls++; };
    await c.tick(new Date('2026-10-28T14:00:00Z'));
    await c.tick(new Date('2026-10-28T15:00:00Z'));
    expect(c.state.checkpoints).toHaveLength(1);
    await c.pump();
    expect(calls).toBe(1);
    expect(c.state.checkpoints[0].status).toBe('completed');
    store.state.paused = true;
    await c.tick(new Date('2026-10-29T15:00:00Z'));
    expect(c.state.checkpoints).toHaveLength(1);
    store.state.paused = false;
    await c.tick(new Date('2026-11-03T15:00:00Z'));
    expect(c.state.checkpoints.map(p => p.date)).toEqual(['2026-10-28', '2026-11-03']);
    c.state.checkpoints[1].status = 'working';
    store.recover();
    expect(c.state.checkpoints[1].status).toBe('interrupted');
    await c.pump();
    expect(calls).toBe(1);
});
test('assignment polling deduplicates, preserves the last complete feed on failure, and queues reassignment', async () => {
    const { c } = setup();
    let assigned = [issue()];
    c.readAssignments = async () => assigned;
    await c.poll();
    await c.poll();
    expect(c.state.listener.reviews).toHaveLength(1);
    c.readAssignments = async () => { throw new Error('No access'); };
    await c.poll();
    expect(c.state.listener.error).toContain('No access');
    expect(c.state.listener.assigned).toHaveLength(1);
    c.readAssignments = async () => assigned;
    assigned = [];
    await c.poll();
    await c.pump();
    expect(c.state.listener.reviews[0].status).toBe('cancelled');
    assigned = [issue()];
    await c.poll();
    expect(c.state.listener.reviews).toHaveLength(2);
});
test('PM reviews are FIFO, project-scoped, read-only and block uncertain ownership before any implementation', async () => {
    const { c, engine } = setup();
    c.readAssignments = async () => [issue('GH-255'), issue('GH-256')];
    await c.poll();
    const calls: string[] = [];
    engine.agents.run = async (role, task, _schema, opts) => { expect(role).toBe('pm'); expect(opts?.readOnly).toBe(true); expect(task).toContain('JFusco/brain'); expect(task).toContain('Missing or expired bridge coverage means ownershipChecked=false'); calls.push(opts!.ticket!); return { outcome: 'ready', ownershipChecked: false, owner: '', summary: 'Missing live session inventory', evidence: ['Synthetic result only'] } as any; };
    await c.pump();
    expect(calls).toEqual(['GH-255']);
    expect(c.state.listener.reviews[0].status).toBe('blocked');
    expect(c.state.listener.reviews[1].status).toBe('queued');
    await c.pump();
    expect(calls).toEqual(['GH-255', 'GH-256']);
});
test('another project waits while the PM lane is occupied; same issue numbers never collide', async () => {
    const capacity = officeCapacity(), a = setup('brain', capacity), b = setup('cms-field-vocabulary', capacity, noOpenPRs);
    a.c.readAssignments = b.c.readAssignments = async () => [issue('GH-91')];
    await a.c.poll();
    await b.c.poll();
    // Hands-off intake is deterministic: CMS admits GH-91 without a PM worker.
    expect(b.c.state.listener.reviews.at(-1)).toMatchObject({ key: 'GH-91', status: 'ready' });
    expect(b.c.state.jobs).toMatchObject([{ key: 'GH-91', stage: 'implement', status: 'queued' }]);
    let release!: () => void;
    const held = new Promise<void>(r => release = r), calls: string[] = [];
    a.engine.agents.run = async () => { calls.push('brain'); await held; return { outcome: 'owned', ownershipChecked: true, owner: 'another-session', summary: 'Existing owner', evidence: ['Synthetic session read'] } as any; };
    b.engine.agents.run = async () => { calls.push('cms-intake-worker'); throw new Error('CMS intake must not launch a worker'); };
    const step = vi.spyOn(GitHubDelivery.prototype, 'step').mockImplementation(async job => { calls.push(`cms-${job.stage}`); job.status = 'blocked'; });
    try {
        const running = a.c.pump();
        await b.c.pump();
        expect(calls).toEqual(['brain']);
        release();
        await running;
        await b.c.pump();
        expect(calls).toEqual(['brain', 'cms-implement']);
        expect(a.c.state.listener.reviews[0].owner).toBe('another-session');
    } finally { step.mockRestore(); }
});
test('an interrupted PM review is never silently replayed', async () => {
    const { c, store } = setup();
    c.readAssignments = async () => [issue()];
    await c.poll();
    c.state.listener.reviews[0].status = 'working';
    store.recover();
    expect(c.state.listener.reviews[0].status).toBe('interrupted');
    expect(c.hasQueued()).toBe(false);
});
test('Ready transitions queue work on existing assignments, deduplicate and recheck after PM review', async () => {
    const { c, engine } = setup();
    let lane = 'Backlog';
    c.readAssignments = async () => [{ ...issue(), pickupStatus: lane }];
    await c.poll();
    engine.agents.run = async () => ({ outcome: 'ready', ownershipChecked: true, owner: '', summary: 'Clear', evidence: ['Synthetic complete ownership read'] } as any);
    await c.pump();
    expect(c.state.jobs).toHaveLength(0);
    lane = 'Ready';
    await c.poll();
    await c.poll();
    expect(c.state.listener.reviews).toHaveLength(1);
    expect(c.state.listener.reviews[0].workRequested).toBe('automatic');
    await c.pump();
    expect(c.state.jobs).toHaveLength(1);
    expect(c.state.jobs![0].automaticStatus).toBe('Ready');
    await c.poll();
    expect(c.state.jobs).toHaveLength(1);
});
test('leaving Ready during ownership review prevents delivery; manual Start works outside Ready', async () => {
    const { c, engine } = setup();
    let lane = 'Ready';
    c.readAssignments = async () => [{ ...issue(), pickupStatus: lane }];
    await c.poll();
    engine.agents.run = async () => { lane = 'Backlog'; return { outcome: 'ready', ownershipChecked: true, owner: '', summary: 'Clear', evidence: ['Synthetic ownership'] } as any; };
    await c.pump();
    expect(c.state.jobs).toHaveLength(0);
    c.requestWork('GH-255');
    await c.pump();
    expect(c.state.jobs).toHaveLength(1);
    expect(c.state.jobs![0].automaticStatus).toBeUndefined();
});
test('per-project rules persist, disabled rules only report, blocked reviews never replay', async () => {
    const a = setup(), b = setup('cms-field-vocabulary');
    a.c.configurePickup({ enabled: false, status: 'Approved' });
    expect(a.c.pickup).toEqual({ enabled: false, status: 'Approved' });
    expect(b.c.pickup.status).toBe('Ready');
    a.c.readAssignments = async () => [{ ...issue(), pickupStatus: 'Approved' }];
    await a.c.poll();
    expect(a.c.state.listener.assigned).toHaveLength(1);
    expect(a.c.state.listener.reviews).toHaveLength(0);
    a.c.enqueue(issue());
    a.c.state.listener.reviews[0].status = 'blocked';
    a.c.configurePickup({ enabled: true, status: 'Approved' });
    await a.c.poll();
    expect(a.c.state.listener.reviews).toHaveLength(1);
    expect(() => a.c.requestWork('GH-255')).toThrow('Read back');
    expect(() => a.c.configurePickup({ enabled: true, status: ' ' })).toThrow();
});
test('existing PR routes to read-only Lead review even when session ownership is uncertain', async () => {
    const { c, engine } = setup();
    (c as any).execute = async (_bin: string, args: string[]) => JSON.stringify(args[0] === 'pr' ? { closingIssuesReferences: [{ url: 'https://github.com/JFusco/brain/issues/255' }] } : { state: 'open', head: { sha: 'a'.repeat(40) }, html_url: 'https://github.com/JFusco/brain/pull/400', base: { ref: 'main', repo: { full_name: 'JFusco/brain' } } });
    c.readAssignments = async () => [issue()];
    await c.poll();
    engine.agents.run = async () => ({ outcome: 'owned', ownershipChecked: false, owner: 'Unknown active session', summary: 'Existing PR', existingWork: { projectId: 'brain', kind: 'pr', id: '400', evidence: 'Synthetic current PR' }, prerequisites: null, evidence: ['https://github.com/JFusco/brain/pull/400'] } as any);
    await c.pump();
    expect(c.state.listener.reviews[0].status).toBe('blocked');
    expect(c.state.jobs![0]).toMatchObject({ stage: 'prepare-pr', pr: 400, status: 'queued' });
    c.state.jobs![0].status = 'working';
    c.store.recover();
    expect(c.state.jobs![0].status).toBe('interrupted');
    expect(c.hasQueued()).toBe(false);
});
test('historical and unrelated PR mentions do not swallow a cleared implementation handoff', async () => {
    for (const linked of [true, false]) {
        const { c, engine } = setup();
        (c as any).execute = async (_bin: string, args: string[]) => JSON.stringify(args[0] === 'pr' ? { closingIssuesReferences: linked ? [{ url: 'https://github.com/JFusco/brain/issues/255' }] : [] } : { state: linked ? 'closed' : 'open', merged_at: linked ? '2026-10-20T12:00Z' : null, head: { sha: 'a'.repeat(40) }, html_url: 'https://github.com/JFusco/brain/pull/272', base: { ref: 'main', repo: { full_name: 'JFusco/brain' } } });
        c.readAssignments = async () => [issue()];
        await c.poll();
        engine.agents.run = async () => ({ outcome: 'ready', ownershipChecked: true, owner: '', summary: 'Ownership clear; scoped work is due', evidence: ['Historical or unrelated PR https://github.com/JFusco/brain/pull/272 is not this delivery.'] } as any);
        await c.pump();
        expect(c.state.listener.reviews[0].status).toBe('ready');
        expect(c.state.jobs).toHaveLength(1);
        expect(c.state.jobs![0]).toMatchObject({ key: 'GH-255', stage: 'implement', pr: 0, status: 'queued', automaticStatus: 'Ready' });
        await c.poll();
        expect(c.state.jobs).toHaveLength(1);
        expect(c.state.listener.reviews).toHaveLength(1);
    }
});
test('a PR lookup failure blocks the handoff instead of guessing that implementation is safe', async () => {
    const { c, engine } = setup();
    c.readAssignments = async () => [issue()];
    await c.poll();
    (c as any).execute = async () => { throw new Error('GitHub read unavailable'); };
    engine.agents.run = async () => ({ outcome: 'ready', ownershipChecked: true, owner: '', summary: 'Clear', existingWork: { projectId: 'brain', kind: 'pr', id: '272', evidence: 'Synthetic current PR' }, prerequisites: null, evidence: ['Read https://github.com/JFusco/brain/pull/272'] } as any);
    await c.pump();
    expect(c.state.listener.reviews[0]).toMatchObject({ status: 'blocked', detail: 'Error: GitHub read unavailable' });
    expect(c.state.jobs).toHaveLength(0);
});
test('a historical PR before a current linked PR still routes the current delivery', async () => {
    const { c, engine } = setup();
    (c as any).execute = async (_bin: string, args: string[]) => JSON.stringify(args[0] === 'pr' ? { closingIssuesReferences: [{ url: 'https://github.com/JFusco/brain/issues/255' }] } : { state: args[1].endsWith('/272') ? 'closed' : 'open', head: { sha: 'a'.repeat(40) }, html_url: `https://github.com/JFusco/brain/pull/${args[1].split('/').at(-1)}`, base: { ref: 'main', repo: { full_name: 'JFusco/brain' } } });
    c.readAssignments = async () => [issue()];
    await c.poll();
    engine.agents.run = async () => ({ outcome: 'owned', ownershipChecked: true, owner: '', summary: 'Existing delivery', existingWork: { projectId: 'brain', kind: 'pr', id: '400', evidence: 'Synthetic current PR' }, prerequisites: null, evidence: ['Historical https://github.com/JFusco/brain/pull/272; current https://github.com/JFusco/brain/pull/400'] } as any);
    await c.pump();
    expect(c.state.jobs).toHaveLength(1);
    expect(c.state.jobs![0]).toMatchObject({ stage: 'prepare-pr', pr: 400 });
    expect(c.state.listener.reviews[0].prNumber).toBe(400);
});
test('polling recovers an orphaned automatic Ready handoff once through fresh intake', async () => {
    const { c, engine } = setup();
    c.readAssignments = async () => [issue()];
    await c.poll();
    const original = c.state.listener.reviews[0];
    original.status = 'ready';
    original.detail = 'Historical completed intake';
    await c.poll();
    await c.poll();
    expect(original.detail).toBe('Historical completed intake');
    expect(c.state.listener.reviews).toHaveLength(2);
    expect(c.state.listener.reviews[1]).toMatchObject({ status: 'queued', workRequested: 'automatic' });
    engine.agents.run = async () => ({ outcome: 'ready', ownershipChecked: true, owner: '', summary: 'Fresh ownership check clear', evidence: ['Current synthetic read'] } as any);
    await c.pump();
    await c.poll();
    expect(c.state.jobs).toHaveLength(1);
    expect(c.state.listener.reviews).toHaveLength(2);
});
test('polling waits for an in-flight intake handoff to finish before recovering Ready work', async () => {
    const { c, engine } = setup();
    c.readAssignments = async () => [issue()];
    await c.poll();
    c.state.listener.reviews[0].status = 'ready';
    engine.busy = true;
    await c.poll();
    expect(c.state.listener.reviews).toHaveLength(1);
    engine.busy = false;
    await c.poll();
    expect(c.state.listener.reviews).toHaveLength(2);
});
test('orphan recovery preserves held, blocked, interrupted, owned and non-Ready assignments', async () => {
    for (const status of ['held', 'blocked', 'interrupted', 'owned', 'ready'] as const) {
        const { c } = setup();
        let lane = 'Ready';
        c.readAssignments = async () => [{ ...issue(), pickupStatus: lane }];
        await c.poll();
        c.state.listener.reviews[0].status = status;
        if (status === 'ready')
            lane = 'Backlog';
        await c.poll();
        expect(c.state.listener.reviews).toHaveLength(1);
        expect(c.state.jobs).toHaveLength(0);
    }
});
test('CEC defaults To Do and queues only after board and ownership read-back', async () => {
    const { c, engine, store } = setup('cec');
    const ticket = { ...issue('CEC-999'), assignee: 'office-account', pickupStatus: 'To Do', status: 'To Do', statusId: '10000' };
    c.readAssignments = async () => [ticket];
    await c.poll();
    expect(c.pickup.status).toBe('To Do');
    expect(c.state.listener.reviews[0].workRequested).toBe('automatic');
    engine.agents.run = async () => ({ outcome: 'ready', ownershipChecked: true, owner: '', summary: 'Clear', evidence: ['Synthetic ownership'] } as any);
    engine.agents.readback = async () => ({ ...ticket, boardMember: true, existingPrId: 0, existingOwner: '', blocker: '' });
    await c.pump();
    expect(store.state.deliveryQueue).toHaveLength(1);
    expect(store.state.deliveryQueue![0].intakeStatus).toBe('To Do');
});
test('waiting for merge Actions releases the desks for the next project ticket', async () => {
    const capacity = officeCapacity(), a = setup('brain', capacity), b = setup('cms-field-vocabulary', capacity);
    const offices = Object.create(Offices.prototype) as Offices;
    offices.capacity = capacity;
    initializeLanes(offices);
    const conversations = { pumpCTO: async () => { }, pump: async () => { } } as any;
    offices.entries = new Map([['brain', { store: a.store, engine: a.engine, coordinator: a.c, conversations }], ['cms-field-vocabulary', { store: b.store, engine: b.engine, coordinator: b.c, conversations }]]);
    a.c.state.jobs = [{ key: 'GH-1', status: 'watching', stage: 'merge', requestedAt: '2026-10-28T12:00Z', mergeCommit: 'a'.repeat(40), steps: [] }] as any;
    b.c.readAssignments = async () => [issue('GH-999')];
    await b.c.poll();
    let dispatched = 0;
    const step = vi.spyOn(GitHubDelivery.prototype, 'step').mockImplementation(async job => { dispatched++; job.status = 'blocked'; });
    try {
        await offices.pump();
    } finally { step.mockRestore(); }
    // Brain's watched merge does not hold the delivery lane; CMS implementation is dispatched.
    expect(dispatched).toBe(1);
    expect(a.c.state.jobs![0].status).toBe('watching');
});
test('only a matching completed conversation retry can resolve an old failure', () => {
    const a = setup('brain'), b = setup('cec'), offices = Object.create(Offices.prototype) as Offices;
    offices.entries = new Map([['brain', { store: a.store, engine: a.engine, conversations: {} as any }], ['cec', { store: b.store, engine: b.engine, conversations: {} as any }]]);
    a.store.state.messages = [{ id: 'old', from: 'human', status: 'failed', body: 'Discuss CEC goals', error: 'Old schema failure', actionId: '', receipts: [] }] as any;
    b.store.state.messages = [{ id: 'retry', requestId: 'retry', from: 'human', to: 'cto', status: 'answered', body: 'Retry: Discuss CEC goals' }, { id: 'reply', requestId: 'retry', from: 'cto', status: 'answered', receipts: [] }] as any;
    expect(() => offices.reconcileConversation('brain', 'old', 'cec', 'wrong')).toThrow();
    offices.reconcileConversation('brain', 'old', 'cec', 'retry');
    expect(a.store.state.messages[0].resolvedBy).toMatchObject({ messageId: 'retry', project: 'cec' });
    expect(a.store.state.messages[0].error).toBe('Old schema failure');
});
test('a healthy bridge retries an old read-only capability failure once and never loops it', async () => {
    const { c } = setup();
    c.readAssignments = async () => [{ ...issue(), pickupStatus: 'Ready' }];
    await c.poll();
    const review = c.state.listener.reviews[0];
    review.status = 'blocked';
    review.detail = 'Missing Codex session inventory; no source work started.';
    c.sessionBridge = { forProject: () => ({ complete: true }) } as any;
    await c.tick();
    expect(review.status).toBe('queued');
    expect(review.bridgeRetryVersion).toBe(1);
    review.status = 'blocked';
    await c.tick();
    expect(review.status).toBe('blocked');
});
test('a merged parent finishes Morgan closeout before its older queued child is dispatched', async () => {
    const capacity = officeCapacity(), a = setup('brain', capacity), offices = Object.create(Offices.prototype) as Offices;
    offices.capacity = capacity;
    initializeLanes(offices);
    const conversations = { pumpCTO: async () => { }, pump: async () => { } } as any;
    offices.entries = new Map([['brain', { store: a.store, engine: a.engine, coordinator: a.c, conversations }]]);
    a.c.state.jobs = [{ id: 'child', key: 'GH-2', status: 'queued', stage: 'lead-pr', requestedAt: '2026-10-28T12:00Z', steps: [] }, { id: 'parent', key: 'GH-1', status: 'queued', stage: 'closeout', requestedAt: '2026-10-28T13:00Z', mergeCommit: 'a'.repeat(40), steps: [] }] as any;
    let picked = '';
    a.c.pump = async (id) => { picked = typeof id === 'string' ? id : id?.id || ''; };
    await offices.pump();
    expect(picked).toBe('parent');
});
test('focused closeout runs before a queued Slack lookup', async () => {
    const { c } = setup();
    const job = { id: 'focus', key: 'GH-255', stage: 'closeout', status: 'queued', steps: [], requestedAt: '' } as any;
    c.state.jobs = [job];
    c.state.notices = { policy: { enabled: true } as any, entries: [{ status: 'queued' } as any] };
    const step = vi.spyOn(GitHubDelivery.prototype, 'step').mockResolvedValue(), lookup = vi.spyOn(MergeNotifications.prototype, 'pump').mockResolvedValue();
    try {
        await c.pump('focus');
        expect(step).toHaveBeenCalledWith(job);
        expect(lookup).not.toHaveBeenCalled();
    }
    finally {
        step.mockRestore();
        lookup.mockRestore();
    }
});
test('a Ready issue held for a completed prerequisite returns to Morgan automatically', async () => {
    const { c } = setup();
    c.readAssignments = async () => [{ ...issue('GH-254'), pickupStatus: 'Ready' }];
    await c.poll();
    const held = c.state.listener.reviews[0];
    held.status = 'held';
    held.workRequested = 'automatic';
    held.detail = 'GH-254 held until GH-255 completes.';
    held.prerequisites = [{ target: { projectId: 'brain', kind: 'delivery', id: 'parent' }, condition: 'job-completed', evidence: 'Synthetic record', observedAt: new Date().toISOString() }];
    c.state.jobs = [{ id: 'parent', key: 'GH-255', status: 'completed', stage: 'closeout', steps: [] } as any];
    await c.tick();
    expect(c.state.listener.reviews.at(-1)).toMatchObject({ key: 'GH-254', status: 'queued', workRequested: 'automatic' });
    const count = c.state.listener.reviews.length;
    await c.poll();
    expect(c.state.listener.reviews).toHaveLength(count);
});
test('completed closeout releases its queued PR child before unrelated intake', async () => {
    const capacity = officeCapacity(), a = setup('brain', capacity), offices = Object.create(Offices.prototype) as Offices;
    offices.capacity = capacity;
    initializeLanes(offices);
    offices.entries = new Map([['brain', { store: a.store, engine: a.engine, coordinator: a.c, conversations: { pumpCTO: async () => { } } as any }]]);
    a.c.state.jobs = [{ id: 'parent', key: 'GH-1', pr: 1, status: 'completed', stage: 'closeout', steps: [] }, { id: 'child', key: 'GH-2', pr: 2, dependsOnPR: 1, prerequisites: [{ target: { projectId: 'brain', kind: 'delivery', id: 'parent' }, condition: 'job-completed', evidence: 'Synthetic record', observedAt: new Date().toISOString() }], status: 'queued', stage: 'prepare-pr', requestedAt: '2026-10-28T12:00Z', steps: [] }, { id: 'other', key: 'GH-3', status: 'queued', stage: 'review', requestedAt: '2026-10-28T13:00Z', steps: [] }] as any;
    let picked = '';
    a.c.pump = async (id) => { picked = typeof id === 'string' ? id : id?.id || ''; };
    await offices.pump();
    expect(picked).toBe('child');
    expect(a.c.state.jobs![1].prerequisites![0].target.id).toBe('parent');
});
test('base update may repeat a failed read preflight only before any base-update worker started', () => {
    const { c, store } = setup();
    const j: any = { id: 'candidate', key: 'GH-255', status: 'blocked', stage: 'update-base', pr: 0, head: 'a'.repeat(40), worktree: '/tmp/candidate', branch: 'candidate', steps: [{ stage: 'validate', result: { outcome: 'passed', commit: 'a'.repeat(40), findings: [{ id: 'delivery-baseline', status: 'open' }], receipts: [] } }] };
    store.state.coordination!.jobs = [j];
    c.updateCandidateBase('GH-255');
    expect(j.status).toBe('queued');
    j.status = 'blocked';
    store.state.workLog = [{ requestId: j.id, stage: 'github-update-base', status: 'interrupted' }] as any;
    expect(() => c.updateCandidateBase('GH-255')).toThrow('must be reconciled');
});
test('a Ready prerequisite hold is rechecked once only after its tracked prerequisite completes', async () => {
    const { c } = setup();
    c.readAssignments = async () => [{ ...issue('GH-254'), pickupStatus: 'Ready' }];
    await c.poll();
    const held = c.state.listener.reviews[0];
    held.status = 'held';
    held.workRequested = 'automatic';
    held.detail = 'Keep GH-254 held until GH-255 completes.';
    held.prerequisites = [{ target: { projectId: 'brain', kind: 'delivery', id: 'parent' }, condition: 'job-completed', evidence: 'Synthetic record', observedAt: new Date().toISOString() }];
    c.state.jobs = [{ id: 'parent', key: 'GH-255', pr: 0, status: 'queued', stage: 'update-base', steps: [] }] as any;
    await c.poll();
    expect(c.state.listener.reviews).toHaveLength(1);
    c.state.jobs![0].status = 'completed';
    await c.tick();
    await c.tick();
    expect(c.state.listener.reviews).toHaveLength(2);
    expect(c.state.listener.reviews[1]).toMatchObject({ key: 'GH-254', status: 'queued', workRequested: 'automatic' });
});
test('completed prerequisites permit delivery after the fresh intake executes, without another review', async () => {
    const { c, engine } = setup();
    c.readAssignments = async () => [issue('GH-254')];
    await c.poll();
    const held = c.state.listener.reviews[0];
    const prerequisites = [{ target: { projectId: 'brain', kind: 'delivery' as const, id: 'parent' }, condition: 'job-completed' as const, evidence: 'Saved completion', observedAt: new Date().toISOString() }];
    Object.assign(held, { status: 'held', workRequested: 'automatic', prerequisites, bridgeRetryVersion: 1, retry: { attempts: 3, nextAt: '', history: [], exhausted: true }, itRecoveryAttempts: 3 });
    c.state.jobs = [{ id: 'parent', key: 'GH-255', pr: 0, status: 'completed', stage: 'closeout', steps: [] } as any];
    await c.tick();
    const child = c.state.listener.reviews.at(-1)!;
    expect(held.resumedFor).toBeTruthy();
    expect(child).toMatchObject({ parentReviewId: held.id, status: 'queued' });
    for (const key of ['resumedFor', 'retry', 'bridgeRetryVersion', 'itRecoveryAttempts'])
        expect(child).not.toHaveProperty(key);
    engine.agents.run = async () => ({ outcome: 'ready', ownershipChecked: true, owner: '', summary: 'Prerequisites complete', evidence: ['Saved completion'], prerequisites, existingWork: null }) as any;
    await c.pump({ kind: 'intake', id: child.id });
    expect(child.status).toBe('ready');
    expect(c.state.jobs!.filter(job => job.key === 'GH-254')).toHaveLength(1);
    expect(c.state.jobs!.find(job => job.key === 'GH-254')).toMatchObject({ stage: 'implement', status: 'queued' });
    await c.tick();
    await c.tick();
    expect(c.state.listener.reviews).toHaveLength(2);
});
test('fresh intake waits for a new prerequisite and preserves explicit holds after completion', async () => {
    const { c, engine } = setup();
    c.readAssignments = async () => [issue('GH-254')];
    await c.poll();
    const review = c.state.listener.reviews[0];
    const prerequisites = [{ target: { projectId: 'brain', kind: 'delivery' as const, id: 'parent' }, condition: 'job-completed' as const, evidence: 'Saved job', observedAt: new Date().toISOString() }];
    c.state.jobs = [{ id: 'parent', key: 'GH-255', pr: 0, status: 'queued', stage: 'closeout', steps: [] } as any];
    review.workRequested = 'automatic';
    engine.agents.run = async () => ({ outcome: 'ready', ownershipChecked: true, owner: '', summary: 'Await prerequisite', evidence: ['Saved job'], prerequisites, existingWork: null }) as any;
    await c.pump({ kind: 'intake', id: review.id });
    expect(review.status).toBe('held');
    await c.tick();
    expect(c.state.listener.reviews).toHaveLength(1);
    c.state.jobs![0].status = 'completed';
    await c.tick();
    await c.tick();
    expect(c.state.listener.reviews).toHaveLength(2);
    const child = c.state.listener.reviews[1];
    engine.agents.run = async () => ({ outcome: 'held', ownershipChecked: true, owner: '', summary: 'Explicit human hold', evidence: ['Keep hold'], prerequisites, existingWork: null }) as any;
    await c.pump({ kind: 'intake', id: child.id });
    expect(child.status).toBe('held');
    expect(c.state.jobs!.some(job => job.key === 'GH-254')).toBe(false);
    await c.tick();
    await c.tick();
    expect(c.state.listener.reviews).toHaveLength(2);
});
test.each(['step', 'reconcile'] as const)('preparation %s defers checks only from complete pending current-head observations', async (mode) => {
    for (const scenario of ['pending', 'pending-status', 'failed', 'cancelled', 'failed-status', 'wrong-head', 'missing', 'partial', 'passed', 'unknown-finding']) {
        const { store, engine } = setup();
        const head = 'a'.repeat(40), prUrl = 'https://github.com/JFusco/brain/pull/700';
        const delivery = new GitHubDelivery(store, engine, async (_bin, args) => {
            expect(args[1]).toContain('/pulls?state=open');
            expect(args).not.toContain('--method');
            return '[[]]';
        });
        delivery.enqueue('GH-999', 700);
        const job = delivery.jobs[0];
        Object.assign(job, { head, prUrl, status: mode === 'reconcile' ? 'blocked' : 'queued' });
        const artifact = resolve(store.dataRoot, 'ticket-work', job.id, 'proof.txt');
        mkdirSync(resolve(artifact, '..'), { recursive: true });
        writeFileSync(artifact, 'Synthetic preparation evidence');
        const result: StageResult = { outcome: 'passed', summary: 'Quality running', commit: head, prId: 700, findings: [{ id: scenario === 'unknown-finding' ? 'unknown' : 'checks', summary: 'Quality running', actual: 'Quality running', expected: 'Checks pass before merge', status: 'open', attempts: 0 }], evidence: [{ id: 'proof', kind: 'provider', path: artifact, commit: head, summary: 'Synthetic', url: prUrl, observedAt: '', environment: 'fixture' }], receipts: [], blocker: '', paidRuns: 0, worktree: '', branch: '', previewUrl: '', qaRunDir: '' };
        engine.agents.run = async () => result as any;
        delivery.verifyPR = async () => ({ state: 'open', head: { sha: head, ref: 'candidate' } }) as any;
        delivery.api = async (path) => {
            if (path === 'issues/999')
                return { number: 999, state: 'open' };
            expect(path).toContain(`commits/${head}/`);
            if (path.endsWith('/status'))
                return { sha: head, state: scenario === 'failed-status' ? 'failure' : scenario === 'pending-status' ? 'pending' : 'success', total_count: scenario === 'pending-status' || scenario === 'failed-status' ? 1 : 0, statuses: scenario === 'pending-status' || scenario === 'failed-status' ? [{ state: scenario === 'pending-status' ? 'pending' : 'failure' }] : [] };
            if (scenario === 'missing')
                return {};
            return { total_count: scenario === 'partial' ? 101 : 1, check_runs: [{ head_sha: scenario === 'wrong-head' ? 'b'.repeat(40) : head, status: ['failed', 'cancelled', 'passed', 'pending-status'].includes(scenario) ? 'completed' : 'in_progress', conclusion: scenario === 'failed' ? 'failure' : scenario === 'cancelled' ? 'cancelled' : ['passed', 'pending-status'].includes(scenario) ? 'success' : null }] };
        };
        job.steps = [{ stage: 'prepare-pr', result }];
        const allowed = ['pending', 'pending-status'].includes(scenario);
        if (mode === 'step')
            await delivery.step(job);
        else if (allowed)
            await delivery.reconcilePreparation(job.key);
        else
            await expect(delivery.reconcilePreparation(job.key)).rejects.toThrow();
        expect(job).toMatchObject({ stage: allowed ? 'lead-pr' : 'prepare-pr', status: allowed ? 'queued' : 'blocked' });
        expect(job.steps[0].result.findings[0].status).toBe('open');
    }
});
test('Brain checkpoint retry requires reconciled effects and waits for native backoff', async () => {
    const { c, engine, store } = setup();
    const checkpoint = { id: 'checkpoint', date: '2026-10-28', dueAt: '', requestedAt: '', startedAt: '', endedAt: '', status: 'blocked' as const, runId: 'original', detail: 'original failure' };
    c.state.checkpoints.push(checkpoint);
    store.state.maintenance = { runs: [{ id: 'original', requestedAt: '', startedAt: '', endedAt: '', status: 'blocked', weekly: false, stage: 'brain-maintenance', error: 'ownership uncertain', steps: [] }], lastDaily: '', lastWeekly: '', ledger: '' };
    const readStatus = vi.spyOn(engine.maintenance as any, 'readStatus').mockResolvedValue({ active: null, completed: null, attempts: 1, retryAfter: new Date(Date.now() + 3600000).toISOString() });
    await expect(c.retryCheckpoint('checkpoint')).rejects.toThrow('Read back');
    expect(readStatus).not.toHaveBeenCalled();
    store.state.maintenance.runs[0].status = 'reconciled';
    await c.retryCheckpoint('checkpoint');
    expect(checkpoint.status).toBe('queued');
    expect(c.hasQueued()).toBe(false);
    const pump = vi.spyOn(engine.maintenance, 'pump');
    await c.pump();
    expect(pump).not.toHaveBeenCalled();
    expect(store.state.maintenance.runs[0].error).toBe('ownership uncertain');
    checkpoint.status = 'blocked';
    readStatus.mockResolvedValue({ active: { id: 'other' }, completed: null, attempts: 1 });
    await expect(c.retryCheckpoint('checkpoint')).rejects.toThrow('active work');
    readStatus.mockResolvedValue({ active: null, completed: { id: 'done' }, attempts: 1 });
    await expect(c.retryCheckpoint('checkpoint')).rejects.toThrow('completed date');
    readStatus.mockResolvedValue({ active: null, completed: null, attempts: 3 });
    await expect(c.retryCheckpoint('checkpoint')).rejects.toThrow('daily retry limit');
});
test('maintenance recovery reads back original effects then schedules a native-gated retry without replay', async () => {
    const { c, engine, store } = setup();
    const run: any = { id: 'failed', status: 'blocked', stage: 'brain-maintenance', error: 'catalog-refresh-incomplete', steps: [], readbackRetry: { attempts: 0, nextAt: '', history: [], exhausted: false } };
    store.state.maintenance = { runs: [run], lastDaily: '', lastWeekly: '', ledger: '' };
    c.state.checkpoints = [{ id: 'checkpoint', date: '2026-10-28', status: 'blocked', runId: 'failed', detail: 'original failure' } as any];
    let reads = 0;
    engine.maintenance.reconcile = async () => { reads++; run.status = 'reconciled'; return run; };
    const pump = vi.spyOn(engine.maintenance, 'pump');
    vi.spyOn(engine.maintenance as any, 'readStatus').mockResolvedValue({ active: null, completed: null, attempts: 2, retryAfter: new Date(Date.now() + 3600000).toISOString() });
    await c.pump();
    expect(reads).toBe(1);
    expect(pump).not.toHaveBeenCalled();
    expect(c.state.checkpoints[0].status).toBe('queued');
    expect(Date.parse(c.state.checkpoints[0].retryAt!)).toBeGreaterThan(Date.now());
    expect(run.error).toBe('catalog-refresh-incomplete');
});
test('uncertain maintenance effects get at most three read-backs and never replay the original writer', async () => {
    const { c, engine, store } = setup();
    const run: any = { id: 'uncertain', status: 'blocked', stage: 'brain-maintenance', error: 'unknown publication outcome', steps: [], readbackRetry: { attempts: 0, nextAt: '', history: [], exhausted: false } };
    store.state.maintenance = { runs: [run], lastDaily: '', lastWeekly: '', ledger: '' };
    let reads = 0;
    engine.maintenance.reconcile = async () => { reads++; return run; };
    const pump = vi.spyOn(engine.maintenance, 'pump');
    for (let i = 0; i < 4; i++) {
        run.readbackRetry.nextAt = '';
        await c.pump();
    }
    expect(reads).toBe(3);
    expect(run.readbackRetry.exhausted).toBe(true);
    expect(pump).not.toHaveBeenCalled();
    expect(store.state.outbox.some(o => o.id === 'maintenance:uncertain' && o.status === 'open')).toBe(true);
});

test.each([0,1,2])('failed maintenance retry %s starts backoff after a read longer than its delay and keeps history',async prior=>{
 const {c,engine,store}=setup(),now=Date.now(),before={at:new Date(now-1000).toISOString(),detail:'Retained old failure'};
 const run:any={id:'slow-original',status:'blocked',stage:'brain-maintenance',error:'Original uncertain effect',steps:[],readbackRetry:{attempts:prior,nextAt:'',history:[before],exhausted:false}};
 store.state.maintenance={runs:[run],lastDaily:'',lastWeekly:'',ledger:''};const date=vi.spyOn(Date,'now').mockReturnValue(now);
 const reader=vi.fn(async()=>{date.mockReturnValue(now+600000);run.error='Still uncertain after long read';return run;});engine.maintenance.reconcile=reader;
 try{
  await c.pump();const retry=run.readbackRetry;
  expect(reader).toHaveBeenCalledTimes(1);expect(retry.attempts).toBe(prior+1);expect(retry.history[0]).toEqual(before);expect(retry.history).toHaveLength(2);
  expect(Date.parse(retry.nextAt)).toBe(now+600000+[30000,120000,300000][prior]);expect(retry.exhausted).toBe(prior===2);expect(c.maintenanceRecovery()).toBeUndefined();
  await c.pump();expect(reader).toHaveBeenCalledTimes(1);
 }finally{date.mockRestore();}
});
