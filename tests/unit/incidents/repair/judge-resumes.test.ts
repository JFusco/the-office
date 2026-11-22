import { afterEach, expect, test, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { compareMemory } from '../../../../server/incidents/deployed-fixes';
import { eventId } from '../../../../server/incidents/event-id';
import { admitResume } from '../../../../server/incidents/repair/dispatch-resume';
import { judgeResumes } from '../../../../server/incidents/repair/judge-resumes';
import { dispatchResumes } from '../../../../server/incidents/repair/resume-arrivals';
import { resumeIdentity } from '../../../../server/incidents/repair/resume-binding';
import { syncIncidents } from '../../../../server/incidents/sync-incidents';
import { recordWithdrawnFixes } from '../../../../server/incidents/withdrawn-fixes';
import type { Store } from '../../../../server/store/store';
import type { SubjectFix } from '../../../../src/contracts/incidents';
import { fakeGitHub } from '../github-fake';
import { item, observe, office } from '../incident-fixture';
import { blocked, later } from './repair-wait-fixture';
import { deployedWorld, ENABLED, FIX, OPERATION, RELEASE } from './resume-fixture';

const stores: Store[] = [], dbs: DatabaseSync[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); dbs.splice(0).forEach(db => db.close()); });
type World = Awaited<ReturnType<typeof deployedWorld>>;
const ONE = 'cms-field-vocabulary/delivery/1', TWO = 'cms-field-vocabulary/delivery/2', THREE = 'cms-field-vocabulary/delivery/3';
const fail = (message: string) => { throw new Error(message); };
type More = { fenced?: () => boolean; entries?: { store: Store }[]; report?: (message: string) => void; running?: () => unknown };
const HOLDS_IT = { commit: RELEASE, operation: OPERATION };
const judge = (w: World, minutes = 6, more: More = {}) => judgeResumes({ ledger: w.ledger, entries: more.entries ?? [{ store: w.store }], running: more.running ?? (() => HOLDS_IT), now: () => later(minutes), fenced: more.fenced ?? (() => false), report: more.report ?? fail });
/** Queues every due resume at minute 5, as the pass before the judgement does. */
const admit = (w: World) => dispatchResumes({ ledger: w.ledger, entries: [{ store: w.store }], control: { read: () => ENABLED }, running: () => ({ commit: RELEASE, operation: OPERATION }), now: () => later(5), fenced: () => false, report: fail }).admitted;
const outcomes = (w: World) => w.ledger.get(w.id)!.fixes!.at(-1)!.outcomes ?? [];
const recorded = (w: World) => w.ledger.events(w.id).filter(event => event.kind === 'resume-outcome');
const leave = (w: World, n: number, stage = 'lead-pr') => Object.assign(w.jobs()[n], { stage, status: 'queued' });
/** The job stops again the way it had: the same cause, a later stop. */
const stopAgain = (w: World, n: number, at: string) => Object.assign(w.jobs()[n], { stage: 'review', status: 'blocked', stop: { kind: 'unclassified', at } });
const PASSED = (bound: SubjectFix): SubjectFix => bound.disposition === 'route' ? { ...bound, boundary: { kind: 'stage-result-passed', stage: 'review' } } : bound;

test('a resume whose job stands where it stood has no outcome: nothing is recorded', async () => {
    const w = await deployedWorld(stores, dbs);
    expect(admit(w)).toEqual([ONE, TWO]);
    const revision = w.ledger.get(w.id)!.revision;
    expect(judge(w)).toEqual([]);
    expect(recorded(w)).toEqual([]);
    expect(w.ledger.get(w.id)).toMatchObject({ state: 'deployed', revision });
    expect('outcomes' in w.ledger.get(w.id)!.fixes!.at(-1)!).toBe(false);
});

test('a crossed boundary is recorded once, in the history and on the fix; the incident keeps its state and the project is not written', async () => {
    const w = await deployedWorld(stores, dbs);
    admit(w);
    leave(w, 0);
    w.store.save();
    const before = w.ledger.get(w.id)!, saved = w.saved(), state = JSON.stringify(w.store.state), identity = resumeIdentity(w.id, ONE, 'cli-bind-1');
    expect(judge(w)).toEqual([ONE]);
    const detail = 'The job left review for lead-pr after its resume.', id = eventId(w.id, 'resume-outcome', identity, 'advanced');
    expect(recorded(w)).toEqual([{ id, incident: w.id, at: later(6).toISOString(), kind: 'resume-outcome', body: { resume: identity, fix: 'cli-bind-1', commit: FIX, subject: ONE, outcome: 'advanced', detail, replaces: null } }]);
    expect(outcomes(w)).toEqual([{ subject: ONE, outcome: 'advanced', detail, event: id, at: later(6).toISOString() }]);
    // Nothing else about the incident changed: an outcome is not a change of state.
    const after = w.ledger.get(w.id)!, { outcomes: _, ...fix } = after.fixes!.at(-1)!;
    expect({ ...after, fixes: [fix] }).toEqual({ ...before, revision: before.revision + 1 });
    expect([w.saved(), JSON.stringify(w.store.state)]).toEqual([saved, state]);
    // Later passes over the same evidence, and one after a restart, record nothing more.
    const history = JSON.stringify(w.ledger.events(w.id));
    for (const minutes of [7, 8, 600]) expect(judge(w, minutes)).toEqual([]);
    w.reload();
    expect(judge(w, 601)).toEqual([]);
    expect(JSON.stringify(w.ledger.events(w.id))).toBe(history);
    expect(w.ledger.get(w.id)!.revision).toBe(before.revision + 1);
});

