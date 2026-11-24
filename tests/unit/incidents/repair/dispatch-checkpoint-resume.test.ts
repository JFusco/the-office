import { afterEach, expect, test, vi } from 'vitest';
import * as eligibility from '../../../../server/incidents/repair/checkpoint-eligibility';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { canonical } from '../../../../server/incidents/canonical-json';
import { admitCheckpointResume } from '../../../../server/incidents/repair/dispatch-checkpoint-resume';
import { REPAIR_WAIT_MS } from '../../../../server/incidents/repair/repair-wait';
import { dispatchResumes } from '../../../../server/incidents/repair/resume-arrivals';
import { boundResume, resumeIdentity } from '../../../../server/incidents/repair/resume-binding';
import { RESUME_ROUTES, type ResumeRoute } from '../../../../server/incidents/repair/resume-routes';
import { enqueueRequest } from '../../../../server/scheduling/requests';
import type { Store } from '../../../../server/store/store';
import { later } from '../incident-fixture';
import { checkpoint, checkpointSubject, checkpointWorld, nativeRoute } from './checkpoint-resume-fixture';
import { HOUR } from './repair-wait-fixture';
import { ENABLED, FIX, OPERATION, RELEASE } from './resume-fixture';

const stores: Store[] = [], dbs: DatabaseSync[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); dbs.splice(0).forEach(db => db.close()); });
type World = Awaited<ReturnType<typeof checkpointWorld>>;
const ONE = checkpointSubject('cp-1'), TWO = checkpointSubject('cp-2');
const ENDED = { refused: 'wait-ended', detail: 'The repair wait no longer holds for this stop: it ran out, the stop changed, or something stronger explains it.' };
const admitted = (w: World) => w.store.state.events.filter(event => event.kind === 'repair-resume-admitted');
/** The first fixture checkpoint bound to another route. */
const routed = (w: World, action: string, payload: Record<string, unknown> = { key: 'cp-1' }) => w.intent('cp-1', { binding: { ...w.binding('cp-1'), route: { action, payload, expectedStage: 'checkpoint' } } });

test('a due resume queues the native read-back once, binds it to the fix with the original run, and lifts the wait from that checkpoint alone, in one write', async () => {
    const w = await checkpointWorld(stores, dbs), before = JSON.stringify([w.checkpoints(), w.runs()]);
    expect(Object.keys(w.waits())).toEqual(['checkpoint/cp-1', 'checkpoint/cp-2']);
    const outcome = admitCheckpointResume(w.store, w.intent('cp-1'), later(5));
    expect(outcome).toMatchObject({ replayed: false, admitted: { action: 'reconcile-native-checkpoint', key: 'cp-1', head: '', lane: 'delivery', status: 'queued' } });
    const request = (outcome as { admitted: { id: string; repairResume: unknown } }).admitted;
    expect(request.repairResume).toEqual({ id: resumeIdentity(w.id, ONE, 'cli-bind-1'), incident: w.id, subject: ONE, digest: w.binding('cp-1').digest, fix: 'cli-bind-1', commit: FIX, action: 'reconcile-native-checkpoint',
        payload: createHash('sha256').update(canonical({ key: 'cp-1' })).digest('hex'), release: { commit: RELEASE, operation: OPERATION }, admittedAt: later(5).toISOString(),
        // How the checkpoint stood: the original run it was linked to, that run's one step, and the project event this admission emitted.
        stood: { steps: 1, stage: 'checkpoint', event: admitted(w)[0].id, run: 'original-1' } });
    // One request, one admission row, one admission event, and the queue's own event for it.
    expect(w.requests()).toHaveLength(1);
    expect(w.admissions()).toEqual([request.id]);
    expect(admitted(w).map(event => [event.message, event.ticket, event.role])).toEqual([[`cp-1: reconcile-native-checkpoint queued to resume after harness fix ${FIX.slice(0, 7)} (${w.id}).`, undefined, undefined]]);
    expect(w.store.state.events.filter(event => event.kind === 'operation-queued')).toHaveLength(1);
    expect(Object.keys(w.waits())).toEqual(['checkpoint/cp-2']);
    // Nothing of the checkpoint or its runs changed, its older repair field included: the handler acts when the scheduler runs the request.
    expect(JSON.stringify([w.checkpoints(), w.runs()])).toBe(before);
    expect(w.checkpoints()[0].repairResume).toBeUndefined();
    expect(w.store.state.it?.recoveries ?? {}).toEqual({});
    // All of it is in the saved state.
    const saved = w.savedState().coordination!;
    expect(saved.requests![0].repairResume).toEqual(request.repairResume);
    expect(Object.keys(saved.repairWaits!)).toEqual(['checkpoint/cp-2']);
    // The last marker goes with its map.
    expect(admitCheckpointResume(w.store, w.intent('cp-2'), later(5))).toMatchObject({ replayed: false, admitted: { key: 'cp-2', repairResume: { stood: { run: 'original-2' } } } });
    expect('repairWaits' in w.store.state.coordination!).toBe(false);
});

