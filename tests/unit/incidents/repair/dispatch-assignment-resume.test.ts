import { afterEach, expect, test, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { canonical } from '../../../../server/incidents/canonical-json';
import { admitAssignmentResume, forAssignment } from '../../../../server/incidents/repair/dispatch-assignment-resume';
import { REPAIR_WAIT_MS } from '../../../../server/incidents/repair/repair-wait';
import { admittedId, dispatchResumes } from '../../../../server/incidents/repair/resume-arrivals';
import { resumeIdentity } from '../../../../server/incidents/repair/resume-binding';
import { RESUME_ROUTES, type ResumeRoute } from '../../../../server/incidents/repair/resume-routes';
import { WAIT_ENDED } from '../../../../server/incidents/repair/undo-admission';
import { HOLDS } from '../../../../server/office/config';
import * as transition from '../../../../server/scheduling/assignment-transition';
import { planReadRetry } from '../../../../server/scheduling/read-retries';
import { enqueueRequest } from '../../../../server/scheduling/requests';
import type { Store } from '../../../../server/store/store';
import type { AssignmentReview, DeliveryRequest, ReadRetry, TicketJob } from '../../../../src/shared';
import { later } from '../incident-fixture';
import { assignmentRoute, assignmentWorld, review, STAGE } from './assignment-resume-fixture';
import { ENABLED, FIX, OPERATION, RELEASE } from './resume-fixture';

const stores: Store[] = [], dbs: DatabaseSync[] = [];
afterEach(() => { vi.restoreAllMocks(); stores.splice(0).forEach(store => store.close()); dbs.splice(0).forEach(db => db.close()); delete HOLDS['GH-1']; });
type World = Awaited<ReturnType<typeof assignmentWorld>>;
const ONE = 'cms-field-vocabulary/intake/review-1';
const retry = (attempts: number, exhausted: boolean): ReadRetry => ({ failure: { category: 'timeout', dispatched: true, detail: 'The read timed out' } as ReadRetry['failure'], attempts, nextAt: '', exhausted,
    history: [{ at: later(-60).toISOString(), detail: 'Error: first read timed out' }, { at: later(-45).toISOString(), detail: 'Error: second read timed out' }] });
/** A bound review for GH-1 with an older review of the same ticket before it, and a second ticket's review, whose wait stays. */
const world = (over: Partial<AssignmentReview> = {}) => assignmentWorld(stores, dbs, [review('review-0', 'GH-1', { endedAt: later(-120).toISOString() }), review('review-1', 'GH-1', over), review('review-2', 'GH-2')]);
const admit = (w: World, reviewId = 'review-1', minutes = 5, routes?: Readonly<Record<string, ResumeRoute>>) => admitAssignmentResume(w.store, w.intent(reviewId), later(minutes), routes);
/** Everything the project holds, saved and in memory, and its events: the same before and after means nothing was written. */
const untouched = (w: World) => { const before = [w.saved(), JSON.stringify(w.store.state)]; return () => expect([w.saved(), JSON.stringify(w.store.state)]).toEqual(before); };
const DETAIL = 'GH-1 queued for PM ownership read-back; recovery counts and retry history kept.';

test.each([
    { name: 'three read retries spent, not yet marked exhausted', over: { retry: retry(3, false) } },
    { name: 'three read retries spent and marked exhausted', over: { retry: retry(3, true) } },
    { name: 'IT ownership recoveries at their cap', over: { itRecoveryAttempts: 3 } },
    { name: 'both budgets spent', over: { itRecoveryAttempts: 3, retry: retry(3, true) } },
])('a due resume of a review with $name requeues only that review, keeps its counts, saves one completed receipt and lifts that wait alone', async ({ over }) => {
    const w = await world(over), bound = structuredClone(w.review('review-1')), older = structuredClone(w.review('review-0')), other = structuredClone(w.review('review-2'));
    const admissions = w.admissions(), events = w.store.state.events.length;
    expect(Object.keys(w.waits())).toEqual(['intake/review-1', 'intake/review-2']);
    const outcome = admit(w) as { admitted: Record<string, any>; replayed: boolean };
    expect(outcome).toMatchObject({ replayed: false, admitted: { action: 'review-assignment', key: 'GH-1', head: '', lane: 'delivery', status: 'completed', requestedAt: later(5).toISOString(), detail: `Repair resume: ${DETAIL}` } });
    // Only the bound review moves, and only its status and queue time: its spent budgets stay spent, field for field.
    const requeued = w.review('review-1');
    expect(requeued).toEqual({ ...bound, status: 'queued', queuedAt: requeued.queuedAt });
    expect(Date.parse(requeued.queuedAt)).not.toBeNaN();
    expect([requeued.retry, requeued.itRecoveryAttempts]).toEqual([bound.retry, bound.itRecoveryAttempts]);
    expect(w.review('review-0')).toEqual(older);
    expect(w.review('review-2')).toEqual(other);
    // Exactly one project event, the Office's own, with no role: neither the operator's recheck event nor any other.
    const added = w.store.state.events.slice(0, w.store.state.events.length - events);
    expect(added.map(event => [event.kind, event.message, event.role, event.ticket])).toEqual([['repair-resume-admitted', `GH-1: review-assignment resumed after harness fix ${FIX.slice(0, 7)} (${w.id}).`, undefined, 'GH-1']]);
    const resume = { id: resumeIdentity(w.id, ONE, 'cli-bind-1'), incident: w.id, subject: ONE, digest: w.binding('review-1').digest, fix: 'cli-bind-1', commit: FIX, action: 'review-assignment',
        payload: createHash('sha256').update(canonical({ key: 'GH-1' })).digest('hex'), release: { commit: RELEASE, operation: OPERATION }, admittedAt: later(5).toISOString(),
        // The review's baseline: no steps of its own, at its one stage, and the admission's event.
        stood: { steps: 0, stage: STAGE, event: added[0].id } };
    expect(outcome.admitted.repairResume).toEqual(resume);
    expect(w.requests()).toEqual([outcome.admitted]);
    // The receipt is no queued work: nothing is journaled for it.
    expect(w.admissions()).toEqual(admissions);
    expect(Object.keys(w.waits())).toEqual(['intake/review-2']);
    // All of it is saved.
    const saved = w.savedState().coordination!;
    expect(saved.requests).toHaveLength(1);
    expect(saved.requests![0]).toMatchObject({ action: 'review-assignment', key: 'GH-1', status: 'completed', repairResume: resume });
    expect(saved.listener.reviews.map(held => [held.id, held.status])).toEqual([['review-0', 'blocked'], ['review-1', 'queued'], ['review-2', 'blocked']]);
    expect(saved.listener.reviews[1]).toEqual(requeued);
    expect(Object.keys(saved.repairWaits!)).toEqual(['intake/review-2']);
    // Bound once: the same intent answers with the same receipt and writes nothing, after a restart too and once the review is gone.
    let unchanged = untouched(w);
    expect(admit(w, 'review-1', 6)).toEqual({ admitted: outcome.admitted, replayed: true });
    unchanged();
    w.reload();
    unchanged = untouched(w);
    expect(admit(w, 'review-1', 7)).toEqual({ admitted: w.requests()[0], replayed: true });
    unchanged();
    w.store.state.coordination!.listener.reviews.splice(1, 1);
    unchanged = untouched(w);
    expect(admit(w, 'review-1', 8)).toMatchObject({ admitted: { id: outcome.admitted.id }, replayed: true });
    unchanged();
});

test('the scheduler runs the bound review and reads the receipt as finished', async () => {
    const w = await world({ retry: retry(3, true), itRecoveryAttempts: 3 });
    const receipt = (admit(w) as { admitted: { id: string } }).admitted;
    const items = w.scheduled(6), of = (kind: string, id: string) => items.filter(item => item.work.kind === kind && item.work.id === id).map(item => [item.eligibility.state, item.eligibility.reason]);
    expect(items.filter(item => item.work.kind === 'intake' && item.work.id === 'review-1').map(item => item.stage)).toEqual([STAGE]);
    expect(of('intake', 'review-1')).toEqual([['runnable', 'Ready for scheduler claim']]);
    // Never run, and in no count: a finished record.
    expect(of('reconciliation', receipt.id)).toEqual([['terminal', 'Work is completed']]);
    // The older review of the ticket is not what runs.
    expect(of('intake', 'review-0')).toEqual([]);
});

test('an admission the ledger never recorded is recorded from the receipt, with no second requeue and no second event', async () => {
    const w = await world();
    const receipt = (admit(w) as { admitted: { id: string; repairResume: { id: string } } }).admitted;
    const requeued = structuredClone(w.review('review-1')), events = w.store.state.events.length;
    expect(w.ledger.event(admittedId(w.id, receipt.repairResume.id))).toBeNull();
    const pass = dispatchResumes({ ledger: w.ledger, entries: [{ store: w.store }], control: { read: () => ENABLED }, running: () => ({ commit: RELEASE, operation: OPERATION }), now: () => later(6), fenced: () => false, report: message => { throw new Error(message); } });
    // The bound review is recorded; the other is admitted on its own.
    expect(pass).toEqual({ admitted: [ONE, 'cms-field-vocabulary/intake/review-2'], refused: [], held: [] });
    expect(w.ledger.event(admittedId(w.id, receipt.repairResume.id))).toMatchObject({ kind: 'resume-admitted', body: { request: receipt.id, subject: ONE, action: 'review-assignment' } });
    expect(w.review('review-1')).toEqual(requeued);
    expect(w.requests().filter(request => request.key === 'GH-1')).toHaveLength(1);
    expect(w.store.state.events.filter(event => event.ticket === 'GH-1')).toHaveLength(1);
    expect(w.store.state.events.length).toBe(events + 1);
});

test('a review that is gone, of another project or kind, or not dispatched is refused, and nothing is written', async () => {
    const w = await world();
    const check = (reading: ReturnType<typeof admit>, expected: unknown) => expect(reading).toEqual(expected);
    let unchanged = untouched(w);
    w.store.state.paused = true;
    check(admit(w), { refused: 'project-paused', detail: 'The project is paused.' });
    w.store.state.paused = false; w.store.state.draining = true;
    check(admit(w), { refused: 'project-paused', detail: 'The project is draining.' });
    w.store.state.draining = false;
    unchanged();
    // This release does not dispatch it: the row says so, the row is for another kind of subject, or the action is another route.
    check(admit(w, 'review-1', 5, { ...RESUME_ROUTES, 'review-assignment': { ...RESUME_ROUTES['review-assignment'], dispatch: 'none' } }), { refused: 'not-dispatchable', detail: 'This release does not dispatch review-assignment for an assignment review.' });
    check(admit(w, 'review-1', 5, { ...RESUME_ROUTES, 'review-assignment': { ...RESUME_ROUTES['review-assignment'], subject: 'job' } }), { refused: 'not-dispatchable', detail: 'This release does not dispatch review-assignment for an assignment review.' });
    const other = w.intent('review-1', { binding: { ...w.binding('review-1'), route: { action: 'review-pr', payload: { key: 'GH-1' }, expectedStage: STAGE } } });
    check(admitAssignmentResume(w.store, other, later(5)), { refused: 'not-dispatchable', detail: 'This release does not dispatch review-pr for an assignment review.' });
    // A subject of another project or kind has no review here.
    for (const subject of ['brain/intake/review-1', 'cms-field-vocabulary/delivery/review-1', 'cms-field-vocabulary/intake', ''])
        check(admitAssignmentResume(w.store, w.intent('review-1', { binding: { ...w.binding('review-1'), subject } }), later(5)), { refused: 'no-record', detail: `${subject} is not an assignment review of cms-field-vocabulary.` });
    unchanged();
    // The review the subject names is gone: no wait can hold it, and the refusal says it is not there.
    const reviews = w.store.state.coordination!.listener.reviews, bound = reviews.splice(1, 1)[0];
    unchanged = untouched(w);
    check(admit(w), { refused: 'no-record', detail: `${ONE} has no assignment review.` });
    unchanged();
    reviews.splice(1, 0, bound);
    // Admitted once these are gone.
    expect(admit(w)).toMatchObject({ replayed: false, admitted: { status: 'completed' } });
});

test('a superseded review, a wait missing or bound to another repair, a stronger hold and a key that is not the review\'s are refused, and nothing is written', async () => {
    const w = await world();
    const refuses = (code: string, detail: string, reading: () => ReturnType<typeof admit> = () => admit(w)) => {
        const unchanged = untouched(w);
        expect(reading()).toEqual({ refused: code, detail });
        unchanged();
    };
    const reviews = w.store.state.coordination!.listener.reviews;
    // A later review of the ticket supersedes the bound one, whatever its own status: the scheduler runs the latest.
    for (const status of ['blocked', 'ready', 'cancelled'] as const) {
        reviews.push(review('review-3', 'GH-1', { status }));
        refuses('wait-ended', WAIT_ENDED);
        reviews.pop();
    }
    // The marker is gone, belongs to another incident, or to another binding of this one.
    const marker = structuredClone(w.waits()['intake/review-1']);
    delete w.store.state.coordination!.repairWaits!['intake/review-1'];
    refuses('wait-ended', WAIT_ENDED);
    w.store.state.coordination!.repairWaits!['intake/review-1'] = { ...marker, incident: 'inc-0000000000000099' };
    refuses('wait-ended', WAIT_ENDED);
    w.store.state.coordination!.repairWaits!['intake/review-1'] = { ...marker, digest: 'e'.repeat(64) };
    refuses('wait-ended', WAIT_ENDED);
    w.store.state.coordination!.repairWaits!['intake/review-1'] = marker;
    // The review stopped again since: another episode.
    const ended = w.review('review-1').endedAt;
    w.review('review-1').endedAt = later(1).toISOString();
    refuses('wait-ended', WAIT_ENDED);
    w.review('review-1').endedAt = ended;
    // A hold on the ticket explains the stop more strongly than the repair.
    HOLDS['GH-1'] = 'Joe is deciding the scope';
    refuses('wait-ended', WAIT_ENDED);
    delete HOLDS['GH-1'];
    // The wait ran out.
    refuses('wait-ended', WAIT_ENDED, () => admit(w, 'review-1', 3 + REPAIR_WAIT_MS / 60_000));
    // The route names another ticket.
    const misnamed = w.intent('review-1', { binding: { ...w.binding('review-1'), route: assignmentRoute('GH-9') } });
    refuses('key-mismatch', 'The route names GH-9; the review is of GH-1.', () => admitAssignmentResume(w.store, misnamed, later(5)));
    expect(admit(w)).toMatchObject({ replayed: false, admitted: { status: 'completed' } });
});

test('an ordinary retry that already requeued the bound review ends its repair wait before admission', async () => {
    const w = await world({ detail: 'Error: the assignment read timed out', retry: { ...retry(2, false), nextAt: later(5).toISOString() } });
    const held = w.review('review-1');
    expect(planReadRetry(held, later(5))).toBe(true);
    expect(held.status).toBe('queued');
    expect(w.waits()).toHaveProperty('intake/review-1');
    const unchanged = untouched(w);
    expect(admit(w)).toEqual({ refused: 'wait-ended', detail: WAIT_ENDED });
    unchanged();
});

test('a queued or working request for the ticket in either queue, or a claim on the review, is refused request-pending; finished requests, other tickets and other work are not', async () => {
    const w = await world();
    const refuses = (detail: string) => { const unchanged = untouched(w); expect(admit(w)).toEqual({ refused: 'request-pending', detail }); unchanged(); };
    const request = enqueueRequest(w.store, 'reconcile-review', 'GH-1');
    refuses('Another request for GH-1 is queued or working.');
    request.status = 'working';
    refuses('Another request for GH-1 is queued or working.');
    request.status = 'completed';
    // The delivery queue counts too.
    const delivery = { id: 'dq-1', key: 'GH-1', action: 'start-pilot', requestedAt: later(4).toISOString(), status: 'queued', error: '' } as DeliveryRequest;
    w.store.state.deliveryQueue = [delivery];
    refuses('Another request for GH-1 is queued or working.');
    delivery.status = 'working';
    refuses('Another request for GH-1 is queued or working.');
    delivery.status = 'blocked';
    // A claim on the review itself; a claim on other work with the same ID is not one.
    const claim = w.store.claimWork({ projectId: w.store.project.id, kind: 'intake', id: 'review-1' }, 'scheduler', STAGE, 'delivery')!;
    refuses(`GH-1 has work in flight under a scheduler claim (${STAGE}).`);
    w.store.finishClaim(claim.id, 'completed');
    const elsewhere = w.store.claimWork({ projectId: w.store.project.id, kind: 'delivery', id: 'review-1' }, 'scheduler', 'review', 'delivery')!;
    expect(elsewhere).not.toBeNull();
    // Pending work for another ticket does not stand in the way either.
    enqueueRequest(w.store, 'reconcile-review', 'GH-2');
    w.store.state.deliveryQueue.push({ ...delivery, id: 'dq-2', key: 'GH-2', status: 'queued' });
    expect(admit(w)).toMatchObject({ replayed: false, admitted: { status: 'completed', key: 'GH-1' } });
    w.store.finishClaim(elsewhere.id, 'completed');
});

test('on Jira/Azure a queued or working start-pilot for the ticket stands in the way with nothing in the recovery queue', async () => {
    const w = await assignmentWorld(stores, dbs, [review('review-1', 'CEC-1')], { project: 'cec' });
    expect(w.store.state.coordination!.requests ?? []).toEqual([]);
    for (const status of ['queued', 'working'] as const) {
        w.store.state.deliveryQueue = [{ id: 'dq-1', key: 'CEC-1', action: 'start-pilot', requestedAt: later(4).toISOString(), status, error: '' }];
        const unchanged = untouched(w);
        expect(admitAssignmentResume(w.store, w.intent('review-1'), later(5))).toEqual({ refused: 'request-pending', detail: 'Another request for CEC-1 is queued or working.' });
        unchanged();
    }
    w.store.state.deliveryQueue![0].status = 'completed';
    expect(admitAssignmentResume(w.store, w.intent('review-1'), later(5))).toMatchObject({ replayed: false, admitted: { key: 'CEC-1', status: 'completed' } });
    expect(w.review('review-1').status).toBe('queued');
});

test('a review whose ticket delivery already holds is refused transition-refused, whatever the job\'s status, and nothing is written', async () => {
    const w = await world();
    for (const status of ['queued', 'blocked', 'completed'] as const) {
        w.store.state.coordination!.jobs = [{ id: 'job-1', key: 'GH-1', status, stage: 'implement', steps: [] } as unknown as TicketJob];
        const unchanged = untouched(w);
        expect(admit(w), status).toEqual({ refused: 'transition-refused', detail: `The handler's own check refused it: Delivery already holds GH-1 (${status}); its review is not run again` });
        unchanged();
    }
    // A cancelled job is no delivery.
    w.store.state.coordination!.jobs = [{ id: 'job-1', key: 'GH-1', status: 'cancelled', stage: 'implement', steps: [] } as unknown as TicketJob];
    expect(admit(w)).toMatchObject({ replayed: false, admitted: { status: 'completed' } });
});

test('an unexpected transition clock error escapes admission unchanged and rolls back the requeue', async () => {
    const w = await world();
    const failure = new Error('Clock unavailable');
    w.store.clock = { ...w.store.clock, now: () => { throw failure; } };
    const unchanged = untouched(w);

    let caught: unknown;
    try { admit(w); }
    catch (error) { caught = error; }

    expect(caught).toBe(failure);
    unchanged();
});

test('a wait that runs out while the admission reads is over: nothing is written', async () => {
    for (const runsOut of [true, false]) {
        const w = await world(), claims = w.store.activeClaims.bind(w.store), clock = w.store.clock;
        // A minute before the wait runs out: 48 hours after the last progress its marker holds.
        const at = new Date(Date.parse(w.waits()['intake/review-1'].progressAt) + REPAIR_WAIT_MS - 60_000);
        let elapsed = 0;
        w.store.clock = { now: clock.now, monotonic: () => elapsed };
        // The claim read is the last one before the write; the wait's last minute passes while it answers.
        w.store.activeClaims = () => { if (runsOut) elapsed = 60_000; return claims(); };
        const unchanged = untouched(w), outcome = admitAssignmentResume(w.store, w.intent('review-1'), at);
        if (runsOut) {
            expect(outcome).toEqual({ refused: 'wait-ended', detail: WAIT_ENDED });
            unchanged();
        }
        else expect(outcome).toMatchObject({ replayed: false, admitted: { action: 'review-assignment', status: 'completed' } });
    }
});

test('a wait that runs out while the admission reads ends it before the transition: an expiry outranks what the transition would refuse', async () => {
    for (const runsOut of [true, false]) {
        const w = await world(), claims = w.store.activeClaims.bind(w.store), clock = w.store.clock;
        // Delivery holds the ticket, so the transition itself would refuse.
        w.store.state.coordination!.jobs = [{ id: 'job-1', key: 'GH-1', status: 'blocked', stage: 'implement', steps: [] } as unknown as TicketJob];
        const at = new Date(Date.parse(w.waits()['intake/review-1'].progressAt) + REPAIR_WAIT_MS - 60_000);
        let elapsed = 0;
        w.store.clock = { now: clock.now, monotonic: () => elapsed };
        w.store.activeClaims = () => { if (runsOut) elapsed = 60_000; return claims(); };
        const unchanged = untouched(w), outcome = admitAssignmentResume(w.store, w.intent('review-1'), at);
        expect(outcome, runsOut ? 'runs out' : 'in time').toMatchObject(runsOut ? { refused: 'wait-ended', detail: WAIT_ENDED } : { refused: 'transition-refused' });
        unchanged();
    }
});

test.each([
    { elapsedMs: 60_000, expired: true },
    { elapsedMs: 59_999, expired: false },
])('a requeue taking $elapsedMs ms of the wait\'s last minute is undone at the 48-hour boundary, and holds a millisecond before it', async ({ elapsedMs, expired }) => {
    const w = await world({ retry: retry(3, false) });
    const at = new Date(Date.parse(w.waits()['intake/review-1'].progressAt) + REPAIR_WAIT_MS - 60_000);
    let elapsed = 0;
    w.store.clock = { ...w.store.clock, monotonic: () => elapsed };
    const requeue = transition.requeueAssignmentReview;
    const spy = vi.spyOn(transition, 'requeueAssignmentReview').mockImplementation((store, held) => {
        const detail = requeue(store, held);
        // The review is already requeued in memory when the time passes.
        expect(held.status).toBe('queued');
        elapsed = elapsedMs;
        return detail;
    });
    const unchanged = untouched(w), outcome = admitAssignmentResume(w.store, w.intent('review-1'), at);
    expect(spy).toHaveBeenCalledOnce();
    if (expired) {
        expect(outcome).toEqual({ refused: 'wait-ended', detail: WAIT_ENDED });
        unchanged();
        expect(w.review('review-1').status).toBe('blocked');
        expect(Object.keys(w.waits())).toEqual(['intake/review-1', 'intake/review-2']);
        expect(w.requests()).toEqual([]);
    } else {
        expect(outcome).toMatchObject({ replayed: false, admitted: { action: 'review-assignment', status: 'completed' } });
        expect(w.review('review-1').status).toBe('queued');
        expect(w.savedState().coordination!.listener.reviews[1].status).toBe('queued');
    }
});

test('only review-assignment is an assignment review\'s route', () => {
    expect(Object.keys(RESUME_ROUTES).filter(forAssignment)).toEqual(['review-assignment']);
    for (const action of ['constructor', 'toString', 'review-pr', 'review-candidate', 'resume-ticket', 'Review-Assignment']) expect(forAssignment(action), action).toBe(false);
});
