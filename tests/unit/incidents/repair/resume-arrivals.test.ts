import { afterEach, expect, test, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { compareMemory } from '../../../../server/incidents/deployed-fixes';
import { admitResume } from '../../../../server/incidents/repair/dispatch-resume';
import { dispatchResumes, resumeAdmitted } from '../../../../server/incidents/repair/resume-arrivals';
import { assessResumes } from '../../../../server/incidents/repair/assess-resumes';
import { recordWithdrawnFixes } from '../../../../server/incidents/withdrawn-fixes';
import type { Store } from '../../../../server/store/store';
import type { IncidentFix, ResumeSwitch } from '../../../../src/contracts/incidents';
import { resumeIdentity } from '../../../../server/incidents/repair/resume-binding';
import { releaseHolding } from '../../../../server/incidents/repair/running-release';
import { comparison } from '../../../../server/incidents/deployed-fixes';
import { admitRepairWaits } from '../../../../server/incidents/repair/admit-repair-waits';
import { HOUR } from './repair-wait-fixture';
import { VERIFIED } from './resume-fixture';
import { SHA } from '../github-fake';
import { fakeGitHub } from '../github-fake';
import { later } from './repair-wait-fixture';
import { deployedWorld, ENABLED, FIX, OPERATION, PAUSED, RELEASE, reviewRoute } from './resume-fixture';

const stores: Store[] = [], dbs: DatabaseSync[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); dbs.splice(0).forEach(db => db.close()); });
type World = Awaited<ReturnType<typeof deployedWorld>>;
const ONE = 'cms-field-vocabulary/delivery/1', TWO = 'cms-field-vocabulary/delivery/2';
const HOLDS_IT = { commit: RELEASE, operation: OPERATION };
type More = { fenced?: () => boolean; entries?: { store: Store }[]; report?: (message: string) => void; running?: (fix: IncidentFix) => { commit: string; operation: string } | null; now?: () => Date };
const pass = (w: World, control: ResumeSwitch = ENABLED, minutes = 5, more: More = {}) =>
    dispatchResumes({ ledger: w.ledger, entries: more.entries ?? [{ store: w.store }], control: { read: () => control }, running: more.running ?? (() => HOLDS_IT), now: more.now ?? (() => later(minutes)), fenced: more.fenced ?? (() => false), report: more.report ?? (message => { throw new Error(message); }) });
const events = (w: World, kind: string) => w.ledger.events(w.id).filter(event => event.kind === kind);
const reading = (w: World, control: ResumeSwitch = ENABLED) => assessResumes(w.ledger.get(w.id)!, control, undefined, subject => resumeAdmitted(w.ledger, w.ledger.get(w.id)!, subject))!.subjects.map(subject => subject.standing);

test('with resumes enabled, every due subject is resumed once and the ledger records each admission once', async () => {
    const w = await deployedWorld(stores, dbs), revision = w.ledger.get(w.id)!.revision;
    expect(reading(w)).toEqual(['due', 'due']);
    expect(pass(w)).toEqual({ admitted: [ONE, TWO], refused: [], held: [] });
    expect(w.requests().map(request => [request.action, request.key, request.head, request.status])).toEqual([['reconcile-review', 'GH-1', '', 'queued'], ['reconcile-review', 'GH-2', '', 'queued']]);
    expect(events(w, 'resume-admitted').map(event => [event.at, event.body])).toEqual(w.requests().map((request, n) => [later(5).toISOString(),
        { resume: resumeIdentity(w.id, [ONE, TWO][n], 'cli-bind-1'), fix: 'cli-bind-1', commit: FIX, subject: [ONE, TWO][n], action: 'reconcile-review', payload: request.repairResume!.payload, request: request.id, release: { commit: RELEASE, operation: OPERATION } }]));
    // The incident itself is as it was: an admission is an event, not a change of state.
    expect(w.ledger.get(w.id)).toMatchObject({ state: 'deployed', revision });
    expect('repairWaits' in w.store.state.coordination!).toBe(false);
    expect(reading(w)).toEqual(['admitted', 'admitted']);
    // Any number of later passes: nothing more is queued and nothing more is recorded.
    const saved = [w.saved(), JSON.stringify(w.ledger.events(w.id))];
    for (const minutes of [6, 7, 600]) expect(pass(w, ENABLED, minutes)).toEqual({ admitted: [], refused: [], held: [] });
    expect([w.saved(), JSON.stringify(w.ledger.events(w.id))]).toEqual(saved);
    expect(w.requests()).toHaveLength(2);
});