test('a resume already bound is returned, not repeated: whatever became of the request, after a restart, and with the wait long gone', async () => {
    const w = await checkpointWorld(stores, dbs, ['cp-1', 'cp-2'], { fixEvent: 'cookie:fix-526' });
    const first = admitCheckpointResume(w.store, w.intent('cp-1'), later(5)) as { admitted: { id: string } };
    w.reload();
    const request = w.requests()[0];
    // The redaction changed the event ID a person chose; the digest it is matched by did not.
    expect(request.repairResume!.fix).toBe('cookie:[redacted]');
    expect(boundResume(w.store.state, resumeIdentity(w.id, ONE, 'cookie:fix-526'))?.id).toBe(first.admitted.id);
    const saved = w.saved();
    for (const status of ['queued', 'working', 'blocked', 'interrupted', 'completed'] as const) {
        request.status = status;
        expect(admitCheckpointResume(w.store, w.intent('cp-1'), later(6 + 60 * HOUR)), status).toEqual({ admitted: request, replayed: true });
    }
    request.status = 'queued';
    expect(w.saved()).toBe(saved);
    expect(w.requests()).toHaveLength(1);
    expect(w.admissions()).toEqual([first.admitted.id]);
    // Another subject of the same fix is its own resume.
    expect(admitCheckpointResume(w.store, w.intent('cp-2'), later(6))).toMatchObject({ replayed: false });
});

test('nothing is admitted, and nothing is written, while the project is paused or draining', async () => {
    const w = await checkpointWorld(stores, dbs), saved = w.saved();
    w.store.state.paused = true;
    expect(admitCheckpointResume(w.store, w.intent('cp-1'), later(5))).toEqual({ refused: 'project-paused', detail: 'The project is paused.' });
    w.store.state.paused = false; w.store.state.draining = true;
    expect(admitCheckpointResume(w.store, w.intent('cp-1'), later(5))).toEqual({ refused: 'project-paused', detail: 'The project is draining.' });
    w.store.state.draining = false;
    expect(w.requests()).toEqual([]);
    expect(w.saved()).toBe(saved);
    expect(admitCheckpointResume(w.store, w.intent('cp-1'), later(5))).toMatchObject({ replayed: false });
});