test('every subject of an incident is judged in one pass, each written over the revision the one before left', async () => {
    const w = await deployedWorld(stores, dbs);
    admit(w);
    leave(w, 0); leave(w, 1, 'merge');
    const revision = w.ledger.get(w.id)!.revision;
    expect(judge(w)).toEqual([ONE, TWO]);
    expect(outcomes(w).map(outcome => [outcome.subject, outcome.outcome, outcome.detail])).toEqual([[ONE, 'advanced', 'The job left review for lead-pr after its resume.'], [TWO, 'advanced', 'The job left review for merge after its resume.']]);
    expect(w.ledger.get(w.id)!.revision).toBe(revision + 2);
});

test('a passed result saved after the admission crosses its boundary; the one the job had before does not', async () => {
    const w = await deployedWorld(stores, dbs, ['1', '2'], undefined, { declare: PASSED });
    admit(w);
    expect(judge(w)).toEqual([]);
    w.jobs()[0].steps.push({ ...w.jobs()[0].steps[0], stage: 'implementation-readback' } as never);
    expect(judge(w, 7)).toEqual([]);
    w.jobs()[0].steps.push(w.jobs()[0].steps[0]);
    expect(judge(w, 8)).toEqual([ONE]);
    expect(outcomes(w)).toMatchObject([{ subject: ONE, outcome: 'advanced', detail: 'A passed review result was saved after the resume.' }]);
});

test('a subject that stops again for the same cause after its resume has recurred, and that replaces an outcome already recorded', async () => {
    const w = await deployedWorld(stores, dbs);
    admit(w);
    leave(w, 0);
    expect(judge(w)).toEqual([ONE]);
    stopAgain(w, 0, 't2');
    w.observed(7);
    expect(judge(w, 8)).toEqual([ONE]);
    const detail = `The subject stopped again for this incident's cause, seen at ${later(7).toISOString()}, after its resume.`;
    expect(outcomes(w)).toEqual([{ subject: ONE, outcome: 'recurred', detail, event: eventId(w.id, 'resume-outcome', resumeIdentity(w.id, ONE, 'cli-bind-1'), 'recurred'), at: later(8).toISOString() }]);
    expect(recorded(w).map(event => [event.body.outcome, event.body.replaces])).toEqual([['advanced', null], ['recurred', 'advanced']]);
    // Nothing replaces it, whatever the job does next.
    leave(w, 0);
    for (const minutes of [9, 10]) expect(judge(w, minutes)).toEqual([]);
    expect(w.ledger.get(w.id)!.state).toBe('deployed');
    // The other subject never moved and never stopped again.
    expect(outcomes(w).map(outcome => outcome.subject)).toEqual([ONE]);
});

test('a job that stops for another cause is chained to that incident, until something final can be said of it', async () => {
    const w = await deployedWorld(stores, dbs);
    admit(w);
    Object.assign(w.jobs()[0], { detail: 'Error: the provider refused the board update', stop: { kind: 'unclassified', at: 't2' } });
    w.observed(6);
    const other = w.ledger.list().find(incident => incident.id !== w.id)!;
    expect(other.subjects.map(subject => subject.id)).toEqual(['1']);
    expect(judge(w, 7)).toEqual([ONE]);
    expect(outcomes(w)).toMatchObject([{ subject: ONE, outcome: 'chained', detail: `${ONE} stopped for another cause after the resume (${other.id}).` }]);
    // Chained is said once.
    expect(judge(w, 8)).toEqual([]);
    leave(w, 0);
    expect(judge(w, 9)).toEqual([ONE]);
    expect(outcomes(w)).toMatchObject([{ subject: ONE, outcome: 'advanced' }]);
    expect(recorded(w).map(event => [event.body.outcome, event.body.replaces])).toEqual([['chained', null], ['advanced', 'chained']]);
});

test('a resume whose own request stopped is chained to the incident that holds that request', async () => {
    const w = await deployedWorld(stores, dbs);
    admit(w);
    const request = w.requests()[1];
    Object.assign(request, { status: 'blocked', detail: 'Error: Saved review does not match the reviewed head', stop: { kind: 'unclassified', at: 't3' } });
    syncIncidents(w.ledger, office(observe(w.store, [blocked('1'), blocked('2'), item('reconciliation', request.id, 'reconcile-review', 'blocked', 'Blocked', 'unclassified')])), later(6), undefined, fail);
    const other = w.ledger.list().find(incident => incident.id !== w.id)!;
    expect(judge(w, 7)).toEqual([TWO]);
    expect(outcomes(w)).toMatchObject([{ subject: TWO, outcome: 'chained', detail: `cms-field-vocabulary/reconciliation/${request.id} stopped for another cause after the resume (${other.id}).` }]);
    // While it is only chained, an operator's move is still looked for, and replaces it.
    w.store.emit('pr-review-recheck', 'an operator rechecked GH-2', 'lead', 'GH-2');
    expect(judge(w, 8)).toEqual([TWO]);
    expect(recorded(w).map(event => [event.body.outcome, event.body.replaces])).toEqual([['chained', null], ['moved-by-hand', 'chained']]);
});

test('a stop elsewhere that cleared again, and the request standing open in this same incident, are not a chain', async () => {
    const w = await deployedWorld(stores, dbs);
    admit(w);
    const detail = w.jobs()[0].detail;
    for (const job of w.jobs()) Object.assign(job, { detail: 'Error: the provider refused the board update', stop: { kind: 'unclassified', at: 't2' } });
    w.observed(6);
    // The first ran again before it was judged: the other incident holds it cleared and the second still open, and this one never saw the first stop again.
    Object.assign(w.jobs()[0], { status: 'queued', detail });
    w.observed(7);
    expect(w.ledger.list().find(incident => incident.id !== w.id)!.subjects.map(subject => [subject.id, subject.status])).toEqual([['1', 'cleared'], ['2', 'open']]);
    expect(judge(w, 8)).toEqual([TWO]);
    // The resume's own request open in the incident it resumes for is that incident's business, not a link to another.
    const incident = w.ledger.get(w.id)!, request = w.requests()[0];
    w.ledger.record({ events: [], incidents: [{ ...incident, revision: incident.revision + 1, subjects: [...incident.subjects, { ...incident.subjects[0], kind: 'reconciliation', id: request.id, status: 'open', openedAt: later(8).toISOString() }] }] });
    expect(judge(w, 9)).toEqual([]);
    expect(outcomes(w).map(outcome => [outcome.subject, outcome.outcome])).toEqual([[TWO, 'chained']]);
});