test('with resumes paused nothing is queued, and the ledger says so once per subject; enabling them resumes what still waits', async () => {
    const w = await deployedWorld(stores, dbs), saved = w.saved();
    expect(pass(w, PAUSED)).toEqual({ admitted: [], refused: [], held: [ONE, TWO] });
    expect(pass(w, { ...PAUSED, revision: 9, reason: 'another reason' }, 6)).toEqual({ admitted: [], refused: [], held: [ONE, TWO] });
    expect(w.saved()).toBe(saved);
    expect(w.requests()).toEqual([]);
    expect(events(w, 'resume-refused').map(event => [event.at, event.body.subject, event.body.code, event.body.detail])).toEqual([
        [later(5).toISOString(), ONE, 'resumes-paused', 'Automatic repair resumes are paused: two rollbacks in a row'], [later(5).toISOString(), TWO, 'resumes-paused', 'Automatic repair resumes are paused: two rollbacks in a row']]);
    expect(pass(w, ENABLED, 7)).toEqual({ admitted: [ONE, TWO], refused: [], held: [] });
    expect(w.requests()).toHaveLength(2);
});

test('nothing is read or written while a deployment holds the fence, and a fence taken during the pass ends it', async () => {
    const w = await deployedWorld(stores, dbs), saved = [w.saved(), JSON.stringify(w.ledger.events(w.id))];
    let reads = 0;
    const counted = { ...w, ledger: new Proxy(w.ledger, { get: (target, name) => { if (name === 'inState') reads++; const value = Reflect.get(target, name); return typeof value === 'function' ? value.bind(target) : value; } }) } as World;
    expect(pass(counted, ENABLED, 5, { fenced: () => true })).toEqual({ admitted: [], refused: [], held: [] });
    expect(reads).toBe(0);
    expect([w.saved(), JSON.stringify(w.ledger.events(w.id))]).toEqual(saved);
    // Taken after the first subject was admitted: the second waits for the next pass.
    let asked = 0;
    expect(pass(w, ENABLED, 5, { fenced: () => asked++ >= 2 })).toEqual({ admitted: [ONE], refused: [], held: [] });
    expect(asked).toBe(3);
    expect(w.requests().map(request => request.key)).toEqual(['GH-1']);
    expect(pass(w, ENABLED, 6)).toEqual({ admitted: [TWO], refused: [], held: [] });
});

test('a refusal is on record once per reason, consumes nothing, and the subject is resumed when the reason goes', async () => {
    const w = await deployedWorld(stores, dbs);
    w.store.state.paused = true;
    expect(pass(w)).toEqual({ admitted: [], refused: [ONE, TWO], held: [] });
    expect(pass(w, ENABLED, 6)).toEqual({ admitted: [], refused: [ONE, TWO], held: [] });
    expect(events(w, 'resume-refused').map(event => [event.body.subject, event.body.code, event.body.detail, event.at])).toEqual([[ONE, 'project-paused', 'The project is paused.', later(5).toISOString()], [TWO, 'project-paused', 'The project is paused.', later(5).toISOString()]]);
    // A refusal names the release it was judged under.
    expect(events(w, 'resume-refused').map(event => event.body.release)).toEqual([HOLDS_IT, HOLDS_IT]);
    expect(w.requests()).toEqual([]);
    w.store.state.paused = false;
    // Another reason for one of them is its own record.
    w.store.state.coordination!.requests = [{ id: 'other', action: 'reconcile-pr-link', key: 'GH-2', head: '', lane: 'delivery', requestedAt: later(0).toISOString(), status: 'working', detail: '' }];
    expect(pass(w, ENABLED, 7)).toEqual({ admitted: [ONE], refused: [TWO], held: [] });
    expect(events(w, 'resume-refused').map(event => [event.body.subject, event.body.code])).toEqual([[ONE, 'project-paused'], [TWO, 'project-paused'], [TWO, 'request-pending']]);
    w.store.state.coordination!.requests![0].status = 'completed';
    expect(pass(w, ENABLED, 8)).toEqual({ admitted: [TWO], refused: [], held: [] });
    expect(events(w, 'resume-admitted')).toHaveLength(2);
});