test('only the native read-back, dispatched for a checkpoint, in Brain, is admitted here', async () => {
    const w = await checkpointWorld(stores, dbs), saved = w.saved();
    for (const action of ['retry-checkpoint', 'reconcile-maintenance', 'reconcile-review', 'resume-ticket', 'reconcile-everything', 'constructor'])
        expect(admitCheckpointResume(w.store, routed(w, action), later(5)), action).toEqual({ refused: 'not-dispatchable', detail: `This release does not dispatch ${action} for a checkpoint.` });
    // Even an inventory that dispatches the checkpoint retry does not send it this way.
    const wide: Record<string, ResumeRoute> = { ...RESUME_ROUTES, 'retry-checkpoint': { ...RESUME_ROUTES['retry-checkpoint'], dispatch: 'all' } };
    expect(admitCheckpointResume(w.store, routed(w, 'retry-checkpoint'), later(5), wide)).toMatchObject({ refused: 'not-dispatchable' });
    // The native read-back is only what the inventory says of it: a row that dispatches none, or that is for another kind of subject, is refused.
    for (const row of [{ ...RESUME_ROUTES['reconcile-native-checkpoint'], dispatch: 'none' }, { ...RESUME_ROUTES['reconcile-native-checkpoint'], subject: 'job' }] as ResumeRoute[])
        expect(admitCheckpointResume(w.store, w.intent('cp-1'), later(5), { ...RESUME_ROUTES, 'reconcile-native-checkpoint': row })).toEqual({ refused: 'not-dispatchable', detail: 'This release does not dispatch reconcile-native-checkpoint for a checkpoint.' });
    expect(w.requests()).toEqual([]);
    expect(w.saved()).toBe(saved);
    // Only Brain has a native gate.
    (w.store as { project: Store['project'] }).project = { ...w.store.project, id: 'cms-field-vocabulary' };
    expect(admitCheckpointResume(w.store, w.intent('cp-1'), later(5))).toEqual({ refused: 'not-dispatchable', detail: 'cms-field-vocabulary has no native checkpoint read-back; only Brain\'s checkpoints are resumed.' });
    expect(w.saved()).toBe(saved);
});

test('a subject that is not a checkpoint of this project, or whose key the route does not name, is refused', async () => {
    const w = await checkpointWorld(stores, dbs), saved = w.saved();
    const bound = (subject: string) => w.intent('cp-1', { binding: { ...w.binding('cp-1'), subject } });
    expect(admitCheckpointResume(w.store, bound('cms-field-vocabulary/checkpoint/cp-1'), later(5))).toEqual({ refused: 'no-record', detail: 'cms-field-vocabulary/checkpoint/cp-1 is not a checkpoint of brain.' });
    for (const subject of ['brain/maintenance/original-1', 'brain/delivery/cp-1', 'not-a-subject']) expect(admitCheckpointResume(w.store, bound(subject), later(5)), subject).toMatchObject({ refused: 'no-record' });
    expect(admitCheckpointResume(w.store, w.intent('cp-1', { binding: { ...w.binding('cp-1'), route: nativeRoute('cp-2') } }), later(5))).toEqual({ refused: 'key-mismatch', detail: 'The route names cp-2; the checkpoint is cp-1.' });
    expect(admitCheckpointResume(w.store, routed(w, 'reconcile-native-checkpoint', { key: ['cp-1'] }), later(5))).toEqual({ refused: 'key-mismatch', detail: 'The route key for checkpoint cp-1 must be a string.' });
    expect(w.requests()).toEqual([]);
    expect(w.admissions()).toEqual([]);
    expect(Object.keys(w.waits())).toEqual(['checkpoint/cp-1', 'checkpoint/cp-2']);
    expect(w.saved()).toBe(saved);
    expect(admitCheckpointResume(w.store, w.intent('cp-1'), later(5))).toMatchObject({ replayed: false, admitted: { key: 'cp-1' } });
});

