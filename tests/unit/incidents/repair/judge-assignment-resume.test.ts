import { afterEach, expect, test } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { judgeResumes } from '../../../../server/incidents/repair/judge-resumes';
import { dispatchResumes } from '../../../../server/incidents/repair/resume-arrivals';
import { settleIncidents } from '../../../../server/incidents/repair/settle-incidents';
import { deferNonReady, recheck } from '../../../../server/scheduling/operator-commands';
import type { Store } from '../../../../server/store/store';
import type { RepairBoundary, SubjectFix } from '../../../../src/contracts/incidents';
import type { TicketJob } from '../../../../src/shared';
import { assignmentWorld, review, STAGE } from './assignment-resume-fixture';
import { HOUR, later } from './repair-wait-fixture';
import { deployedWorld, ENABLED, OPERATION, RELEASE } from './resume-fixture';

const stores: Store[] = [], dbs: DatabaseSync[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); dbs.splice(0).forEach(db => db.close()); });
type World = Awaited<ReturnType<typeof assignmentWorld>>;
type Ledgered = Pick<World, 'ledger' | 'store' | 'id'>;
const ONE = 'cms-field-vocabulary/intake/review-1', HOLDS_IT = { commit: RELEASE, operation: OPERATION };
const fail = (message: string) => { throw new Error(message); };
const pass = (w: Ledgered, minutes = 5) => dispatchResumes({ ledger: w.ledger, entries: [{ store: w.store }], control: { read: () => ENABLED }, running: () => HOLDS_IT, now: () => later(minutes), fenced: () => false, report: fail });
const judge = (w: Ledgered, minutes: number) => judgeResumes({ ledger: w.ledger, entries: [{ store: w.store }], running: () => HOLDS_IT, now: () => later(minutes), fenced: () => false, report: fail });
const settle = (w: Ledgered, minutes: number) => settleIncidents({ ledger: w.ledger, running: () => HOLDS_IT, now: () => later(minutes), fenced: () => false, report: fail });
const outcomes = (w: Ledgered) => (w.ledger.get(w.id)!.fixes!.at(-1)!.outcomes ?? []).map(({ subject, outcome, detail }) => ({ subject, outcome, detail }));
/** One stopped review, bound to `review-assignment` with this boundary, its resume admitted at minute 5. */
async function resumed(boundary: RepairBoundary = { kind: 'stage-left', stage: STAGE }, declare?: (bound: SubjectFix) => SubjectFix) {
    const w = await assignmentWorld(stores, dbs, [review('review-1', 'GH-1')], { boundary, ...(declare ? { declare } : {}) });
    expect(pass(w)).toEqual({ admitted: [ONE], refused: [], held: [] });
    expect(w.review('review-1').status).toBe('queued');
    return w;
}
const delivery = (w: World, status: TicketJob['status'] = 'queued') => { (w.store.state.coordination!.jobs ??= []).push({ id: 'job-1', key: 'GH-1', status, stage: 'implement', steps: [] } as unknown as TicketJob); };
const claimReview = (w: World) => w.store.claimWork({ projectId: w.store.project.id, kind: 'intake', id: 'review-1' }, 'scheduler', STAGE, 'delivery')!;
const LEFT: RepairBoundary = { kind: 'stage-left', stage: STAGE };
const SETTLED: RepairBoundary = { kind: 'record-settled' };

test('a review resumed through the normal passes advances once it leaves intake ready, and verifies the incident', async () => {
    const w = await resumed();
    // Queued, nothing has moved yet.
    expect(judge(w, 6)).toEqual([]);
    expect(settle(w, 6)).toEqual({ verified: [], recurred: [] });
    // The PM read-back the scheduler runs ends ready.
    Object.assign(w.review('review-1'), { status: 'ready', endedAt: later(6).toISOString(), detail: 'GH-1 is clear for the team.' });
    expect(judge(w, 7)).toEqual([ONE]);
    expect(outcomes(w)).toEqual([{ subject: ONE, outcome: 'advanced', detail: 'The review left assignment-review ready for delivery after its resume.' }]);
    expect(settle(w, 8)).toEqual({ verified: [w.id], recurred: [] });
    expect(w.ledger.get(w.id)!.state).toBe('verified');
});

test('record-settled advances on the review\'s own decision: ready, owned or held', async () => {
    for (const status of ['ready', 'owned', 'held'] as const) {
        const w = await resumed(SETTLED);
        expect(judge(w, 6), status).toEqual([]);
        w.review('review-1').status = status;
        expect(judge(w, 7), status).toEqual([ONE]);
        expect(outcomes(w), status).toEqual([{ subject: ONE, outcome: 'advanced', detail: `The review reached its decision (${status}) after its resume.` }]);
    }
});