test('an operator\'s command after the admission makes the outcome moved-by-hand, even with the boundary crossed; one before it does not', async () => {
    const w = await deployedWorld(stores, dbs);
    w.store.emit('pr-review-recheck', 'an operator rechecked GH-2 before the resume', 'lead', 'GH-2');
    admit(w);
    const move = w.store.emit('pr-review-recheck', 'an operator rechecked GH-1', 'lead', 'GH-1');
    leave(w, 0); leave(w, 1);
    expect(judge(w)).toEqual([ONE, TWO]);
    expect(outcomes(w).map(outcome => [outcome.subject, outcome.outcome, outcome.detail])).toEqual([
        [ONE, 'moved-by-hand', `An operator's command (pr-review-recheck) moved the job at ${move.at}, after its resume.`], [TWO, 'advanced', 'The job left review for lead-pr after its resume.']]);
});

test('a job or a request the project no longer holds is gone', async () => {
    const w = await deployedWorld(stores, dbs);
    admit(w);
    w.store.state.coordination!.jobs = w.jobs().filter(job => job.id !== '1');
    w.store.state.coordination!.requests = w.requests().filter(request => request.key !== 'GH-2');
    leave(w, 0);
    expect(judge(w)).toEqual([ONE, TWO]);
    expect(outcomes(w).map(outcome => [outcome.subject, outcome.outcome, outcome.detail])).toEqual([[ONE, 'gone', 'The project no longer holds the job.'], [TWO, 'gone', 'The project no longer holds the request this resume queued.']]);
});

test('a fix that declared no boundary is untested as soon as its resume is admitted; a subject with no route is never judged', async () => {
    const w = await deployedWorld(stores, dbs, ['1', '2'], undefined, { declare: bound => bound.disposition !== 'route' ? bound
        : bound.subject === ONE ? { subject: bound.subject, digest: bound.digest, disposition: 'undeclared-boundary', route: bound.route, reason: 'x'.repeat(480) }
        : { subject: bound.subject, digest: bound.digest, disposition: 'no-route', reason: 'nothing resumes it' } });
    expect(admit(w)).toEqual([ONE]);
    leave(w, 1);
    expect(judge(w)).toEqual([ONE]);
    // The detail is bounded, whatever a fix wrote.
    expect(outcomes(w)).toEqual([expect.objectContaining({ subject: ONE, outcome: 'untested', detail: `The fix declared no boundary to observe: ${'x'.repeat(480)}`.slice(0, 300) })]);
});

test('what a project wrote reaches the ledger with credentials removed', async () => {
    const w = await deployedWorld(stores, dbs);
    admit(w);
    leave(w, 0, `xoxb-1-2-${'c'.repeat(20)}`);
    expect(judge(w)).toEqual([ONE]);
    expect(JSON.stringify([outcomes(w), recorded(w)])).not.toContain('xoxb-');
    expect(outcomes(w)[0].detail).toMatch(/^The job left review for .+ after its resume\.$/);
});

test('while the fix is not deployed nothing is judged, and a resume admitted under an earlier deployment mark is untested', async () => {
    const w = await deployedWorld(stores, dbs);
    admit(w);
    leave(w, 0);
    expect((await recordWithdrawnFixes({ ledger: w.ledger, identity: () => ({ status: 'unknown', reason: 'no deployment has recorded an active release' }), execute: fakeGitHub({}).execute, now: later(10), memory: compareMemory(), limit: 10 })).withdrawn).toEqual([w.id]);
    expect(judge(w, 11)).toEqual([]);
    await w.arrive(undefined, 12);
    expect(w.ledger.get(w.id)!.state).toBe('deployed');
    expect(judge(w, 13)).toEqual([ONE, TWO]);
    const detail = 'The release that held the fix stopped serving after the resume was admitted; what happened since says nothing of the fix.';
    expect(outcomes(w).map(outcome => [outcome.subject, outcome.outcome, outcome.detail])).toEqual([[ONE, 'untested', detail], [TWO, 'untested', detail]]);
    // The outcomes stay on the fix when it is withdrawn again.
    await recordWithdrawnFixes({ ledger: w.ledger, identity: () => ({ status: 'unknown', reason: 'no deployment has recorded an active release' }), execute: fakeGitHub({}).execute, now: later(14), memory: compareMemory(), limit: 10 });
    expect(w.ledger.get(w.id)!.state).toBe('shipped');
    expect(outcomes(w)).toHaveLength(2);
});

test('only an admitted resume of the latest fix is judged', async () => {
    const w = await deployedWorld(stores, dbs);
    leave(w, 0);
    // Not admitted yet: whatever the job did, there is no resume to judge.
    expect(judge(w)).toEqual([]);
    Object.assign(w.jobs()[0], { stage: 'review', status: 'blocked' });
    admit(w);
    leave(w, 0);
    // An earlier fix of the same repair, bound before this one and never deployed, is not the one read.
    const incident = w.ledger.get(w.id)!, fix = incident.fixes!.at(-1)!, { deployed: _, ...earlier } = fix;
    w.ledger.record({ events: [], incidents: [{ ...incident, revision: incident.revision + 1, fixes: [{ ...earlier, event: 'cli-bind-0', bindings: [] }, fix] }] });
    expect(judge(w)).toEqual([ONE]);
    expect(w.ledger.get(w.id)!.fixes!.map(fix => [fix.event, fix.outcomes?.length ?? 0])).toEqual([['cli-bind-0', 0], ['cli-bind-1', 1]]);
});