test('nothing is admitted unless this incident\'s repair wait is in effect for that exact stop; a checkpoint that is gone has none', async () => {
    const cases: [string, (w: World) => Date | void][] = [
        ['no marker', w => { delete w.store.state.coordination!.repairWaits!['checkpoint/cp-1']; }],
        ['another incident\'s marker', w => { w.waits()['checkpoint/cp-1'].incident = 'inc-ffffffffffffffff'; }],
        ['a marker for another digest', w => { w.waits()['checkpoint/cp-1'].digest = 'e'.repeat(64); }],
        ['an expired wait', w => { w.waits()['checkpoint/cp-1'].expiredAt = later(4).toISOString(); }],
        ['a wait that ran out by the clock', () => later(4 + 49 * HOUR)],
        ['a stop that changed', w => { w.checkpoints()[0].endedAt = 'later-end'; }],
        ['a checkpoint queued again', w => { w.checkpoints()[0].status = 'queued'; }],
        ['a checkpoint that is gone', w => { w.checkpoints().shift(); }],
    ];
    for (const [name, change] of cases) {
        const w = await checkpointWorld(stores, dbs);
        const now = change(w) ?? later(5), saved = w.saved();
        expect(admitCheckpointResume(w.store, w.intent('cp-1'), now), name).toEqual(ENDED);
        expect(w.requests(), name).toEqual([]);
        expect(w.saved(), name).toBe(saved);
    }
});

test('a request queued or working for the checkpoint, of any action and head, holds the resume back; a finished one does not', async () => {
    for (const [action, head, status] of [['retry-checkpoint', '', 'queued'], ['reconcile-native-checkpoint', '', 'working'], ['reconcile-native-checkpoint', 'other-head', 'queued'], ['reconcile-pr-link', '', 'working']] as const) {
        const w = await checkpointWorld(stores, dbs), other = enqueueRequest(w.store, action, 'cp-1', head);
        other.status = status;
        w.store.save();
        const saved = w.saved();
        expect(admitCheckpointResume(w.store, w.intent('cp-1'), later(5)), action).toEqual({ refused: 'request-pending', detail: 'Another request for cp-1 is queued or working.' });
        expect(w.requests()).toEqual([other]);
        expect(w.saved()).toBe(saved);
        // A pending request for another checkpoint is no obstacle.
        expect(admitCheckpointResume(w.store, w.intent('cp-2'), later(5))).toMatchObject({ replayed: false, admitted: { key: 'cp-2' } });
    }
    for (const status of ['blocked', 'interrupted', 'completed'] as const) {
        const w = await checkpointWorld(stores, dbs), other = enqueueRequest(w.store, 'reconcile-native-checkpoint', 'cp-1');
        other.status = status;
        const outcome = admitCheckpointResume(w.store, w.intent('cp-1'), later(5)) as { admitted: { id: string } };
        expect(outcome, status).toMatchObject({ replayed: false });
        expect(outcome.admitted.id).not.toBe(other.id);
        expect(other.repairResume).toBeUndefined();
    }
});

