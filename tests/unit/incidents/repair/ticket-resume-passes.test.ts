import { afterEach, expect, test, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { admitRepairWaits } from '../../../../server/incidents/repair/admit-repair-waits';
import { assessResumes } from '../../../../server/incidents/repair/assess-resumes';
import { admitTicketResume } from '../../../../server/incidents/repair/dispatch-ticket-resume';
import { judgeResumes } from '../../../../server/incidents/repair/judge-resumes';
import { dispatchResumes, resumeAdmitted, type ResumeProject } from '../../../../server/incidents/repair/resume-arrivals';
import { boundResume, boundTicketResume, resumeIdentity, resumeRequest } from '../../../../server/incidents/repair/resume-binding';
import { settleIncidents } from '../../../../server/incidents/repair/settle-incidents';
import type { Store } from '../../../../server/store/store';
import type { ResumeSwitch } from '../../../../src/contracts/incidents';
import { later } from '../incident-fixture';
import { ENABLED, FIX, OPERATION, PAUSED, RELEASE } from './resume-fixture';
import { STOPPED_AT, ticketSubject, ticketWorld } from './ticket-resume-fixture';

const stores: Store[] = [], dbs: DatabaseSync[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); dbs.splice(0).forEach(db => db.close()); });
type World = Awaited<ReturnType<typeof ticketWorld>>;
const ONE = ticketSubject('CEC-1'), TWO = ticketSubject('CEC-2'), HOLDS_IT = { commit: RELEASE, operation: OPERATION };
const fail = (message: string) => { throw new Error(message); };
/** The project as the service hands it to the pass: its store and its delivery queue. */
const project = (w: World): ResumeProject => ({ store: w.store, engine: { requestDelivery: (key, action, _status, routing) => { expect(action).toBe('resume-ticket'); expect(Object.keys(routing ?? {})).toEqual(['repairResume']); return w.queue(key, routing!.repairResume!); } } });
const pass = (w: World, control: ResumeSwitch = ENABLED, minutes = 5, entries: ResumeProject[] = [project(w)]) =>
    dispatchResumes({ ledger: w.ledger, entries, control: { read: () => control }, running: () => HOLDS_IT, now: () => later(minutes), fenced: () => false, report: fail });
const events = (w: World, kind: string) => w.ledger.events(w.id).filter(event => event.kind === kind);
const reading = (w: World, control: ResumeSwitch = ENABLED) => assessResumes(w.ledger.get(w.id)!, control, undefined, subject => resumeAdmitted(w.ledger, w.ledger.get(w.id)!, subject))!.subjects.map(subject => subject.standing);

test('with resumes enabled a due ticket is resumed once through its project\'s delivery queue, and the ledger records it once', async () => {
    const w = await ticketWorld(stores, dbs);
    expect(reading(w)).toEqual(['due', 'due']);
    expect(pass(w)).toEqual({ admitted: [ONE, TWO], refused: [], held: [] });
    expect(w.requests().map(request => [request.key, request.action, request.status, request.repairResume?.subject])).toEqual([['CEC-1', 'resume-ticket', 'queued', ONE], ['CEC-2', 'resume-ticket', 'queued', TWO]]);
    // Nothing went to the recovery requests a job's resume uses.
    expect(w.store.state.coordination!.requests ?? []).toEqual([]);
    expect(events(w, 'resume-admitted').map(event => [event.at, event.body])).toEqual(w.requests().map((request, n) => [later(5).toISOString(),
        { resume: resumeIdentity(w.id, [ONE, TWO][n], 'cli-bind-1'), fix: 'cli-bind-1', commit: FIX, subject: [ONE, TWO][n], action: 'resume-ticket', payload: request.repairResume!.payload, request: request.id, release: HOLDS_IT }]));
    expect(reading(w)).toEqual(['admitted', 'admitted']);
    expect('repairWaits' in w.store.state.coordination!).toBe(false);
    const saved = [w.saved(), JSON.stringify(w.ledger.events(w.id))];
    for (const minutes of [6, 7, 600]) expect(pass(w, ENABLED, minutes)).toEqual({ admitted: [], refused: [], held: [] });
    expect([w.saved(), JSON.stringify(w.ledger.events(w.id))]).toEqual(saved);
});