test('an admission whose event was never recorded is recorded by the next pass from the request it finds, whatever the subject has done since', async () => {
    for (const moved of [false, true]) {
        const w = await deployedWorld(stores, dbs);
        // The project write happened; the pass stopped before the ledger write.
        const first = admitResume(w.store, w.intent('1'), later(5)) as { admitted: { id: string } };
        expect(events(w, 'resume-admitted')).toEqual([]);
        if (moved) {
            // The scheduler ran the request and the job moved on; observation cleared the subject.
            w.jobs()[0].status = 'queued';
            w.observed(6);
            expect(reading(w, ENABLED)[0]).toBe('gone');
        }
        expect(pass(w, moved ? PAUSED : ENABLED, 9).admitted).toContain(ONE);
        expect(w.requests().filter(request => request.key === 'GH-1')).toHaveLength(1);
        // The event carries the time of the admission, not of the pass that recorded it.
        expect(events(w, 'resume-admitted').filter(event => event.body.subject === ONE).map(event => [event.at, event.body.request])).toEqual([[later(5).toISOString(), first.admitted.id]]);
        expect(reading(w, ENABLED)[0]).toBe('admitted');
    }
});

test('a failed admission-event write leaves the bound request to be recorded on the next pass, even while paused', async () => {
    const w = await deployedWorld(stores, dbs, ['1']);
    const first = admitResume(w.store, w.intent('1'), later(5)) as { admitted: { id: string } };
    const reported: string[] = [];
    vi.spyOn(w.ledger, 'record').mockImplementationOnce(() => { throw new Error('ledger is busy'); });
    expect(pass(w, PAUSED, 6, { report: message => reported.push(message) })).toEqual({ admitted: [], refused: [], held: [] });
    expect(reported).toEqual([expect.stringContaining('ledger is busy')]);
    expect(events(w, 'resume-admitted')).toEqual([]);
    expect(events(w, 'resume-refused')).toEqual([]);

    expect(pass(w, PAUSED, 7)).toEqual({ admitted: [ONE], refused: [], held: [] });
    expect(pass(w, PAUSED, 8)).toEqual({ admitted: [], refused: [], held: [] });
    expect(events(w, 'resume-admitted').map(event => [event.body.request, event.at])).toEqual([[first.admitted.id, later(5).toISOString()]]);
    expect(events(w, 'resume-refused')).toEqual([]);
    expect(w.requests().map(request => request.id)).toEqual([first.admitted.id]);
    expect(w.admissions()).toEqual([first.admitted.id]);
});

test('a fix withdrawn and found again does not resume its subjects a second time', async () => {
    const w = await deployedWorld(stores, dbs);
    pass(w);
    expect(w.requests()).toHaveLength(2);
    expect((await recordWithdrawnFixes({ ledger: w.ledger, identity: () => ({ status: 'unknown', reason: 'no deployment has recorded an active release' }), execute: fakeGitHub({}).execute, now: later(10), memory: compareMemory(), limit: 10 })).withdrawn).toEqual([w.id]);
    // While it is shipped there is nothing to resume.
    expect(pass(w, ENABLED, 11)).toEqual({ admitted: [], refused: [], held: [] });
    await w.arrive(undefined, 12);
    expect(w.ledger.get(w.id)!.state).toBe('deployed');
    // The jobs stopped the same way again and are marked again? They are not: the fix has had its resume.
    expect(pass(w, ENABLED, 13)).toEqual({ admitted: [], refused: [], held: [] });
    expect(w.requests()).toHaveLength(2);
    expect(reading(w)).toEqual(['admitted', 'admitted']);
});

