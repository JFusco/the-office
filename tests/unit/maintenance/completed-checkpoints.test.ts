import { afterEach, expect, test, vi } from 'vitest';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { coordination, Coordinator } from '../../../server/scheduling/coordination';
import { Engine } from '../../../server/scheduling/engine';
import { reconcileCompletedCheckpoints } from '../../../server/maintenance/completed-checkpoints';
import { projectOutbox } from '../../../server/conversations/outbox';
import { scheduledWork } from '../../../server/scheduling/scheduled-work';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
function fixture(project = 'cms-field-vocabulary') {
    const store = new Store(':memory:', projectById(project)); stores.push(store);
    store.state.coordination = { ...coordination(), enabled: true };
    const checkpoint: any = { id: 'checkpoint', date: '2026-11-03', status: 'blocked', runId: 'run', detail: 'Original failure', endedAt: 'old-end' };
    const run: any = { id: 'run', checkpointId: checkpoint.id, status: 'completed', stage: project === 'brain' ? 'brain-completed' : 'complete', endedAt: '2026-11-03T23:00:00Z', steps: [{ stage: 'follow-up', result: { outcome: 'passed', receipts: [] } }] };
    store.state.coordination.checkpoints = [checkpoint];
    store.state.maintenance = { runs: [run], lastDaily: '', lastWeekly: '', ledger: 'Original history' };
    store.state.outbox = projectOutbox(store.state);
    return { store, run, checkpoint };
}
test.each(['cec', 'cms-field-vocabulary', 'brain'])('%s clears its stale checkpoint after linked completion without changing history or replaying work', project => {
    const { store, run, checkpoint } = fixture(project), steps = structuredClone(run.steps), read = vi.fn();
    expect(store.state.outbox.filter(item => item.status === 'open')).toHaveLength(1);
    reconcileCompletedCheckpoints(store, read);
    expect(checkpoint.status).toBe('completed');
    expect(store.state.outbox.filter(item => item.status === 'open')).toEqual([]);
    expect(run.steps.slice(0, -1)).toEqual(steps);
    expect(JSON.parse(run.steps.at(-1).result.receipts[0].detail).prior.detail).toBe('Original failure');
    expect(store.state.maintenance!.ledger).toBe('Original history');
    expect(read).not.toHaveBeenCalled();
    reconcileCompletedCheckpoints(store, read);
    expect(run.steps).toHaveLength(2);
});
test.each(['unreconciled', 'reconciled-only', 'skipped', 'wrong-link', 'missing-run', 'uncertain', 'failed-result', 'active-worker', 'active-recovery', 'active-claim', 'repair', 'continuation', 'paused', 'draining', 'disabled'])('keeps unresolved checkpoint with %s', scenario => {
    const { store, run, checkpoint } = fixture();
    if (scenario === 'unreconciled') run.status = 'blocked';
    if (scenario === 'reconciled-only') run.status = 'reconciled';
    if (scenario === 'skipped') run.stage = 'skipped: backoff';
    if (scenario === 'wrong-link') run.checkpointId = 'other';
    if (scenario === 'missing-run') checkpoint.runId = 'missing';
    if (scenario === 'uncertain') run.steps[0].result.receipts = [{ verified: true, uncertain: true }];
    if (scenario === 'failed-result') run.steps[0].result.outcome = 'blocked';
    if (scenario === 'active-worker') store.state.workLog = [{ requestId: run.id, status: 'stopping' } as any];
    if (scenario === 'active-recovery') store.state.coordination!.requests = [{ id: 'reader', key: checkpoint.id, action: 'retry-checkpoint', status: 'working' } as any];
    if (scenario === 'active-claim') vi.spyOn(store, 'activeClaims').mockReturnValue([{ work: { id: run.id } } as any]);
    if (scenario === 'repair') checkpoint.repairResume = { needsFollowup: true };
    if (scenario === 'continuation') checkpoint.continuationId = 'continuation';
    if (scenario === 'paused') store.state.paused = true;
    if (scenario === 'draining') store.state.draining = true;
    if (scenario === 'disabled') store.state.coordination!.enabled = false;
    const before = structuredClone(store.state);
    reconcileCompletedCheckpoints(store, vi.fn());
    expect(store.state).toEqual(before);
});
test('normal coordinator tick performs reconciliation automatically', async () => {
    const { store, checkpoint } = fixture();
    store.state.coordination!.activatedAt = '2026-11-04T23:00:00Z';
    store.state.coordination!.listener.nextCheckAt = '2026-11-05T23:00:00Z';
    const engine = new Engine(store), coordinator = new Coordinator(store, engine);
    const worker = vi.spyOn(engine.agents, 'run');
    await coordinator.tick(new Date('2026-11-04T12:00:00Z'));
    expect(checkpoint.status).toBe('completed'); expect(worker).not.toHaveBeenCalled();
});
test.each(['queued', 'blocked', 'interrupted'])('completed checkpoint makes an old %s recovery terminal in the scheduler', status => {
    const { store, checkpoint } = fixture();
    store.state.coordination!.requests = ['retry-checkpoint', 'reconcile-native-checkpoint'].map(action => ({ id: action, key: checkpoint.id, action, status, lane: 'delivery' })) as any;
    reconcileCompletedCheckpoints(store);
    const engine = new Engine(store), coordinator = new Coordinator(store, engine);
    const work = scheduledWork({ store, engine, coordinator, conversations: {} as any }, new Map([[store.project.id, store]]));
    expect(work.filter(item => item.work.kind === 'reconciliation').map(item => item.eligibility.state)).toEqual(['terminal', 'terminal']);
});