test('paused, a ticket is held like any subject; a project with no delivery queue cannot resume one', async () => {
    const w = await ticketWorld(stores, dbs);
    expect(pass(w, PAUSED)).toEqual({ admitted: [], refused: [], held: [ONE, TWO] });
    expect(w.requests()).toEqual([]);
    const saved = w.saved();
    expect(pass(w, ENABLED, 6, [{ store: w.store }])).toEqual({ admitted: [], refused: [ONE, TWO], held: [] });
    expect(w.saved()).toBe(saved);
    expect(events(w, 'resume-refused').filter(event => event.body.code !== 'resumes-paused').map(event => [event.body.subject, event.body.code, event.body.detail])).toEqual([
        [ONE, 'not-dispatchable', 'cec has no delivery queue to resume a ticket through.'], [TWO, 'not-dispatchable', 'cec has no delivery queue to resume a ticket through.']]);
    // A refusal consumed nothing: with the queue there, both are admitted.
    expect(pass(w, ENABLED, 7)).toEqual({ admitted: [ONE, TWO], refused: [], held: [] });
});

test('a ticket\'s refusal is recorded once with its reason, and the ticket is admitted when the reason is gone', async () => {
    const w = await ticketWorld(stores, dbs, ['CEC-1']);
    w.store.state.deliveryQueue = [{ id: 'other', key: 'CEC-1', action: 'resume-ticket', requestedAt: later(4).toISOString(), status: 'working', error: '' }];
    for (const minutes of [5, 6]) expect(pass(w, ENABLED, minutes)).toEqual({ admitted: [], refused: [ONE], held: [] });
    expect(events(w, 'resume-refused').map(event => [event.body.code, event.body.detail])).toEqual([['request-pending', 'Another delivery request for CEC-1 is queued or working.']]);
    w.store.state.deliveryQueue[0].status = 'completed';
    expect(pass(w, ENABLED, 7)).toEqual({ admitted: [ONE], refused: [], held: [] });
});

test('an admission the ledger never recorded is recorded from the delivery request itself, once, with nothing queued', async () => {
    const w = await ticketWorld(stores, dbs, ['CEC-1']);
    const first = admitTicketResume(w.store, w.queue, w.intent('CEC-1'), later(5)) as { admitted: { id: string } };
    expect(events(w, 'resume-admitted')).toEqual([]);
    expect(pass(w, PAUSED, 6)).toEqual({ admitted: [ONE], refused: [], held: [] });
    expect(pass(w, PAUSED, 7)).toEqual({ admitted: [], refused: [], held: [] });
    expect(events(w, 'resume-admitted').map(event => [event.at, event.body.request, event.body.action])).toEqual([[later(5).toISOString(), first.admitted.id, 'resume-ticket']]);
    expect(w.requests()).toHaveLength(1);
});

test('a failed admission-event write leaves the ticket\'s bound request to be recorded on the next pass, and it is not put to admission again', async () => {
    const w = await ticketWorld(stores, dbs, ['CEC-1']);
    const first = admitTicketResume(w.store, w.queue, w.intent('CEC-1'), later(5)) as { admitted: { id: string } };
    const reported: string[] = [];
    vi.spyOn(w.ledger, 'record').mockImplementationOnce(() => { throw new Error('ledger is busy'); });
    expect(dispatchResumes({ ledger: w.ledger, entries: [project(w)], control: { read: () => PAUSED }, running: () => HOLDS_IT, now: () => later(6), fenced: () => false, report: message => reported.push(message) })).toEqual({ admitted: [], refused: [], held: [] });
    expect(reported).toEqual([expect.stringContaining('ledger is busy')]);
    // Still due by the ledger's reading, and bound in the project: neither held nor refused, and not recorded twice.
    expect(events(w, 'resume-admitted')).toEqual([]);
    expect(events(w, 'resume-refused')).toEqual([]);
    expect(pass(w, PAUSED, 7)).toEqual({ admitted: [ONE], refused: [], held: [] });
    expect(pass(w, PAUSED, 8)).toEqual({ admitted: [], refused: [], held: [] });
    expect(events(w, 'resume-admitted').map(event => event.body.request)).toEqual([first.admitted.id]);
    expect(w.requests().map(request => request.id)).toEqual([first.admitted.id]);
});

