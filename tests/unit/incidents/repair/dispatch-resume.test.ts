import { afterEach, expect, test } from 'vitest';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { canonical } from '../../../../server/incidents/canonical-json';
import { admitResume } from '../../../../server/incidents/repair/dispatch-resume';
import { REPAIR_WAIT_MS } from '../../../../server/incidents/repair/repair-wait';
import { boundResume, resumeIdentity } from '../../../../server/incidents/repair/resume-binding';
import { RESUME_ROUTES, type ResumeRoute } from '../../../../server/incidents/repair/resume-routes';
import { routeHeadFault } from '../../../../server/incidents/repair/route-head';
import { HOLDS } from '../../../../server/office/config';
import { enqueueRequest } from '../../../../server/scheduling/requests';
import type { Store } from '../../../../server/store/store';
import { HOUR, later } from './repair-wait-fixture';
import { markAwaitingRepair } from './mark-fixture';
import { deployedWorld, FIX, OPERATION, RELEASE, reviewRoute } from './resume-fixture';
import { rules, run } from './route-head-fixture';

const stores: Store[] = [], dbs: DatabaseSync[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); dbs.splice(0).forEach(db => db.close()); delete HOLDS['GH-1']; });
const ONE = 'cms-field-vocabulary/delivery/1';
const READ_BACK = ['reconcile-implementation', 'reconcile-validation', 'reconcile-scope-repair', 'reconcile-preparation', 'reconcile-base-update', 'reconcile-closeout', 'reconcile-review'];
type World = Awaited<ReturnType<typeof deployedWorld>>;
/** The fixture's first job bound to another route. Its stage stays `review`: what a handler reads at which stage is route-head.ts's to say, and is tested there. */
const routed = (w: World, action: string, head?: string) => w.intent('1', { binding: { ...w.binding('1'), route: { action, payload: head === undefined ? { key: 'GH-1' } : { key: 'GH-1', head }, expectedStage: 'review' } } });
const taken: typeof routeHeadFault = () => null;

test('a due resume queues the bound request once, binds it to the fix and lifts the wait from that stop alone, in one write', async () => {
    const w = await deployedWorld(stores, dbs), job = JSON.stringify(w.jobs()[0]);
    expect(Object.keys(w.waits())).toEqual(['delivery/1', 'delivery/2']);
    const outcome = admitResume(w.store, w.intent('1'), later(5));
    expect(outcome).toMatchObject({ replayed: false, admitted: { action: 'reconcile-review', key: 'GH-1', head: '', lane: 'delivery', status: 'queued' } });
    const request = (outcome as { admitted: { id: string; repairResume: unknown } }).admitted;
    expect(request.repairResume).toEqual({ id: resumeIdentity(w.id, ONE, 'cli-bind-1'), incident: w.id, subject: ONE, digest: w.binding('1').digest, fix: 'cli-bind-1', commit: FIX, action: 'reconcile-review',
        payload: createHash('sha256').update(canonical({ key: 'GH-1' })).digest('hex'), release: { commit: RELEASE, operation: OPERATION }, admittedAt: later(5).toISOString(),
        // How the job stood, for its outcome to be judged against: its one step, its stage, and the project event this admission emitted.
        stood: { steps: 1, stage: 'review', event: w.store.state.events.find(event => event.kind === 'repair-resume-admitted')!.id } });
    expect(w.requests()).toHaveLength(1);
    expect(w.admissions()).toEqual([request.id]);
    expect(Object.keys(w.waits())).toEqual(['delivery/2']);
    // No counter, attempt or status of the job changed: the handler does that when the scheduler runs the request.
    expect(JSON.stringify(w.jobs()[0])).toBe(job);
    expect(w.store.state.it?.recoveries ?? {}).toEqual({});
    // All of it is in the saved state.
    const saved = JSON.parse(JSON.parse(w.saved()).body);
    expect(saved.coordination.requests[0].repairResume.fix).toBe('cli-bind-1');
    expect(saved.coordination.requests[0].repairResume.stood).toEqual((request.repairResume as { stood: unknown }).stood);
    expect(Object.keys(saved.coordination.repairWaits)).toEqual(['delivery/2']);
    // The last marker goes with its map.
    admitResume(w.store, w.intent('2'), later(5));
    expect('repairWaits' in w.store.state.coordination!).toBe(false);
});

