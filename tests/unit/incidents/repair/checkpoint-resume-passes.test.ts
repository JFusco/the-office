import { afterEach, expect, test } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { freezeReads } from '../../../../server/incidents/repair/freeze-reads';
import { judgeResumes } from '../../../../server/incidents/repair/judge-resumes';
import { repairFreeze } from '../../../../server/incidents/repair/repair-freeze';
import { dispatchResumes } from '../../../../server/incidents/repair/resume-arrivals';
import { settleIncidents } from '../../../../server/incidents/repair/settle-incidents';
import { syncIncidents } from '../../../../server/incidents/sync-incidents';
import type { ITContext } from '../../../../server/it/context';
import { runDeliveryRecoveries } from '../../../../server/it/delivery-recoveries';
import { recoverAttempt } from '../../../../server/it/recovery-attempt';
import { enqueueRequest, executeRequest } from '../../../../server/scheduling/requests';
import type { Store } from '../../../../server/store/store';
import type { HarnessRequest } from '../../../../src/contracts/work';
import type { MaintenanceRun } from '../../../../src/shared';
import { item, later, observe, office } from '../incident-fixture';
import { checkpointSubject, checkpointWorld, gate, original } from './checkpoint-resume-fixture';
import { HOUR } from './repair-wait-fixture';
import { ENABLED, OPERATION, RELEASE } from './resume-fixture';

const stores: Store[] = [], dbs: DatabaseSync[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); dbs.splice(0).forEach(db => db.close()); });
type World = Awaited<ReturnType<typeof checkpointWorld>>;
const ONE = checkpointSubject('cp-1'), TWO = checkpointSubject('cp-2'), HOLDS_IT = { commit: RELEASE, operation: OPERATION };
const fail = (message: string) => { throw new Error(message); };
const pass = (w: World, minutes = 5) => dispatchResumes({ ledger: w.ledger, entries: [{ store: w.store }], control: { read: () => ENABLED }, running: () => HOLDS_IT, now: () => later(minutes), fenced: () => false, report: fail });
const judge = (w: World, minutes: number) => judgeResumes({ ledger: w.ledger, entries: [{ store: w.store }], running: () => HOLDS_IT, now: () => later(minutes), fenced: () => false, report: fail });
const settle = (w: World, minutes: number) => settleIncidents({ ledger: w.ledger, running: () => HOLDS_IT, now: () => later(minutes), fenced: () => false, report: fail });
const outcomes = (w: World) => (w.ledger.get(w.id)!.fixes!.at(-1)!.outcomes ?? []).map(({ subject, outcome, detail }) => ({ subject, outcome, detail }));
/** Brain's gate with nothing completed for the date, nothing active and retries left: a retry is queued, a native read-back refuses. */
const open = () => ({ ...gate(), completed: null });
/** The scheduler runs one request, with Brain's native gate answering `status`. */
async function execute(w: World, request: HarnessRequest, status: () => unknown = gate) {
    const scheduler = w.scheduler(status);
    await executeRequest(w.store, scheduler.engine, scheduler.coordinator, request);
    return scheduler;
}
/** The step the ordinary completion read-back saves when it closes a checkpoint (server/maintenance/completed-checkpoints.ts). */
function completeOrdinarily(w: World, checkpointId = 'cp-1') {
    const run = w.run(checkpointId);
    run.steps.push({ role: 'pm', stage: 'checkpoint-completion-readback', at: later(6).toISOString(), result: { outcome: 'passed', summary: 'verified complete', ledger: '', blocker: '', candidates: [],
        receipts: [{ id: `checkpoint:${checkpointId}:${run.id}`, action: 'checkpoint-completion-readback', target: run.id, verified: true, uncertain: false, detail: JSON.stringify({ originalRunId: run.id }) }] } });
    Object.assign(w.checkpoints().find(saved => saved.id === checkpointId)!, { status: 'completed', endedAt: later(6).toISOString() });
}
const retryMessage = (run: string) => `Original maintenance ${run} reconciled. Brain checkpoint will retry after ${later(6).toISOString()}; the nightly gate remains authoritative.`;