test.each([LEFT, SETTLED])('$kind waits for the bound review claim before judging provisional ready', async boundary => {
    for (const status of ['cancelled', 'ready'] as const) {
        const w = await resumed(boundary);
        const claim = claimReview(w);
        w.review('review-1').status = 'ready';
        expect(judge(w, 6)).toEqual([]);
        expect(outcomes(w)).toEqual([]);
        expect(settle(w, 6)).toEqual({ verified: [], recurred: [] });
        expect(w.ledger.get(w.id)!.state).toBe('deployed');

        w.review('review-1').status = status;
        w.store.finishClaim(claim.id, 'completed');
        w.store.claimWork({ projectId: w.store.project.id, kind: 'delivery', id: 'review-1' }, 'scheduler', 'review', 'delivery');
        w.store.claimWork({ projectId: w.store.project.id, kind: 'intake', id: 'review-2' }, 'scheduler', STAGE, 'delivery');
        expect(judge(w, 7)).toEqual([ONE]);
        expect(outcomes(w)).toMatchObject([{ subject: ONE, outcome: status === 'ready' ? 'advanced' : 'gone' }]);
        expect(settle(w, 8).verified).toEqual(status === 'ready' ? [w.id] : []);
        expect(w.ledger.get(w.id)!.state).toBe(status === 'ready' ? 'verified' : 'deployed');
    }
});

test('same-key delivery proves stage-left while the review claim is active', async () => {
    const w = await resumed();
    claimReview(w);
    w.review('review-1').status = 'ready';
    delivery(w);
    expect(judge(w, 6)).toEqual([ONE]);
    expect(outcomes(w)).toEqual([{ subject: ONE, outcome: 'advanced', detail: 'Delivery took GH-1 after its resume (job job-1, implement).' }]);
});

test('delivery taking the ticket after a review is cancelled or gone advances stage-left; record-settled reads gone without the review\'s own decision', async () => {
    for (const change of [(w: World) => { w.review('review-1').status = 'cancelled'; }, (w: World) => { w.store.state.coordination!.listener.reviews.length = 0; }]) {
        const left = await resumed();
        change(left); delivery(left);
        expect(judge(left, 6)).toEqual([ONE]);
        expect(outcomes(left)).toEqual([{ subject: ONE, outcome: 'advanced', detail: 'Delivery took GH-1 after its resume (job job-1, implement).' }]);
        const settled = await resumed(SETTLED);
        change(settled); delivery(settled);
        expect(judge(settled, 6)).toEqual([ONE]);
        expect(outcomes(settled)[0].outcome).toBe('gone');
    }
    // A cancelled job is no delivery: the review that is gone is gone.
    const w = await resumed();
    w.store.state.coordination!.listener.reviews.length = 0;
    delivery(w, 'cancelled');
    expect(judge(w, 6)).toEqual([ONE]);
    expect(outcomes(w)).toEqual([{ subject: ONE, outcome: 'gone', detail: 'The project no longer holds the review.' }]);
    const cancelled = await resumed();
    cancelled.review('review-1').status = 'cancelled';
    expect(judge(cancelled, 6)).toEqual([ONE]);
    expect(outcomes(cancelled)).toEqual([{ subject: ONE, outcome: 'gone', detail: 'The review was cancelled before the boundary was crossed.' }]);
});

test('a passed stage result, another stage and an undeclared boundary are untested on the first pass', async () => {
    const passed = await resumed({ kind: 'stage-result-passed', stage: STAGE });
    expect(judge(passed, 6)).toEqual([ONE]);
    expect(outcomes(passed)).toEqual([{ subject: ONE, outcome: 'untested', detail: 'An assignment review saves no stage results; only stage-left and record-settled can be judged for it.' }]);
    const other = await resumed({ kind: 'stage-left', stage: 'review' });
    expect(judge(other, 6)).toEqual([ONE]);
    expect(outcomes(other)).toEqual([{ subject: ONE, outcome: 'untested', detail: 'An assignment review has only assignment-review to leave, not review.' }]);
    const undeclared = await resumed(undefined, bound => bound.disposition !== 'route' ? bound : { subject: bound.subject, digest: bound.digest, disposition: 'undeclared-boundary', route: bound.route, reason: 'nothing observable follows the review' });
    expect(judge(undeclared, 6)).toEqual([ONE]);
    expect(outcomes(undeclared)).toEqual([{ subject: ONE, outcome: 'untested', detail: 'The fix declared no boundary to observe: nothing observable follows the review' }]);
});