test('a resume already bound is returned, not repeated: whatever became of the request, and whether or not the wait still stands', async () => {
    const w = await deployedWorld(stores, dbs), first = admitResume(w.store, w.intent('1'), later(5)) as { admitted: { id: string; status: string } };
    const saved = w.saved();
    for (const status of ['queued', 'working', 'blocked', 'interrupted', 'completed']) {
        first.admitted.status = status;
        const again = admitResume(w.store, w.intent('1'), later(6 + 60 * HOUR));
        expect(again, status).toEqual({ admitted: first.admitted, replayed: true });
        expect(w.requests()).toHaveLength(1);
    }
    first.admitted.status = 'queued';
    expect(w.saved()).toBe(saved);
    expect(w.admissions()).toHaveLength(1);
    // Another fix of the same incident, another subject and another incident are each their own resume.
    expect(boundResume(w.store.state, resumeIdentity(w.id, ONE, 'cli-bind-1'))).toBe(first.admitted);
    for (const [incident, subject, fix] of [[w.id, ONE, 'cli-bind-2'], [w.id, w.subject('2'), 'cli-bind-1'], ['inc-ffffffffffffffff', ONE, 'cli-bind-1']])
        expect(boundResume(w.store.state, resumeIdentity(incident, subject, fix))).toBeUndefined();
    // The three parts are told apart however they are split.
    expect(new Set([resumeIdentity('a', 'b/c', 'd'), resumeIdentity('a/b', 'c', 'd'), resumeIdentity('a', 'b', 'c/d'), resumeIdentity('a', 'b/c', 'd')]).size).toBe(3);
});

test('nothing is admitted, and nothing is written, while the project is paused or draining', async () => {
    const w = await deployedWorld(stores, dbs), saved = w.saved();
    w.store.state.paused = true;
    expect(admitResume(w.store, w.intent('1'), later(5))).toEqual({ refused: 'project-paused', detail: 'The project is paused.' });
    w.store.state.paused = false; w.store.state.draining = true;
    expect(admitResume(w.store, w.intent('1'), later(5))).toEqual({ refused: 'project-paused', detail: 'The project is draining.' });
    w.store.state.draining = false;
    expect(w.requests()).toEqual([]);
    expect(w.saved()).toBe(saved);
    // The refusal consumed nothing: the same resume is admitted once the project runs again.
    expect(admitResume(w.store, w.intent('1'), later(5))).toMatchObject({ replayed: false });
});

test('only a route this release dispatches, in the form it dispatches, for a delivery job, is admitted', async () => {
    const w = await deployedWorld(stores, dbs), saved = w.saved();
    const routed = (route: ReturnType<typeof reviewRoute>) => w.intent('1', { binding: { ...w.binding('1'), route } });
    // The handler's rule is not reached for a route that is not dispatched.
    const unasked: typeof routeHeadFault = () => { throw new Error('not to be asked'); };
    for (const action of ['review-pr', 'review-candidate', 'requeue-implement', 'resume-ticket', 'reconcile-maintenance', 'reconcile-everything', 'constructor'])
        expect(admitResume(w.store, routed(reviewRoute('1', { action })), later(5), RESUME_ROUTES, unasked), action).toEqual({ refused: 'not-dispatchable', detail: `This release does not dispatch ${action}.` });
    // The form is the inventory's to say: a row that dispatches only its saved result is refused with a head.
    const narrow: Record<string, ResumeRoute> = { ...RESUME_ROUTES, 'reconcile-review': { ...RESUME_ROUTES['reconcile-review'], dispatch: 'saved-result' } };
    expect(admitResume(w.store, routed(reviewRoute('1', { payload: { key: 'GH-1', head: 'worker-1' } })), later(5), narrow, unasked)).toEqual({ refused: 'not-dispatchable', detail: 'This release does not dispatch reconcile-review with a head.' });
    // A route for another kind of subject is not this engine's, even where an inventory would dispatch it.
    const wide: Record<string, ResumeRoute> = { ...RESUME_ROUTES, 'resume-ticket': { ...RESUME_ROUTES['resume-ticket'], dispatch: 'all' }, 'retry-checkpoint': { ...RESUME_ROUTES['retry-checkpoint'], dispatch: 'all' } };
    for (const action of ['resume-ticket', 'retry-checkpoint']) expect(admitResume(w.store, routed(reviewRoute('1', { action })), later(5), wide)).toMatchObject({ refused: 'not-dispatchable' });
    expect(w.requests()).toEqual([]);
    expect(w.saved()).toBe(saved);
    // An empty head is the saved-result form.
    expect(admitResume(w.store, routed(reviewRoute('1', { payload: { key: 'GH-1', head: '' } })), later(5))).toMatchObject({ replayed: false, admitted: { head: '' } });
});

