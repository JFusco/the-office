import { afterEach, expect, test } from 'vitest';
import { Store } from '../../../server/store/store';
import { ControlStore } from '../../../server/store/control-store';
import { Effects, EffectUncertainError } from '../../../server/store/effects';
import { easternInstant } from '../../../server/office/clock';
import { migrateSnapshot } from '../../../server/store/migrations';
import { initialSnapshot } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { coordination, Coordinator } from '../../../server/scheduling/coordination';
import { Engine } from '../../../server/scheduling/engine';
import type { EffectIntent, WorkTime } from '../../../src/shared';
const stores: {
    close(): void;
}[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
function setup() { const store = new Store(':memory:', projectById('brain')); stores.push(store); return store; }
const work = { projectId: 'brain', kind: 'delivery' as const, id: 'job' };
const prepared = (): EffectIntent => ({ id: 'effect', work, attemptId: 'attempt', operation: 'fixture', target: 'GH-999', authorization: 'fixture', payload: { value: 1 }, expectedState: {}, status: 'prepared', createdAt: new Date().toISOString(), dispatchedAt: '', verifiedAt: '', receipt: null, error: '', elapsedMs: null });
test('failed transition rolls back domain records, effect intents and events before notification', () => {
    const store = setup();
    let observed = 0;
    store.listeners.add(() => observed++);
    expect(() => store.transaction(() => {
        store.state.pilotKey = 'GH-999';
        store.putEffect(prepared());
        store.emit('fixture', 'Uncommitted');
        throw new Error('simulated disk/transition failure');
    })).toThrow('simulated');
    expect(store.state.pilotKey).toBe('');
    expect(store.getEffect('effect')).toBeUndefined();
    expect(store.replay(0)).toEqual([]);
    expect(observed).toBe(0);
    store.transition('fixture', 'Committed', () => { store.state.pilotKey = 'GH-999'; });
    expect(observed).toBe(1);
    const saved = store.db.prepare('SELECT body FROM state').get() as {
        body: string;
    };
    expect(JSON.parse(saved.body).pilotKey).toBe('GH-999');
});
test('stopping work retains its unique claim until termination is established', () => {
    const store = setup(), claim = store.claimWork(work, 'owner', 'implement')!;
    store.finishClaim(claim.id, 'stopping');
    expect(store.claimWork(work, 'other', 'implement')).toBeNull();
    store.finishClaim(claim.id, 'completed');
    expect(store.claimWork(work, 'other', 'review')).not.toBeNull();
});
test('recovery preserves a yielded checkpoint so its linked queued run can complete it once', async () => {
    const store = setup(), coordinator = new Coordinator(store, new Engine(store));
    coordinator.activate(new Date());
    const checkpoint = { id: 'checkpoint', date: '2026-10-29', dueAt: '', requestedAt: '', startedAt: 'original-start', endedAt: '', status: 'working' as const, runId: 'run', detail: 'Yielded to scheduler' };
    coordinator.state.checkpoints.push(checkpoint);
    store.state.maintenance = { runs: [{ id: 'run', checkpointId: checkpoint.id, status: 'queued', stage: 'proposal-plan', steps: [], requestedAt: '', startedAt: '', endedAt: '', weekly: false, error: '' }], lastDaily: '', lastWeekly: '', ledger: '' };
    store.save();
    store.recover();
    store.recover();
    expect(checkpoint).toMatchObject({ status: 'working', startedAt: 'original-start', endedAt: '' });
    expect(store.state.maintenance.runs[0].status).toBe('queued');
    store.state.maintenance.runs[0].status = 'completed';
    await coordinator.tick();
    await coordinator.tick();
    expect(checkpoint.status).toBe('completed');
    expect(store.state.events.filter(event => event.kind === 'checkpoint-finished')).toHaveLength(1);
});
test.each(['working', 'missing', 'claim', 'effect', 'receipt', 'other-checkpoint'] as const)('checkpoint recovery preserves interruption for %s evidence', scenario => {
    const store = setup();
    store.state.coordination = coordination();
    const checkpoint = { id: 'checkpoint', date: '2026-10-29', dueAt: '', requestedAt: '', startedAt: '', endedAt: '', status: 'working' as const, runId: 'run', detail: '' };
    store.state.coordination.checkpoints.push(checkpoint);
    const run = { id: 'run', checkpointId: scenario === 'other-checkpoint' ? 'other' : checkpoint.id, status: scenario === 'working' ? 'working' as const : 'queued' as const, stage: 'proposal-plan', steps: scenario === 'receipt' ? [{ role: 'pm' as const, stage: 'follow-up', at: '', result: { outcome: 'blocked' as const, summary: '', ledger: '', blocker: '', candidates: [], receipts: [{ id: 'write', action: 'write', target: 'fixture', verified: false, uncertain: true, detail: '' }] } }] : [], requestedAt: '', startedAt: '', endedAt: '', weekly: false, error: '' };
    store.state.maintenance = { runs: scenario === 'missing' ? [] : [run], lastDaily: '', lastWeekly: '', ledger: '' };
    if (scenario === 'claim')
        store.claimWork({ projectId: 'brain', kind: 'maintenance', id: run.id }, 'owner', run.stage);
    if (scenario === 'effect')
        store.putEffect({ ...prepared(), work: { projectId: 'brain', kind: 'maintenance', id: run.id }, status: 'dispatching' });
    store.recover();
    expect(checkpoint.status).toBe('interrupted');
    if (scenario === 'effect')
        expect(store.getEffect('effect')?.status).toBe('uncertain');
    if (scenario === 'working')
        expect(run.status).toBe('interrupted');
});
test('uncertain effects preserve their exact payload and can only be read back', async () => {
    const store = setup(), effects = new Effects(store);
    let writes = 0;
    const operation = { ...prepared(), preflight: async () => { }, dispatch: async () => { writes++; return { id: 'provider-1' }; }, verify: async () => false };
    await expect(effects.execute(operation)).rejects.toBeInstanceOf(EffectUncertainError);
    await expect(effects.execute(operation)).rejects.toBeInstanceOf(EffectUncertainError);
    expect(writes).toBe(1);
    expect(await effects.reconcile('effect', async (intent) => { expect(intent.payload).toEqual({ value: 1 }); return { verified: false, receipt: null }; })).toBe(false);
    expect(store.getEffect('effect')?.status).toBe('uncertain');
    expect(await effects.reconcile('effect', async () => ({ verified: true, receipt: { id: 'provider-1' } }))).toBe(true);
    expect(await effects.execute(operation)).toEqual({ id: 'provider-1' });
    expect(writes).toBe(1);
});
test('goal ownership and explicit dependencies migrate without guessing from prose', () => {
    const state = initialSnapshot();
    state.coordination = coordination();
    state.goals = [{ id: 'goal', project: 'CEC', title: 'Keep me', detail: '', priority: 1, status: 'idea', updatedAt: 'original-version', requestId: 'human' }];
    state.coordination.listener.reviews.push({ id: 'review', key: 'GH-254', summary: '', url: '', queuedAt: '', startedAt: '', endedAt: '', status: 'held', detail: 'Wait for GH-255', owner: '' });
    migrateSnapshot(state, projectById('brain'));
    migrateSnapshot(state, projectById('brain'));
    expect(state.goals[0]).toMatchObject({ projectId: 'brain', project: 'CEC', mapping: 'unmapped', status: 'idea', updatedAt: 'original-version' });
    expect(state.coordination.listener.reviews[0].prerequisites).toEqual([]);
});
test('confirmed segments exclude heartbeat/suspend gaps and retain later observations', () => {
    let now = Date.parse('2026-10-29T12:00:00Z');
    const clock = { now: () => new Date(now), monotonic: () => now };
    const store = new Store(':memory:', projectById('brain'), undefined, clock);
    stores.push(store);
    const record: WorkTime = { id: 'worker', role: 'developer', task: 'Fixture', ticket: 'GH-999', stage: 'implement', requestId: 'job', sessionId: '', provider: 'fixture', model: '', effort: '', status: 'running', startedAt: clock.now().toISOString(), lastHeartbeatAt: clock.now().toISOString(), endedAt: '', elapsedMs: 0, queuedMs: 0, inputTokens: null, outputTokens: null, durationUncertain: false, reportedAt: '' };
    store.beginWork(record);
    now += 5000;
    store.checkpointWork('worker', 5000);
    now += 60000;
    store.checkpointWork('worker', 65000);
    now += 5000;
    store.finishWork('worker', 'completed', 70000);
    const saved = store.state.workLog![0];
    expect(saved.elapsedMs).toBe(10000);
    expect(saved.segments).toHaveLength(2);
    expect(saved.gaps).toHaveLength(1);
    expect(saved.durationUncertain).toBe(true);
});
test('Eastern midnight uses the offset at midnight on both DST transition dates', () => {
    expect(easternInstant('2026-11-01').toISOString()).toBe('2026-11-01T04:00:00.000Z');
    expect(easternInstant('2026-11-02').getTime() - easternInstant('2026-11-01').getTime()).toBe(25 * 3600000);
    expect(easternInstant('2026-03-09').getTime() - easternInstant('2026-03-08').getTime()).toBe(23 * 3600000);
});
test('daily control store deduplicates a date, protects versions and keeps only bounded summaries', () => {
    const control = new ControlStore(':memory:');
    stores.push(control);
    const first = control.enqueue('2026-10-29', '2026-10-29T21:00:00Z', { project: 'brain' });
    const duplicate = control.enqueue('2026-10-29', '2026-10-29T21:00:00Z', { changed: true });
    expect(duplicate.id).toBe(first.id);
    expect(duplicate.facts).toEqual({ project: 'brain' });
    control.update(first.id, 0, report => { report.status = 'working'; report.attemptId = 'attempt'; });
    expect(() => control.update(first.id, 0, report => { report.status = 'completed'; })).toThrow('changed');
    control.recover();
    expect(control.get(first.id)?.status).toBe('interrupted');
    expect(control.summaries()[0]).not.toHaveProperty('facts');
});
