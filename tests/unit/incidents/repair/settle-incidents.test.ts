import { afterEach, expect, test, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { compareMemory } from '../../../../server/incidents/deployed-fixes';
import { eventId } from '../../../../server/incidents/event-id';
import { admitResume } from '../../../../server/incidents/repair/dispatch-resume';
import { judgeResumes } from '../../../../server/incidents/repair/judge-resumes';
import { dispatchResumes } from '../../../../server/incidents/repair/resume-arrivals';
import { settleIncidents } from '../../../../server/incidents/repair/settle-incidents';
import { recordWithdrawnFixes } from '../../../../server/incidents/withdrawn-fixes';
import type { Store } from '../../../../server/store/store';
import type { ResumeSwitch } from '../../../../src/contracts/incidents';
import { fakeGitHub } from '../github-fake';
import { job, later } from './repair-wait-fixture';
import { deployedWorld, ENABLED, FIX, OPERATION, PAUSED, RELEASE } from './resume-fixture';

const stores: Store[] = [], dbs: DatabaseSync[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); dbs.splice(0).forEach(db => db.close()); });
type World = Awaited<ReturnType<typeof deployedWorld>>;
const ONE = 'cms-field-vocabulary/delivery/1', TWO = 'cms-field-vocabulary/delivery/2', THREE = 'cms-field-vocabulary/delivery/3';
const fail = (message: string) => { throw new Error(message); };
type More = { fenced?: () => boolean; report?: (message: string) => void; running?: () => unknown };
const HOLDS_IT = { commit: RELEASE, operation: OPERATION };
const settle = (w: World, minutes: number, more: More = {}) => settleIncidents({ ledger: w.ledger, running: more.running ?? (() => HOLDS_IT), now: () => later(minutes), fenced: more.fenced ?? (() => false), report: more.report ?? fail });
const admit = (w: World, control: ResumeSwitch = ENABLED) => dispatchResumes({ ledger: w.ledger, entries: [{ store: w.store }], control: { read: () => control }, running: () => HOLDS_IT, now: () => later(5), fenced: () => false, report: fail }).admitted;
const judge = (w: World, minutes: number) => judgeResumes({ ledger: w.ledger, entries: [{ store: w.store }], running: () => HOLDS_IT, now: () => later(minutes), fenced: () => false, report: fail });
const leave = (w: World, n: number) => Object.assign(w.jobs()[n], { stage: 'lead-pr', status: 'queued' });
const stopAgain = (w: World, n: number, at: string) => Object.assign(w.jobs()[n], { stage: 'review', status: 'blocked', stop: { kind: 'unclassified', at } });
const moves = (w: World) => w.ledger.events(w.id).filter(event => event.kind.startsWith('incident-') && event.kind !== 'incident-observed');
/** Both resumes admitted at minute 5, both jobs past the boundary, both outcomes recorded at minute 6. */
async function advanced() {
    const w = await deployedWorld(stores, dbs);
    admit(w); leave(w, 0); leave(w, 1);
    expect(judge(w, 6)).toEqual([ONE, TWO]);
    return w;
}

test('a deployed incident whose resumes are still open is left as it is', async () => {
    const w = await deployedWorld(stores, dbs);
    admit(w);
    const before = JSON.stringify(w.ledger.get(w.id));
    expect(settle(w, 6)).toEqual({ verified: [], recurred: [] });
    // One advanced and the other still pending: not yet.
    leave(w, 0);
    judge(w, 6);
    expect(settle(w, 7)).toEqual({ verified: [], recurred: [] });
    expect(moves(w)).toEqual([]);
    expect(w.ledger.get(w.id)!.state).toBe('deployed');
    expect(JSON.parse(before).fixes[0].bindings).toEqual(w.ledger.get(w.id)!.fixes![0].bindings);
});