test('nothing is admitted unless this incident\'s repair wait is in effect for that exact stop', async () => {
    const ended = { refused: 'wait-ended', detail: 'The repair wait no longer holds for this stop: it ran out, the stop changed, or something stronger explains it.' };
    const cases: [string, (w: Awaited<ReturnType<typeof deployedWorld>>) => Date | void][] = [
        ['no marker', w => { delete w.store.state.coordination!.repairWaits!['delivery/1']; }],
        ['another incident\'s marker', w => { w.waits()['delivery/1'].incident = 'inc-ffffffffffffffff'; }],
        ['a marker for another digest', w => { w.waits()['delivery/1'].digest = 'e'.repeat(64); }],
        ['an expired wait', w => { w.waits()['delivery/1'].expiredAt = later(4).toISOString(); }],
        ['a wait that ran out by the clock', () => later(4 * HOUR + 49 * HOUR)],
        ['a stop that changed', w => { w.jobs()[0].stop = { kind: 'unclassified', at: 't2' }; }],
        ['a job that runs again', w => { w.jobs()[0].status = 'queued'; }],
        ['a configured hold', () => { HOLDS['GH-1'] = 'Joe is looking'; }],
        // The stop stands exactly as marked; something stronger explains it.
        ['a merge approval that is a person\'s', w => { w.jobs()[0].mergeApprovalRequired = true; }],
    ];
    for (const [name, change] of cases) {
        const w = await deployedWorld(stores, dbs);
        const now = change(w) ?? later(5), saved = w.saved();
        expect(admitResume(w.store, w.intent('1'), now), name).toEqual(ended);
        expect(w.requests(), name).toEqual([]);
        expect(w.saved(), name).toBe(saved);
        delete HOLDS['GH-1'];
    }
});

test('a subject that is not a delivery job of this project, or whose key the route does not name, is refused', async () => {
    const w = await deployedWorld(stores, dbs), saved = w.saved();
    const bound = (subject: string) => w.intent('1', { binding: { ...w.binding('1'), subject } });
    expect(admitResume(w.store, bound('brain/delivery/1'), later(5))).toEqual({ refused: 'no-record', detail: 'brain/delivery/1 is not delivery work of cms-field-vocabulary.' });
    expect(admitResume(w.store, bound('cms-field-vocabulary/intake/1'), later(5))).toMatchObject({ refused: 'no-record' });
    expect(admitResume(w.store, bound('not-a-subject'), later(5))).toMatchObject({ refused: 'no-record' });
    expect(admitResume(w.store, w.intent('1', { binding: { ...w.binding('1'), route: reviewRoute('9') } }), later(5))).toEqual({ refused: 'key-mismatch', detail: 'The route names GH-9; the job is GH-1.' });
    // A stopped delivery request shares the subject kind, and can be waited for, but is no job.
    w.store.state.deliveryQueue = [{ id: 'dq-1', key: 'CEC-1', action: 'resume-ticket', requestedAt: later(0).toISOString(), status: 'blocked', error: 'worktree is missing' }];
    const marker = markAwaitingRepair(w.store.state, 'cms-field-vocabulary', { kind: 'delivery', id: 'dq-1' }, 'resume-ticket', { incident: w.id, digest: w.binding('1').digest });
    expect(marker.subject).toBe('cms-field-vocabulary/delivery/dq-1');
    const before = w.saved();
    expect(admitResume(w.store, bound('cms-field-vocabulary/delivery/dq-1'), later(5))).toEqual({ refused: 'no-record', detail: 'cms-field-vocabulary/delivery/dq-1 has no delivery job.' });
    expect(w.requests()).toEqual([]);
    expect(w.saved()).toBe(before);
    expect(before).toBe(saved);
});