test('a checkpoint that fails a repair admission check keeps its wait and is admitted once the condition clears', async () => {
    const cases: [string, (w: World) => () => void, string][] = [
        ['an unreconciled original', w => { w.run('cp-1').status = 'blocked'; return () => { w.run('cp-1').status = 'reconciled'; }; }, 'The run original-1 is blocked, not reconciled.'],
        ['a missing original', w => { const held = w.runs().splice(w.runs().indexOf(w.run('cp-1')), 1)[0]; return () => { w.runs().push(held); }; }, 'The project holds no run original-1 for the checkpoint.'],
        ['a run linked to another checkpoint', w => { w.run('cp-1').checkpointId = 'cp-9'; return () => { w.run('cp-1').checkpointId = 'cp-1'; }; }, 'The run original-1 is not linked back to this checkpoint.'],
        ['a blocker follow-up', w => { w.run('cp-1').blockerFollowup = { status: 'blocked', detail: 'source repair' }; return () => { delete w.run('cp-1').blockerFollowup; }; }, 'The run original-1 has a blocker follow-up.'],
        ['the older repair field', w => { w.checkpoints()[0].repairResume = { issue: 12, nextCheckAt: '', needsFollowup: false }; return () => { delete w.checkpoints()[0].repairResume; }; }, 'The checkpoint carries a refresh continuation\'s repair resume.'],
        ['a continuation', w => { w.checkpoints()[0].continuationId = 'cont-1'; return () => { delete w.checkpoints()[0].continuationId; }; }, 'The checkpoint has a continuation (cont-1).'],
        ['a read-back that did not pass', w => { const result = w.run('cp-1').steps[0].result; result.outcome = 'blocked'; return () => { result.outcome = 'passed'; }; }, 'The latest maintenance read-back of original-1 did not pass with every receipt verified and certain.'],
        ['a read-back with no receipt', w => { const result = w.run('cp-1').steps[0].result, held = result.receipts.splice(0); return () => { result.receipts.push(...held); }; }, 'The latest maintenance read-back of original-1 did not pass with every receipt verified and certain.'],
        ['an unverified receipt', w => { const receipt = w.run('cp-1').steps[0].result.receipts[0]; receipt.verified = false; return () => { receipt.verified = true; }; }, 'The latest maintenance read-back of original-1 did not pass with every receipt verified and certain.'],
        ['an uncertain receipt', w => { const receipt = w.run('cp-1').steps[0].result.receipts[0]; receipt.uncertain = true; return () => { receipt.uncertain = false; }; }, 'The latest maintenance read-back of original-1 did not pass with every receipt verified and certain.'],
        // The latest read-back decides: an earlier pass is not enough.
        ['a later read-back that failed', w => { const steps = w.run('cp-1').steps; steps.push({ ...structuredClone(steps[0]), result: { ...structuredClone(steps[0].result), outcome: 'blocked' } }); return () => { steps.pop(); }; }, 'The latest maintenance read-back of original-1 did not pass with every receipt verified and certain.'],
        ['a worker still running', w => { w.store.state.workLog = [{ id: 'w-1', requestId: 'original-1', status: 'running' } as never]; return () => { w.store.state.workLog = []; }; }, 'Work under the run original-1 is still running or stopping.'],
        ['a worker still stopping', w => { w.store.state.workLog = [{ id: 'w-1', requestId: 'original-1', status: 'stopping' } as never]; return () => { w.store.state.workLog = []; }; }, 'Work under the run original-1 is still running or stopping.'],
        ['two checkpoints sharing one run', w => { w.checkpoints().push(checkpoint('cp-3', { runId: 'original-1', status: 'completed' })); return () => { w.checkpoints().pop(); }; }, 'Another checkpoint (cp-3) points to the run original-1; a retry queued for that run could not be told apart.'],
    ];
    for (const [name, change, detail] of cases) {
        const w = await checkpointWorld(stores, dbs);
        const clear = change(w);
        w.store.save();
        const saved = w.saved();
        expect(admitCheckpointResume(w.store, w.intent('cp-1'), later(5)), name).toEqual({ refused: 'not-dispatchable', detail: `Checkpoint repair admission refused: ${detail}` });
        expect(w.requests(), name).toEqual([]);
        expect(w.admissions(), name).toEqual([]);
        expect(Object.keys(w.waits()), name).toEqual(['checkpoint/cp-1', 'checkpoint/cp-2']);
        expect(w.saved(), name).toBe(saved);
        // The refusal consumed nothing: once the condition clears, the same resume is admitted.
        clear();
        expect(admitCheckpointResume(w.store, w.intent('cp-1'), later(6)), name).toMatchObject({ replayed: false, admitted: { key: 'cp-1', repairResume: { stood: { run: 'original-1' } } } });
    }
    // Work under another run, and a run another checkpoint left behind, are no obstacle.
    const w = await checkpointWorld(stores, dbs);
    w.store.state.workLog = [{ id: 'w-2', requestId: 'original-2', status: 'running' } as never];
    w.checkpoints().push(checkpoint('cp-3', { runId: 'original-3', status: 'completed' }));
    expect(admitCheckpointResume(w.store, w.intent('cp-1'), later(5))).toMatchObject({ replayed: false });
});