test('only what the reading calls due is put to admission: no route, a form this release does not dispatch, and a subject that is gone are left alone', async () => {
    const w = await deployedWorld(stores, dbs, ['1', '2', '3'], jobId => jobId === '1' ? reviewRoute('1', { payload: { key: 'GH-1', head: 'worker-1' } }) : jobId === '2' ? reviewRoute('2', { action: 'review-pr' }) : reviewRoute('3'));
    // The third job stopped again since: it is gone as bound.
    w.jobs()[2].stop = { kind: 'unclassified', at: 't2' };
    w.observed(4);
    expect(reading(w)).toEqual(['no-route', 'no-route', 'gone']);
    const saved = [w.saved(), JSON.stringify(w.ledger.events(w.id))];
    expect(pass(w)).toEqual({ admitted: [], refused: [], held: [] });
    expect([w.saved(), JSON.stringify(w.ledger.events(w.id))]).toEqual(saved);
});

test('a subject in a project this Office does not hold is refused; a project that fails is reported and the rest go on', async () => {
    const w = await deployedWorld(stores, dbs);
    expect(pass(w, ENABLED, 5, { entries: [] })).toEqual({ admitted: [], refused: [ONE, TWO], held: [] });
    expect(events(w, 'resume-refused').map(event => [event.body.code, event.body.detail])).toEqual([['no-record', `${ONE} is in no project this Office holds.`], ['no-record', `${TWO} is in no project this Office holds.`]]);
    const emit = w.store.emit.bind(w.store), reported: string[] = [];
    w.store.emit = ((kind: string, message: string, ...rest: unknown[]) => { if (kind === 'repair-resume-admitted' && message.startsWith('GH-1')) throw new Error('disk full token=ghp_abcdefghijklmnopqrstuvwxyz0123456789'); return (emit as (...args: unknown[]) => unknown)(kind, message, ...rest); }) as typeof w.store.emit;
    expect(pass(w, ENABLED, 6, { report: message => reported.push(message) })).toEqual({ admitted: [TWO], refused: [], held: [] });
    w.store.emit = emit;
    expect(reported).toHaveLength(1);
    expect(reported[0]).toMatch(new RegExp(`^A repair resume could not be admitted for ${ONE}: Error: disk full`));
    expect(reported[0]).not.toContain('ghp_');
    expect(w.requests().map(request => request.key)).toEqual(['GH-2']);
    expect(pass(w, ENABLED, 7)).toEqual({ admitted: [ONE], refused: [], held: [] });
});

test('only a deployed incident is read', async () => {
    const w = await deployedWorld(stores, dbs), incident = w.ledger.get(w.id)!;
    for (const state of ['shipped', 'fixing', 'observed', 'recurred', 'dismissed'] as const) {
        w.ledger.record({ events: [], incidents: [{ ...w.ledger.get(w.id)!, state, revision: w.ledger.get(w.id)!.revision + 1 }] });
        expect(pass(w), state).toEqual({ admitted: [], refused: [], held: [] });
    }
    expect(w.requests()).toEqual([]);
    expect(events(w, 'resume-refused')).toEqual([]);
    w.ledger.record({ events: [], incidents: [{ ...incident, revision: w.ledger.get(w.id)!.revision + 1 }] });
    expect(pass(w).admitted).toEqual([ONE, TWO]);
});

