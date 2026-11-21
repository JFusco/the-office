import { afterEach, expect, test } from 'vitest';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { canonical } from '../../../../server/incidents/canonical-json';
import { admitResume } from '../../../../server/incidents/repair/dispatch-resume';
import { boundResume, resumeIdentity } from '../../../../server/incidents/repair/resume-binding';
import { RESUME_ROUTES, type ResumeRoute } from '../../../../server/incidents/repair/resume-routes';
import { HOLDS } from '../../../../server/office/config';
import { enqueueRequest } from '../../../../server/scheduling/requests';
import type { Store } from '../../../../server/store/store';
import { HOUR, later } from './repair-wait-fixture';
import { markAwaitingRepair } from './mark-fixture';
import { deployedWorld, FIX, OPERATION, RELEASE, reviewRoute } from './resume-fixture';

const stores: Store[] = [], dbs: DatabaseSync[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); dbs.splice(0).forEach(db => db.close()); delete HOLDS['GH-1']; });
const ONE = 'cms-field-vocabulary/delivery/1';

test('a due resume queues the bound request once, binds it to the fix and lifts the wait from that stop alone, in one write', async () => {
    const w = await deployedWorld(stores, dbs), job = JSON.stringify(w.jobs()[0]);
    expect(Object.keys(w.waits())).toEqual(['delivery/1', 'delivery/2']);
    const outcome = admitResume(w.store, w.intent('1'), later(5));
    expect(outcome).toMatchObject({ replayed: false, admitted: { action: 'reconcile-review', key: 'GH-1', head: '', lane: 'delivery', status: 'queued' } });
    const request = (outcome as { admitted: { id: string; repairResume: unknown } }).admitted;
    expect(request.repairResume).toEqual({ id: resumeIdentity(w.id, ONE, 'cli-bind-1'), incident: w.id, subject: ONE, digest: w.binding('1').digest, fix: 'cli-bind-1', commit: FIX, action: 'reconcile-review',
        payload: createHash('sha256').update(canonical({ key: 'GH-1' })).digest('hex'), release: { commit: RELEASE, operation: OPERATION }, admittedAt: later(5).toISOString() });
    expect(w.requests()).toHaveLength(1);
    expect(w.admissions()).toEqual([request.id]);
    expect(Object.keys(w.waits())).toEqual(['delivery/2']);
    // No counter, attempt or status of the job changed: the handler does that when the scheduler runs the request.
    expect(JSON.stringify(w.jobs()[0])).toBe(job);
    expect(w.store.state.it?.recoveries ?? {}).toEqual({});
    // All of it is in the saved state.
    const saved = JSON.parse(JSON.parse(w.saved()).body);
    expect(saved.coordination.requests[0].repairResume.fix).toBe('cli-bind-1');
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
    expect(admitResume(w.store, routed(reviewRoute('1', { payload: { key: 'GH-1', head: 'worker-1' } })), later(5))).toEqual({ refused: 'not-dispatchable', detail: 'This release does not dispatch reconcile-review with a head.' });
    for (const action of ['review-pr', 'reconcile-closeout', 'resume-ticket', 'reconcile-everything', 'constructor'])
        expect(admitResume(w.store, routed(reviewRoute('1', { action })), later(5)), action).toEqual({ refused: 'not-dispatchable', detail: `This release does not dispatch ${action}.` });
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

test('an identical request that completed earlier and still answers for itself is not taken for a resume', async () => {
    // reconcile-validation with a head is one the queue answers with its completed request; such a route is not dispatched yet, so the inventory is widened here.
    const routes: Record<string, ResumeRoute> = { ...RESUME_ROUTES, 'reconcile-validation': { ...RESUME_ROUTES['reconcile-validation'], dispatch: 'all' } };
    const w = await deployedWorld(stores, dbs), earlier = enqueueRequest(w.store, 'reconcile-validation', 'GH-1', 'worker-1');
    earlier.status = 'completed';
    w.store.save();
    const saved = w.saved(), intent = w.intent('1', { binding: { ...w.binding('1'), route: { action: 'reconcile-validation', payload: { key: 'GH-1', head: 'worker-1' }, expectedStage: 'review' } } });
    // Not even the unchanged state is written: the transaction the queue answered in is undone.
    const save = w.store.save.bind(w.store);
    let saves = 0;
    w.store.save = () => { saves++; save(); };
    expect(admitResume(w.store, intent, later(5), routes)).toEqual({ refused: 'already-reconciled', detail: 'reconcile-validation for GH-1 completed earlier and was not queued again.' });
    w.store.save = save;
    expect(saves).toBe(0);
    expect(w.requests()).toEqual([earlier]);
    expect(earlier.repairResume).toBeUndefined();
    expect(Object.keys(w.waits())).toEqual(['delivery/1', 'delivery/2']);
    expect(w.saved()).toBe(saved);
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