test('a bound resume is found in whichever queue its route uses', async () => {
    const w = await ticketWorld(stores, dbs, ['CEC-1']);
    const identity = resumeIdentity(w.id, ONE, 'cli-bind-1');
    expect([boundResume(w.store.state, identity), boundTicketResume(w.store.state, identity), resumeRequest(w.store.state, identity)]).toEqual([undefined, undefined, undefined]);
    const { admitted } = admitTicketResume(w.store, w.queue, w.intent('CEC-1'), later(5)) as { admitted: { id: string } };
    expect(boundResume(w.store.state, identity)).toBeUndefined();
    expect(boundTicketResume(w.store.state, identity)).toBe(admitted);
    expect(resumeRequest(w.store.state, identity)).toBe(admitted);
    expect(resumeRequest(w.store.state, resumeIdentity(w.id, ONE, 'cli-bind-2'))).toBeUndefined();
    // A recovery request bound under the same identity is found first, as a job's resume is.
    const recovery = { id: 'r1', action: 'reconcile-review', key: 'GH-1', head: '', requestedAt: 'r', status: 'queued', detail: '', lane: 'delivery', repairResume: { id: identity } };
    w.store.state.coordination!.requests = [recovery as never];
    expect(resumeRequest(w.store.state, identity)).toBe(recovery);
});

test('a ticket that was resumed and stopped the same way again is not held for the repair a second time', async () => {
    const w = await ticketWorld(stores, dbs, ['CEC-1']);
    pass(w);
    expect(w.waits()).toEqual({});
    // Its request ended and the ticket stands stopped exactly as before: the fix has had its resume.
    w.requests()[0].status = 'blocked';
    const marked = admitRepairWaits(w.ledger, [{ store: w.store }], later(6), () => false, fail);
    expect(marked.admitted ?? []).toEqual([]);
    expect(w.waits()).toEqual({});
});

test('a ticket\'s resume has no outcome yet: the outcome pass leaves it alone and its incident is not settled on it', async () => {
    const w = await ticketWorld(stores, dbs, ['CEC-1']);
    pass(w);
    // Whatever became of the ticket and its request, nothing is read for it and nothing recorded.
    Object.assign(w.tickets()[0], { stage: 'publish', activity: 'waiting' });
    w.store.state.deliveryQueue = [];
    let asked = 0;
    const openedAfter = w.ledger.openedAfter.bind(w.ledger);
    w.ledger.openedAfter = (id, since) => { asked += 1; return openedAfter(id, since); };
    const judged = judgeResumes({ ledger: w.ledger, entries: [{ store: w.store }], running: () => HOLDS_IT, now: () => later(6 + 24 * 60), fenced: () => false, report: fail });
    expect(judged).toEqual([]);
    expect(asked).toBe(0);
    expect(w.ledger.get(w.id)!.fixes!.at(-1)!.outcomes).toBeUndefined();
    w.ledger.openedAfter = openedAfter;
    expect(settleIncidents({ ledger: w.ledger, running: () => HOLDS_IT, now: () => later(7 + 24 * 60), fenced: () => false, report: fail })).toEqual({ verified: [], recurred: [] });
    expect(w.ledger.get(w.id)!.state).toBe('deployed');
});