test('a request already queued or working for the job\'s key holds the resume back; a finished one does not', async () => {
    for (const status of ['queued', 'working'] as const) {
        const w = await deployedWorld(stores, dbs), other = enqueueRequest(w.store, 'reconcile-pr-link', 'GH-1');
        other.status = status;
        w.store.save();
        const saved = w.saved();
        expect(admitResume(w.store, w.intent('1'), later(5)), status).toEqual({ refused: 'request-pending', detail: 'Another request for GH-1 is queued or working.' });
        expect(w.requests()).toEqual([other]);
        expect(w.saved()).toBe(saved);
        // A pending request for another ticket is no obstacle.
        expect(admitResume(w.store, w.intent('2'), later(5))).toMatchObject({ replayed: false, admitted: { key: 'GH-2' } });
    }
    for (const status of ['blocked', 'interrupted', 'completed'] as const) {
        const w = await deployedWorld(stores, dbs), other = enqueueRequest(w.store, 'reconcile-review', 'GH-1');
        other.status = status;
        const outcome = admitResume(w.store, w.intent('1'), later(5)) as { admitted: { id: string } };
        expect(outcome, status).toMatchObject({ replayed: false });
        expect(outcome.admitted.id).not.toBe(other.id);
        expect(other.repairResume).toBeUndefined();
    }
});

test('an identical request that completed earlier and still answers for itself is not taken for a resume, on each route the queue answers that way', async () => {
    // The queue's own rule (`enqueueRequest`): a completed request answers for these, and for no others.
    const answered: [string, string, (job: Record<string, unknown>) => void][] = [
        ['reconcile-validation', 'worker-1', () => {}], ['reconcile-validation', '', () => {}],
        ['reconcile-implementation', 'worker-1', job => { job.savedPrerequisiteHandoff = { originalWorkId: 'worker-1' }; }],
        ['reconcile-preparation', 'worker-1', () => {}], ['reconcile-scope-repair', 'worker-1', () => {}], ['reconcile-closeout', 'worker-1', () => {}],
    ];
    for (const [action, head, change] of answered) {
        const w = await deployedWorld(stores, dbs), earlier = enqueueRequest(w.store, action, 'GH-1', head);
        earlier.status = 'completed';
        change(w.jobs()[0] as unknown as Record<string, unknown>);
        w.store.save();
        const saved = w.saved();
        // Not even the unchanged state is written: the transaction the queue answered in is undone.
        const save = w.store.save.bind(w.store);
        let saves = 0;
        w.store.save = () => { saves++; save(); };
        expect(admitResume(w.store, routed(w, action, head), later(5), RESUME_ROUTES, taken), `${action} ${head}`).toEqual({ refused: 'already-reconciled', detail: `${action} for GH-1 completed earlier and was not queued again.` });
        w.store.save = save;
        expect(saves, action).toBe(0);
        expect(w.requests(), action).toEqual([earlier]);
        expect(earlier.repairResume, action).toBeUndefined();
        expect(Object.keys(w.waits()), action).toEqual(['delivery/1', 'delivery/2']);
        expect(w.saved(), action).toBe(saved);
    }
    // Elsewhere a completed request is history: the resume is its own new request.
    const fresh: [string, string, (job: Record<string, unknown>) => void][] = [
        ['reconcile-implementation', 'worker-1', () => {}], ['reconcile-implementation', 'worker-1', job => { job.savedPrerequisiteHandoff = { originalWorkId: 'worker-2' }; }],
        ['reconcile-preparation', '', () => {}], ['reconcile-scope-repair', '', () => {}], ['reconcile-closeout', '', () => {}],
        ['reconcile-closeout', 'worker-1', job => { job.closeoutRecovery = { status: 'cleanup-pending', originalWorkId: 'worker-1' }; }],
        ['reconcile-base-update', 'worker-1', () => {}], ['reconcile-base-update', '', () => {}], ['reconcile-review', 'worker-1', () => {}], ['reconcile-review', '', () => {}],
    ];
    for (const [action, head, change] of fresh) {
        const w = await deployedWorld(stores, dbs), earlier = enqueueRequest(w.store, action, 'GH-1', head);
        earlier.status = 'completed';
        change(w.jobs()[0] as unknown as Record<string, unknown>);
        const outcome = admitResume(w.store, routed(w, action, head), later(5), RESUME_ROUTES, taken) as { admitted: { id: string; repairResume: unknown } };
        expect(outcome, `${action} ${head}`).toMatchObject({ replayed: false, admitted: { action, key: 'GH-1', head } });
        expect(outcome.admitted.id, action).not.toBe(earlier.id);
        expect(earlier.repairResume, action).toBeUndefined();
    }
});

