import { afterEach, expect, test } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { compareMemory } from '../../../../server/incidents/deployed-fixes';
import { eventId } from '../../../../server/incidents/event-id';
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
const ONE = 'cms-field-vocabulary/delivery/1', TWO = 'cms-field-vocabulary/delivery/2';
const fail = (message: string) => { throw new Error(message); };
type More = { fenced?: () => boolean; entries?: { store: Store }[]; report?: (message: string) => void };
const judge = (w: World, minutes = 6, more: More = {}) => judgeResumes({ ledger: w.ledger, entries: more.entries ?? [{ store: w.store }], now: () => later(minutes), fenced: more.fenced ?? (() => false), report: more.report ?? fail });
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
    const detail = `The subject stopped again for this incident's cause at ${later(7).toISOString()}, after its resume.`;
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
    expect(judge(w, 8, { fenced: () => held })).toEqual([]);
    expect(held).toBe(true);
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

test('an operator\'s move is read by the request\'s own key, so it is still found once the job is gone', async () => {
    const w = await deployedWorld(stores, dbs);
    admit(w);
    const move = w.store.emit('candidate-review-recheck', 'an operator rechecked GH-1', 'lead', 'GH-1');
    w.store.state.coordination!.jobs = [];
    expect(judge(w)).toEqual([ONE, TWO]);
    expect(outcomes(w).map(outcome => [outcome.subject, outcome.outcome, outcome.detail])).toEqual([
        [ONE, 'moved-by-hand', `An operator's command (candidate-review-recheck) moved the job at ${move.at}, after its resume.`], [TWO, 'gone', 'The project no longer holds the job.']]);
});

test('a recurrence is still found once the projection has let the cleared subject go: the history says when it last opened', async () => {
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
        [ONE, 'recurred', `The subject stopped again for this incident's cause at ${later(7).toISOString()}, after its resume.`]]);
    // Recorded as recurred, it is not looked up again.
    let asked = 0;
    const history = w.ledger.subjectHistory.bind(w.ledger);
    w.ledger.subjectHistory = (id, subject) => { asked += 1; return history(id, subject); };
    expect(judge(w, 10)).toEqual([]);
    // Once for the second subject, whose last opening is before its admission; never for the first.
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
    // The history is for a subject the projection has let go; while it holds both, it is never asked.
    w.ledger.subjectHistory = () => fail('the event history was read for a subject the projection holds');
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