test('the native read-back resumes the checkpoint through the normal callers, advances on its own receipt and verifies the incident', async () => {
    const w = await checkpointWorld(stores, dbs, ['cp-1']);
    expect(pass(w)).toEqual({ admitted: [ONE], refused: [], held: [] });
    const [request] = w.requests();
    // Queued, nothing has moved yet.
    expect(judge(w, 6)).toEqual([]);
    const scheduler = await execute(w, request);
    expect(request).toMatchObject({ status: 'completed' });
    // One model-free status read; no maintenance run was requested and no worker started.
    expect(scheduler.read).toHaveBeenCalledTimes(1);
    expect(scheduler.maintenance).not.toHaveBeenCalled();
    expect(scheduler.worker).not.toHaveBeenCalled();
    expect(w.checkpoints()[0]).toMatchObject({ status: 'completed', runId: 'original-1' });
    const steps = w.run('cp-1').steps;
    expect(steps.map(step => step.stage)).toEqual(['maintenance-readback', 'checkpoint-native-readback']);
    expect(JSON.parse(steps[1].result.receipts[0].detail)).toMatchObject({ checkpointId: 'cp-1', originalRunId: 'original-1', completedWrapperId: 'completed-wrapper' });
    expect(judge(w, 7)).toEqual([ONE]);
    expect(outcomes(w)).toEqual([{ subject: ONE, outcome: 'advanced', detail: 'The native read-back completed the checkpoint from the original run original-1 after its resume.' }]);
    expect(settle(w, 8)).toEqual({ verified: [w.id], recurred: [] });
    expect(w.ledger.get(w.id)!.state).toBe('verified');
});

test('a resume runs only against the original run it was admitted for: a stale one ends blocked and touches nothing, an ordinary request keeps its key-only read', async () => {
    const w = await checkpointWorld(stores, dbs, ['cp-1']);
    pass(w);
    const [request] = w.requests();
    // The checkpoint was linked to a replacement run the native read-back would otherwise accept.
    const replacement: MaintenanceRun = { ...original('cp-1'), id: 'replacement' };
    w.runs().push(replacement);
    w.checkpoints()[0].runId = 'replacement';
    const before = JSON.stringify([w.checkpoints(), w.runs()]);
    const stale = await execute(w, request);
    expect(request).toMatchObject({ status: 'blocked', detail: 'Error: Checkpoint cp-1 is no longer linked to the original run original-1 its repair resume was admitted for; no native read-back was made' });
    expect(stale.read).not.toHaveBeenCalled();
    expect(JSON.stringify([w.checkpoints(), w.runs()])).toBe(before);
    // An ordinary native read-back, unmarked, reads what the checkpoint is linked to now.
    const ordinary = enqueueRequest(w.store, 'reconcile-native-checkpoint', 'cp-1');
    await execute(w, ordinary);
    expect(ordinary.status).toBe('completed');
    expect(replacement.steps.at(-1)!.stage).toBe('checkpoint-native-readback');
    // The resume is judged on its own original run, which shows nothing of it.
    expect(judge(w, 7)).toEqual([ONE]);
    expect(outcomes(w)).toEqual([{ subject: ONE, outcome: 'untested', detail: 'The checkpoint and the original run original-1 no longer name each other.' }]);
    // A marked request that does not say which run it was admitted for is not run either.
    const v = await checkpointWorld(stores, dbs, ['cp-1']);
    pass(v);
    const [unnamed] = v.requests();
    delete unnamed.repairResume!.stood!.run;
    const untouched = JSON.stringify([v.checkpoints(), v.runs()]), refused = await execute(v, unnamed);
    expect(unnamed).toMatchObject({ status: 'blocked', detail: 'Error: The repair resume of checkpoint cp-1 records no original run; no native read-back was made' });
    expect(refused.read).not.toHaveBeenCalled();
    expect(JSON.stringify([v.checkpoints(), v.runs()])).toBe(untouched);
});