test('an admission that fails part-way leaves no request, no admission row and the wait in place', async () => {
    const w = await deployedWorld(stores, dbs), saved = w.saved(), emit = w.store.emit.bind(w.store);
    w.store.emit = ((kind: string, ...rest: unknown[]) => { if (kind === 'repair-resume-admitted') throw new Error('disk full'); return (emit as (...args: unknown[]) => unknown)(kind, ...rest); }) as typeof w.store.emit;
    expect(() => admitResume(w.store, w.intent('1'), later(5))).toThrow('disk full');
    w.store.emit = emit;
    expect(w.requests()).toEqual([]);
    expect(w.admissions()).toEqual([]);
    expect(Object.keys(w.waits()).sort()).toEqual(['delivery/1', 'delivery/2']);
    expect(w.waits()['delivery/1']).toMatchObject({ incident: w.id, subject: ONE });
    expect(w.saved()).toBe(saved);
    expect(admitResume(w.store, w.intent('1'), later(5))).toMatchObject({ replayed: false });
});

test('a resume is still the same resume after a restart, when the redaction of saved text has changed the event ID a person chose', async () => {
    // Both IDs are valid event IDs, and both are saved as `cookie:[redacted]`.
    const w = await deployedWorld(stores, dbs, ['1', '2'], undefined, { fixEvent: 'cookie:fix-421' });
    const first = admitResume(w.store, w.intent('1'), later(5)) as { admitted: { id: string } };
    w.reload();
    const saved = w.requests()[0].repairResume!;
    expect(saved.fix).toBe('cookie:[redacted]');
    expect(saved.id).toBe(resumeIdentity(w.id, ONE, 'cookie:fix-421'));
    expect(boundResume(w.store.state, resumeIdentity(w.id, ONE, 'cookie:fix-421'))?.id).toBe(first.admitted.id);
    expect(boundResume(w.store.state, resumeIdentity(w.id, ONE, 'cookie:fix-999'))).toBeUndefined();
    // The same intent again, after the request finished and with the wait long gone: returned, not queued.
    w.requests()[0].status = 'completed';
    expect(admitResume(w.store, w.intent('1'), later(6))).toMatchObject({ replayed: true, admitted: { id: first.admitted.id } });
    expect(w.requests()).toHaveLength(1);
    expect(w.admissions()).toEqual([first.admitted.id]);
});

test('each read-back route is queued with the action, key and head its fix bound, once its handler would take that head', async () => {
    for (const action of READ_BACK) for (const head of ['worker-1', '', undefined]) {
        const w = await deployedWorld(stores, dbs), asked: unknown[][] = [];
        const outcome = admitResume(w.store, routed(w, action, head), later(5), RESUME_ROUTES, (...args) => { asked.push(args); return null; });
        expect(outcome, `${action} ${head}`).toMatchObject({ replayed: false, admitted: { action, key: 'GH-1', head: head ?? '', lane: 'delivery', status: 'queued', repairResume: { action, subject: ONE, fix: 'cli-bind-1' } } });
        // The rule is asked once, of this project's own job, for exactly what will be queued.
        expect(asked, `${action} ${head}`).toEqual([[w.store, w.jobs()[0], action, head ?? '']]);
        expect(asked[0][1]).toBe(w.jobs()[0]);
        expect(w.requests()).toHaveLength(1);
        expect(Object.keys(w.waits())).toEqual(['delivery/2']);
    }
});

