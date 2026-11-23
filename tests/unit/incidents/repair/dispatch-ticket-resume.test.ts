import { afterEach, expect, test } from 'vitest';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { canonical } from '../../../../server/incidents/canonical-json';
import { admitTicketResume, type QueueTicketResume } from '../../../../server/incidents/repair/dispatch-ticket-resume';
import { REPAIR_WAIT_MS } from '../../../../server/incidents/repair/repair-wait';
import { resumeIdentity } from '../../../../server/incidents/repair/resume-binding';
import { RESUME_ROUTES, type ResumeRoute } from '../../../../server/incidents/repair/resume-routes';
import { HOLDS } from '../../../../server/office/config';
import type { Store } from '../../../../server/store/store';
import type { DeliveryRequest, StageResult } from '../../../../src/shared';
import { later } from '../incident-fixture';
import { FIX, OPERATION, RELEASE } from './resume-fixture';
import { STOPPED_AT, ticketSubject, ticketWorld } from './ticket-resume-fixture';

const stores: Store[] = [], dbs: DatabaseSync[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); dbs.splice(0).forEach(db => db.close()); delete HOLDS['CEC-1']; });
type World = Awaited<ReturnType<typeof ticketWorld>>;
const ONE = ticketSubject('CEC-1');
type More = { queue?: QueueTicketResume; routes?: Readonly<Record<string, ResumeRoute>>; intent?: Parameters<World['intent']>[1]; minutes?: number };
const admit = (w: World, key = 'CEC-1', more: More = {}) => admitTicketResume(w.store, more.queue ?? w.queue, w.intent(key, more.intent), later(more.minutes ?? 5), more.routes);
/** A refusal that wrote nothing: the project is as it was saved, in memory and on disk, and the ticket is still held. */
const refusedCleanly = (w: World, attempt: () => unknown, code: string, detail?: string | RegExp) => {
    w.store.save();
    const saved = w.saved(), state = JSON.stringify(w.store.state);
    const outcome = attempt() as { refused?: string; detail?: string };
    expect(outcome.refused).toBe(code);
    if (detail !== undefined) expect(outcome.detail).toEqual(typeof detail === 'string' ? detail : expect.stringMatching(detail));
    expect([w.saved(), JSON.stringify(w.store.state)]).toEqual([saved, state]);
    expect(w.requests()).toEqual([]);
};
const WAIT_ENDED = 'The repair wait no longer holds for this stop: it ran out, the stop changed, or something stronger explains it.';
const setupStop = (summary: string) => ({ outcome: 'blocked', commit: 'abc1234', paidRuns: 0, blocker: '', qa: { setup: { status: 'blocked', summary }, cases: [] } }) as unknown as StageResult;

test('a due ticket resume queues the ticket\'s own resume once, bound to the fix, and lifts the wait from that ticket alone, in one write', async () => {
    const w = await ticketWorld(stores, dbs), ticket = JSON.stringify(w.tickets()[0]);
    expect(Object.keys(w.waits())).toEqual(['delivery/ticket:CEC-1', 'delivery/ticket:CEC-2']);
    const outcome = admit(w) as { admitted: DeliveryRequest; replayed: boolean };
    expect(outcome).toMatchObject({ replayed: false, admitted: { key: 'CEC-1', action: 'resume-ticket', status: 'queued', error: '' } });
    const events = w.store.state.events.filter(event => event.ticket === 'CEC-1').map(event => [event.kind, event.id]);
    // Queued by the project's own queue, then marked as admitted; the binding names that second event.
    expect(events.map(([kind]) => kind)).toEqual(['repair-resume-admitted', 'delivery-queued']);
    expect(outcome.admitted.repairResume).toEqual({ id: resumeIdentity(w.id, ONE, 'cli-bind-1'), incident: w.id, subject: ONE, digest: w.binding('CEC-1').digest, fix: 'cli-bind-1', commit: FIX, action: 'resume-ticket',
        payload: createHash('sha256').update(canonical({ key: 'CEC-1' })).digest('hex'), release: { commit: RELEASE, operation: OPERATION }, admittedAt: later(5).toISOString(),
        // How many stage attempts it had (none here), its stage and the admission's own event are what its outcome is judged against.
        stood: { steps: 0, stage: 'qa', event: events[0][1], ticketAttemptsCounted: true } });
    expect(w.store.state.events[0].message).toBe(`CEC-1: resume-ticket queued to resume after harness fix ${FIX.slice(0, 7)} (${w.id}).`);
    expect(w.requests()).toEqual([outcome.admitted]);
    expect(w.admissions()).toEqual([outcome.admitted.id]);
    expect(Object.keys(w.waits())).toEqual(['delivery/ticket:CEC-2']);
    // The ticket itself is untouched: the handler acts on it when the scheduler runs the request.
    expect(JSON.stringify(w.tickets()[0])).toBe(ticket);
    // The last marker goes with its map.
    admit(w, 'CEC-2');
    expect('repairWaits' in w.store.state.coordination!).toBe(false);
});

