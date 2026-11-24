import { afterEach, expect, test, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { canonical } from '../../../../server/incidents/canonical-json';
import { admitTransitionResume, forTransition } from '../../../../server/incidents/repair/dispatch-transition-resume';
import { REPAIR_WAIT_MS } from '../../../../server/incidents/repair/repair-wait';
import { resumeIdentity } from '../../../../server/incidents/repair/resume-binding';
import { RESUME_ROUTES, type ResumeRoute } from '../../../../server/incidents/repair/resume-routes';
import * as mergeCeiling from '../../../../server/delivery/readiness/merge-ceiling';
import * as policy from '../../../../server/office/project-policy';
import { recheckCandidate } from '../../../../server/scheduling/operator-commands';
import { enqueueRequest } from '../../../../server/scheduling/requests';
import { scheduledWork, type OfficeEntry } from '../../../../server/scheduling/scheduled-work';
import type { Store } from '../../../../server/store/store';
import type { RepairRoute, SubjectFix } from '../../../../src/contracts/incidents';
import { later } from './repair-wait-fixture';
import { deployedWorld, FIX, OPERATION, RELEASE } from './resume-fixture';

const stores: Store[] = [], dbs: DatabaseSync[] = [];
afterEach(() => { vi.restoreAllMocks(); stores.splice(0).forEach(store => store.close()); dbs.splice(0).forEach(db => db.close()); });
const ONE = 'cms-field-vocabulary/delivery/1';
type World = Awaited<ReturnType<typeof deployedWorld>>;
const route = (action: string, stage: string) => (jobId: string): RepairRoute => ({ action, payload: { key: `GH-${jobId}` }, expectedStage: stage });
const leaving = (stage: string) => (bound: SubjectFix): SubjectFix => bound.disposition === 'route' ? { ...bound, boundary: { kind: 'stage-left', stage } } : bound;
/** Jobs stopped at candidate review, bound to `review-candidate`. */
const candidates = (ids = ['1', '2']) => deployedWorld(stores, dbs, ids, route('review-candidate', 'review'));
/** Jobs stopped at `stage`, bound to `review-pr`. */
const reviews = (stage: string, job: Record<string, unknown> = {}, ids = ['1']) => deployedWorld(stores, dbs, ids, route('review-pr', stage), { job: { stage, ...job }, declare: leaving(stage) });
const admit = (w: World, jobId = '1', minutes = 5, routes?: Readonly<Record<string, ResumeRoute>>) => admitTransitionResume(w.store, w.intent(jobId), later(minutes), routes);
/** Everything the project holds, saved and in memory, and its events: the same before and after means nothing was written. */
const untouched = (w: World) => { const before = [w.saved(), JSON.stringify(w.store.state)]; return () => expect([w.saved(), JSON.stringify(w.store.state)]).toEqual(before); };

test('a due candidate-review resume requeues the job as the operator\'s recheck does, saves one completed receipt with the binding and lifts that wait alone', async () => {
    const w = await candidates(), before = w.admissions();
    expect(Object.keys(w.waits())).toEqual(['delivery/1', 'delivery/2']);
    const outcome = admit(w) as { admitted: Record<string, any>; replayed: boolean };
    const detail = 'Independent candidate review requeued; prior provider failures retained. No source work replayed.';
    expect(outcome).toMatchObject({ replayed: false, admitted: { action: 'review-candidate', key: 'GH-1', head: '', lane: 'delivery', status: 'completed', requestedAt: later(5).toISOString(), detail: `Repair resume: ${detail}` } });
    expect(w.jobs()[0]).toMatchObject({ stage: 'review', status: 'queued', detail });
    const admitted = w.store.state.events.filter(event => event.ticket === 'GH-1');
    // Only the Office's own event: the operator's recheck event would read as a person's move.
    expect(admitted.map(event => [event.kind, event.message])).toEqual([['repair-resume-admitted', `GH-1: review-candidate resumed after harness fix ${FIX.slice(0, 7)} (${w.id}).`]]);
    expect(outcome.admitted.repairResume).toEqual({ id: resumeIdentity(w.id, ONE, 'cli-bind-1'), incident: w.id, subject: ONE, digest: w.binding('1').digest, fix: 'cli-bind-1', commit: FIX, action: 'review-candidate',
        payload: createHash('sha256').update(canonical({ key: 'GH-1' })).digest('hex'), release: { commit: RELEASE, operation: OPERATION }, admittedAt: later(5).toISOString(),
        // How the job stood before the transition.
        stood: { steps: 1, stage: 'review', event: admitted[0].id } });
    expect(w.requests()).toEqual([outcome.admitted]);
    // The receipt is no queued work: nothing is journaled as admitted for it.
    expect(w.admissions()).toEqual(before);
    expect(Object.keys(w.waits())).toEqual(['delivery/2']);
    expect(w.jobs()[1]).toMatchObject({ status: 'blocked' });
    // All of it is saved.
    const saved = w.savedState().coordination!;
    expect(saved.requests![0]).toMatchObject({ status: 'completed', repairResume: { stood: outcome.admitted.repairResume.stood } });
    expect(saved.jobs![0]).toMatchObject({ status: 'queued' });
    expect(Object.keys(saved.repairWaits!)).toEqual(['delivery/2']);
    // Bound once: a later pass answers with the same receipt and writes nothing.
    const unchanged = untouched(w);
    expect(admit(w, '1', 6)).toEqual({ admitted: outcome.admitted, replayed: true });
    unchanged();
    admit(w, '2');
    expect('repairWaits' in w.store.state.coordination!).toBe(false);
});

test('the scheduler reads the receipt as finished, and the job exactly as after a person\'s recheck', async () => {
    const projection = (w: World) => { const entry = { store: w.store, engine: {}, conversations: {}, coordinator: {} } as OfficeEntry; return ['delivery', 'operations', 'it'].flatMap(lane => scheduledWork(entry, new Map([[w.store.project.id, w.store]]), later(6), lane)); };
    const office = await candidates(['1']), person = await candidates(['1']);
    const receipt = (admit(office) as { admitted: { id: string } }).admitted;
    recheckCandidate.call({ store: person.store, state: person.store.state.coordination } as never, 'GH-1');
    const items = projection(office);
    // Never run, and in no count: a finished record.
    expect(items.filter(item => item.work.kind === 'reconciliation' && item.work.id === receipt.id).map(item => [item.eligibility.state, item.eligibility.reason])).toEqual([['terminal', 'Work is completed']]);
    const job = (w: World, list = projection(w)) => list.filter(item => item.work.kind === 'delivery' && item.work.id === '1').map(item => [item.stage, item.eligibility]);
    expect(job(office, items)).toEqual(job(person));
    expect(office.jobs()[0]).toEqual(person.jobs()[0]);
});

test('a PR review is resumed at the PR stage, a merge preflight that sent nothing at the merge, each with the operator\'s detail', async () => {
    const pr = await reviews('lead-pr');
    expect(admit(pr)).toMatchObject({ replayed: false, admitted: { action: 'review-pr', status: 'completed', detail: 'Repair resume: Read-only PR reassessment queued. Prior sessions and results retained; source/publication stages will not replay.' } });
    expect(pr.jobs()[0]).toMatchObject({ stage: 'lead-pr', status: 'queued' });
    const merge = await reviews('merge');
    expect(admit(merge)).toMatchObject({ replayed: false, admitted: { repairResume: { stood: { steps: 1, stage: 'merge' } }, detail: 'Repair resume: Merge preflight queued; no prior merge request was sent. Current head and checks will be verified again.' } });
    expect(merge.jobs()[0]).toMatchObject({ stage: 'merge', status: 'queued' });
    expect(merge.store.state.events.filter(event => event.ticket === 'GH-1').map(event => event.kind)).toEqual(['repair-resume-admitted']);
});

test('a transition its own checks refuse is refused transition-refused, and nothing is written', async () => {
    // Above the project's merge ceiling a merge preflight is a person's.
    const ceiling = await reviews('merge');
    const resolved = policy.resolveProjectPolicy;
    vi.spyOn(policy, 'projectPolicy').mockImplementation(project => ({ ...resolved(project), merge: 'human' }));
    let unchanged = untouched(ceiling);
    expect(admit(ceiling)).toEqual({ refused: 'transition-refused', detail: `The handler's own check refused it: ${mergeCeiling.HUMAN_MERGE}` });
    unchanged();
    vi.restoreAllMocks();
    // A job with a write still to read back is reconciled first, never re-reviewed: that write explains the stop, so the repair's wait no longer stands for it.
    const uncertain = await reviews('lead-pr', { steps: [{ stage: 'publish', result: { outcome: 'passed', summary: 'ok', receipts: [{ id: 'r', action: 'push', target: 'b', verified: false, uncertain: true, detail: 'unconfirmed' }] } }] });
    unchanged = untouched(uncertain);
    expect(admit(uncertain)).toMatchObject({ refused: 'wait-ended' });
    unchanged();
    // A merge already attempted is not a preflight.
    const attempted = await reviews('merge', { mergeAttempt: { at: 't0' } });
    unchanged = untouched(attempted);
    expect(admit(attempted)).toEqual({ refused: 'transition-refused', detail: 'The handler\'s own check refused it: Only an inactive PR review or a merge preflight with no attempted write can be rechecked' });
    unchanged();
});

test('every refusal a job\'s resume has applies, and writes nothing', async () => {
    const w = await candidates(['1']);
    const check = (expected: { refused: string; detail: string | RegExp }, minutes = 5, routes?: Readonly<Record<string, ResumeRoute>>) => {
        const unchanged = untouched(w), outcome = admit(w, '1', minutes, routes) as { refused: string; detail: string };
        expect(outcome.refused).toBe(expected.refused);
        if (expected.detail instanceof RegExp) expect(outcome.detail).toMatch(expected.detail); else expect(outcome.detail).toBe(expected.detail);
        unchanged();
    };
    w.store.state.paused = true;
    check({ refused: 'project-paused', detail: 'The project is paused.' });
    w.store.state.paused = false; w.store.state.draining = true;
    check({ refused: 'project-paused', detail: 'The project is draining.' });
    w.store.state.draining = false;
    // This release does not dispatch it: the row says so, or the route has no transition.
    check({ refused: 'not-dispatchable', detail: 'This release does not dispatch review-candidate for a job.' }, 5, { ...RESUME_ROUTES, 'review-candidate': { ...RESUME_ROUTES['review-candidate'], dispatch: 'none' } });
    const reading = w.intent('1', { binding: { ...w.binding('1'), route: { action: 'reconcile-review', payload: { key: 'GH-1' }, expectedStage: 'review' } } });
    expect(admitTransitionResume(w.store, reading, later(5))).toEqual({ refused: 'not-dispatchable', detail: 'This release does not dispatch reconcile-review for a job.' });
    // A row for another kind of subject is not a job's, whatever it is called.
    check({ refused: 'not-dispatchable', detail: 'This release does not dispatch review-candidate for a job.' }, 5, { ...RESUME_ROUTES, 'review-candidate': { ...RESUME_ROUTES['review-candidate'], subject: 'intake' } });
    // A subject of another project, or not a delivery job, has no record here.
    const elsewhere = w.intent('1', { binding: { ...w.binding('1'), subject: 'brain/delivery/1' } });
    expect(admitTransitionResume(w.store, elsewhere, later(5))).toEqual({ refused: 'no-record', detail: 'brain/delivery/1 is not delivery work of cms-field-vocabulary.' });
    const intake = w.intent('1', { binding: { ...w.binding('1'), subject: 'cms-field-vocabulary/intake/1' } });
    expect(admitTransitionResume(w.store, intake, later(5))).toEqual({ refused: 'no-record', detail: 'cms-field-vocabulary/intake/1 is not delivery work of cms-field-vocabulary.' });
    const misnamed = w.intent('1', { binding: { ...w.binding('1'), route: { action: 'review-candidate', payload: { key: 'GH-9' }, expectedStage: 'review' } } });
    expect(admitTransitionResume(w.store, misnamed, later(5))).toEqual({ refused: 'key-mismatch', detail: 'The route names GH-9; the job is GH-1.' });
    // Another request for the key, queued or working.
    const other = enqueueRequest(w.store, 'reconcile-review', 'GH-1');
    check({ refused: 'request-pending', detail: 'Another request for GH-1 is queued or working.' });
    other.status = 'working';
    check({ refused: 'request-pending', detail: 'Another request for GH-1 is queued or working.' });
    other.status = 'completed';
    // A claim on other work is not this job's work in flight.
    const another = w.store.claimWork({ projectId: w.store.project.id, kind: 'delivery', id: '9' }, 'scheduler', 'review', 'delivery')!;
    expect(another).not.toBeNull();
    // The wait ran out, or the stop it was bound to is no longer the one standing.
    check({ refused: 'wait-ended', detail: /./ }, 3 + REPAIR_WAIT_MS / 60_000 + 1);
    w.jobs()[0].stop = { kind: 'unclassified', at: 't9' };
    check({ refused: 'wait-ended', detail: /./ });
    // Admitted once those are gone, the other job's claim notwithstanding.
    w.jobs()[0].stop = { kind: 'unclassified', at: 't1' };
    expect(admit(w)).toMatchObject({ replayed: false, admitted: { status: 'completed' } });
    w.store.finishClaim(another.id, 'completed');
});

test('only a claim on the bound work kind and ID blocks a review resume', async () => {
    const w = await candidates(['1']);
    const work = w.work('1');
    const claim = w.store.claimWork(work, 'scheduler', 'review', 'delivery')!;
    expect(w.requests()).toEqual([]);
    const unchanged = untouched(w);
    expect(admit(w)).toEqual({ refused: 'request-pending', detail: 'GH-1 has work in flight under a scheduler claim (review).' });
    unchanged();
    w.store.finishClaim(claim.id, 'completed');

    const checkpoint = w.store.claimWork({ ...work, kind: 'checkpoint' }, 'scheduler', 'checkpoint', 'operations');
    expect(checkpoint).not.toBeNull();
    expect(admit(w)).toMatchObject({ replayed: false, admitted: { status: 'completed' } });
    expect(w.jobs()[0].status).toBe('queued');
});

test('a wait that runs out while the admission reads is over: nothing is written', async () => {
    for (const runsOut of [true, false]) {
        const w = await candidates(['1']), claims = w.store.activeClaims.bind(w.store), clock = w.store.clock;
        // A minute before the wait runs out: 48 hours after the last progress its marker holds.
        const at = new Date(Date.parse(w.waits()['delivery/1'].progressAt) + REPAIR_WAIT_MS - 60_000);
        let elapsed = 0;
        w.store.clock = { now: clock.now, monotonic: () => elapsed };
        // The claim read is the last one before the write; the wait's last minute passes while it answers.
        w.store.activeClaims = () => { if (runsOut) elapsed = 60_000; return claims(); };
        const unchanged = untouched(w), outcome = admitTransitionResume(w.store, w.intent('1'), at);
        if (runsOut) {
            expect(outcome).toMatchObject({ refused: 'wait-ended' });
            unchanged();
        }
        // Read in time, the same admission goes through: the refusal above is the late check's.
        else expect(outcome).toMatchObject({ replayed: false, admitted: { action: 'review-candidate', status: 'completed' } });
    }
});

test.each([
    { elapsedMs: 60_000, expired: true },
    { elapsedMs: 59_999, expired: false },
])('a merge policy check taking $elapsedMs ms respects the repair wait deadline', async ({ elapsedMs, expired }) => {
    const w = await reviews('merge');
    const at = new Date(Date.parse(w.waits()['delivery/1'].progressAt) + REPAIR_WAIT_MS - 60_000);
    let elapsed = 0;
    w.store.clock = { ...w.store.clock, monotonic: () => elapsed };
    const assertHarnessMayMerge = mergeCeiling.assertHarnessMayMerge;
    const mergePolicy = vi.spyOn(mergeCeiling, 'assertHarnessMayMerge').mockImplementation(store => {
        assertHarnessMayMerge(store);
        elapsed = elapsedMs;
    });

    const unchanged = untouched(w);
    const outcome = admitTransitionResume(w.store, w.intent('1'), at);
    expect(mergePolicy).toHaveBeenCalledOnce();
    if (expired) {
        expect(outcome).toMatchObject({ refused: 'wait-ended' });
        unchanged();
    } else {
        expect(outcome).toMatchObject({ replayed: false, admitted: { action: 'review-pr', status: 'completed' } });
        expect(w.jobs()[0].status).toBe('queued');
    }
});

test('only the two review routes are transitions', () => {
    expect(Object.keys(RESUME_ROUTES).filter(forTransition).sort()).toEqual(['review-candidate', 'review-pr']);
    for (const action of ['constructor', 'toString', 'hasOwnProperty', 'requeue-implement', 'review-assignment', 'resume-ticket']) expect(forTransition(action), action).toBe(false);
});