test('a head the handler would not take is refused with nothing written, and the same resume is admitted once the handler would take it', async () => {
    for (const action of READ_BACK) {
        const w = await deployedWorld(stores, dbs), saved = w.saved();
        let fault: string | null = `${action} reads worker-2; the route names worker-1.`;
        const outcome = () => admitResume(w.store, routed(w, action, 'worker-1'), later(5), RESUME_ROUTES, () => fault);
        expect(outcome(), action).toEqual({ refused: 'head-mismatch', detail: `${action} reads worker-2; the route names worker-1.` });
        expect(w.requests(), action).toEqual([]);
        expect(w.admissions(), action).toEqual([]);
        expect(Object.keys(w.waits()), action).toEqual(['delivery/1', 'delivery/2']);
        expect(w.saved(), action).toBe(saved);
        // The refusal consumed nothing.
        fault = null;
        expect(outcome(), action).toMatchObject({ replayed: false, admitted: { action, head: 'worker-1' } });
    }
});

test('by default the head is put to the handlers\' own rules, and the rules a caller gives are the ones asked', async () => {
    // The fixture's job holds no evidence of any original run, so the handlers' own rules name none.
    const w = await deployedWorld(stores, dbs), saved = w.saved();
    expect(admitResume(w.store, routed(w, 'reconcile-review', 'worker-1'), later(5))).toEqual({ refused: 'head-mismatch', detail: 'reconcile-review for GH-1 reads its saved result, with no head; the route names worker-1.' });
    expect(admitResume(w.store, routed(w, 'reconcile-validation', 'worker-1'), later(5))).toEqual({ refused: 'head-mismatch', detail: 'reconcile-validation has nothing to read for GH-1 under worker-1 as the job stands.' });
    expect(admitResume(w.store, routed(w, 'reconcile-closeout'), later(5))).toEqual({ refused: 'head-mismatch', detail: 'reconcile-closeout has nothing to read for GH-1 without a head as the job stands.' });
    expect(w.saved()).toBe(saved);
    // With the rule that names the run, the same route is admitted; another job of the same key stops it.
    const named = (...args: Parameters<typeof routeHeadFault>) => routeHeadFault(args[0], args[1], args[2], args[3], rules({ validation: () => run('worker-1') }));
    w.jobs().push({ ...w.jobs()[0], id: 'twin', status: 'queued' });
    expect(admitResume(w.store, routed(w, 'reconcile-validation', 'worker-1'), later(5), RESUME_ROUTES, named)).toEqual({ refused: 'head-mismatch', detail: 'GH-1 has another job that is not cancelled; reconcile-validation finds its job by key.' });
    w.jobs().pop();
    expect(admitResume(w.store, routed(w, 'reconcile-validation', 'worker-2'), later(5), RESUME_ROUTES, named)).toEqual({ refused: 'head-mismatch', detail: 'reconcile-validation for GH-1 reads worker-1; the route names worker-2.' });
    expect(admitResume(w.store, routed(w, 'reconcile-validation', 'worker-1'), later(5), RESUME_ROUTES, named)).toMatchObject({ replayed: false, admitted: { action: 'reconcile-validation', head: 'worker-1' } });
});

test('the handler\'s rule is asked last: not for a resume already bound, a paused project, a wait that ended, another key, or while a request is pending', async () => {
    const unasked: typeof routeHeadFault = () => { throw new Error('not to be asked'); };
    const cases: [string, (w: World) => void, string][] = [
        ['paused', w => { w.store.state.paused = true; }, 'project-paused'],
        ['wait ended', w => { w.waits()['delivery/1'].expiredAt = later(4).toISOString(); }, 'wait-ended'],
        ['pending', w => { enqueueRequest(w.store, 'reconcile-pr-link', 'GH-1'); }, 'request-pending'],
    ];
    for (const [name, change, code] of cases) {
        const w = await deployedWorld(stores, dbs);
        change(w);
        expect(admitResume(w.store, routed(w, 'reconcile-validation', 'worker-1'), later(5), RESUME_ROUTES, unasked), name).toMatchObject({ refused: code });
    }
    const w = await deployedWorld(stores, dbs);
    expect(admitResume(w.store, w.intent('1', { binding: { ...w.binding('1'), route: { action: 'reconcile-validation', payload: { key: 'GH-9', head: 'worker-1' }, expectedStage: 'review' } } }), later(5), RESUME_ROUTES, unasked)).toMatchObject({ refused: 'key-mismatch' });
    const first = admitResume(w.store, routed(w, 'reconcile-validation', 'worker-1'), later(5), RESUME_ROUTES, taken) as { admitted: { id: string } };
    expect(admitResume(w.store, routed(w, 'reconcile-validation', 'worker-1'), later(6), RESUME_ROUTES, unasked)).toEqual({ admitted: first.admitted, replayed: true });
});