test('the ordinary completion read-back closing the checkpoint while its resume is queued is untested, and alone cannot verify the incident', async () => {
    const w = await checkpointWorld(stores, dbs, ['cp-1']);
    pass(w);
    completeOrdinarily(w);
    expect(judge(w, 6)).toEqual([ONE]);
    expect(outcomes(w)).toEqual([{ subject: ONE, outcome: 'untested', detail: 'The ordinary completion read-back completed the checkpoint, not the native one; that says nothing of the native boundary.' }]);
    expect(settle(w, 7)).toEqual({ verified: [], recurred: [] });
    expect(w.ledger.get(w.id)!.state).toBe('deployed');
    // Beside a checkpoint the native read-back advanced, it is accounted for.
    const both = await checkpointWorld(stores, dbs);
    pass(both);
    completeOrdinarily(both, 'cp-2');
    expect(both.run('cp-2').steps.at(-1)!.result.receipts[0]).toMatchObject({
        id: 'checkpoint:cp-2:original-2', target: 'original-2', detail: JSON.stringify({ originalRunId: 'original-2' }),
    });
    await execute(both, both.requests()[0]);
    expect(judge(both, 6)).toEqual([ONE, TWO]);
    expect(outcomes(both).map(outcome => outcome.outcome)).toEqual(['advanced', 'untested']);
    expect(settle(both, 7)).toEqual({ verified: [both.id], recurred: [] });
});

test('historical baselines and a native step from before the admission are untested, whatever the checkpoint did', async () => {
    for (const [name, change] of [
        ['no original run recorded', (request: HarnessRequest) => { delete request.repairResume!.stood!.run; }],
        ['nothing recorded of how it stood', (request: HarnessRequest) => { delete request.repairResume!.stood; }],
    ] as const) {
        const w = await checkpointWorld(stores, dbs, ['cp-1']);
        pass(w);
        const [request] = w.requests();
        await execute(w, request);
        expect(w.checkpoints()[0].status, name).toBe('completed');
        change(request);
        expect(judge(w, 6), name).toEqual([ONE]);
        expect(outcomes(w)[0].outcome, name).toBe('untested');
    }
    // A native step the original run already had when it was resumed shows nothing of the resume.
    const w = await checkpointWorld(stores, dbs, ['cp-1']);
    const s = w.scheduler();
    await s.coordinator.readBackCheckpoint('cp-1');
    Object.assign(w.checkpoints()[0], { status: 'blocked', endedAt: 'old-end' });
    w.mark(4);
    pass(w);
    expect(w.requests()[0].repairResume!.stood).toMatchObject({ steps: 2, run: 'original-1' });
    w.checkpoints()[0].status = 'completed';
    expect(judge(w, 6)).toEqual([ONE]);
    expect(outcomes(w)).toEqual([{ subject: ONE, outcome: 'untested', detail: 'The checkpoint completed with no native read-back of the original run original-1 after its resume.' }]);
});

test('a retry queued for the original run after the admission moves the checkpoint, whoever queued it and however long ago; others do not', async () => {
    const w = await checkpointWorld(stores, dbs, ['cp-1']);
    // Before the admission, a retry for the run is no move of the resume.
    w.store.emit('checkpoint-retry-queued', retryMessage('original-1'), 'pm');
    pass(w);
    // Another run's retry, and the same words under another kind.
    w.store.emit('checkpoint-retry-queued', retryMessage('original-2'), 'pm');
    w.store.emit('checkpoint-finished', retryMessage('original-1'), 'pm');
    expect(judge(w, 6)).toEqual([]);
    // The handler's own retry, as a person's or IT's request runs it, with no native completion for the date.
    const s = w.scheduler(open);
    await s.coordinator.retryCheckpoint('cp-1');
    const retried = w.store.state.events.find(event => event.kind === 'checkpoint-retry-queued')!;
    expect(retried.message).toBe(w.checkpoints()[0].detail);
    expect(w.checkpoints()[0].status).toBe('queued');
    // Long since out of the events held in memory: it is read from the project's own.
    for (let n = 0; n < 120; n++) w.store.emit('refresh', `noise ${n}`);
    expect(w.store.state.events.some(event => event.id === retried.id)).toBe(false);
    expect(judge(w, 7)).toEqual([ONE]);
    expect(outcomes(w)).toEqual([{ subject: ONE, outcome: 'moved-by-hand', detail: `A retry of the checkpoint's original run was queued at ${retried.at}, after its resume.` }]);
    // A move is said ahead of absence too.
    const v = await checkpointWorld(stores, dbs, ['cp-1']);
    pass(v);
    v.store.emit('checkpoint-retry-queued', retryMessage('original-1'), 'pm');
    v.checkpoints().length = 0;
    expect(judge(v, 6)).toEqual([ONE]);
    expect(outcomes(v)[0].outcome).toBe('moved-by-hand');
});

