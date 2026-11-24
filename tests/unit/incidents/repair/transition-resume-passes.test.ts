import { afterEach, expect, test } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { judgeResumes } from '../../../../server/incidents/repair/judge-resumes';
import { dispatchResumes } from '../../../../server/incidents/repair/resume-arrivals';
import { settleIncidents } from '../../../../server/incidents/repair/settle-incidents';
import { recheckCandidate, recheckPR } from '../../../../server/scheduling/operator-commands';
import type { Store } from '../../../../server/store/store';
import type { RepairRoute, SubjectFix } from '../../../../src/contracts/incidents';
import { later } from './repair-wait-fixture';
import { deployedWorld, ENABLED, OPERATION, PAUSED, RELEASE } from './resume-fixture';

const stores: Store[] = [], dbs: DatabaseSync[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); dbs.splice(0).forEach(db => db.close()); });
type World = Awaited<ReturnType<typeof deployedWorld>>;
const ONE = 'cms-field-vocabulary/delivery/1', TWO = 'cms-field-vocabulary/delivery/2', HOLDS_IT = { commit: RELEASE, operation: OPERATION };
const fail = (message: string) => { throw new Error(message); };
const route = (action: string, stage: string) => (jobId: string): RepairRoute => ({ action, payload: { key: `GH-${jobId}` }, expectedStage: stage });
const pass = (w: World, minutes = 5, control = ENABLED) => dispatchResumes({ ledger: w.ledger, entries: [{ store: w.store }], control: { read: () => control }, running: () => HOLDS_IT, now: () => later(minutes), fenced: () => false, report: fail });
const judge = (w: World, minutes: number) => judgeResumes({ ledger: w.ledger, entries: [{ store: w.store }], running: () => HOLDS_IT, now: () => later(minutes), fenced: () => false, report: fail });
const settle = (w: World, minutes: number) => settleIncidents({ ledger: w.ledger, running: () => HOLDS_IT, now: () => later(minutes), fenced: () => false, report: fail });
const outcomes = (w: World) => (w.ledger.get(w.id)!.fixes!.at(-1)!.outcomes ?? []).map(held => [held.subject, held.outcome, held.detail]);
const person = (w: World) => ({ store: w.store, state: w.store.state.coordination }) as never;

test('a due review resume is admitted through the transition once, recorded in the ledger, and its outcome judged like any job\'s', async () => {
    const w = await deployedWorld(stores, dbs, ['1', '2'], route('review-candidate', 'review'));
    // Paused, nothing is touched.
    expect(pass(w, 5, PAUSED)).toEqual({ admitted: [], refused: [], held: [ONE, TWO] });
    expect(w.jobs().map(job => job.status)).toEqual(['blocked', 'blocked']);
    expect(pass(w, 6)).toEqual({ admitted: [ONE, TWO], refused: [], held: [] });
    expect(w.jobs().map(job => job.status)).toEqual(['queued', 'queued']);
    expect(w.requests().map(request => [request.action, request.status])).toEqual([['review-candidate', 'completed'], ['review-candidate', 'completed']]);
    expect(w.ledger.events(w.id).filter(event => event.kind === 'resume-admitted').map(event => [event.body.subject, event.body.request])).toEqual(w.requests().map((request, n) => [[ONE, TWO][n], request.id]));
    // Admitted once: later passes add nothing.
    const saved = [w.saved(), w.ledger.events(w.id).length];
    expect(pass(w, 7)).toEqual({ admitted: [], refused: [], held: [] });
    expect([w.saved(), w.ledger.events(w.id).length]).toEqual(saved);
    // Queued is not yet past the boundary.
    expect(judge(w, 8)).toEqual([]);
    // The first job's review passes and it moves on; the second stops at review again and a person rechecks it.
    Object.assign(w.jobs()[0], { stage: 'lead-pr', status: 'queued' });
    w.jobs()[1].status = 'blocked';
    recheckCandidate.call(person(w), 'GH-2');
    expect(judge(w, 9)).toEqual([ONE, TWO]);
    expect(outcomes(w)).toEqual([
        [ONE, 'advanced', 'The job left review for lead-pr after its resume.'],
        [TWO, 'moved-by-hand', expect.stringMatching(/^An operator's command \(candidate-review-recheck\) moved the job at .*, after its resume\.$/)],
    ]);
    expect(settle(w, 10)).toEqual({ verified: [w.id], recurred: [] });
});

test('a merge preflight resumed by the Office is judged by the merge it was bound to: the job completes, or a person\'s recheck takes it', async () => {
    const declare = (bound: SubjectFix): SubjectFix => bound.disposition === 'route' ? { ...bound, boundary: { kind: 'record-settled' } } : bound;
    const w = await deployedWorld(stores, dbs, ['1', '2'], route('review-pr', 'merge'), { job: { stage: 'merge' }, declare });
    expect(pass(w)).toEqual({ admitted: [ONE, TWO], refused: [], held: [] });
    expect(w.jobs().map(job => [job.stage, job.status])).toEqual([['merge', 'queued'], ['merge', 'queued']]);
    // The Office's own admission is no person's move.
    expect(w.store.state.events.filter(event => event.kind === 'pr-review-recheck')).toEqual([]);
    w.jobs()[0].status = 'completed';
    w.jobs()[1].status = 'blocked';
    recheckPR.call(person(w), 'GH-2');
    expect(judge(w, 6)).toEqual([ONE, TWO]);
    expect(outcomes(w).map(([subject, outcome]) => [subject, outcome])).toEqual([[ONE, 'advanced'], [TWO, 'moved-by-hand']]);
});

test('a resume the transition refuses is recorded once with its reason, and admitted when the reason is gone', async () => {
    const w = await deployedWorld(stores, dbs, ['1'], route('review-pr', 'merge'), { job: { stage: 'merge' } });
    // The merge was attempted after the stop was bound: no longer a preflight.
    w.jobs()[0].mergeAttempt = { head: 'abc1234', at: 't3' };
    const saved = w.saved();
    expect(pass(w)).toEqual({ admitted: [], refused: [ONE], held: [] });
    expect(pass(w, 6)).toEqual({ admitted: [], refused: [ONE], held: [] });
    expect(w.saved()).toBe(saved);
    expect(w.ledger.events(w.id).filter(event => event.kind === 'resume-refused').map(event => [event.body.code, event.body.detail])).toEqual([
        ['transition-refused', 'The handler\'s own check refused it: Only an inactive PR review or a merge preflight with no attempted write can be rechecked']]);
    delete w.jobs()[0].mergeAttempt;
    expect(pass(w, 7)).toEqual({ admitted: [ONE], refused: [], held: [] });
});