test('every resume advanced: the incident is verified once, with the fix it was for, and nothing else about it changes', async () => {
    const w = await advanced(), before = w.ledger.get(w.id)!, saved = w.saved(), state = JSON.stringify(w.store.state);
    expect(settle(w, 7)).toEqual({ verified: [w.id], recurred: [] });
    const id = eventId(w.id, 'incident-verified', 'cli-bind-1');
    expect(moves(w)).toEqual([{ id, incident: w.id, at: later(7).toISOString(), kind: 'incident-verified', body: { fix: 'cli-bind-1', commit: FIX, from: 'deployed', to: 'verified', revision: before.revision + 1,
        detail: 'Every subject of the fix is accounted for and 2 resumed past the boundary the fix declared.', subjects: [ONE, TWO] } }]);
    expect(w.ledger.get(w.id)).toEqual({ ...before, state: 'verified', revision: before.revision + 1, verified: { event: id, fix: 'cli-bind-1', at: later(7).toISOString() } });
    // The project is neither read for it nor written.
    expect([w.saved(), JSON.stringify(w.store.state)]).toEqual([saved, state]);
    for (const minutes of [8, 9, 600]) expect(settle(w, minutes)).toEqual({ verified: [], recurred: [] });
    expect(moves(w)).toHaveLength(1);
    // A rollback does not undo it: the withdrawal reads deployed incidents only.
    expect((await recordWithdrawnFixes({ ledger: w.ledger, identity: () => ({ status: 'unknown', reason: 'no deployment has recorded an active release' }), execute: fakeGitHub({}).execute, now: later(601), memory: compareMemory(), limit: 10 })).withdrawn).toEqual([]);
    expect(w.ledger.get(w.id)!.state).toBe('verified');
});

test.each([
    { order: 'append order despite an earlier mark timestamp', markMinute: 3, backfilled: false },
    { order: 'saved admission time despite later ledger backfill', markMinute: 12, backfilled: true },
])('a replacement mark after admission makes advances during withdrawal untested by $order', async ({ markMinute, backfilled }) => {
    const w = await deployedWorld(stores, dbs);
    if (backfilled) {
        for (const id of ['1', '2']) expect(admitResume(w.store, w.intent(id), later(5))).toHaveProperty('admitted');
    } else {
        expect(admit(w)).toEqual([ONE, TWO]);
    }
    const withdrawal = await recordWithdrawnFixes({ ledger: w.ledger, identity: () => ({ status: 'unknown', reason: 'no deployment has recorded an active release' }), execute: fakeGitHub({}).execute, now: later(10), memory: compareMemory(), limit: 10 });
    expect(withdrawal.withdrawn).toEqual([w.id]);
    leave(w, 0); leave(w, 1);
    expect((await w.arrive(undefined, markMinute)).deployed).toEqual([w.id]);
    if (backfilled) expect(admit(w, PAUSED)).toEqual([ONE, TWO]);
    expect(judge(w, 13)).toEqual([ONE, TWO]);
    expect(w.ledger.get(w.id)!.fixes!.at(-1)!.outcomes?.map(({ outcome }) => outcome)).toEqual(['untested', 'untested']);
    expect(settle(w, 14)).toEqual({ verified: [], recurred: [] });
    expect(w.ledger.get(w.id)!.state).toBe('deployed');
    expect(moves(w)).toEqual([]);
});

test('an admission under the original mark stays pending after the clock steps back and blocks settlement until it advances', async () => {
    const w = await deployedWorld(stores, dbs);
    expect(admitResume(w.store, w.intent('1'), later(5))).toHaveProperty('admitted');
    expect(admit(w, PAUSED)).toEqual([ONE]);
    leave(w, 0);
    expect(judge(w, 6)).toEqual([ONE]);

    expect(admitResume(w.store, w.intent('2'), later(3))).toHaveProperty('admitted');
    expect(admit(w, PAUSED)).toEqual([TWO]);
    const history = w.ledger.events(w.id);
    const mark = history.findIndex(event => event.kind === 'fix-deployed');
    const admission = history.findIndex(event => event.kind === 'resume-admitted' && event.body.subject === TWO);
    expect(mark).toBeGreaterThanOrEqual(0);
    expect(admission).toBeGreaterThan(mark);
    expect(history[admission].at).toBe(later(3).toISOString());
    expect(judge(w, 4)).toEqual([]);
    expect(settle(w, 4)).toEqual({ verified: [], recurred: [] });
    expect(w.ledger.get(w.id)!.state).toBe('deployed');

    leave(w, 1);
    expect(judge(w, 5)).toEqual([TWO]);
    expect(settle(w, 5)).toEqual({ verified: [w.id], recurred: [] });
    expect(settle(w, 6)).toEqual({ verified: [], recurred: [] });
    expect(moves(w).map(event => event.kind)).toEqual(['incident-verified']);
});