test('an incident that is not deployed is not judged though its fix carries a mark, and a deployed one whose latest fix carries none is passed over', async () => {
    const w = await deployedWorld(stores, dbs);
    admit(w);
    leave(w, 0);
    const incident = w.ledger.get(w.id)!, fix = incident.fixes!.at(-1)!, { deployed: _, ...unmarked } = fix;
    w.ledger.record({ events: [], incidents: [{ ...incident, state: 'shipped', revision: incident.revision + 1 }] });
    expect(judge(w)).toEqual([]);
    w.ledger.record({ events: [], incidents: [{ ...incident, revision: incident.revision + 2, fixes: [unmarked] }] });
    expect(judge(w, 7)).toEqual([]);
    w.ledger.record({ events: [], incidents: [{ ...incident, revision: incident.revision + 3 }] });
    expect(judge(w, 8)).toEqual([ONE]);
});

test('nothing is read or recorded under the deployment fence: at the start, between subjects, or before a write', async () => {
    const w = await deployedWorld(stores, dbs);
    admit(w);
    leave(w, 0); leave(w, 1);
    const revision = w.ledger.get(w.id)!.revision;
    let reads = 0;
    const inState = w.ledger.inState.bind(w.ledger), get = w.ledger.get.bind(w.ledger), record = w.ledger.record.bind(w.ledger);
    w.ledger.inState = state => { reads += 1; return inState(state); };
    w.ledger.get = id => { reads += 1; return get(id); };
    expect(judge(w, 6, { fenced: () => true })).toEqual([]);
    expect(reads).toBe(0);
    // Taken as soon as the first outcome is written: the second subject is not read at all.
    let held = false;
    w.ledger.record = change => { record(change); held = true; reads = 0; };
    expect(judge(w, 7, { fenced: () => held })).toEqual([ONE]);
    expect(reads).toBe(0);
    w.ledger.record = record;
    expect(get(w.id)!.revision).toBe(revision + 1);
    // Only the second subject still needs evidence from the other incidents.
    held = false;
    const current = w.ledger.current.bind(w.ledger);
    w.ledger.current = fingerprints => {
        const incidents = current(fingerprints);
        held = true;
        return incidents;
    };
    const subjectChangedAt = vi.spyOn(w.ledger, 'subjectChangedAt');
    expect(judge(w, 8, { fenced: () => held })).toEqual([]);
    expect(held).toBe(true);
    expect(subjectChangedAt).not.toHaveBeenCalled();
    w.ledger.current = current;
    expect(get(w.id)!.revision).toBe(revision + 1);
    expect(judge(w, 9)).toEqual([TWO]);
});

test('a fence taken between deployed incidents stops the pass before it reads the next incident', async () => {
    const w = await deployedWorld(stores, dbs);
    // Split the fixture into two deployed incidents before admitting their resumes.
    const incident = w.ledger.get(w.id)!, fix = incident.fixes!.at(-1)!;
    const second = 'inc-ffffffffffffffff';
    const [firstBinding, secondBinding] = fix.bindings;
    w.ledger.record({ events: [], incidents: [
        { ...incident, revision: incident.revision + 1, subjects: [incident.subjects[0]], fixes: [{ ...fix, bindings: [firstBinding] }] },
        { ...incident, id: second, fingerprint: second, revision: 1, subjects: [incident.subjects[1]], fixes: [{ ...fix, bindings: [secondBinding] }] },
    ] });
    w.waits()['delivery/2'].incident = second;
    expect(admit(w)).toEqual([ONE, TWO]);
    leave(w, 0); leave(w, 1);

    const get = w.ledger.get.bind(w.ledger), record = w.ledger.record.bind(w.ledger);
    const reads: string[] = [];
    let held = false;
    w.ledger.get = id => { reads.push(id); return get(id); };
    w.ledger.record = change => { record(change); held = true; };
    expect(judge(w, 6, { fenced: () => held })).toEqual([ONE]);
    expect(reads).not.toContain(second);
    expect(recorded(w).map(event => event.body.subject)).toEqual([ONE]);
    expect(w.ledger.events(second).filter(event => event.kind === 'resume-outcome')).toEqual([]);
    expect(judge(w, 7)).toEqual([TWO]);
});

test('judging rechecks the fence after the subject read, release lookup and admission lookup', async () => {
    const w = await deployedWorld(stores, dbs, ['1']);
    expect(admit(w)).toEqual([ONE]);
    let held = false;
    const fenced = () => held;
    const get = w.ledger.get.bind(w.ledger), event = w.ledger.event.bind(w.ledger);
    const readIncident = vi.spyOn(w.ledger, 'get').mockImplementationOnce(get).mockImplementationOnce(id => {
        const incident = get(id);
        held = true;
        return incident;
    });
    const running = vi.fn(() => HOLDS_IT);
    const readAdmission = vi.spyOn(w.ledger, 'event'), openedAfter = vi.spyOn(w.ledger, 'openedAfter');
    const record = vi.spyOn(w.ledger, 'record');
    expect(judge(w, 6, { fenced, running })).toEqual([]);
    expect(readIncident).toHaveBeenCalledTimes(2);
    expect(running).not.toHaveBeenCalled();

    held = false;
    running.mockImplementationOnce(() => { held = true; return HOLDS_IT; });
    expect(judge(w, 6, { fenced, running })).toEqual([]);
    expect(running).toHaveBeenCalledTimes(1);
    expect(readAdmission).not.toHaveBeenCalled();

    held = false;
    readAdmission.mockImplementationOnce(id => {
        const admission = event(id);
        held = true;
        return admission;
    });
    expect(judge(w, 6, { fenced, running })).toEqual([]);
    expect(readAdmission).toHaveBeenCalledTimes(1);
    expect(openedAfter).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
});