test('a wait that runs out while the handler\'s rule reads is over: nothing is queued, whatever the rule said', async () => {
    const ended = { refused: 'wait-ended', detail: 'The repair wait no longer holds for this stop: it ran out, the stop changed, or something stronger explains it.' };
    const second = 1000;
    for (const [name, took, fault, outcome] of [
        ['read past the deadline', 5 * second, null, ended], ['read to the deadline', 2 * second, null, ended], ['read past it and refused', 5 * second, 'another run', ended],
        ['read short of it', 1 * second, null, { replayed: false, admitted: { action: 'reconcile-validation', head: 'worker-1' } }],
        ['read short of it and refused', 1 * second, 'another run', { refused: 'head-mismatch', detail: 'another run' }],
        // A clock that steps back takes nothing off the time already read.
        ['a clock that stepped back', -60 * second, null, { replayed: false }],
    ] as const) {
        const w = await deployedWorld(stores, dbs), saved = w.saved(), clock = w.store.clock;
        // The wait runs out 48 hours after the last progress its marker holds.
        const deadline = new Date(Date.parse(w.waits()['delivery/1'].progressAt) + REPAIR_WAIT_MS);
        let elapsed = 700;
        w.store.clock = { now: clock.now, monotonic: () => elapsed };
        const reads: typeof routeHeadFault = () => { elapsed += took; return fault; };
        const result = admitResume(w.store, routed(w, 'reconcile-validation', 'worker-1'), new Date(deadline.getTime() - 2 * second), RESUME_ROUTES, reads);
        w.store.clock = clock;
        expect(result, name).toMatchObject(outcome);
        if ('refused' in outcome) {
            expect(w.requests(), name).toEqual([]);
            expect(w.admissions(), name).toEqual([]);
            expect(Object.keys(w.waits()), name).toEqual(['delivery/1', 'delivery/2']);
            expect(w.saved(), name).toBe(saved);
        } else expect(w.requests(), name).toHaveLength(1);
    }
});

test('a run an earlier request already reconciled is one its handler no longer reads: the refusal is head-mismatch, ahead of the queue\'s own answer', async () => {
    // The queue would answer each of these with its completed request (see the test above). The handlers' own rules come first, and name no such run.
    const reconciled: [string, (job: Record<string, unknown>) => void][] = [
        ['reconcile-implementation', job => { job.savedPrerequisiteHandoff = { originalWorkId: 'worker-1' }; }],
        ['reconcile-scope-repair', job => { job.scopeRepairResumes = [{ originalWorkId: 'worker-1' }]; }],
        ['reconcile-validation', () => {}], ['reconcile-preparation', () => {}], ['reconcile-closeout', () => {}],
    ];
    for (const [action, change] of reconciled) {
        const w = await deployedWorld(stores, dbs), earlier = enqueueRequest(w.store, action, 'GH-1', 'worker-1');
        earlier.status = 'completed';
        change(w.jobs()[0] as unknown as Record<string, unknown>);
        w.store.save();
        const saved = w.saved();
        expect(admitResume(w.store, routed(w, action, 'worker-1'), later(5)), action).toMatchObject({ refused: 'head-mismatch' });
        expect(w.requests(), action).toEqual([earlier]);
        expect(w.admissions(), action).toEqual([earlier.id]);
        expect(earlier.repairResume, action).toBeUndefined();
        expect(Object.keys(w.waits()), action).toEqual(['delivery/1', 'delivery/2']);
        expect(w.saved(), action).toBe(saved);
    }
});