test('a subject still waiting for its resume keeps the incident deployed; once its stop is gone the incident is verified', async () => {
    const w = await deployedWorld(stores, dbs);
    admitResume(w.store, w.intent('1'), later(5));
    // The switch is paused: the first admission is recorded, the second subject is held.
    expect(admit(w, PAUSED)).toEqual([ONE]);
    leave(w, 0);
    expect(judge(w, 6)).toEqual([ONE]);
    expect(settle(w, 7)).toEqual({ verified: [], recurred: [] });
    // A person moved the second job on: its stop cleared without a resume.
    leave(w, 1);
    w.observed(9);
    expect(settle(w, 10)).toEqual({ verified: [w.id], recurred: [] });
    expect(moves(w).map(event => event.body.subjects)).toEqual([[ONE]]);
});

test('a resume that recurred makes the incident recurred at once; its waits end and a new repair can start', async () => {
    const w = await deployedWorld(stores, dbs);
    admitResume(w.store, w.intent('1'), later(5));
    admit(w, PAUSED);
    stopAgain(w, 0, 't2');
    w.observed(6);
    expect(judge(w, 7)).toEqual([ONE]);
    const before = w.ledger.get(w.id)!;
    expect(Object.keys(w.waits())).toEqual(['delivery/2']);
    expect(settle(w, 8)).toEqual({ verified: [], recurred: [w.id] });
    expect(moves(w)).toEqual([{ id: eventId(w.id, 'incident-recurred', 'cli-bind-1'), incident: w.id, at: later(8).toISOString(), kind: 'incident-recurred', body: { fix: 'cli-bind-1', commit: FIX, from: 'deployed', to: 'recurred', revision: before.revision + 1,
        detail: `The cause stopped work again after the fix was found in the running release at ${later(4).toISOString()}.`, subjects: [ONE] } }]);
    // The failed fix, its bindings and its outcomes are kept.
    expect(w.ledger.get(w.id)).toEqual({ ...before, state: 'recurred', revision: before.revision + 1 });
    expect(settle(w, 9)).toEqual({ verified: [], recurred: [] });
    // The subject that was never resumed is no longer held for this repair.
    w.pass(10);
    expect(w.waits()).toEqual({});
    w.start('cli-start-2', 11);
    expect(w.ledger.get(w.id)!.state).toBe('fixing');
});

test('work the fix does not name, stopped by the same cause after the deployment mark, makes the incident recurred', async () => {
    const w = await advanced();
    w.jobs().push(job('3', { stop: { kind: 'unclassified', at: 't9' } }) as never);
    w.observed(7);
    expect(w.ledger.get(w.id)!.subjects.map(subject => subject.id)).toEqual(['1', '2', '3']);
    expect(settle(w, 8)).toEqual({ verified: [], recurred: [w.id] });
    expect(moves(w).map(event => [event.kind, event.body.subjects])).toEqual([['incident-recurred', [THREE]]]);
});

test('a verified incident whose cause stops work again becomes recurred, once, and keeps what it was verified for', async () => {
    const w = await advanced();
    expect(settle(w, 7)).toEqual({ verified: [w.id], recurred: [] });
    const verified = w.ledger.get(w.id)!.verified!;
    stopAgain(w, 1, 't2');
    w.observed(8);
    expect(settle(w, 9)).toEqual({ verified: [], recurred: [w.id] });
    expect(moves(w).at(-1)).toMatchObject({ id: eventId(w.id, 'incident-recurred', verified.event), kind: 'incident-recurred', body: { from: 'verified', to: 'recurred', subjects: [TWO], detail: `After the incident was verified at ${later(7).toISOString()}, the ledger observed another stop for the same cause.` } });
    expect(w.ledger.get(w.id)).toMatchObject({ state: 'recurred', verified });
    expect(settle(w, 10)).toEqual({ verified: [], recurred: [] });
    expect(moves(w).map(event => event.kind)).toEqual(['incident-verified', 'incident-recurred']);
});