test('a resume already bound is returned as it stands, whatever became of its request, and nothing more is queued', async () => {
    const w = await ticketWorld(stores, dbs);
    const first = admit(w) as { admitted: DeliveryRequest };
    for (const status of ['queued', 'working', 'blocked', 'completed'] as const) {
        first.admitted.status = status;
        const saved = w.saved();
        expect(admit(w, 'CEC-1', { minutes: 6 }), status).toEqual({ admitted: first.admitted, replayed: true });
        expect(w.saved()).toBe(saved);
    }
    expect(w.requests()).toHaveLength(1);
    // Another fix of the same incident is another resume: not this request.
    expect(admit(w, 'CEC-1', { intent: { fix: { event: 'cli-bind-2', commit: FIX } } })).toMatchObject({ refused: 'wait-ended' });
});

test('a paused or draining project admits nothing', async () => {
    const w = await ticketWorld(stores, dbs);
    w.store.state.paused = true;
    refusedCleanly(w, () => admit(w), 'project-paused', 'The project is paused.');
    Object.assign(w.store.state, { paused: false, draining: true });
    refusedCleanly(w, () => admit(w), 'project-paused', 'The project is draining.');
    Object.assign(w.store.state, { draining: false });
    expect(admit(w)).toMatchObject({ replayed: false });
});

test('a route this release does not dispatch for a ticket is refused', async () => {
    const w = await ticketWorld(stores, dbs);
    const off = { ...RESUME_ROUTES, 'resume-ticket': { ...RESUME_ROUTES['resume-ticket'], dispatch: 'none' as const } };
    refusedCleanly(w, () => admit(w, 'CEC-1', { routes: off }), 'not-dispatchable', 'This release does not dispatch resume-ticket for a ticket.');
    // A job's route, and one the inventory does not hold, are not a ticket's.
    for (const action of ['reconcile-review', 'toString', 'no-such-route'])
        refusedCleanly(w, () => admit(w, 'CEC-1', { intent: { binding: { ...w.binding('CEC-1'), route: { action, payload: { key: 'CEC-1' }, expectedStage: 'qa' } } } }), 'not-dispatchable');
    expect(RESUME_ROUTES['resume-ticket']).toEqual({ subject: 'ticket', keyed: 'ticket', head: null, dispatch: 'all' });
});

test('a subject that is not a ticket of this project is refused', async () => {
    const w = await ticketWorld(stores, dbs);
    for (const subject of ['brain/delivery/ticket:CEC-1', 'cec/intake/ticket:CEC-1', 'cec/delivery/job-1', 'cec/delivery', ''])
        refusedCleanly(w, () => admit(w, 'CEC-1', { intent: { binding: { ...w.binding('CEC-1'), subject } } }), 'no-record', `${subject} is not a ticket of cec.`);
});

test('without the repair wait in effect for that exact stop nothing is admitted', async () => {
    const w = await ticketWorld(stores, dbs);
    // Bound to another stop of the ticket, or held for another incident.
    refusedCleanly(w, () => admit(w, 'CEC-1', { intent: { binding: { ...w.binding('CEC-1'), digest: 'e'.repeat(64) } } }), 'wait-ended', WAIT_ENDED);
    refusedCleanly(w, () => admit(w, 'CEC-1', { intent: { incident: 'inc-0000000000000000' } }), 'wait-ended', WAIT_ENDED);
    // Run out.
    refusedCleanly(w, () => admit(w, 'CEC-1', { minutes: 3 + REPAIR_WAIT_MS / 60_000 }), 'wait-ended', WAIT_ENDED);
    // Something stronger explains the stop: a hold, and a park on the board.
    HOLDS['CEC-1'] = 'held by a person';
    refusedCleanly(w, () => admit(w), 'wait-ended', WAIT_ENDED);
    delete HOLDS['CEC-1'];
    Object.assign(w.tickets()[0], { parked: { stage: 'qa', reason: 'needs a decision', at: 't2', published: true } });
    refusedCleanly(w, () => admit(w), 'wait-ended', WAIT_ENDED);
    delete (w.tickets()[0] as { parked?: unknown }).parked;
    // The ticket stopped again since, or has moved on.
    Object.assign(w.tickets()[0], { stop: { kind: 'unclassified', at: later(4).toISOString() } });
    refusedCleanly(w, () => admit(w), 'wait-ended', WAIT_ENDED);
    // A stage run removes the saved stop when it starts; a stage that then stops the ticket by its own verdict saves none.
    delete (w.tickets()[0] as { stop?: unknown }).stop;
    refusedCleanly(w, () => admit(w), 'wait-ended', WAIT_ENDED);
    Object.assign(w.tickets()[0], { stop: { kind: 'unclassified', at: STOPPED_AT }, activity: 'waiting' });
    refusedCleanly(w, () => admit(w), 'wait-ended', WAIT_ENDED);
    // And no marker at all.
    Object.assign(w.tickets()[0], { activity: 'blocked' });
    delete w.store.state.coordination!.repairWaits;
    refusedCleanly(w, () => admit(w), 'wait-ended', WAIT_ENDED);
});