test('the deadline counts every read from entry on: the wait lookup before the handler\'s rule, and the queue\'s own answer after it', async () => {
    const ended = { refused: 'wait-ended', detail: 'The repair wait no longer holds for this stop: it ran out, the stop changed, or something stronger explains it.' };
    // Milliseconds each read takes, with 10 left on the wait at entry: the Effects lookup behind the wait check, the handler's rule, the queue's answer.
    for (const [name, lookup, rule, queue, outcome] of [
        ['the lookup and the rule together cross it', 8, 5, 0, ended], ['the lookup alone crosses it', 10, 0, 0, ended],
        ['the queue\'s answer crosses it', 2, 2, 6, ended], ['the queue\'s answer alone crosses it', 0, 0, 10, ended],
        ['all three stay short of it', 3, 3, 3, { replayed: false, admitted: { action: 'reconcile-base-update', head: 'worker-1' } }],
    ] as const) {
        const w = await deployedWorld(stores, dbs), saved = w.saved(), clock = w.store.clock, prepare = w.store.db.prepare.bind(w.store.db);
        const deadline = new Date(Date.parse(w.waits()['delivery/1'].progressAt) + REPAIR_WAIT_MS);
        let elapsed = 40, stamped = false;
        w.store.clock = { now: () => { if (!stamped) { stamped = true; elapsed += queue; } return clock.now(); }, monotonic: () => elapsed };
        w.store.db.prepare = ((sql: string) => { if (/FROM effects/.test(sql)) elapsed += lookup; return prepare(sql); }) as typeof w.store.db.prepare;
        const result = admitResume(w.store, routed(w, 'reconcile-base-update', 'worker-1'), new Date(deadline.getTime() - 10), RESUME_ROUTES, () => { elapsed += rule; return null; });
        w.store.clock = clock; w.store.db.prepare = prepare;
        expect(result, name).toMatchObject(outcome);
        // The queue stamps a request only when it is about to add one, so its answer was reached exactly when the earlier reads left time.
        expect(stamped, name).toBe(lookup + rule < 10);
        if ('refused' in outcome) {
            expect(w.requests(), name).toEqual([]);
            expect(w.admissions(), name).toEqual([]);
            expect(Object.keys(w.waits()), name).toEqual(['delivery/1', 'delivery/2']);
            expect(w.saved(), name).toBe(saved);
        } else {
            expect(w.requests(), name).toHaveLength(1);
            expect(w.admissions(), name).toHaveLength(1);
            expect(Object.keys(w.waits()), name).toEqual(['delivery/2']);
        }
    }
});

test('the binding records how the job stood at that admission: its own step count and stage, and the event of that admission', async () => {
    const w = await deployedWorld(stores, dbs);
    const step = w.jobs()[0].steps[0];
    w.jobs()[1].steps.push(step, step);
    const ids = () => w.store.state.events.filter(event => event.kind === 'repair-resume-admitted').map(event => event.id);
    const first = admitResume(w.store, w.intent('1'), later(5)) as { admitted: { repairResume: { stood: unknown } } };
    expect(first.admitted.repairResume.stood).toEqual({ steps: 1, stage: 'review', event: ids()[0] });
    // Whatever is recorded for the project in between is before the second admission's event, not after it.
    w.store.emit('pr-review-recheck', 'an operator rechecked GH-2', 'lead', 'GH-2');
    const second = admitResume(w.store, w.intent('2'), later(5)) as { admitted: { repairResume: { stood: { event: number } } } };
    expect(second.admitted.repairResume.stood).toEqual({ steps: 3, stage: 'review', event: ids()[0] });
    expect(ids()).toHaveLength(2);
    expect(second.admitted.repairResume.stood.event).toBeGreaterThan(w.store.state.events.find(event => event.kind === 'pr-review-recheck')!.id);
    // A replay returns the binding as it was made: the job is not read again, whatever it has done since.
    w.jobs()[1].steps.push(step);
    w.jobs()[1].stage = 'lead-pr';
    expect(admitResume(w.store, w.intent('2'), later(6))).toMatchObject({ replayed: true, admitted: { repairResume: { stood: { steps: 3, stage: 'review', event: ids()[0] } } } });
    expect(ids()).toHaveLength(2);
});