test('a checkpoint whose ID begins like a ticket\'s is read as a checkpoint', async () => {
    const w = await checkpointWorld(stores, dbs, ['ticket:CEC-7']), subject = checkpointSubject('ticket:CEC-7');
    expect(pass(w)).toEqual({ admitted: [subject], refused: [], held: [] });
    await execute(w, w.requests()[0]);
    expect(judge(w, 6)).toEqual([subject]);
    expect(outcomes(w)).toEqual([{ subject, outcome: 'advanced', detail: 'The native read-back completed the checkpoint from the original run original-7 after its resume.' }]);
});

test('a checkpoint the project no longer holds is gone', async () => {
    const w = await checkpointWorld(stores, dbs, ['cp-1']);
    pass(w);
    w.checkpoints().length = 0;
    expect(judge(w, 6)).toEqual([ONE]);
    expect(outcomes(w)).toEqual([{ subject: ONE, outcome: 'gone', detail: 'The project no longer holds the checkpoint.' }]);
});

test('a checkpoint that stops again for this cause has recurred; one that stops for another, or whose request does, is chained', async () => {
    const w = await checkpointWorld(stores, dbs, ['cp-1']);
    pass(w);
    w.checkpoints()[0].endedAt = 'new-end';
    w.observed(6);
    expect(judge(w, 7)).toEqual([ONE]);
    expect(outcomes(w)).toEqual([{ subject: ONE, outcome: 'recurred', detail: `The subject stopped again for this incident's cause, seen at ${later(6).toISOString()}, after its resume.` }]);
    // Another cause.
    const v = await checkpointWorld(stores, dbs, ['cp-1']);
    pass(v);
    Object.assign(v.checkpoints()[0], { detail: 'Error: the gate file could not be read', endedAt: 'new-end' });
    v.observed(6);
    const other = v.ledger.list().find(incident => incident.id !== v.id)!;
    expect(judge(v, 7)).toEqual([ONE]);
    expect(outcomes(v)).toEqual([{ subject: ONE, outcome: 'chained', detail: `${ONE} stopped for another cause after the resume (${other.id}).` }]);
    // The resume's own request stopped: the native read-back found no completion for the date.
    const u = await checkpointWorld(stores, dbs, ['cp-1']);
    pass(u);
    const [request] = u.requests();
    await execute(u, request, open);
    expect(request).toMatchObject({ status: 'blocked', detail: 'Error: Existing native completion does not resolve this checkpoint; no maintenance retry dispatched' });
    syncIncidents(u.ledger, office(observe(u.store, [item('checkpoint', 'cp-1', 'checkpoint', 'blocked', 'Blocked', 'unclassified', 'brain'), item('reconciliation', request.id, 'reconcile-native-checkpoint', 'blocked', 'Blocked', 'unclassified', 'brain')])), later(6), undefined, fail);
    const held = u.ledger.list().find(incident => incident.id !== u.id)!;
    expect(judge(u, 7)).toEqual([ONE]);
    expect(outcomes(u)).toEqual([{ subject: ONE, outcome: 'chained', detail: `brain/reconciliation/${request.id} stopped for another cause after the resume (${held.id}).` }]);
});