test('an operator\'s move is read by the request\'s own key, so it is still found once the job is gone', async () => {
    const w = await deployedWorld(stores, dbs);
    admit(w);
    const move = w.store.emit('candidate-review-recheck', 'an operator rechecked GH-1', 'lead', 'GH-1');
    w.store.state.coordination!.jobs = [];
    expect(judge(w)).toEqual([ONE, TWO]);
    expect(outcomes(w).map(outcome => [outcome.subject, outcome.outcome, outcome.detail])).toEqual([
        [ONE, 'moved-by-hand', `An operator's command (candidate-review-recheck) moved the job at ${move.at}, after its resume.`], [TWO, 'gone', 'The project no longer holds the job.']]);
});

test('a recurrence is still found once the projection has let the cleared subject go: the ledger recorded it opening', async () => {
    const w = await deployedWorld(stores, dbs);
    admit(w);
    leave(w, 0); leave(w, 1);
    expect(judge(w)).toEqual([ONE, TWO]);
    // The first stopped again and ran again; the second only ran. Both cleared, and the projection drops them.
    stopAgain(w, 0, 't2');
    w.observed(7);
    leave(w, 0);
    w.observed(8);
    const incident = w.ledger.get(w.id)!;
    expect(incident.subjects.map(subject => subject.status)).toEqual(['cleared', 'cleared']);
    w.ledger.record({ events: [], incidents: [{ ...incident, revision: incident.revision + 1, subjects: [] }] });
    expect(judge(w, 9)).toEqual([ONE]);
    expect(outcomes(w).map(outcome => [outcome.subject, outcome.outcome, outcome.detail])).toEqual([[TWO, 'advanced', 'The job left review for lead-pr after its resume.'],
        [ONE, 'recurred', `The subject stopped again for this incident's cause, seen at ${later(7).toISOString()}, after its resume.`]]);
    // Recorded as recurred, it is not looked up again.
    let asked = 0;
    const openedAfter = w.ledger.openedAfter.bind(w.ledger);
    w.ledger.openedAfter = (id, events) => { asked += 1; return openedAfter(id, events); };
    expect(judge(w, 10)).toEqual([]);
    // Once for the second subject, which has not opened since its admission; never for the first.
    expect(asked).toBe(1);
});

test('once an outcome is recorded, the project\'s events and the other incidents are no longer read for that subject', async () => {
    const w = await deployedWorld(stores, dbs);
    admit(w);
    leave(w, 0);
    expect(judge(w)).toEqual([ONE]);
    const queries: unknown[][] = [];
    let listed = 0;
    const prepare = w.store.db.prepare.bind(w.store.db), current = w.ledger.current.bind(w.ledger);
    w.store.db.prepare = ((sql: string) => { const statement = prepare(sql); return sql.includes('FROM events') ? { get: (...values: unknown[]) => { queries.push(values); return statement.get(...values as never[]); } } : statement; }) as never;
    w.ledger.current = prints => { listed += 1; return current(prints); };
    expect(judge(w, 7)).toEqual([]);
    // Only the second subject is still open: one events query, for its ticket, and one reading of the other incidents.
    expect(queries.map(values => values[1])).toEqual(['GH-2']);
    expect(listed).toBe(1);
    leave(w, 1);
    expect(judge(w, 8)).toEqual([TWO]);
    queries.length = 0; listed = 0;
    expect(judge(w, 9)).toEqual([]);
    expect([queries.length, listed]).toEqual([0, 0]);
});

test('a project this Office does not hold is left for a later pass, and a subject that cannot be read is reported without stopping the others', async () => {
    const w = await deployedWorld(stores, dbs, ['1', '2'], undefined, { declare: PASSED });
    admit(w);
    w.jobs()[1].steps.push(w.jobs()[1].steps[0]);
    expect(judge(w, 6, { entries: [] })).toEqual([]);
    (w.jobs()[0] as { steps: unknown }).steps = undefined;
    const reported: string[] = [];
    expect(judge(w, 7, { report: message => reported.push(message) })).toEqual([TWO]);
    expect(reported).toEqual([expect.stringMatching(new RegExp(`^The outcome of a repair resume could not be judged for ${ONE}: TypeError`))]);
    expect(outcomes(w).map(outcome => outcome.subject)).toEqual([TWO]);
});

const DAY = 24 * 60;

test('judging skips the standing-change read when the project event query takes the fence', async () => {
    const w = await deployedWorld(stores, dbs, ['1']);
    expect(admit(w)).toEqual([ONE]);
    let held = false;
    const prepare = w.store.db.prepare.bind(w.store.db);
    w.store.db.prepare = ((sql: string) => {
        const statement = prepare(sql);
        if (!sql.includes('FROM events')) return statement;
        return { get: (...values: Parameters<typeof statement.get>) => {
            const found = statement.get(...values);
            held = true;
            return found;
        } };
    }) as typeof prepare;
    const subjectChangedAt = vi.spyOn(w.ledger, 'subjectChangedAt'), record = vi.spyOn(w.ledger, 'record');
    expect(judge(w, 5 + DAY, { fenced: () => held })).toEqual([]);
    expect(held).toBe(true);
    expect(subjectChangedAt).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
});