test('nothing is admitted unless the release that runs now is verified and known to hold the fix; the request names that release', async () => {
    const w = await deployedWorld(stores, dbs), fix = w.ledger.get(w.id)!.fixes!.at(-1)!, saved = w.saved();
    const NEWER = SHA('c'), OLDER = SHA('d'), answers = new Map<string, boolean>([[comparison(OLDER, FIX), false]]);
    const running = (identity: Parameters<typeof releaseHolding>[0]) => (asked: IncidentFix) => releaseHolding(identity, asked, answers);
    // The mark names RELEASE. Unknown, a release GitHub said lacks the fix, and one nothing was asked about yet, are each not enough.
    for (const identity of [{ status: 'unknown' as const, reason: 'no deployment has recorded an active release' }, { ...VERIFIED, commit: OLDER }, { ...VERIFIED, commit: NEWER }])
        expect(pass(w, ENABLED, 5, { running: running(identity) })).toEqual({ admitted: [], refused: [ONE, TWO], held: [] });
    expect(w.requests()).toEqual([]);
    expect(w.saved()).toBe(saved);
    expect(Object.keys(w.waits())).toEqual(['delivery/1', 'delivery/2']);
    expect(events(w, 'resume-refused').map(event => [event.body.subject, event.body.code, event.body.detail, event.body.release])).toEqual(
        [ONE, TWO].map(subject => [subject, 'release-unconfirmed', 'The release that runs now is not verified, or is not yet known to hold the fix.', null]));
    // The comparison confirms the newer release holds it: admitted, under that release and not the one the mark names.
    answers.set(comparison(NEWER, FIX), true);
    expect(pass(w, ENABLED, 6, { running: running({ ...VERIFIED, commit: NEWER, operation: 'deploy-newer' }) })).toEqual({ admitted: [ONE, TWO], refused: [], held: [] });
    expect(fix.deployed!.release.commit).toBe(RELEASE);
    expect(w.requests().map(request => request.repairResume!.release)).toEqual(Array(2).fill({ commit: NEWER, operation: 'deploy-newer' }));
    expect(events(w, 'resume-admitted').map(event => event.body.release)).toEqual(Array(2).fill({ commit: NEWER, operation: 'deploy-newer' }));
});

test('an admission the ledger never recorded is recorded even after its fix was withdrawn, once, with nothing queued', async () => {
    const w = await deployedWorld(stores, dbs), first = admitResume(w.store, w.intent('1'), later(5)) as { admitted: { id: string } };
    expect((await recordWithdrawnFixes({ ledger: w.ledger, identity: () => ({ status: 'unknown', reason: 'no deployment has recorded an active release' }), execute: fakeGitHub({}).execute, now: later(6), memory: compareMemory(), limit: 10 })).withdrawn).toEqual([w.id]);
    expect(w.ledger.get(w.id)!.state).toBe('shipped');
    expect(pass(w, PAUSED, 7, { running: () => null })).toEqual({ admitted: [ONE], refused: [], held: [] });
    expect(pass(w, PAUSED, 8, { running: () => null })).toEqual({ admitted: [], refused: [], held: [] });
    expect(events(w, 'resume-admitted').map(event => [event.at, event.body.fix, event.body.request, event.body.release])).toEqual([[later(5).toISOString(), 'cli-bind-1', first.admitted.id, { commit: RELEASE, operation: OPERATION }]]);
    expect(w.requests()).toHaveLength(1);
    expect(w.admissions()).toEqual([first.admitted.id]);
    // Not while fenced, though: the ledger is not written under a deployment.
    const v = await deployedWorld(stores, dbs);
    admitResume(v.store, v.intent('1'), later(5));
    let asked = 0;
    expect(pass(v, ENABLED, 7, { fenced: () => asked++ >= 1 })).toEqual({ admitted: [], refused: [], held: [] });
    expect(events(v, 'resume-admitted')).toEqual([]);
});

