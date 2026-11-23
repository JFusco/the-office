import { afterEach, expect, test, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { requestDelivery } from '../../../../server/cec/pilot-delivery';
import { judgeResumes } from '../../../../server/incidents/repair/judge-resumes';
import { dispatchResumes, type ResumeProject } from '../../../../server/incidents/repair/resume-arrivals';
import { settleIncidents } from '../../../../server/incidents/repair/settle-incidents';
import * as progress from '../../../../server/incidents/repair/ticket-progress';
import type { Store } from '../../../../server/store/store';
import type { RepairBoundary } from '../../../../src/contracts/incidents';
import type { DeliveryRequest, Stage } from '../../../../src/shared';
import { syncIncidents } from '../../../../server/incidents/sync-incidents';
import { item, later, observe, office } from '../incident-fixture';
import { ENABLED, OPERATION, RELEASE } from './resume-fixture';
import { ticketSubject, ticketWorld } from './ticket-resume-fixture';

const stores: Store[] = [], dbs: DatabaseSync[] = [];
afterEach(() => {
    vi.restoreAllMocks();
    stores.splice(0).forEach(store => store.close());
    dbs.splice(0).forEach(db => db.close());
});
type World = Awaited<ReturnType<typeof ticketWorld>>;
const ONE = ticketSubject('CEC-1'), TWO = ticketSubject('CEC-2'), HOLDS_IT = { commit: RELEASE, operation: OPERATION };
const fail = (message: string) => { throw new Error(message); };
const world = (keys = ['CEC-1'], boundary?: RepairBoundary) => ticketWorld(stores, dbs, keys, 'cli-bind-1', {}, boundary);
const project = (w: World): ResumeProject => ({ store: w.store, engine: { requestDelivery: (key, _action, _status, routing) => w.queue(key, routing!.repairResume!) } });
/** Queues every due ticket resume at minute 5, as the pass before the judgement does. */
const admit = (w: World) => dispatchResumes({ ledger: w.ledger, entries: [project(w)], control: { read: () => ENABLED }, running: () => HOLDS_IT, now: () => later(5), fenced: () => false, report: fail }).admitted;
const judge = (w: World, minutes = 6, fenced = () => false) => judgeResumes({ ledger: w.ledger, entries: [{ store: w.store }], running: () => HOLDS_IT, now: () => later(minutes), fenced, report: fail });
const settle = (w: World, minutes: number) => settleIncidents({ ledger: w.ledger, running: () => HOLDS_IT, now: () => later(minutes), fenced: () => false, report: fail });
const outcomes = (w: World) => (w.ledger.get(w.id)!.fixes!.at(-1)!.outcomes ?? []).map(held => [held.subject, held.outcome, held.detail]);
const held = (w: World, key: string) => w.tickets().find(ticket => ticket.key === key)!;
const move = (w: World, key: string, stage: Stage, activity = 'waiting') => Object.assign(held(w, key), { stage, activity, blocker: '' });
/** One stage attempt of a ticket: begun, and ended with `outcome` when one is given. */
const attempt = (w: World, key: string, stage: Stage, outcome?: string) => { const id = w.store.begin(held(w, key), stage); if (outcome) w.store.finish(id, { outcome } as never); return id; };
/** The Office's own request has run: the queue is free for the ticket again. */
const ran = (w: World, n = 0, status: DeliveryRequest['status'] = 'completed') => Object.assign(w.requests()[n], { status });
const queued = (w: World, key: string, routing?: Parameters<typeof requestDelivery>[3]) => requestDelivery.call({ store: w.store } as never, key, 'resume-ticket', undefined, routing) as DeliveryRequest;
const DAY = 24 * 60;

test('a resumed ticket that stands where it stood has no outcome; one that left its stage has advanced, and its incident is verified on it', async () => {
    const w = await world(['CEC-1', 'CEC-2']);
    expect(admit(w)).toEqual([ONE, TWO]);
    expect(judge(w)).toEqual([]);
    expect(w.ledger.get(w.id)!.fixes!.at(-1)!.outcomes).toBeUndefined();
    // By a stage that ran and found work to do, or by a read-back that accepted the earlier run: the ticket is past the stage either way.
    attempt(w, 'CEC-1', 'qa', 'failed'); move(w, 'CEC-1', 'repair');
    w.store.save();
    const saved = w.saved();
    expect(judge(w, 7)).toEqual([ONE]);
    expect(outcomes(w)).toEqual([[ONE, 'advanced', 'The ticket left qa for repair after its resume.']]);
    expect(settle(w, 8)).toEqual({ verified: [], recurred: [] });
    move(w, 'CEC-2', 'publish');
    expect(judge(w, 9)).toEqual([TWO]);
    expect(outcomes(w)[1]).toEqual([TWO, 'advanced', 'The ticket left qa for publish after its resume.']);
    // An outcome is recorded once, and judging wrote nothing to the project.
    expect(judge(w, 10)).toEqual([]);
    expect(w.saved()).toBe(saved);
    expect(settle(w, 11)).toEqual({ verified: [w.id], recurred: [] });
});

test('under a passed-result boundary only an attempt of that stage begun after the admission counts', async () => {
    const w = await world(['CEC-1'], { kind: 'stage-result-passed', stage: 'qa' });
    // Before the resume the ticket had passed QA once and then been stopped there.
    attempt(w, 'CEC-1', 'qa', 'passed'); attempt(w, 'CEC-1', 'qa', 'blocked');
    admit(w);
    expect(w.requests()[0].repairResume!.stood).toMatchObject({ steps: 2, stage: 'qa' });
    expect(judge(w)).toEqual([]);
    // A read-back accepts the earlier run and the ticket moves on: no QA result was saved after the resume.
    move(w, 'CEC-1', 'publish');
    attempt(w, 'CEC-1', 'publish', 'passed');
    expect(judge(w, 7)).toEqual([]);
    // QA runs again: nothing while it runs or when it fails, and the boundary once it passes.
    const running = attempt(w, 'CEC-1', 'qa');
    expect(judge(w, 8)).toEqual([]);
    w.store.finish(running, { outcome: 'failed' } as never);
    expect(judge(w, 9)).toEqual([]);
    attempt(w, 'CEC-1', 'qa', 'passed');
    expect(judge(w, 10)).toEqual([ONE]);
    expect(outcomes(w)).toEqual([[ONE, 'advanced', 'A passed qa result was saved after the resume.']]);
});

test('a settled-record boundary is crossed when the ticket is complete, and a ticket that was not at the fix\'s stage cannot be judged by it', async () => {
    const settled = await world(['CEC-1'], { kind: 'record-settled' });
    admit(settled);
    move(settled, 'CEC-1', 'staging-qa');
    expect(judge(settled)).toEqual([]);
    move(settled, 'CEC-1', 'complete', 'idle');
    expect(judge(settled, 7)).toEqual([ONE]);
    expect(outcomes(settled)).toEqual([[ONE, 'advanced', 'The ticket completed after its resume.']]);
    const elsewhere = await world(['CEC-1'], { kind: 'stage-left', stage: 'retest' });
    admit(elsewhere);
    expect(judge(elsewhere)).toEqual([ONE]);
    expect(outcomes(elsewhere)).toEqual([[ONE, 'untested', 'The ticket was at qa, not retest, when it was resumed.']]);
});

test('an operator\'s request for the ticket after its resume makes the outcome moved-by-hand, even with the boundary crossed; an automatic one does not', async () => {
    const w = await world(['CEC-1', 'CEC-2']);
    admit(w);
    ran(w, 0); ran(w, 1);
    // CEC-1: Joe resumed it himself. CEC-2: Jira moved it out of Blocked, which queues the same resume with no one's command.
    const mine = queued(w, 'CEC-1', { operator: true }), theirs = queued(w, 'CEC-2');
    expect([mine.operator, 'operator' in theirs]).toEqual([true, false]);
    move(w, 'CEC-1', 'publish'); move(w, 'CEC-2', 'publish');
    expect(judge(w)).toEqual([ONE, TWO]);
    expect(outcomes(w)).toEqual([
        [ONE, 'moved-by-hand', `An operator's command (resume-ticket) moved the ticket at ${mine.requestedAt}, after its resume.`],
        [TWO, 'advanced', 'The ticket left qa for publish after its resume.'],
    ]);
});

test('a corrected QA plan or a saved-implementation continuation Joe approved after the resume is a move by hand; one approved before it is not', async () => {
    const w = await world(['CEC-1', 'CEC-2']);
    const approved = (key: string, more: Partial<DeliveryRequest>): DeliveryRequest => ({ id: `${key}-approved`, key, action: 'resume-ticket', requestedAt: later(1).toISOString(), status: 'completed', error: '', ...more });
    w.store.state.deliveryQueue = [approved('CEC-2', { qaPlanRetry: {} as never })];
    admit(w);
    ran(w, 1); ran(w, 2);
    w.store.state.deliveryQueue!.push(approved('CEC-1', { action: 'continue-saved-implementation', implementationContinuation: {} as never }));
    expect(judge(w)).toEqual([ONE]);
    expect(outcomes(w)).toEqual([[ONE, 'moved-by-hand', `An operator's command (continue-saved-implementation) moved the ticket at ${later(1).toISOString()}, after its resume.`]]);
});

test('a ticket or a request the project no longer holds is gone', async () => {
    const w = await world(['CEC-1', 'CEC-2']);
    admit(w);
    w.store.state.deliveryQueue = w.requests().filter(request => request.key !== 'CEC-1');
    w.store.state.tickets = w.tickets().filter(ticket => ticket.key !== 'CEC-2');
    expect(judge(w)).toEqual([ONE, TWO]);
    expect(outcomes(w)).toEqual([[ONE, 'gone', 'The project no longer holds the request this resume queued.'], [TWO, 'gone', 'The project no longer holds the ticket.']]);
});

test('a resume the ticket\'s own handler refused, with nothing run since, is stalled after 24 hours and not a minute sooner', async () => {
    const w = await world();
    admit(w);
    // The read-back refused: the request ends blocked and the ticket stands as it stood, with the stop it had.
    ran(w, 0, 'blocked');
    expect(judge(w, 5 + DAY - 1)).toEqual([]);
    expect(judge(w, 5 + DAY)).toEqual([ONE]);
    expect(outcomes(w)).toEqual([[ONE, 'stalled', `Nothing has moved for this resume since ${later(5).toISOString()}: 24 hours without progress, and no wait that explains it.`]]);
    // Stalled is not final: the ticket runs after all and gets past the stage.
    move(w, 'CEC-1', 'repair');
    expect(judge(w, 6 + DAY)).toEqual([ONE]);
    expect(outcomes(w)).toEqual([[ONE, 'advanced', 'The ticket left qa for repair after its resume.']]);
});

test('delivery work for the ticket starts the 24 hours again; a conversation about it, or work for another ticket, does not', async () => {
    const w = await world();
    admit(w);
    const run = (ticket: string, stage: string, minutes: number) => ({ id: `${ticket}-${stage}-${minutes}`, ticket, stage, requestId: stage === 'conversation' ? 'message-1' : '', status: 'completed', startedAt: later(minutes - 1).toISOString(), lastHeartbeatAt: '', endedAt: later(minutes).toISOString() });
    w.store.state.workLog = [run('CEC-1', 'conversation', 900), run('CEC-2', 'qa', 900)] as never;
    expect(judge(w, 5 + DAY)).toEqual([ONE]);
    expect(outcomes(w)[0][1]).toBe('stalled');
    const again = await world();
    admit(again);
    again.store.state.workLog = [run('CEC-1', 'readback', 600), run('CEC-1', 'conversation', 900)] as never;
    expect(judge(again, 5 + DAY)).toEqual([]);
    expect(judge(again, 600 + DAY - 1)).toEqual([]);
    expect(judge(again, 600 + DAY)).toEqual([ONE]);
    expect(outcomes(again)).toEqual([[ONE, 'stalled', `Nothing has moved for this resume since ${later(600).toISOString()}: 24 hours without progress, and no wait that explains it.`]]);
});

test('a ticket that stops for another cause after its resume is chained to that incident', async () => {
    const w = await world();
    admit(w);
    ran(w, 0);
    // QA ran and the harness stopped it for something else: another cause, another incident, the same ticket.
    Object.assign(held(w, 'CEC-1'), { blocker: 'Error: the board refused the status change', stop: { kind: 'unclassified', at: later(6).toISOString() } });
    w.observed(7);
    const other = w.ledger.list().find(incident => incident.id !== w.id)!;
    expect(other.subjects.map(subject => subject.id)).toEqual(['ticket:CEC-1']);
    expect(judge(w, 8)).toEqual([ONE]);
    expect(outcomes(w)).toEqual([[ONE, 'chained', `${ONE} stopped for another cause after the resume (${other.id}).`]]);
    expect(judge(w, 9)).toEqual([]);
});

test('a resume whose own delivery request stopped is chained to the incident that holds that request', async () => {
    const w = await world();
    admit(w);
    const request = ran(w, 0, 'blocked');
    request.error = 'Error: Ownership/eligibility requires attention';
    // The scheduler shows the stopped request under its own ID, beside the ticket it was for.
    syncIncidents(w.ledger, office(observe(w.store, [item('delivery', 'ticket:CEC-1', 'qa', 'blocked', 'Blocked', 'unclassified', 'cec'), item('delivery', request.id, 'resume-ticket', 'blocked', 'Blocked', 'unclassified', 'cec')])), later(6), undefined, fail);
    const other = w.ledger.list().find(incident => incident.id !== w.id)!;
    expect(other.subjects.map(subject => subject.id)).toEqual([request.id]);
    expect(judge(w, 7)).toEqual([ONE]);
    expect(outcomes(w)).toEqual([[ONE, 'chained', `cec/delivery/${request.id} stopped for another cause after the resume (${other.id}).`]]);
});

test('a ticket\'s resume admitted before its attempts were counted is untested: how the ticket stood was not recorded', async () => {
    const w = await world(['CEC-1', 'CEC-2'], { kind: 'stage-result-passed', stage: 'qa' });
    // CEC-1 had passed QA before it was stopped; CEC-2 had never run a stage.
    w.store.clock.now = () => later(2);
    attempt(w, 'CEC-1', 'qa', 'passed');
    w.store.clock.now = () => later(5);
    admit(w);
    expect(w.requests().map(request => request.repairResume!.stood!.steps)).toEqual([1, 0]);
    // As a release from before the count saved it: none, whatever the ticket had run.
    const legacy = w.requests()[0].repairResume!.stood!;
    legacy.steps = 0;
    delete legacy.ticketAttemptsCounted;
    expect(judge(w)).toEqual([ONE]);
    expect(outcomes(w)).toEqual([[ONE, 'untested', 'The resume was admitted before outcomes were judged: how the ticket stood then was not recorded.']]);
    // A count of none is the truth for a ticket that had run nothing: its later pass counts.
    w.store.clock.now = () => later(6);
    attempt(w, 'CEC-2', 'qa', 'passed');
    expect(judge(w, 7)).toEqual([TWO]);
    expect(outcomes(w)[1]).toEqual([TWO, 'advanced', 'A passed qa result was saved after the resume.']);
    // An attempt begun at the very instant of the admission was begun by it: the count of none was not the truth.
    const edge = await world(['CEC-1'], { kind: 'stage-result-passed', stage: 'qa' });
    edge.store.clock.now = () => later(5);
    attempt(edge, 'CEC-1', 'qa', 'passed');
    admit(edge);
    const stood = edge.requests()[0].repairResume!.stood!;
    stood.steps = 0;
    delete stood.ticketAttemptsCounted;
    expect(judge(edge)).toEqual([ONE]);
    expect(outcomes(edge)[0][1]).toBe('untested');
});

test('an unmarked count is distrusted only when it is none and attempts had begun by the admission', async () => {
    const w = await world(['CEC-1', 'CEC-2'], { kind: 'stage-result-passed', stage: 'qa' });
    w.store.clock.now = () => later(2);
    attempt(w, 'CEC-1', 'qa', 'passed');
    w.store.clock.now = () => later(5);
    admit(w);
    // Neither carries the mark: one counted an attempt, the other truthfully counted none.
    for (const request of w.requests()) delete request.repairResume!.stood!.ticketAttemptsCounted;
    expect(w.requests().map(request => request.repairResume!.stood)).toMatchObject([{ steps: 1 }, { steps: 0 }]);
    expect(judge(w)).toEqual([]);
    w.store.clock.now = () => later(6);
    attempt(w, 'CEC-1', 'qa', 'passed'); attempt(w, 'CEC-2', 'qa', 'passed');
    expect(judge(w, 7)).toEqual([ONE, TWO]);
    expect(outcomes(w).map(([, outcome]) => outcome)).toEqual(['advanced', 'advanced']);
});

test('a passing attempt inserted after admission counts even at the same timestamp', async () => {
    const w = await world(['CEC-1'], { kind: 'stage-result-passed', stage: 'qa' });
    w.store.clock.now = () => later(5);
    expect(admit(w)).toEqual([ONE]);
    expect(w.requests()[0].repairResume!.stood).toMatchObject({ steps: 0, ticketAttemptsCounted: true });
    attempt(w, 'CEC-1', 'qa', 'passed');
    expect(judge(w)).toEqual([ONE]);
    expect(outcomes(w)).toEqual([[ONE, 'advanced', 'A passed qa result was saved after the resume.']]);
});

test('a final ticket outcome uses ledger evidence for recurrence without reading attempts', async () => {
    const w = await world();
    expect(admit(w)).toEqual([ONE]);
    delete w.requests()[0].repairResume!.stood!.ticketAttemptsCounted;
    w.observed(6);
    ran(w);
    move(w, 'CEC-1', 'publish');
    expect(judge(w, 7)).toEqual([ONE]);
    expect(w.ledger.get(w.id)!.state).toBe('deployed');

    const prepare = w.store.db.prepare.bind(w.store.db);
    const attempts = vi.spyOn(w.store.db, 'prepare').mockImplementation(sql => {
        if (sql.includes('FROM attempts')) throw new Error('Attempt rows are unavailable');
        return prepare(sql);
    });
    const record = vi.spyOn(w.ledger, 'record');
    expect(judge(w, 8)).toEqual([]);
    expect(record).not.toHaveBeenCalled();

    move(w, 'CEC-1', 'qa', 'blocked');
    Object.assign(held(w, 'CEC-1'), { blocker: 'Error: the preview host never answered', stop: { kind: 'unclassified', at: later(9).toISOString() } });
    w.observed(10);
    attempts.mockClear();
    expect(judge(w, 11)).toEqual([ONE]);
    expect(attempts).not.toHaveBeenCalled();
    expect(outcomes(w)).toEqual([[ONE, 'recurred', `The subject stopped again for this incident's cause, seen at ${later(10).toISOString()}, after its resume.`]]);
});

test.each(['attemptsBegunBy', 'ticketProgress'] as const)('a fence taken during %s stops the pass after the query returns', async query => {
    const w = await world(['CEC-1', 'CEC-2']);
    expect(admit(w)).toEqual([ONE, TWO]);
    delete w.requests()[1].repairResume!.stood!.ticketAttemptsCounted;
    move(w, 'CEC-1', 'publish');
    move(w, 'CEC-2', 'publish');

    let fenced = false;
    const count = progress.attemptsBegunBy, read = progress.ticketProgress;
    if (query === 'attemptsBegunBy') {
        vi.spyOn(progress, 'attemptsBegunBy').mockImplementation((store, key, at) => {
            const result = count(store, key, at);
            if (key === 'CEC-2') fenced = true;
            return result;
        });
    } else {
        vi.spyOn(progress, 'ticketProgress').mockImplementation((store, key) => {
            const result = read(store, key);
            if (key === 'CEC-2') fenced = true;
            return result;
        });
    }

    const queriesWhileFenced: string[] = [];
    for (const db of [w.store.db, w.db]) {
        const prepare = db.prepare.bind(db);
        vi.spyOn(db, 'prepare').mockImplementation(sql => {
            if (fenced) queriesWhileFenced.push(sql);
            return prepare(sql);
        });
    }
    const record = vi.spyOn(w.ledger, 'record');
    expect(judge(w, 6, () => fenced)).toEqual([ONE]);
    expect(fenced).toBe(true);
    expect(queriesWhileFenced).toEqual([]);
    expect(record).toHaveBeenCalledTimes(1);
});