test('the deadline counts every read from entry on: the wait lookup, the local checks, the queue and the admission\'s own writes', async () => {
    // Milliseconds each takes, with 10 left on the wait at entry: the Effects lookup behind the wait check, the queue stamping its request, the admission event.
    for (const [name, lookup, queue, event, outcome] of [
        ['the lookup crosses it', 10, 0, 0, ENDED], ['the lookup comes short of it', 9, 0, 0, { replayed: false }],
        ['the queue crosses it', 4, 6, 0, ENDED], ['the admission event crosses it', 0, 0, 10, ENDED], ['all three together cross it', 3, 3, 4, ENDED],
        ['all three stay short of it', 3, 3, 3, { replayed: false, admitted: { action: 'reconcile-native-checkpoint', key: 'cp-1' } }],
    ] as const) {
        const w = await checkpointWorld(stores, dbs), saved = w.saved(), clock = w.store.clock, prepare = w.store.db.prepare.bind(w.store.db), emit = w.store.emit.bind(w.store);
        const deadline = new Date(Date.parse(w.waits()['checkpoint/cp-1'].progressAt) + REPAIR_WAIT_MS);
        let elapsed = 40, stamped = false;
        w.store.clock = { now: () => { if (!stamped) { stamped = true; elapsed += queue; } return clock.now(); }, monotonic: () => elapsed };
        w.store.db.prepare = ((sql: string) => { if (/FROM effects/.test(sql)) elapsed += lookup; return prepare(sql); }) as typeof w.store.db.prepare;
        w.store.emit = ((kind: string, ...rest: unknown[]) => { if (kind === 'repair-resume-admitted') elapsed += event; return (emit as (...args: unknown[]) => unknown)(kind, ...rest); }) as typeof w.store.emit;
        const result = admitCheckpointResume(w.store, w.intent('cp-1'), new Date(deadline.getTime() - 10));
        w.store.clock = clock; w.store.db.prepare = prepare; w.store.emit = emit;
        expect(result, name).toMatchObject(outcome);
        if ('refused' in outcome) {
            // Memory, disk, the journal and the events are as they were.
            expect(w.requests(), name).toEqual([]);
            expect(w.admissions(), name).toEqual([]);
            expect(admitted(w), name).toEqual([]);
            // A rolled-back transaction restores the markers in place, not in their order.
            expect(Object.keys(w.waits()).sort(), name).toEqual(['checkpoint/cp-1', 'checkpoint/cp-2']);
            expect(w.saved(), name).toBe(saved);
        } else {
            expect(w.requests(), name).toHaveLength(1);
            expect(w.admissions(), name).toHaveLength(1);
            expect(Object.keys(w.waits()), name).toEqual(['checkpoint/cp-2']);
        }
    }
});

test('expiry during the Effects lookup takes precedence over admission faults and preserves saved state', async () => {
    const cases: [string, (w: World) => ReturnType<World['intent']>][] = [
        ['key-mismatch', w => routed(w, 'reconcile-native-checkpoint', { key: 'cp-2' })],
        ['request-pending', w => { enqueueRequest(w.store, 'retry-checkpoint', 'cp-1'); return w.intent('cp-1'); }],
        ['not-dispatchable', w => { w.run('cp-1').status = 'blocked'; return w.intent('cp-1'); }],
    ];
    for (const [fault, setup] of cases) {
        const w = await checkpointWorld(stores, dbs), intent = setup(w);
        w.store.save();
        const saved = w.saved(), clock = w.store.clock, prepare = w.store.db.prepare.bind(w.store.db);
        const now = new Date(Date.parse(w.waits()['checkpoint/cp-1'].progressAt) + REPAIR_WAIT_MS - 10);
        for (const lookup of [9, 10]) {
            let elapsed = 0;
            w.store.clock = { now: clock.now, monotonic: () => elapsed };
            w.store.db.prepare = ((sql: string) => { if (/FROM effects/.test(sql)) elapsed += lookup; return prepare(sql); }) as typeof w.store.db.prepare;
            const result = admitCheckpointResume(w.store, intent, now);
            w.store.clock = clock; w.store.db.prepare = prepare;
            expect(result, `${fault} after ${lookup} ms`).toMatchObject(lookup === 10 ? ENDED : { refused: fault });
            expect(w.saved()).toBe(saved);
        }
    }
});