test('a stop with no date of its own is not resumed: the same run can stop again and look the same', async () => {
    const w = await ticketWorld(stores, dbs, ['CEC-1'], 'cli-bind-1', { stop: undefined });
    // The wait is in effect for it all the same; what is missing is anything that would end it on a later stop.
    expect(Object.values(w.waits()).map(wait => wait.stands)).toEqual([{ stage: 'qa', episode: 'run-1:1', stop: null, head: 'abc1234' }]);
    expect(w.binding('CEC-1').disposition).toBe('route');
    const detail = 'The ticket was stopped by its stage and its stop carries no date of its own; a later stop of the same run could not be told from it, so the resume is a person\'s.';
    refusedCleanly(w, () => admit(w), 'ticket-not-resumable', detail);
    // A person resumed it, the stage ran and stopped it again between two observations: nothing the Office holds changed.
    Object.assign(w.tickets()[0], { blocker: w.tickets()[0].blocker });
    refusedCleanly(w, () => admit(w), 'ticket-not-resumable', detail);
});

test('a route whose key is not the ticket\'s is refused', async () => {
    const w = await ticketWorld(stores, dbs);
    refusedCleanly(w, () => admit(w, 'CEC-1', { intent: { binding: { ...w.binding('CEC-1'), route: { action: 'resume-ticket', payload: { key: 'CEC-2' }, expectedStage: 'qa' } } } }), 'key-mismatch', 'The route names CEC-2; the ticket is CEC-1.');
});

test('a delivery request already queued or working for the ticket keeps the resume out; one that has ended, or belongs to another ticket, does not', async () => {
    for (const status of ['queued', 'working'] as const) {
        const w = await ticketWorld(stores, dbs);
        const other = { id: 'other', key: 'CEC-1', action: 'resume-ticket', requestedAt: later(4).toISOString(), status, error: '' } as DeliveryRequest;
        w.store.state.deliveryQueue = [other];
        w.store.save();
        const saved = w.saved();
        expect(admit(w), status).toEqual({ refused: 'request-pending', detail: 'Another delivery request for CEC-1 is queued or working.' });
        expect(w.saved()).toBe(saved);
        expect(other.repairResume).toBeUndefined();
        expect(Object.keys(w.waits())).toHaveLength(2);
    }
    const w = await ticketWorld(stores, dbs);
    w.store.state.deliveryQueue = ['completed', 'blocked', 'interrupted'].map((status, n) => ({ id: `ended-${n}`, key: 'CEC-1', action: 'resume-ticket', requestedAt: later(n).toISOString(), status, error: '' }) as DeliveryRequest);
    w.store.state.deliveryQueue.push({ id: 'elsewhere', key: 'CEC-2', action: 'resume-ticket', requestedAt: later(4).toISOString(), status: 'queued', error: '' } as DeliveryRequest);
    expect(admit(w)).toMatchObject({ replayed: false, admitted: { key: 'CEC-1' } });
    expect(w.requests()).toHaveLength(5);
});