test('judging skips a due stalled outcome when the standing-change read takes the fence', async () => {
    const w = await deployedWorld(stores, dbs, ['1']);
    expect(admit(w)).toEqual([ONE]);
    let held = false;
    const changed = w.ledger.subjectChangedAt.bind(w.ledger);
    const subjectChangedAt = vi.spyOn(w.ledger, 'subjectChangedAt').mockImplementationOnce(subject => {
        const at = changed(subject);
        held = true;
        return at;
    });
    const record = vi.spyOn(w.ledger, 'record');
    expect(judge(w, 5 + DAY, { fenced: () => held })).toEqual([]);
    expect(subjectChangedAt).toHaveBeenCalledWith(ONE);
    expect(record).not.toHaveBeenCalled();
    expect(judge(w, 5 + DAY)).toEqual([ONE]);
    expect(outcomes(w)).toMatchObject([{ subject: ONE, outcome: 'stalled' }]);
});

test('a resume that shows nothing for 24 hours is stalled, once, and not a minute sooner', async () => {
    const w = await deployedWorld(stores, dbs);
    admit(w);
    expect(judge(w, 5 + DAY - 1)).toEqual([]);
    expect(judge(w, 5 + DAY)).toEqual([ONE, TWO]);
    const detail = `Nothing has moved for this resume since ${later(5).toISOString()}: 24 hours without progress, and no wait that explains it.`;
    expect(outcomes(w).map(outcome => [outcome.subject, outcome.outcome, outcome.detail])).toEqual([[ONE, 'stalled', detail], [TWO, 'stalled', detail]]);
    expect(judge(w, 5 + 2 * DAY)).toEqual([]);
    // Not final: the job moving on replaces it.
    leave(w, 0);
    expect(judge(w, 6 + 2 * DAY)).toEqual([ONE]);
    expect(recorded(w).filter(event => event.body.subject === ONE).map(event => [event.body.outcome, event.body.replaces])).toEqual([['stalled', null], ['advanced', 'stalled']]);
    // An operator's move is still looked for while a resume is only stalled.
    w.store.emit('pr-review-recheck', 'an operator rechecked GH-2', 'lead', 'GH-2');
    expect(judge(w, 7 + 2 * DAY)).toEqual([TWO]);
    expect(recorded(w).filter(event => event.body.subject === TWO).map(event => [event.body.outcome, event.body.replaces])).toEqual([['stalled', null], ['moved-by-hand', 'stalled']]);
    expect(w.ledger.get(w.id)!.state).toBe('deployed');
});

test('a run of the job or of the resume\'s own request, and a change in how the subject stands, start the 24 hours again', async () => {
    const w = await deployedWorld(stores, dbs, ['1', '2', '3']);
    admit(w);
    const run = (requestId: string, startedAt: number, lastHeartbeatAt: number) => ({ requestId, startedAt: later(startedAt).toISOString(), lastHeartbeatAt: later(lastHeartbeatAt).toISOString(), endedAt: '' });
    // The first job's own run, and a run filed under the second subject's request; one for another record counts for neither.
    w.store.state.workLog = [run('1', 100, 120), run(w.requests()[1].id, 200, 200), run('other', 900, 900)] as never;
    // The third stopped for another cause at minute 300: a change of standing, in another incident.
    Object.assign(w.jobs()[2], { detail: 'Error: the provider refused the board update', stop: { kind: 'unclassified', at: 't2' } });
    w.observed(300);
    expect(judge(w, 5 + DAY)).toEqual([THREE]);
    expect(outcomes(w).map(outcome => [outcome.subject, outcome.outcome])).toEqual([[THREE, 'chained']]);
    expect(judge(w, 120 + DAY - 1)).toEqual([]);
    expect(judge(w, 120 + DAY)).toEqual([ONE]);
    expect(judge(w, 200 + DAY - 1)).toEqual([]);
    expect(judge(w, 200 + DAY)).toEqual([TWO]);
    expect(judge(w, 300 + DAY - 1)).toEqual([]);
    // Chained gives way to stalled.
    expect(judge(w, 300 + DAY)).toEqual([THREE]);
    expect(outcomes(w).map(outcome => [outcome.subject, outcome.outcome, outcome.detail.match(/since (\S+):/)![1]])).toEqual([[ONE, 'stalled', later(120).toISOString()], [TWO, 'stalled', later(200).toISOString()], [THREE, 'stalled', later(300).toISOString()]]);
    expect(recorded(w).filter(event => event.body.subject === THREE).map(event => [event.body.outcome, event.body.replaces])).toEqual([['chained', null], ['stalled', 'chained']]);
});

test('the clock does not run while the project is paused or draining, or the subject waits on something the Office understands', async () => {
    const w = await deployedWorld(stores, dbs);
    admit(w);
    for (const flag of ['paused', 'draining'] as const) {
        Object.assign(w.store.state, { [flag]: true });
        expect(judge(w, 5 + DAY), flag).toEqual([]);
        Object.assign(w.store.state, { [flag]: false });
    }
    // A hold on the first ticket: its subject is open with a wait the ledger names.
    syncIncidents(w.ledger, office(observe(w.store, [blocked('1'), blocked('2')], later(6 + DAY), { 'GH-1': 'held by a person' })), later(6 + DAY), undefined, fail);
    expect(w.ledger.get(w.id)!.subjects.map(subject => subject.expected)).toEqual(['hold', null]);
    expect(judge(w, 7 + DAY)).toEqual([TWO]);
    // The hold is lifted with nothing having moved: the first resume has been quiet for longer than 24 hours, and is stalled at once.
    w.observed(8 + DAY);
    expect(judge(w, 9 + DAY)).toEqual([ONE]);
    expect(outcomes(w).map(outcome => [outcome.subject, outcome.outcome])).toEqual([[TWO, 'stalled'], [ONE, 'stalled']]);
});