test('expiry during the local checks takes precedence over the fault they find and preserves saved state', async () => {
    for (const checks of [9, 10]) {
        const w = await checkpointWorld(stores, dbs);
        w.run('cp-1').status = 'blocked';
        w.store.save();
        const saved = w.saved(), clock = w.store.clock, real = eligibility.checkpointEligibility;
        const now = new Date(Date.parse(w.waits()['checkpoint/cp-1'].progressAt) + REPAIR_WAIT_MS - 10);
        let elapsed = 0;
        w.store.clock = { now: clock.now, monotonic: () => elapsed };
        // The last minute of the wait passes while the local checks read the checkpoint and its run.
        const spy = vi.spyOn(eligibility, 'checkpointEligibility').mockImplementation((...args) => { elapsed += checks; return real(...args); });
        const result = admitCheckpointResume(w.store, w.intent('cp-1'), now);
        spy.mockRestore(); w.store.clock = clock;
        expect(result, `checks taking ${checks} ms`).toMatchObject(checks === 10 ? ENDED : { refused: 'not-dispatchable' });
        expect(w.saved()).toBe(saved);
    }
});

test('an admission that fails part-way leaves no request, no admission row, no event and the wait in place', async () => {
    const w = await checkpointWorld(stores, dbs), saved = w.saved(), events = JSON.stringify(w.store.state.events), emit = w.store.emit.bind(w.store);
    w.store.emit = ((kind: string, ...rest: unknown[]) => { if (kind === 'repair-resume-admitted') throw new Error('disk full'); return (emit as (...args: unknown[]) => unknown)(kind, ...rest); }) as typeof w.store.emit;
    expect(() => admitCheckpointResume(w.store, w.intent('cp-1'), later(5))).toThrow('disk full');
    w.store.emit = emit;
    expect(w.requests()).toEqual([]);
    expect(w.admissions()).toEqual([]);
    expect(JSON.stringify(w.store.state.events)).toBe(events);
    expect(Object.keys(w.waits()).sort()).toEqual(['checkpoint/cp-1', 'checkpoint/cp-2']);
    expect(w.waits()['checkpoint/cp-1']).toMatchObject({ incident: w.id, subject: ONE });
    expect(w.saved()).toBe(saved);
    expect(admitCheckpointResume(w.store, w.intent('cp-1'), later(5))).toMatchObject({ replayed: false });
});

test('an admission whose ledger record was never written is recorded from the request on the next pass, and nothing is queued again', async () => {
    const w = await checkpointWorld(stores, dbs);
    // Admitted in the project, as a pass that stopped before its ledger write leaves it.
    const first = admitCheckpointResume(w.store, w.intent('cp-1'), later(5)) as { admitted: { id: string; repairResume: { payload: string } } };
    expect(w.ledger.events(w.id).filter(event => event.kind === 'resume-admitted')).toEqual([]);
    const pass = (minutes: number) => dispatchResumes({ ledger: w.ledger, entries: [{ store: w.store }], control: { read: () => ENABLED }, running: () => ({ commit: RELEASE, operation: OPERATION }), now: () => later(minutes), fenced: () => false, report: message => { throw new Error(message); } });
    expect(pass(6)).toEqual({ admitted: [ONE, TWO], refused: [], held: [] });
    expect(w.ledger.events(w.id).filter(event => event.kind === 'resume-admitted').map(event => [event.at, event.body.subject, event.body.request])).toEqual([[later(5).toISOString(), ONE, first.admitted.id], [later(6).toISOString(), TWO, w.requests()[1].id]]);
    expect(w.requests().map(request => request.key)).toEqual(['cp-1', 'cp-2']);
    expect(w.admissions()).toHaveLength(2);
    for (const minutes of [7, 8]) expect(pass(minutes)).toEqual({ admitted: [], refused: [], held: [] });
    expect(w.requests()).toHaveLength(2);
});