test('a stop dated between deployment and verification recurs when the ledger first sees it after verification', async () => {
    const w = await advanced();
    w.jobs().push(job('3', { stop: { kind: 'unclassified', at: later(6).toISOString() } }) as never);
    expect(settle(w, 8)).toEqual({ verified: [w.id], recurred: [] });
    w.observed(9);
    expect(settle(w, 9)).toEqual({ verified: [], recurred: [w.id] });
    expect(moves(w).at(-1)).toMatchObject({ kind: 'incident-recurred', body: { subjects: [THREE] } });
});

test('nothing is read or recorded once the deployment fence is held: at the start, between listings, incidents and admission lookups, or before a write', async () => {
    const w = await advanced();
    const incident = w.ledger.get(w.id)!, second = 'inc-ffffffffffffffff';
    const reads: string[] = [];
    const inState = w.ledger.inState.bind(w.ledger), get = w.ledger.get.bind(w.ledger), record = w.ledger.record.bind(w.ledger), event = w.ledger.event.bind(w.ledger);
    w.ledger.inState = state => { reads.push(`list ${state}`); return inState(state); };
    w.ledger.get = id => { reads.push(`get ${id}`); return get(id); };
    const readAdmission = (id: string) => { reads.push('event'); return event(id); };
    w.ledger.event = readAdmission;
    const openedAfter = w.ledger.openedAfter.bind(w.ledger);
    w.ledger.openedAfter = (id, events) => { reads.push('opened'); return openedAfter(id, events); };
    const NOTHING = { verified: [], recurred: [] };
    expect(settle(w, 7, { fenced: () => true })).toEqual(NOTHING);
    expect(reads).toEqual([]);
    // Taken as the deployed listing returns: neither that incident nor the verified listing is read.
    let asked = 0;
    expect(settle(w, 7, { fenced: () => ++asked > 1 })).toEqual(NOTHING);
    expect(reads).toEqual(['list deployed']);
    // Taken after the first admission lookup: the second is not made, and nothing is written.
    reads.length = 0;
    let held = false;
    w.ledger.event = id => {
        const admission = readAdmission(id);
        held = true;
        return admission;
    };
    expect(settle(w, 7, { fenced: () => held })).toEqual(NOTHING);
    expect(reads).toEqual(['list deployed', `get ${w.id}`, 'event']);
    w.ledger.event = readAdmission;
    // Taken as the opening history returns, before the move is written.
    reads.length = 0;
    held = false;
    w.ledger.openedAfter = (id, events) => {
        reads.push('opened');
        const openings = openedAfter(id, events);
        held = true;
        return openings;
    };
    expect(settle(w, 8, { fenced: () => held })).toEqual(NOTHING);
    expect(reads).toEqual(['list deployed', `get ${w.id}`, 'event', 'event', 'opened']);
    expect(get(w.id)!.state).toBe('deployed');
    w.ledger.openedAfter = openedAfter;
    // Taken as soon as the first move is written: the next incident is not read, nor the verified listing.
    record({ events: [], incidents: [{ ...incident, id: second, fingerprint: second, revision: 1 }] });
    held = false;
    w.ledger.record = change => { record(change); held = true; reads.length = 0; };
    expect(settle(w, 9, { fenced: () => held })).toEqual({ verified: [w.id], recurred: [] });
    expect(reads).toEqual([]);
    w.ledger.record = record;
    expect(get(second)!.state).toBe('deployed');
});