test('a ticket another request takes while it awaits its repair is no longer the Office\'s to resume for that fix', async () => {
    const w = await ticketWorld(stores, dbs, ['CEC-1']);
    // A person resumes the ticket. While that request is queued or working the scheduler shows no entry for the ticket, so the ledger sees its stop clear.
    w.store.state.deliveryQueue = [{ id: 'theirs', key: 'CEC-1', action: 'resume-ticket', requestedAt: later(4).toISOString(), status: 'queued', error: '' }];
    w.observed(5);
    expect(w.ledger.get(w.id)!.subjects.map(subject => subject.status)).toEqual(['cleared']);
    expect(reading(w)).toEqual(['gone']);
    w.mark(5);
    expect(w.waits()).toEqual({});
    expect(pass(w, ENABLED, 5)).toEqual({ admitted: [], refused: [], held: [] });
    // Their request ends and the ticket stands stopped exactly as before: it is another episode now, not the stop the fix was bound to.
    w.store.state.deliveryQueue[0].status = 'blocked';
    w.observed(6);
    expect(w.ledger.get(w.id)!.subjects.map(subject => [subject.status, subject.episodeCount])).toEqual([['open', 2]]);
    expect(reading(w)).toEqual(['gone']);
    w.mark(6);
    expect(pass(w, ENABLED, 7)).toEqual({ admitted: [], refused: [], held: [] });
    expect(w.requests().map(request => request.id)).toEqual(['theirs']);
    expect(events(w, 'resume-refused')).toEqual([]);
});

test('a resumed ticket that only came back into view with the stop it had is not a recurrence; one that stopped anew is', async () => {
    const settle = (w: World, minutes: number) => settleIncidents({ ledger: w.ledger, running: () => HOLDS_IT, now: () => later(minutes), fenced: () => false, report: fail });
    const w = await ticketWorld(stores, dbs, ['CEC-1']);
    pass(w);
    // While the Office's own request is queued the scheduler shows no entry for the ticket: the ledger sees the stop clear.
    w.observed(6);
    expect(w.ledger.get(w.id)!.subjects.map(subject => subject.status)).toEqual(['cleared']);
    // The handler refused: the request ends blocked and the ticket stands exactly as it stood, back in view.
    w.requests()[0].status = 'blocked';
    w.observed(7);
    expect(w.ledger.get(w.id)!.subjects.map(subject => [subject.status, subject.episode, subject.episodeCount])).toEqual([['open', STOPPED_AT, 2]]);
    // The ledger wrote that opening after the deployment mark; the project dated the stop before it, and that settles it.
    expect(w.ledger.openedAfter(w.id, [w.ledger.get(w.id)!.fixes!.at(-1)!.deployed!.event]).map(opened => opened.subject)).toEqual([ONE]);
    expect(settle(w, 8)).toEqual({ verified: [], recurred: [] });
    expect(w.ledger.get(w.id)!.state).toBe('deployed');
    // It then runs and the harness stops it again for the same cause: another stop, dated after the fix was deployed.
    Object.assign(w.tickets()[0], { stop: { kind: 'unclassified', at: later(8).toISOString() } });
    w.observed(9);
    expect(settle(w, 10)).toEqual({ verified: [], recurred: [w.id] });
});

test('a ticket whose stop has no date is never resumed by the Office, and one that comes back into view counts as stopping again', async () => {
    const w = await ticketWorld(stores, dbs, ['CEC-1'], 'cli-bind-1', { stop: undefined });
    expect(pass(w)).toEqual({ admitted: [], refused: [ONE], held: [] });
    expect(events(w, 'resume-refused').map(event => event.body.code)).toEqual(['ticket-not-resumable']);
    expect(w.requests()).toEqual([]);
    // A person resumes it; their request ends and the ticket is back in view, marked as it was. Whether its stage ran in between cannot be told, so it counts.
    w.store.state.deliveryQueue = [{ id: 'theirs', key: 'CEC-1', action: 'resume-ticket', requestedAt: later(5).toISOString(), status: 'queued', error: '' }];
    w.observed(6);
    w.store.state.deliveryQueue[0].status = 'blocked';
    w.observed(7);
    expect(w.ledger.get(w.id)!.subjects.map(subject => [subject.status, subject.episode, subject.episodeCount])).toEqual([['open', 'run-1:1', 2]]);
    expect(settleIncidents({ ledger: w.ledger, running: () => HOLDS_IT, now: () => later(8), fenced: () => false, report: fail })).toEqual({ verified: [], recurred: [w.id] });
});