test('whether a resume is stalled is read only while its outcome is open and it is not yet called stalled', async () => {
    const w = await deployedWorld(stores, dbs);
    admit(w);
    leave(w, 0);
    expect(judge(w)).toEqual([ONE]);
    let asked: string[] = [];
    const changed = w.ledger.subjectChangedAt.bind(w.ledger);
    w.ledger.subjectChangedAt = subject => { asked.push(subject); return changed(subject); };
    const paused = vi.fn(() => false), draining = vi.fn(() => false);
    Object.defineProperties(w.store.state, { paused: { get: paused }, draining: { get: draining } });
    expect(judge(w, 7)).toEqual([]);
    expect(asked).toEqual([TWO]);
    expect(paused).toHaveBeenCalledTimes(1);
    expect(draining).toHaveBeenCalledTimes(1);
    expect(judge(w, 5 + DAY)).toEqual([TWO]);
    asked = [];
    paused.mockClear();
    draining.mockClear();
    expect(judge(w, 6 + DAY)).toEqual([]);
    expect(asked).toEqual([]);
    expect(paused).not.toHaveBeenCalled();
    expect(draining).not.toHaveBeenCalled();
});

test('an incident is judged only while the release that runs now is known to hold its fix', async () => {
    const w = await deployedWorld(stores, dbs);
    admit(w);
    leave(w, 0);
    stopAgain(w, 1, 't2');
    w.observed(6);
    // After a rollback the mark still stands for a time: what happened under the other release says nothing of the fix.
    let reads = 0;
    const event = w.ledger.event.bind(w.ledger);
    w.ledger.event = id => { reads += 1; return event(id); };
    expect(judge(w, 7, { running: () => null })).toEqual([]);
    expect(reads).toBe(0);
    expect(outcomes(w)).toEqual([]);
    expect(judge(w, 8)).toEqual([ONE, TWO]);
    expect(outcomes(w).map(outcome => [outcome.subject, outcome.outcome])).toEqual([[ONE, 'advanced'], [TWO, 'recurred']]);
});

test('whether a subject opened again is told by the order the ledger wrote it in, not by the time on it', async () => {
    const w = await deployedWorld(stores, dbs);
    admit(w);
    // The clock stepped back: the new stop is recorded after the admission with an earlier time on it.
    stopAgain(w, 0, 't2');
    w.observed(3);
    expect(judge(w, 4)).toEqual([ONE]);
    expect(outcomes(w)).toMatchObject([{ subject: ONE, outcome: 'recurred', detail: `The subject stopped again for this incident's cause, seen at ${later(3).toISOString()}, after its resume.` }]);
});

test('a stop that happened while the fix was not serving, first seen after the fix served again, is not a recurrence', async () => {
    const withdraw = (w: World, minutes: number) => recordWithdrawnFixes({ ledger: w.ledger, identity: () => ({ status: 'unknown', reason: 'no deployment has recorded an active release' }), execute: fakeGitHub({}).execute, now: later(minutes), memory: compareMemory(), limit: 10 });
    for (const [stoppedAt, expected] of [[later(11), 'untested'], [later(12), 'untested'], [later(14), 'recurred']] as const) {
        const w = await deployedWorld(stores, dbs);
        admit(w);
        await withdraw(w, 10);
        // The second job stops again; the deployment holds the fence, so the ledger does not see it until the fix is found serving again at minute 12. The first job's own stop carries no readable date.
        stopAgain(w, 1, stoppedAt.toISOString());
        await w.arrive(undefined, 12);
        w.observed(13);
        expect(judge(w, 15), stoppedAt.toISOString()).toEqual([ONE, TWO]);
        expect(outcomes(w).map(outcome => outcome.outcome), stoppedAt.toISOString()).toEqual(['untested', expected]);
    }
    // A stop the ledger did see while the fix was not serving, with no readable date on it: written before the mark that stands, so not after it.
    const w = await deployedWorld(stores, dbs);
    admit(w);
    await withdraw(w, 10);
    stopAgain(w, 0, 't2');
    w.observed(11);
    await w.arrive(undefined, 12);
    expect(judge(w, 13)).toEqual([ONE, TWO]);
    expect(outcomes(w).map(outcome => outcome.outcome)).toEqual(['untested', 'untested']);
});

test('for resumes already called stalled the other incidents are not read, also when one of them then advances', async () => {
    const w = await deployedWorld(stores, dbs);
    admit(w);
    expect(judge(w, 5 + DAY)).toEqual([ONE, TWO]);
    let listed = 0;
    const current = w.ledger.current.bind(w.ledger);
    w.ledger.current = prints => { listed += 1; return current(prints); };
    expect(judge(w, 6 + DAY)).toEqual([]);
    leave(w, 0);
    expect(judge(w, 7 + DAY)).toEqual([ONE]);
    expect(outcomes(w).map(outcome => [outcome.subject, outcome.outcome])).toEqual([[TWO, 'stalled'], [ONE, 'advanced']]);
    expect(listed).toBe(0);
});

test('a mark the ledger wrote after the admission makes an open resume untested, even with an earlier time on it than the admission', async () => {
    const withdraw = (w: World, minutes: number) => recordWithdrawnFixes({ ledger: w.ledger, identity: () => ({ status: 'unknown', reason: 'no deployment has recorded an active release' }), execute: fakeGitHub({}).execute, now: later(minutes), memory: compareMemory(), limit: 10 });
    const w = await deployedWorld(stores, dbs);
    admit(w);
    await withdraw(w, 10);
    // Both jobs move on while the fix is not serving; the clock then steps back, and the fix is found serving again at "minute 3".
    leave(w, 0); leave(w, 1);
    await w.arrive(undefined, 3);
    expect(w.ledger.get(w.id)!.fixes!.at(-1)!.deployed!.at < later(5).toISOString()).toBe(true);
    expect(judge(w, 11)).toEqual([ONE, TWO]);
    expect(outcomes(w).map(outcome => [outcome.outcome, outcome.detail])).toEqual(Array(2).fill(['untested', 'The release that held the fix stopped serving after the resume was admitted; what happened since says nothing of the fix.']));
    // A mark that was never withdrawn is not looked up at all.
    const v = await deployedWorld(stores, dbs);
    admit(v);
    v.ledger.eventFollows = () => fail('the order of the mark and the admission was read for a fix that was never withdrawn');
    leave(v, 0);
    expect(judge(v)).toEqual([ONE]);
});