test('a scheduler claim on the ticket, its run or one of its delivery requests keeps the resume out, whatever that request\'s status', async () => {
    const w = await ticketWorld(stores, dbs);
    // A QA handoff a person approved: its request stays blocked while the ownership check runs under a claim.
    const handoff = { id: 'handoff', key: 'CEC-1', action: 'resume-ticket', requestedAt: later(4).toISOString(), status: 'blocked', error: 'Error: the preview host never answered', officeQAHandoff: { workerId: 'w1' } } as unknown as DeliveryRequest;
    w.store.state.deliveryQueue = [handoff, { id: 'elsewhere', key: 'CEC-2', action: 'resume-ticket', requestedAt: later(4).toISOString(), status: 'blocked', error: '' } as DeliveryRequest];
    for (const [id, stage] of [['handoff', 'check-qa-ownership'], ['handoff', 'check-qa-ownership-fresh'], ['ticket:CEC-1', 'qa'], ['run-1', 'qa']]) {
        const claim = w.store.claimWork({ projectId: 'cec', kind: 'delivery', id }, 'scheduler', stage, 'delivery')!;
        w.store.save();
        const saved = w.saved();
        expect(admit(w), `${id} ${stage}`).toEqual({ refused: 'request-pending', detail: `CEC-1 has work in flight under a scheduler claim (${stage}).` });
        expect(w.saved()).toBe(saved);
        expect(handoff.repairResume).toBeUndefined();
        w.store.finishClaim(claim.id, 'completed');
    }
    // A claim for another ticket's request, or one that has ended, is not this ticket's work in flight.
    w.store.claimWork({ projectId: 'cec', kind: 'delivery', id: 'elsewhere' }, 'scheduler', 'check-qa-ownership', 'delivery');
    handoff.officeQAHandoff!.consumedAt = later(4).toISOString();
    expect(admit(w)).toMatchObject({ replayed: false, admitted: { key: 'CEC-1' } });
});

test('an approved QA handoff still waiting on its ownership check keeps the resume out between checks, when it holds no claim', async () => {
    const w = await ticketWorld(stores, dbs);
    const request = (id: string, key: string, status: string, handoff?: Record<string, unknown>) => ({ id, key, action: 'resume-ticket', requestedAt: later(4).toISOString(), status, error: 'Error: the preview host never answered', ...handoff && { officeQAHandoff: handoff } }) as unknown as DeliveryRequest;
    const waiting = request('handoff', 'CEC-1', 'blocked', { workerId: 'w1' });
    w.store.state.deliveryQueue = [waiting];
    w.store.save();
    const saved = w.saved();
    expect(admit(w)).toEqual({ refused: 'request-pending', detail: 'CEC-1 has an approved QA handoff waiting on its ownership check.' });
    expect(w.saved()).toBe(saved);
    expect(w.requests()).toEqual([waiting]);
    expect(waiting.repairResume).toBeUndefined();
    expect(Object.keys(w.waits())).toHaveLength(2);
    // One that was used, one whose request ended another way, a blocked request with no handoff, and another ticket's, are not waiting on this ticket.
    w.store.state.deliveryQueue = [request('used', 'CEC-1', 'blocked', { workerId: 'w1', consumedAt: later(4).toISOString() }), request('ended', 'CEC-1', 'interrupted', { workerId: 'w2' }),
        request('plain', 'CEC-1', 'blocked'), request('elsewhere', 'CEC-2', 'blocked', { workerId: 'w3' })];
    expect(admit(w)).toMatchObject({ replayed: false, admitted: { key: 'CEC-1' } });
});

test('at the QA setup cap the Office does not resume: showing the count, and spending another attempt past it, are a person\'s', async () => {
    const w = await ticketWorld(stores, dbs);
    const capped = (earlier: number, confirmed = false) => {
        const current = setupStop('the sign-in page never loaded');
        Object.assign(w.tickets()[0], { results: { qa: current }, qaHistory: Array.from({ length: earlier }, (_, n) => ({ stage: 'qa', result: setupStop(`earlier stop ${n}`) })), qaSetupStopsConfirmed: undefined, qaSetupStopsConfirmedFor: undefined });
        if (confirmed) Object.assign(w.tickets()[0], { qaSetupStopsConfirmed: earlier + 1, qaSetupStopsConfirmedFor: createHash('sha256').update(JSON.stringify(['qa', 'abc1234', current])).digest('hex') });
    };
    capped(2);
    refusedCleanly(w, () => admit(w), 'ticket-not-resumable', 'QA setup has stopped 3 times in a row on this candidate; whether to spend another attempt is a person\'s to say.');
    // The ticket's own record of the count having been shown is untouched: the next resume by a person still shows it first.
    expect(w.tickets()[0].qaSetupStopsConfirmed).toBeUndefined();
    // Shown already: the next resume would spend an attempt past the cap, which is no more the Office's to spend.
    capped(3, true);
    refusedCleanly(w, () => admit(w), 'ticket-not-resumable', /^QA setup has stopped 4 times/);
    // Below the cap the resume is admitted.
    capped(1);
    expect(admit(w)).toMatchObject({ replayed: false });
});