test('after a restart that changed the saved event ID, the subject is neither resumed nor marked again, and its one admission is on record', async () => {
    const fixEvent = 'cookie:fix-421';
    const w = await deployedWorld(stores, dbs, ['1', '2'], undefined, { fixEvent });
    const first = admitResume(w.store, w.intent('1'), later(5)) as { admitted: { id: string } };
    w.reload();
    expect(w.requests()[0].repairResume!.fix).toBe('cookie:[redacted]');
    // The request ran and ended; the job stands stopped as before and the incident is still deployed.
    w.requests()[0].status = 'completed';
    expect(admitRepairWaits(w.ledger, [{ store: w.store }], later(6), () => false, message => { throw new Error(message); })).toEqual({ admitted: [], expired: [], removed: [], unmarked: [] });
    expect(Object.keys(w.waits())).toEqual(['delivery/2']);
    expect(pass(w, ENABLED, 7)).toEqual({ admitted: [ONE, TWO], refused: [], held: [] });
    expect(pass(w, ENABLED, 8)).toEqual({ admitted: [], refused: [], held: [] });
    expect(w.requests().filter(request => request.key === 'GH-1').map(request => request.id)).toEqual([first.admitted.id]);
    expect(w.admissions().filter(ref => ref === first.admitted.id)).toHaveLength(1);
    const digests = [ONE, TWO].map(subject => resumeIdentity(w.id, subject, fixEvent));
    expect(w.requests().map(request => request.repairResume!.id)).toEqual(digests);
    expect(events(w, 'resume-admitted').map(event => [event.body.request, event.body.fix, event.body.resume])).toEqual(
        w.requests().map((request, index) => [request.id, 'cookie:[redacted]', digests[index]]));
    expect(reading(w)).toEqual(['admitted', 'admitted']);
});

test('each subject is judged at its own moment: a wait that runs out during the pass is not admitted', async () => {
    const w = await deployedWorld(stores, dbs);
    // The waits are kept first, as on every tick, so both follow the fix found at minute 4 and run out 48 hours after it. The clock reaches that between the two subjects.
    w.pass(5);
    expect(w.waits()['delivery/2'].progressAt).toBe(later(4).toISOString());
    const deadline = 4 + 48 * HOUR, times = [later(deadline - 1), later(deadline)];
    let reads = 0;
    expect(pass(w, ENABLED, 0, { now: () => times[Math.min(reads++, 1)] })).toEqual({ admitted: [ONE], refused: [TWO], held: [] });
    expect(reads).toBe(2);
    expect(w.requests().map(request => [request.key, request.repairResume!.admittedAt])).toEqual([['GH-1', later(deadline - 1).toISOString()]]);
    expect(w.admissions()).toHaveLength(1);
    expect(Object.keys(w.waits())).toEqual(['delivery/2']);
    expect(events(w, 'resume-refused').map(event => [event.body.subject, event.body.code, event.at])).toEqual([[TWO, 'wait-ended', later(deadline).toISOString()]]);
});

test('a repair wait that expires during release verification is refused at the deadline', async () => {
    const w = await deployedWorld(stores, dbs, ['1']);
    w.pass(5);
    const saved = w.saved(), deadline = 4 + 48 * HOUR;
    let at = later(deadline - 1);
    expect(pass(w, ENABLED, 0, { now: () => at, running: () => { at = later(deadline); return HOLDS_IT; } }))
        .toEqual({ admitted: [], refused: [ONE], held: [] });
    expect(events(w, 'resume-refused').map(event => [event.body.subject, event.body.code, event.at])).toEqual([[ONE, 'wait-ended', later(deadline).toISOString()]]);
    expect(Object.keys(w.waits())).toEqual(['delivery/1']);
    expect(w.saved()).toBe(saved);
    expect(w.requests()).toEqual([]);
    expect(w.admissions()).toEqual([]);
});

test('a subject the ledger records as admitted is left alone even when its project is not among those held', async () => {
    const w = await deployedWorld(stores, dbs);
    expect(pass(w).admitted).toEqual([ONE, TWO]);
    const recorded = JSON.stringify(w.ledger.events(w.id));
    // The project is missing from this pass: the ledger's own record is what says the resumes were made.
    expect(pass(w, ENABLED, 6, { entries: [] })).toEqual({ admitted: [], refused: [], held: [] });
    expect(pass(w, PAUSED, 7, { entries: [] })).toEqual({ admitted: [], refused: [], held: [] });
    expect(JSON.stringify(w.ledger.events(w.id))).toBe(recorded);
});
