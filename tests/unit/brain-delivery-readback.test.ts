import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../server/store';
import { Engine } from '../../server/engine';
import { Coordinator, coordination } from '../../server/coordination';
import { GitHubDelivery } from '../../server/github-delivery';
import { nativeDeliveryReadbackCandidate } from '../../server/brain-delivery-readback';
import { ITSpecialist } from '../../server/it-specialist';
import { projectById } from '../../server/projects';
import type { TicketJob } from '../../src/shared';
const stores: Store[] = [], roots: string[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });
function fixture() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-native-readback-')); roots.push(root);
    const store = new Store(':memory:', projectById('brain'), root); stores.push(store);
    store.state.coordination = coordination();
    const engine = new Engine(store), coordinator = new Coordinator(store, engine);
    const key = 'GH-276', issueUrl = 'https://github.com/JFusco/brain/issues/276';
    const head = 'a'.repeat(40), merge = 'b'.repeat(40), nativeId = 'cd7e4991-9220-4b42-8ffc-6cf4eec81812';
    const job: TicketJob = { id: 'native-mirror', key, requestedAt: '', status: 'blocked', stage: 'prepare-pr',
        detail: 'Issue is closed or no longer assigned to Joe; delivery stopped', head: '', worktree: '', branch: 'codex/276-native',
        pr: 277, prUrl: 'https://github.com/JFusco/brain/pull/277', existingPR: true, steps: [] };
    coordinator.state.jobs!.push(job);
    store.state.maintenance = { lastDaily: '2026-10-29', lastWeekly: '', ledger: 'Historical failures retained', runs: [
        { id: 'wrapper', status: 'completed', nativeRunId: nativeId, steps: [] } as any,
    ] };
    const gate: any = { active: null, slotDate: '2026-10-29', attempts: 1, retryAfter: null, completed: { id: nativeId,
        authorId: '07d1ae13-a21b-41ac-a6b9-d81cc5bc9bdc', phase: 'completed', slotDate: '2026-10-29', completedAt: '2026-10-29T14:01:47Z', reportSha256: 'c'.repeat(64), prs: [{ number: 277, headSha: head, mergeCommit: merge }] } };
    const native = vi.spyOn(engine.maintenance as any, 'readStatus').mockImplementation(async () => structuredClone(gate));
    const pull: any = { number: 277, html_url: job.prUrl, head: { sha: head }, base: { ref: 'main', repo: { full_name: 'JFusco/brain' } }, state: 'closed', merged_at: '2026-10-29T13:36:09Z', merge_commit_sha: merge };
    const issue: any = { number: 276, html_url: issueUrl, state: 'closed', state_reason: 'completed', updated_at: '2026-10-29T14:00:00Z' };
    const board: any = { url: store.project.githubProject!.url, error: '', items: [{ id: 'card', repository: 'JFusco/brain', number: 276, state: 'CLOSED', status: 'Done' }] };
    vi.spyOn(engine.github, 'board').mockResolvedValue(board);
    let linked = true;
    const runs: any = { total_count: 1, workflow_runs: [{ id: 10, head_sha: merge, event: 'push', head_branch: 'main', status: 'completed', conclusion: 'success' }] };
    const calls: string[] = [];
    const execute = vi.fn(async (_bin: string, args: string[]) => {
        calls.push(args.join(' '));
        if (args[0] === 'pr') return JSON.stringify({ closingIssuesReferences: linked ? [{ url: issueUrl }] : [] });
        if (args[1].endsWith('/pulls/277')) return JSON.stringify(pull);
        if (args[1].endsWith('/issues/276')) return JSON.stringify(issue);
        if (args[1].includes('/actions/runs?')) return JSON.stringify(runs);
        throw new Error('Unexpected command: ' + args.join(' '));
    });
    const delivery = new GitHubDelivery(store, engine, execute as any);
    const workers = vi.spyOn(engine.agents, 'run'), maintenance = vi.spyOn(engine.maintenance, 'request');
    return { store, engine, coordinator, job, gate, native, pull, issue, board, runs, calls, execute, delivery, workers, maintenance, setLinked: (value: boolean) => linked = value };
}
test('native publication read-back atomically completes the stale mirror and outbox without models, writes, or old notices', async () => {
    const a = fixture(), prior = structuredClone(a.job);
    a.store.emit('fixture', 'Initial blocked mirror');
    expect(a.store.state.outbox.some(action => action.status === 'open')).toBe(true);
    await a.delivery.reconcileNativeDelivery(a.job.key);
    expect(a.job).toMatchObject({ status: 'completed', stage: 'closeout', head: a.pull.head.sha, mergeCommit: a.pull.merge_commit_sha });
    const receipt = a.job.steps.at(-1)!.result.receipts[0];
    expect(JSON.parse(receipt.detail)).toMatchObject({ prior, native: { id: a.gate.completed.id }, board: { status: 'Done' } });
    expect(a.store.state.outbox.filter(action => action.status === 'open')).toEqual([]);
    expect(a.store.state.maintenance!.ledger).toBe('Historical failures retained'); expect(a.gate.attempts).toBe(1);
    expect(a.workers).not.toHaveBeenCalled(); expect(a.maintenance).not.toHaveBeenCalled();
    expect(a.calls.some(call => /--method|issue create|comment|merge --/.test(call))).toBe(false);
    expect(a.store.state.coordination!.notices?.entries || []).toEqual([]);
    await expect(a.delivery.reconcileNativeDelivery(a.job.key)).rejects.toThrow('inactive');
    expect(a.job.steps).toHaveLength(1);
});
test.each(['active', 'missing-wrapper', 'wrong-pr', 'wrong-head', 'wrong-merge', 'unlinked', 'open-issue', 'not-planned', 'wrong-board-repo', 'not-done', 'incomplete-actions', 'failed-actions'] as const)('read-back preserves the blocker for %s evidence', async scenario => {
    const a = fixture();
    if (scenario === 'active') a.gate.active = a.gate.completed;
    if (scenario === 'missing-wrapper') a.store.state.maintenance!.runs = [];
    if (scenario === 'wrong-pr') a.gate.completed.prs[0].number = 999;
    if (scenario === 'wrong-head') a.pull.head.sha = 'd'.repeat(40);
    if (scenario === 'wrong-merge') a.pull.merge_commit_sha = 'd'.repeat(40);
    if (scenario === 'unlinked') a.setLinked(false);
    if (scenario === 'open-issue') a.issue.state = 'open';
    if (scenario === 'not-planned') a.issue.state_reason = 'not_planned';
    if (scenario === 'wrong-board-repo') a.board.items[0].repository = 'Other/brain';
    if (scenario === 'not-done') a.board.items[0].status = 'In progress';
    if (scenario === 'incomplete-actions') a.runs.total_count = 101;
    if (scenario === 'failed-actions') a.runs.workflow_runs[0].conclusion = 'failure';
    const before = JSON.stringify(a.job);
    await expect(a.delivery.reconcileNativeDelivery(a.job.key)).rejects.toThrow();
    expect(JSON.stringify(a.job)).toBe(before); expect(a.workers).not.toHaveBeenCalled();
});
test('any started Office work or persisted effect prevents native-mirror cleanup', async () => {
    const a = fixture();
    expect(nativeDeliveryReadbackCandidate(a.store, a.job)).toBe(true);
    a.store.state.workLog = [{ id: 'old-writer', requestId: a.job.id, status: 'failed' } as any];
    expect(nativeDeliveryReadbackCandidate(a.store, a.job)).toBe(false);
    a.store.state.workLog = [];
    a.store.putEffect({ id: 'old-effect', work: { projectId: 'brain', kind: 'delivery', id: a.job.id }, status: 'uncertain' } as any);
    await expect(a.delivery.reconcileNativeDelivery(a.job.key)).rejects.toThrow('inactive');
    expect(a.native).not.toHaveBeenCalled(); expect(a.job.status).toBe('blocked');
});
test('a pause during final native observation prevents committing completion', async () => {
    const a = fixture(); let reads = 0;
    a.native.mockImplementation(async () => { if (++reads === 2) a.store.state.paused = true; return structuredClone(a.gate); });
    await expect(a.delivery.reconcileNativeDelivery(a.job.key)).rejects.toThrow('changed');
    expect(a.job.status).toBe('blocked'); expect(a.job.steps).toEqual([]);
});
test.each(['blocked', 'interrupted'])('IT preserves the original retry route for a %s checkpoint with a fresh budget', async status => {
    const a = fixture();
    a.store.state.coordination!.jobs = [];
    a.store.state.coordination!.checkpoints = [{ id: 'checkpoint', runId: 'original', status, detail: 'Surviving helper', date: '2026-10-29' } as any];
    a.store.state.maintenance!.runs.push({ id: 'original', checkpointId: 'checkpoint', status: 'reconciled', steps: [] } as any);
    const offices = { entries: new Map([['brain', { store: a.store, engine: a.engine, coordinator: a.coordinator }]]) };
    const it = new ITSpecialist(offices as any, { report: async () => ({ services: [] }) } as any);
    await it.tick(new Date('2026-10-29T23:00:00Z'), true);
    await it.tick(new Date('2026-10-29T23:01:00Z'), true);
    expect(a.store.state.coordination!.requests).toEqual([
        expect.objectContaining({ action: 'retry-checkpoint', key: 'checkpoint', status: 'queued' }),
    ]);
    expect(a.store.state.it!.recoveries['checkpoint:checkpoint'].attempts).toBe(1);
    expect(a.store.state.it!.recoveries['checkpoint-readback:checkpoint']).toBeUndefined();
    expect(a.native).not.toHaveBeenCalled(); expect(a.execute).not.toHaveBeenCalled();
    expect(a.workers).not.toHaveBeenCalled(); expect(a.maintenance).not.toHaveBeenCalled();
});
test.each(['queued', 'working'] as const)('IT waits for the third %s checkpoint retry before using pure read-back', async status => {
    const a = fixture(), c = a.store.state.coordination!;
    c.jobs = [];
    c.checkpoints = [{ id: 'checkpoint', runId: 'original', status: 'blocked', detail: 'Surviving helper', date: '2026-10-29' } as any];
    a.store.state.maintenance!.runs.push({ id: 'original', checkpointId: 'checkpoint', status: 'reconciled', steps: [] } as any);
    const retry = { id: 'third-retry', action: 'retry-checkpoint', key: 'checkpoint', head: '', lane: 'delivery' as const,
        requestedAt: '2026-10-29T22:59:00Z', status, detail: 'Waiting for scheduler ownership.' };
    c.requests = [retry];
    a.store.state.it = { status: 'retrying', checkedAt: '', nextCheckAt: '', services: [], reports: [], recoveries: {
        'checkpoint:checkpoint': { attempts: 3, status: 'retrying', requestId: retry.id, nextAt: '2026-10-29T23:04:00Z', detail: 'Surviving helper' },
    } };
    const offices = { entries: new Map([['brain', { store: a.store, engine: a.engine, coordinator: a.coordinator }]]) };
    const it = new ITSpecialist(offices as any, { report: async () => ({ services: [] }) } as any);
    await it.tick(new Date('2026-10-29T23:00:00Z'), true);
    expect(c.requests).toEqual([retry]);
    expect(a.store.state.it.recoveries['checkpoint-readback:checkpoint']).toBeUndefined();
    expect(a.store.state.it.reports.at(-1)!.followUps).toContainEqual({ id: 'checkpoint:checkpoint', owner: 'IT',
        detail: `retry-checkpoint is ${status}; scheduler owns execution.` });
    c.requests[0].status = 'blocked'; c.requests[0].detail = 'Native date already completed';
    await it.tick(new Date('2026-10-29T23:01:00Z'), true);
    expect(a.store.state.it.recoveries['checkpoint:checkpoint'].status).toBe('needs-human');
    expect(c.requests).toHaveLength(1);
    await it.tick(new Date('2026-10-29T23:02:00Z'), true);
    expect(c.requests.filter(request => request.action === 'reconcile-native-checkpoint')).toEqual([
        expect.objectContaining({ key: 'checkpoint', status: 'queued' }),
    ]);
    expect(c.requests).toHaveLength(2);
    expect(a.store.state.it.recoveries['checkpoint:checkpoint']).toMatchObject({ attempts: 3, requestId: retry.id,
        status: 'needs-human', nextAt: '2026-10-29T23:04:00Z' });
    expect(a.native).not.toHaveBeenCalled(); expect(a.execute).not.toHaveBeenCalled();
    expect(a.workers).not.toHaveBeenCalled(); expect(a.maintenance).not.toHaveBeenCalled();
});
test('IT automatically queues PM read-backs once and uses a pure checkpoint route after exhausted native retries', async () => {
    const a = fixture();
    a.store.state.coordination!.checkpoints = [{ id: 'checkpoint', runId: 'original', status: 'blocked', detail: 'Surviving helper', date: '2026-10-29' } as any];
    a.store.state.maintenance!.runs.push({ id: 'original', checkpointId: 'checkpoint', status: 'reconciled', steps: [] } as any);
    a.store.state.it = { status: 'needs-attention', checkedAt: '', nextCheckAt: '', services: [], reports: [], recoveries: { 'checkpoint:checkpoint': { attempts: 3, status: 'needs-human', nextAt: '', detail: 'Completed date refused' } } };
    const health = { report: async () => ({ services: [] }) }, offices = { entries: new Map([['brain', { store: a.store, engine: a.engine, coordinator: a.coordinator }]]) };
    const it = new ITSpecialist(offices as any, health as any);
    await it.tick(new Date('2026-10-29T23:00:00Z'), true);
    await it.tick(new Date('2026-10-29T23:01:00Z'), true);
    expect(a.store.state.coordination!.requests).toEqual(expect.arrayContaining([
        expect.objectContaining({ action: 'reconcile-native-delivery', key: a.job.key, status: 'queued' }),
        expect.objectContaining({ action: 'reconcile-native-checkpoint', key: 'checkpoint', status: 'queued' }),
    ]));
    expect(a.store.state.coordination!.requests).toHaveLength(2);
    expect(a.store.state.it!.recoveries['checkpoint:checkpoint'].attempts).toBe(3);
    expect(a.native).not.toHaveBeenCalled(); expect(a.execute).not.toHaveBeenCalled(); expect(a.maintenance).not.toHaveBeenCalled();
});
test.each([1, 3])('pause preserves %i-attempt checkpoint and native-delivery recoveries until verified source completion', async attempts => {
    const a = fixture(), c = a.store.state.coordination!;
    c.checkpoints = [{ id: 'checkpoint', runId: 'original', status: 'blocked', detail: 'Surviving helper', date: '2026-10-29' } as any];
    a.store.state.maintenance!.runs.push({ id: 'original', checkpointId: 'checkpoint', status: 'reconciled', steps: [
        { role: 'pm', stage: 'maintenance-readback', at: '', result: { outcome: 'passed', summary: 'Original effects read back', ledger: '', blocker: '', candidates: [],
            receipts: [{ id: 'original-readback', action: 'read', target: 'original', verified: true, uncertain: false, detail: 'No uncertain effects remain' }] } },
    ] } as any);
    const intents = [
        ['checkpoint:checkpoint', 'retry-checkpoint', 'checkpoint', 'Surviving helper'],
        ['checkpoint-readback:checkpoint', 'reconcile-native-checkpoint', 'checkpoint', 'Surviving helper'],
        [`native-delivery:${a.job.id}`, 'reconcile-native-delivery', a.job.key, a.job.detail],
    ];
    c.requests = intents.map(([id, action, key]) => ({ id, action, key, head: '', lane: 'delivery', requestedAt: '2026-10-29T22:00:00Z', status: 'blocked', detail: 'Prior read-back refused' }));
    a.store.state.it = { status: 'needs-attention', checkedAt: '', nextCheckAt: '', services: [], reports: [],
        recoveries: Object.fromEntries(intents.map(([id, , , detail]) => [id, { attempts, status: attempts === 3 ? 'needs-human' : 'retrying',
            nextAt: '2026-10-29T23:30:00Z', requestId: id, detail }])) };
    const before = structuredClone(a.store.state.it.recoveries), requests = structuredClone(c.requests);
    const offices = { entries: new Map([['brain', { store: a.store, engine: a.engine, coordinator: a.coordinator }]]) };
    const it = new ITSpecialist(offices as any, { report: async () => ({ services: [] }) } as any);
    a.store.state.paused = true;
    await it.tick(new Date('2026-10-29T23:00:00Z'), true);
    expect(a.store.state.it.recoveries).toEqual(before); expect(c.requests).toEqual(requests);
    expect(a.store.state.it.reports.at(-1)!.actions).toEqual([]);
    expect(a.store.state.it.reports.at(-1)!.followUps.map(f => f.id)).toEqual(expect.arrayContaining(intents.map(([id]) => id)));
    a.store.state.paused = false;
    await it.tick(new Date('2026-10-29T23:01:00Z'), true);
    expect(a.store.state.it.recoveries).toEqual(before); expect(c.requests).toEqual(requests);
    expect(a.store.state.it.reports.at(-1)!.actions).toEqual([]);
    expect(a.native).not.toHaveBeenCalled(); expect(a.execute).not.toHaveBeenCalled(); expect(a.maintenance).not.toHaveBeenCalled();
    await a.coordinator.readBackCheckpoint('checkpoint');
    await a.delivery.reconcileNativeDelivery(a.job.key);
    a.store.state.paused = true;
    await it.tick(new Date('2026-10-29T23:02:00Z'), true);
    for (const [id] of intents)
        expect(a.store.state.it.recoveries[id]).toMatchObject({ attempts, requestId: id, status: 'resolved', nextAt: '' });
    expect(a.store.state.it.reports.at(-1)!.followUps).toEqual([]); expect(c.requests).toEqual(requests);
    expect(a.workers).not.toHaveBeenCalled(); expect(a.maintenance).not.toHaveBeenCalled();
});