test('a quiet resume is stalled after 24 hours; work under the checkpoint, its request or its original run postpones that, other work does not', async () => {
    const heartbeat = (requestId: string) => ({ id: `w-${requestId}`, requestId, status: 'completed', startedAt: later(5 + 19 * HOUR).toISOString(), lastHeartbeatAt: later(5 + 20 * HOUR).toISOString(), endedAt: '' }) as never;
    for (const [name, id, postponed] of [['the original run', () => 'original-1', true], ['the checkpoint', () => 'cp-1', true], ['the request', (w: World) => w.requests()[0].id, true],
        ['another run', () => 'original-2', false], ['the completed wrapper', () => 'completed-wrapper', false]] as const) {
        const w = await checkpointWorld(stores, dbs, ['cp-1']);
        pass(w);
        w.store.state.workLog = [heartbeat(id(w))];
        if (postponed) {
            expect(judge(w, 5 + 24 * HOUR + 1), name).toEqual([]);
            expect(judge(w, 5 + 44 * HOUR + 1), name).toEqual([ONE]);
            expect(outcomes(w)[0], name).toMatchObject({ outcome: 'stalled', detail: expect.stringContaining(later(5 + 20 * HOUR).toISOString()) });
        } else {
            expect(judge(w, 5 + 24 * HOUR + 1), name).toEqual([ONE]);
            expect(outcomes(w)[0], name).toMatchObject({ outcome: 'stalled', detail: expect.stringContaining(later(5).toISOString()) });
        }
    }
});

/** IT's check of one project, as the specialist runs it, with recovery attempts written through the ordinary ledger. */
function itCheck(w: World, now: Date) {
    const it = (w.store.state.it ??= { checkedAt: '', nextCheckAt: '', status: 'monitoring', reports: [], recoveries: {}, services: [] } as never) as ITContext['it'];
    const context: ITContext = { store: w.store, state: w.store.state, engine: {} as ITContext['engine'], it, actions: [], followUps: [], current: new Set<string>(), now, services: [], retainedPartials: [], retainedCloseouts: new Set(),
        activationBudget: () => undefined, coordinator: {} as ITContext['coordinator'], health: { checkedAt: '', context: '', services: [] } as unknown as ITContext['health'], nextAt: 0, offices: {} as ITContext['offices'],
        freeze: work => repairFreeze(w.store.state, work, now, freezeReads(w.store, now)), recover: (...args: Parameters<ITContext['recover']>) => recoverAttempt(context, ...args) };
    return context;
}

test('once the wait lifts, IT can queue its own checkpoint retry beside the resume; its enqueue proves nothing, and what its handler does is judged', async () => {
    for (const [name, status, outcome] of [['a native completion', gate, 'advanced'], ['no completion yet', open, 'moved-by-hand']] as const) {
        const w = await checkpointWorld(stores, dbs, ['cp-1']);
        // While the wait stands IT spends nothing and queues nothing.
        const held = itCheck(w, later(5));
        await runDeliveryRecoveries(held);
        expect(w.requests(), name).toEqual([]);
        expect(held.followUps, name).toEqual([{ id: 'checkpoint:cp-1', owner: 'IT', detail: 'Awaiting harness repair JFusco/the-office#526; held without spending an attempt.', routine: true }]);
        pass(w);
        // The wait is gone with the admission: IT's budget is not spent, so it queues its retry beside the native request.
        await runDeliveryRecoveries(itCheck(w, later(6)));
        expect(w.requests().map(request => [request.action, request.key, request.status]), name).toEqual([['reconcile-native-checkpoint', 'cp-1', 'queued'], ['retry-checkpoint', 'cp-1', 'queued']]);
        expect(w.store.state.it!.recoveries['checkpoint:cp-1'], name).toMatchObject({ attempts: 1, requestId: w.requests()[1].id });
        expect(judge(w, 7), name).toEqual([]);
        // The scheduler runs IT's retry first, against a gate this test controls.
        const scheduler = await execute(w, w.requests()[1], status);
        expect(scheduler.maintenance, name).not.toHaveBeenCalled();
        expect(judge(w, 8), name).toEqual([ONE]);
        expect(outcomes(w)[0].outcome, name).toBe(outcome);
    }
    // With IT's retry budget used up, its native read-back reuses the identical request while queued.
    const w = await checkpointWorld(stores, dbs, ['cp-1']);
    pass(w);
    const check = itCheck(w, later(6));
    check.it.recoveries['checkpoint:cp-1'] = { attempts: 3, nextAt: '', status: 'needs-human', detail: 'earlier' };
    await runDeliveryRecoveries(check);
    expect(w.requests()).toHaveLength(1);
    expect(check.it.recoveries['checkpoint-readback:cp-1']).toMatchObject({ attempts: 1, requestId: w.requests()[0].id });
});