test('settlement skips the verified listing when an empty deployed listing takes the fence', async () => {
    const w = await advanced();
    expect(settle(w, 7)).toEqual({ verified: [w.id], recurred: [] });
    let held = false;
    const list = w.ledger.inState.bind(w.ledger);
    const inState = vi.spyOn(w.ledger, 'inState').mockImplementationOnce(state => {
        const incidents = list(state);
        expect(incidents).toEqual([]);
        held = true;
        return incidents;
    });
    expect(settle(w, 8, { fenced: () => held })).toEqual({ verified: [], recurred: [] });
    expect(inState.mock.calls).toEqual([['deployed']]);
});

test('settlement skips the release lookup when reading a deployed incident takes the fence', async () => {
    const w = await advanced();
    let held = false;
    const get = w.ledger.get.bind(w.ledger);
    const readIncident = vi.spyOn(w.ledger, 'get').mockImplementationOnce(id => {
        const incident = get(id);
        held = true;
        return incident;
    });
    const running = vi.fn(() => HOLDS_IT), admission = vi.spyOn(w.ledger, 'event');
    const openedAfter = vi.spyOn(w.ledger, 'openedAfter'), record = vi.spyOn(w.ledger, 'record');
    expect(settle(w, 7, { fenced: () => held, running })).toEqual({ verified: [], recurred: [] });
    expect(readIncident).toHaveBeenCalledWith(w.id);
    expect(running).not.toHaveBeenCalled();
    expect(admission).not.toHaveBeenCalled();
    expect(openedAfter).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
});

test('settlement skips opening history when the final admission lookup takes the fence', async () => {
    const w = await advanced();
    let held = false, admissions = 0;
    const event = w.ledger.event.bind(w.ledger);
    w.ledger.event = id => {
        const found = event(id);
        held = ++admissions === 2;
        return found;
    };
    const openedAfter = vi.spyOn(w.ledger, 'openedAfter'), record = vi.spyOn(w.ledger, 'record');
    expect(settle(w, 7, { fenced: () => held })).toEqual({ verified: [], recurred: [] });
    expect(admissions).toBe(2);
    expect(openedAfter).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
});

test('settlement skips opening history when reading a verified incident takes the fence', async () => {
    const w = await advanced();
    expect(settle(w, 7)).toEqual({ verified: [w.id], recurred: [] });
    stopAgain(w, 0, 't2');
    w.observed(8);
    let held = false;
    const get = w.ledger.get.bind(w.ledger);
    w.ledger.get = id => {
        const incident = get(id);
        held = true;
        return incident;
    };
    const openedAfter = vi.spyOn(w.ledger, 'openedAfter'), record = vi.spyOn(w.ledger, 'record');
    expect(settle(w, 9, { fenced: () => held })).toEqual({ verified: [], recurred: [] });
    expect(held).toBe(true);
    expect(openedAfter).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
});

test('a deployed incident is settled only while the release that runs now is known to hold its fix; a verified one whatever runs', async () => {
    const w = await advanced();
    w.jobs().push(job('3', { stop: { kind: 'unclassified', at: 't9' } }) as never);
    w.observed(7);
    // After a rollback the mark still stands for a time: work the cause stops then says nothing of the fix, and nothing is looked up for the incident.
    let reads = 0;
    const get = w.ledger.get.bind(w.ledger), event = w.ledger.event.bind(w.ledger);
    w.ledger.event = id => { reads += 1; return event(id); };
    expect(settle(w, 8, { running: () => null })).toEqual({ verified: [], recurred: [] });
    expect(reads).toBe(0);
    expect(get(w.id)!.state).toBe('deployed');
    expect(settle(w, 9)).toEqual({ verified: [], recurred: [w.id] });
    // A verified incident whose cause returns is recurred with no release confirmed at all.
    const v = await advanced();
    expect(settle(v, 7)).toEqual({ verified: [v.id], recurred: [] });
    stopAgain(v, 0, 't2');
    v.observed(8);
    expect(settle(v, 9, { running: () => null })).toEqual({ verified: [], recurred: [v.id] });
});