test('judging stops before reading open subjects when the replacement-mark lookup takes the fence', async () => {
    const w = await deployedWorld(stores, dbs, ['1']);
    expect(admit(w)).toEqual([ONE]);
    await recordWithdrawnFixes({ ledger: w.ledger, identity: () => ({ status: 'unknown', reason: 'no deployment has recorded an active release' }), execute: fakeGitHub({}).execute, now: later(10), memory: compareMemory(), limit: 10 });
    expect((await w.arrive(undefined, 12)).deployed).toEqual([w.id]);
    let held = false;
    const follows = w.ledger.eventFollows.bind(w.ledger);
    const eventFollows = vi.spyOn(w.ledger, 'eventFollows').mockImplementationOnce((mark, admission) => {
        const followsAdmission = follows(mark, admission);
        held = true;
        return followsAdmission;
    });
    const current = vi.spyOn(w.ledger, 'current'), record = vi.spyOn(w.ledger, 'record');
    expect(judge(w, 13, { fenced: () => held })).toEqual([]);
    expect(eventFollows).toHaveBeenCalledTimes(1);
    expect(current).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
});

test('the fence taken as the openings are read stops the pass before anything else is read', async () => {
    const w = await deployedWorld(stores, dbs);
    admit(w);
    leave(w, 0);
    let held = false, listed = 0;
    const openedAfter = w.ledger.openedAfter.bind(w.ledger), current = w.ledger.current.bind(w.ledger);
    w.ledger.openedAfter = (id, events) => { const opened = openedAfter(id, events); held = true; return opened; };
    w.ledger.current = prints => { listed += 1; return current(prints); };
    expect(judge(w, 6, { fenced: () => held })).toEqual([]);
    expect(listed).toBe(0);
    expect(outcomes(w)).toEqual([]);
    w.ledger.openedAfter = openedAfter;
    expect(judge(w, 7)).toEqual([ONE]);
});

test('a chained resume whose other stop is a wait the Office understands is not stalled while that wait stands', async () => {
    const w = await deployedWorld(stores, dbs);
    admit(w);
    // The first job stops for another cause and is put on hold: another incident holds it open, with a wait the ledger names.
    Object.assign(w.jobs()[0], { detail: 'Error: the provider refused the board update', stop: { kind: 'unclassified', at: 't2' } });
    const observe2 = (minutes: number, holds: Record<string, string>) => syncIncidents(w.ledger, office(observe(w.store, [blocked('1'), blocked('2')], later(minutes), holds)), later(minutes), undefined, fail);
    observe2(6, { 'GH-1': 'held by a person' });
    expect(w.ledger.list().find(incident => incident.id !== w.id)!.subjects.map(subject => subject.expected)).toEqual(['hold']);
    expect(judge(w, 7)).toEqual([ONE]);
    expect(outcomes(w).map(outcome => outcome.outcome)).toEqual(['chained']);
    // A day on: the second resume, with nothing to explain it, is stalled; the first is waiting on the hold.
    expect(judge(w, 7 + DAY)).toEqual([TWO]);
    observe2(8 + DAY, {});
    for (const flag of ['paused', 'draining'] as const) {
        Object.assign(w.store.state, { [flag]: true });
        expect(judge(w, 9 + DAY), flag).toEqual([]);
        Object.assign(w.store.state, { [flag]: false });
    }
    expect(judge(w, 9 + DAY)).toEqual([ONE]);
    expect(outcomes(w).map(outcome => [outcome.subject, outcome.outcome])).toEqual([[TWO, 'stalled'], [ONE, 'stalled']]);
});

test('an admission the ledger recorded late is still before a mark made after it: the times decide where the order cannot', async () => {
    const w = await deployedWorld(stores, dbs, ['1']);
    // Admitted in the project at minute 5; the ledger does not get its event until after the fix was withdrawn and found serving again.
    admitResume(w.store, w.intent('1'), later(5));
    await recordWithdrawnFixes({ ledger: w.ledger, identity: () => ({ status: 'unknown', reason: 'no deployment has recorded an active release' }), execute: fakeGitHub({}).execute, now: later(10), memory: compareMemory(), limit: 10 });
    leave(w, 0);
    await w.arrive(undefined, 12);
    expect(admit(w)).toEqual([ONE]);
    const fix = w.ledger.get(w.id)!.fixes!.at(-1)!;
    expect(w.ledger.eventFollows(fix.deployed!.event, w.ledger.events(w.id).find(event => event.kind === 'resume-admitted')!.id)).toBe(false);
    expect(judge(w, 13)).toEqual([ONE]);
    expect(outcomes(w).map(outcome => outcome.outcome)).toEqual(['untested']);
});

test('the fence taken as the other incidents are read stops the pass before the project is read', async () => {
    const w = await deployedWorld(stores, dbs);
    admit(w);
    leave(w, 0);
    let held = false, queries = 0;
    const current = w.ledger.current.bind(w.ledger), prepare = w.store.db.prepare.bind(w.store.db);
    w.ledger.current = prints => { const listed = current(prints); held = true; return listed; };
    w.store.db.prepare = ((sql: string) => { if (sql.includes('FROM events')) queries += 1; return prepare(sql); }) as never;
    expect(judge(w, 6, { fenced: () => held })).toEqual([]);
    expect(queries).toBe(0);
    expect(outcomes(w)).toEqual([]);
    held = false;
    w.ledger.current = current;
    expect(judge(w, 7)).toEqual([ONE]);
});
