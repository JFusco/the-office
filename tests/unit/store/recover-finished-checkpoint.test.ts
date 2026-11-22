import { afterEach, expect, test } from 'vitest';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { coordination } from '../../../server/scheduling/coordination';
import { projectOutbox } from '../../../server/conversations/outbox';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
/** The service stopped after tonight's run ended and before the coordinator tick copied its result to the checkpoint. */
function fixture(runStatus = 'completed') {
    const store = new Store(':memory:', projectById('brain')); stores.push(store);
    store.state.coordination = { ...coordination(), enabled: true };
    const checkpoint: any = { id: 'checkpoint', date: '2026-11-22', status: 'working', runId: 'run', detail: 'Maintenance run enqueued; the scheduler owns subsequent stages.', startedAt: '2026-11-22T22:00:15Z', endedAt: '' };
    const run: any = { id: 'run', checkpointId: checkpoint.id, status: runStatus, stage: runStatus === 'completed' ? 'brain-completed' : 'brain-maintenance', error: runStatus === 'completed' ? '' : 'Stopped',
        requestedAt: '2026-11-22T22:00:15Z', endedAt: runStatus === 'queued' || runStatus === 'working' ? '' : '2026-11-22T22:33:20Z',
        steps: [{ stage: 'brain-maintenance', result: { outcome: 'passed', receipts: [{ id: 'refused', action: 'prepare refused', target: 't', verified: false, uncertain: false, detail: '' }] } }] };
    store.state.coordination.checkpoints = [checkpoint];
    store.state.maintenance = { runs: [run], lastDaily: '', lastWeekly: '', ledger: '' };
    store.save();
    return { store, checkpoint, run };
}
const open = (store: Store) => projectOutbox(store.state).filter(item => item.status === 'open').map(item => item.id);

test('a restart after the run completed leaves its checkpoint completed, with nothing in the outbox', () => {
    const { store, checkpoint, run } = fixture(), steps = structuredClone(run.steps);
    store.recover();
    expect(checkpoint).toMatchObject({ status: 'completed', detail: 'Maintenance run: brain-completed' });
    expect(checkpoint.endedAt).toBeTruthy();
    expect(run.steps).toEqual(steps);
    expect(store.state.events[0]).toMatchObject({ kind: 'checkpoint-finished', message: 'Maintenance run: brain-completed' });
    expect(open(store)).toEqual([]);
});

test('the same restart under a deployment fence does the same', () => {
    const { store, checkpoint } = fixture();
    store.recover(true);
    expect(checkpoint.status).toBe('completed');
    expect(open(store)).toEqual([]);
});

test.each<[string, (f: ReturnType<typeof fixture>) => void]>([
    ['its run was still working', f => { f.run.status = 'working'; f.run.endedAt = ''; }],
    ['its run stopped', f => { f.run.status = 'blocked'; f.run.error = 'Stopped'; }],
    ['its run was interrupted', f => { f.run.status = 'interrupted'; }],
    ['its run was reconciled only', f => { f.run.status = 'reconciled'; }],
    ['its completed run has no end time', f => { f.run.endedAt = ''; }],
    ['its completed run belongs to another checkpoint', f => { f.run.checkpointId = 'other'; }],
    ['its run is missing', f => { f.checkpoint.runId = 'missing'; }],
])('a working checkpoint is still interrupted for read-back when %s', (_name, change) => {
    const f = fixture();
    change(f);
    f.store.recover();
    expect(f.checkpoint).toMatchObject({ status: 'interrupted', detail: 'Checkpoint interrupted; reconcile its original run before a new request. No automatic replay.' });
    expect(f.store.state.events.some(event => event.kind === 'checkpoint-finished')).toBe(false);
});

test('a checkpoint that is not working is left as it is', () => {
    const f = fixture();
    f.checkpoint.status = 'blocked'; f.checkpoint.detail = 'Earlier failure';
    f.store.recover();
    expect(f.checkpoint).toMatchObject({ status: 'blocked', detail: 'Earlier failure' });
});