test('a person\'s recheck or deferral of the ticket after the resume is moved-by-hand, ahead of a crossed boundary, and is found once the review is gone', async () => {
    // A recheck after the review ended ready: the boundary was crossed, but a person moved it.
    const w = await resumed();
    w.review('review-1').status = 'ready';
    recheck.call({ store: w.store, state: w.store.state.coordination } as never, 'GH-1');
    const rechecked = w.store.state.events.find(event => event.kind === 'assignment-recheck')!;
    expect(judge(w, 6)).toEqual([ONE]);
    expect(outcomes(w)).toEqual([{ subject: ONE, outcome: 'moved-by-hand', detail: `An operator's command (assignment-recheck) for the review's ticket was recorded at ${rechecked.at}, after its resume.` }]);
    // A deferral sets the review held, which would settle it: the person decided, not the repair.
    const d = await resumed(SETTLED);
    await deferNonReady.call({ store: d.store, state: d.store.state.coordination, pickup: { status: 'Ready' }, readAssignments: async () => [{ key: 'GH-1', status: 'Backlog' }] } as never, 'GH-1');
    expect(d.review('review-1').status).toBe('held');
    const deferred = d.store.state.events.find(event => event.kind === 'pickup-deferred')!;
    expect(judge(d, 6)).toEqual([ONE]);
    expect(outcomes(d)).toEqual([{ subject: ONE, outcome: 'moved-by-hand', detail: `An operator's command (pickup-deferred) for the review's ticket was recorded at ${deferred.at}, after its resume.` }]);
    // Read by the receipt's ticket: found once the review is gone too.
    const g = await resumed();
    g.store.emit('assignment-recheck', 'GH-1 queued for deliberate PM ownership read-back.', 'pm', 'GH-1');
    g.store.state.coordination!.listener.reviews.length = 0;
    expect(judge(g, 6)).toEqual([ONE]);
    expect(outcomes(g)[0].outcome).toBe('moved-by-hand');
    // A job's commands, another ticket's and a command before the resume are no move of the review.
    const n = await assignmentWorld(stores, dbs, [review('review-1', 'GH-1')]);
    n.store.emit('assignment-recheck', 'before the resume', 'pm', 'GH-1');
    pass(n);
    n.store.emit('pr-review-recheck', 'a job command for the same ticket', 'lead', 'GH-1');
    n.store.emit('assignment-recheck', 'another ticket', 'pm', 'GH-2');
    expect(judge(n, 6)).toEqual([]);
    n.review('review-1').status = 'ready';
    expect(judge(n, 7)).toEqual([ONE]);
    expect(outcomes(n)[0].outcome).toBe('advanced');
});

test('a person\'s assignment command for a ticket leaves a delivery job\'s resume to its own boundary', async () => {
    const w = await deployedWorld(stores, dbs, ['1']);
    expect(pass(w).admitted).toEqual(['cms-field-vocabulary/delivery/1']);
    w.store.emit('assignment-recheck', 'GH-1 queued for deliberate PM ownership read-back.', 'pm', 'GH-1');
    w.store.emit('pickup-deferred', 'GH-1 is in Backlog.', 'pm', 'GH-1');
    Object.assign(w.jobs()[0], { stage: 'lead-pr', status: 'queued' });
    expect(judge(w, 6)).toEqual(['cms-field-vocabulary/delivery/1']);
    expect(outcomes(w)).toEqual([{ subject: 'cms-field-vocabulary/delivery/1', outcome: 'advanced', detail: 'The job left review for lead-pr after its resume.' }]);
});

test('a review that stops again for this cause has recurred; one that stops for another is chained', async () => {
    const w = await resumed();
    // The read-back ran and stopped the same way.
    Object.assign(w.review('review-1'), { status: 'blocked', endedAt: later(6).toISOString() });
    w.observed(6);
    expect(judge(w, 7)).toEqual([ONE]);
    expect(outcomes(w)).toEqual([{ subject: ONE, outcome: 'recurred', detail: `The subject stopped again for this incident's cause, seen at ${later(6).toISOString()}, after its resume.` }]);
    expect(settle(w, 8)).toEqual({ verified: [], recurred: [w.id] });
    // Another cause.
    const v = await resumed();
    Object.assign(v.review('review-1'), { status: 'blocked', endedAt: later(6).toISOString(), detail: 'Error: the review returned output the schema refused', failure: { category: 'invalid-output', dispatched: true, detail: 'The review returned output the schema refused' } });
    v.observed(6);
    const other = v.ledger.list().find(incident => incident.id !== v.id)!;
    expect(other.subjects.map(subject => subject.id)).toEqual(['review-1']);
    expect(judge(v, 7)).toEqual([ONE]);
    expect(outcomes(v)).toEqual([{ subject: ONE, outcome: 'chained', detail: `${ONE} stopped for another cause after the resume (${other.id}).` }]);
});

test('a quiet resume is stalled after 24 hours; a run filed under the review postpones that, another review\'s does not', async () => {
    const heartbeat = (requestId: string) => ({ id: `w-${requestId}`, requestId, stage: STAGE, status: 'completed', startedAt: later(5 + 19 * HOUR).toISOString(), lastHeartbeatAt: later(5 + 20 * HOUR).toISOString(), endedAt: '' }) as never;
    for (const [id, postponed] of [['review-1', true], ['review-0', false]] as const) {
        const w = await resumed();
        w.store.state.workLog = [heartbeat(id)];
        expect(judge(w, 5 + 24 * HOUR - 1), id).toEqual([]);
        if (postponed) {
            expect(judge(w, 5 + 24 * HOUR + 1), id).toEqual([]);
            expect(judge(w, 5 + 44 * HOUR + 1), id).toEqual([ONE]);
            expect(outcomes(w)[0], id).toMatchObject({ outcome: 'stalled', detail: expect.stringContaining(later(5 + 20 * HOUR).toISOString()) });
        } else {
            expect(judge(w, 5 + 24 * HOUR + 1), id).toEqual([ONE]);
            expect(outcomes(w)[0], id).toMatchObject({ outcome: 'stalled', detail: expect.stringContaining(later(5).toISOString()) });
        }
    }
});