test('what opened is told by the order the ledger wrote it in: a verification stamped earlier than an old opening does not make it a recurrence', async () => {
    const w = await advanced();
    // The clock stepped back before the verification: every subject's opening carries a later time than it.
    expect(settle(w, -5)).toEqual({ verified: [w.id], recurred: [] });
    expect(w.ledger.get(w.id)!.verified!.at < w.ledger.get(w.id)!.subjects[0].openedAt).toBe(true);
    for (const minutes of [-4, 7]) expect(settle(w, minutes)).toEqual({ verified: [], recurred: [] });
    // An opening the ledger records after it is one, even with an earlier time on it than the verification.
    stopAgain(w, 0, 't2');
    w.observed(-9);
    expect(settle(w, 8)).toEqual({ verified: [], recurred: [w.id] });
    expect(moves(w).map(event => event.kind)).toEqual(['incident-verified', 'incident-recurred']);
});

test('a stop the project dated before the deployment mark, first seen after it, does not make the incident recurred', async () => {
    const w = await advanced();
    // Stopped at minute 3, before the fix was found serving at minute 4; the ledger could not see it until minute 7.
    w.jobs().push(job('3', { stop: { kind: 'unclassified', at: later(3).toISOString() } }) as never);
    w.observed(7);
    expect(settle(w, 8)).toEqual({ verified: [w.id], recurred: [] });
    // Verified, it is measured from the verification: that opening is before it, also once the projection has let the subject and its date go.
    const incident = w.ledger.get(w.id)!;
    w.ledger.record({ events: [], incidents: [{ ...incident, revision: incident.revision + 1, subjects: incident.subjects.filter(subject => subject.id !== '3') }] });
    expect(settle(w, 9)).toEqual({ verified: [], recurred: [] });
    const x = await advanced();
    x.jobs().push(job('3', { stop: { kind: 'unclassified', at: later(5).toISOString() } }) as never);
    x.observed(7);
    expect(settle(x, 8)).toEqual({ verified: [], recurred: [x.id] });
});

test('a subject the fix gave a route this release cannot dispatch keeps the incident deployed while it is still stopped', async () => {
    const w = await deployedWorld(stores, dbs, ['1', '2'], jobId => jobId === '2' ? { action: 'requeue-implement', payload: { key: 'GH-2' }, expectedStage: 'review' } : { action: 'reconcile-review', payload: { key: 'GH-1' }, expectedStage: 'review' });
    expect(admit(w)).toEqual([ONE]);
    leave(w, 0);
    expect(judge(w, 6)).toEqual([ONE]);
    expect(settle(w, 7)).toEqual({ verified: [], recurred: [] });
    // Its stop clears without a resume: now it is accounted for.
    leave(w, 1);
    w.observed(8);
    expect(settle(w, 9)).toEqual({ verified: [w.id], recurred: [] });
});

test('an incident that cannot be settled is reported and leaves the others unaffected', async () => {
    const w = await advanced();
    const incident = w.ledger.get(w.id)!, first = 'inc-0000000000000000';
    // Listed before the fixture's incident, with a latest fix that cannot be read.
    w.ledger.record({ events: [], incidents: [{ ...incident, id: first, fingerprint: first, revision: 1, fixes: [{ ...incident.fixes![0], bindings: null as never }] }] });
    const reported: string[] = [];
    expect(settle(w, 7, { report: message => reported.push(message) })).toEqual({ verified: [w.id], recurred: [] });
    expect(reported).toEqual([expect.stringMatching(new RegExp(`^Incident ${first} could not be settled: TypeError`))]);
    expect(w.ledger.get(first)!.state).toBe('deployed');
});

test('incidents in other states are never read for a verdict', async () => {
    const w = await advanced(), incident = w.ledger.get(w.id)!;
    let reads = 0;
    const get = w.ledger.get.bind(w.ledger);
    w.ledger.get = id => { reads += 1; return get(id); };
    for (const [n, state] of (['shipped', 'fixing', 'recurred', 'observed'] as const).entries()) {
        w.ledger.record({ events: [], incidents: [{ ...incident, state, revision: incident.revision + 1 + n }] });
        expect(settle(w, 7), state).toEqual({ verified: [], recurred: [] });
    }
    // Not even opened: only deployed and verified incidents are listed for a verdict.
    expect(reads).toBe(0);
    expect(moves(w)).toEqual([]);
});