test('what the ticket\'s own queue refuses is a refusal, and the whole admission is undone', async () => {
    const w = await ticketWorld(stores, dbs);
    // Not a pilot any more: the project's queue itself says so, after the Office's own checks passed.
    Object.assign(w.tickets()[0], { pilot: false });
    refusedCleanly(w, () => admit(w), 'ticket-not-resumable', 'The ticket\'s own resume refused: Error: Ticket has no resumable delivery');
    expect(w.admissions()).toEqual([]);
    expect(Object.keys(w.waits())).toHaveLength(2);
    Object.assign(w.tickets()[0], { pilot: true });
    // A queue that had written before it threw leaves nothing behind either, and its words reach the ledger without credentials, bounded.
    const partial: QueueTicketResume = (key, bound) => { w.queue(key, bound); throw new Error(`Feature is paused; token xoxb-1-2-${'c'.repeat(20)} ${'x'.repeat(400)}`); };
    w.store.save();
    const saved = w.saved();
    const outcome = admit(w, 'CEC-1', { queue: partial }) as { refused: string; detail: string };
    expect(outcome.refused).toBe('ticket-not-resumable');
    expect(outcome.detail).toMatch(/^The ticket's own resume refused: Error: Feature is paused; token /);
    expect(outcome.detail).not.toContain('xoxb-');
    expect(outcome.detail.length).toBeLessThanOrEqual('The ticket\'s own resume refused: '.length + 200);
    expect(w.saved()).toBe(saved);
    expect(w.requests()).toEqual([]);
    expect(Object.keys(w.waits())).toHaveLength(2);
    // An error that is not the queue's refusal is not swallowed: here, the store failing after the queue answered.
    const emit = w.store.emit.bind(w.store);
    w.store.emit = (kind, ...rest) => { if (kind === 'repair-resume-admitted') throw new Error('disk full'); return emit(kind, ...rest); };
    expect(() => admit(w)).toThrow('disk full');
    w.store.emit = emit;
    expect(w.saved()).toBe(saved);
    expect(admit(w)).toMatchObject({ replayed: false });
});

test('a wait that runs out while the queue answers is over: the request is undone', async () => {
    const w = await ticketWorld(stores, dbs);
    const left = Date.parse(w.waits()['delivery/ticket:CEC-1'].progressAt) + REPAIR_WAIT_MS - later(5).getTime();
    const slow = (ms: number): QueueTicketResume => (key, bound) => { clock += ms; return w.queue(key, bound); };
    let clock = 0;
    w.store.clock = { ...w.store.clock, monotonic: () => clock };
    refusedCleanly(w, () => admit(w, 'CEC-1', { queue: slow(left) }), 'wait-ended', WAIT_ENDED);
    expect(w.admissions()).toEqual([]);
    clock = 0;
    expect(admit(w, 'CEC-1', { queue: slow(left - 1) })).toMatchObject({ replayed: false });
    // The admission is dated at the instant it was given, not by how long its own reads took.
    w.store.clock = { ...w.store.clock, monotonic: () => clock += 7 };
    expect(admit(w, 'CEC-2')).toMatchObject({ replayed: false, admitted: { repairResume: { admittedAt: later(5).toISOString() } } });
});

test('the admission counts the ticket\'s own stage attempts as they stand at that moment', async () => {
    const w = await ticketWorld(stores, dbs);
    const begin = (key: string, stage: 'qa' | 'implement') => w.store.begin(w.tickets().find(held => held.key === key)!, stage);
    w.store.finish(begin('CEC-1', 'implement'), { outcome: 'passed' } as never); begin('CEC-1', 'qa'); begin('CEC-2', 'qa');
    expect((admit(w) as { admitted: DeliveryRequest }).admitted.repairResume!.stood).toMatchObject({ steps: 2, stage: 'qa' });
    // An attempt begun afterwards is after the admission: the count saved does not move, and a replay answers with the same request.
    begin('CEC-1', 'qa');
    expect((admit(w, 'CEC-1', { minutes: 6 }) as { admitted: DeliveryRequest; replayed: boolean })).toMatchObject({ replayed: true, admitted: { repairResume: { stood: { steps: 2 } } } });
    expect((admit(w, 'CEC-2', { minutes: 6 }) as { admitted: DeliveryRequest }).admitted.repairResume!.stood).toMatchObject({ steps: 1 });
});
