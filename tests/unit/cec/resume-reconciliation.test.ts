import { afterEach, expect, test, vi } from 'vitest';
import { Store } from '../../../server/store/store';
import { Engine } from '../../../server/scheduling/engine';
import { CEC } from '../../../server/office/config';
import { needsResumeReconciliation } from '../../../server/cec/resume-reconciliation';
import { ticket, decision } from './parking/fixtures';

const timeout = 'codex read timed out; saved observations retained; safe to retry the read';
const failedRead = () => ({ ticket: 'CEC-999', role: 'pm' as const, stage: 'reconcile', status: 'failed' as const,
    failure: { category: 'transient-read' as const, detail: timeout, dispatched: true } });
function blockedQA(blocker = `Error: ${timeout}`) {
    const t = ticket();
    Object.assign(t, { key: 'CEC-999', stage: 'retest', activity: 'blocked', blocker, attempt: 4, repairAttempts: { F1: 2 } });
    t.results.retest = decision('', { outcome: 'blocked', paidRuns: 0, commit: t.commit, blocker: 'Browser sign-in required',
        receipts: [{ id: 'saved-comment', action: 'jira-comment', target: t.key, verified: true, uncertain: false, detail: 'Retained verified comment' }] });
    return t;
}

test('a matching native reader timeout resumes the same QA stage without reconstructing acceptance', () => {
    const t = blockedQA(), before = structuredClone(t);
    expect(needsResumeReconciliation(t, [failedRead(), { ticket: t.key, role: 'pm', stage: 'readback', status: 'completed' }])).toBe(false);
    expect(t).toEqual(before);
});

test.each(['no-native-failure', 'other-ticket', 'different-detail', 'writer', 'shutdown-warning', 'newer-action'])('timeout remains held without exact reader provenance: %s', reason => {
    const t = blockedQA(), attempt: any = failedRead(), attempts: any[] = [attempt];
    if (reason === 'no-native-failure') attempts.length = 0;
    if (reason === 'other-ticket') attempt.ticket = 'CEC-998';
    if (reason === 'different-detail') attempt.failure.detail = 'Different failure';
    if (reason === 'writer') attempt.failure.category = 'uncertain-effect';
    if (reason === 'shutdown-warning') attempt.failure.code = 'surviving-subprocesses';
    if (reason === 'newer-action') attempts.push({ ...attempt, role: 'developer', stage: 'repair' });
    expect(needsResumeReconciliation(t, attempts)).toBe(true);
});

test.each(['uncertain-receipt', 'unknown-paid-usage'])('reader timeout never clears %s', reason => {
    const t = blockedQA();
    if (reason === 'uncertain-receipt') t.results.retest!.receipts.push({ id: 'submit', action: 'generation', target: t.key, verified: false, uncertain: true, detail: 'Unknown outcome' });
    else t.results.retest!.paidRuns = null;
    expect(needsResumeReconciliation(t, [failedRead()])).toBe(true);
});

test('a native uncertain writer remains guarded when legacy wording is inconclusive', () => {
    const t = blockedQA('Pending action reconciliation could not be verified');
    expect(needsResumeReconciliation(t, [{ ...failedRead(), role: 'developer', stage: 'repair',
        failure: { category: 'uncertain-effect', detail: 'Connection lost', dispatched: true } }])).toBe(true);
});

test('an incidental explanation does not turn missing QA acceptance into a stage reconstruction', () => {
    expect(needsResumeReconciliation(blockedQA('Configured-list membership is unverified. The harness owns saved-plan reconciliation; unrelated IT history is not a prerequisite.'), [])).toBe(false);
});

test.each(['Interrupted stage; external effects require reconciliation.', 'External action requires read-back reconciliation', 'Provider run usage requires reconciliation', 'Reconciliation incomplete: missing receipt', 'Original action reconciliation required', 'Existing owner/PR 9 requires reconciliation before adoption'])('legacy action uncertainty remains guarded: %s', blocker => {
    expect(needsResumeReconciliation(blockedQA(blocker), [])).toBe(true);
});

/** CEC-154's shape: QA stopped in setup, and its result restates the replaced implementation run's uncertain receipt. */
const OLD = { id: 'old-implement', action: 'implement', target: 'CEC-999', verified: false, uncertain: true, detail: 'Worker did not return a verified final result' };
const qaStop = { ticket: 'CEC-999', role: 'qa' as const, stage: 'retest', status: 'blocked' as const };
function setupStop(blocker = 'Browser tool unavailable; nothing was tested.') {
    const t = blockedQA(blocker);
    Object.assign(t, { implementationContinuation: { originalResult: { receipts: [OLD] } } });
    t.results.implement = decision('', { outcome: 'passed', receipts: [] });
    Object.assign(t.results.retest!, { qa: { setup: { status: 'blocked' } } });
    t.results.retest!.receipts.push({ ...OLD, detail: 'Inherited original receipt, unchanged' });
    return t;
}
test.each(['Browser tool unavailable; nothing was tested.', 'The supported browser access host is unavailable. The inherited uncertain implementation effect remains unreconciled by this QA assignment.', 'Error: Reconciliation incomplete: Required retest acceptance remains unproven, and the original implementation effect remains uncertain.'])('a QA stage that stopped in setup reruns instead of reconstructing acceptance that never happened: %s', blocker => {
    const t = setupStop(blocker), before = structuredClone(t);
    expect(needsResumeReconciliation(t, [qaStop, { ticket: t.key, role: 'pm', stage: 'reconcile', status: 'blocked' }, { ticket: t.key, role: 'pm', stage: 'readback', status: 'completed' }])).toBe(false);
    expect(t).toEqual(before);
});
// The restated receipt is settled history on its own, so each case carries wording that forces reconstruction unless the setup-stop rule applies.
const WORDING = 'External action requires read-back reconciliation';
test.each(['own uncertain action', 'uncertain action named like a stage', 'restated receipt with no continuation record', 'paid run', 'unknown paid usage', 'setup ready', 'failed outcome', 'other commit', 'no QA run recorded', 'latest QA run interrupted', 'latest QA run failed uncertain'])('a setup stop still reconstructs when QA may have acted: %s', reason => {
    const t = setupStop(WORDING), attempts: any[] = [qaStop];
    expect(needsResumeReconciliation(setupStop(WORDING), [qaStop]), 'baseline').toBe(false);
    if (reason === 'own uncertain action') t.results.retest!.receipts.push({ id: 'submit', action: 'generation', target: t.key, verified: false, uncertain: true, detail: 'Unknown outcome' });
    if (reason === 'uncertain action named like a stage') t.results.retest!.receipts.push({ id: 'pr', action: 'draft-pr', target: t.key, verified: false, uncertain: true, detail: 'Unknown outcome' });
    if (reason === 'restated receipt with no continuation record') { delete (t as any).implementationContinuation; t.blocker = 'Browser tool unavailable; nothing was tested.'; }
    if (reason === 'paid run') t.results.retest!.paidRuns = 1;
    if (reason === 'unknown paid usage') t.results.retest!.paidRuns = null;
    if (reason === 'setup ready') (t.results.retest as any).qa.setup.status = 'ready';
    if (reason === 'failed outcome') t.results.retest!.outcome = 'failed';
    if (reason === 'other commit') t.results.retest!.commit = 'f'.repeat(40);
    if (reason === 'no QA run recorded') attempts.length = 0;
    if (reason === 'latest QA run interrupted') attempts.push({ ...qaStop, status: 'interrupted' });
    if (reason === 'latest QA run failed uncertain') attempts.push({ ...qaStop, status: 'failed', failure: { category: 'uncertain-effect', detail: 'Connection lost', dispatched: true } });
    expect(needsResumeReconciliation(t, attempts)).toBe(true);
});
test('a later run that died after a setup stop is reconstructed, whatever the older saved result says', () => {
    const t = setupStop('Worker interrupted. Reconcile the previous stage and external effects before resuming.');
    expect(needsResumeReconciliation(t, [qaStop, { ...qaStop, status: 'interrupted' }])).toBe(true);
});
test('a timed-out run whose saved result the stage accepted no longer forces reconstruction', () => {
    const t = blockedQA('Repair findings remain open.');
    const timedOut = { ticket: t.key, role: 'qa' as const, stage: 'retest', status: 'failed' as const, failure: { category: 'uncertain-effect' as const, detail: 'codex timed out; previous action outcome must be reconciled', dispatched: true } };
    expect(needsResumeReconciliation(t, [timedOut])).toBe(true);
    expect(needsResumeReconciliation(t, [{ ...timedOut, completionAccepted: true }])).toBe(false);
});
test('a review that returned its own verdict runs again; a restated settled receipt and its wording force nothing', () => {
    const t = setupStop('The source repair is approved, but the inherited uncertain implementation receipt remains unreconciled.');
    t.results['repair-review'] = decision('', { outcome: 'blocked', paidRuns: 0, commit: t.commit, blocker: t.blocker, receipts: [{ ...OLD, detail: 'Inherited original receipt preserved' }] });
    t.stage = 'repair-review';
    const review = { ticket: t.key, role: 'lead' as const, stage: 'repair-review', status: 'blocked' as const, executionStatus: 'completed' as const };
    expect(needsResumeReconciliation(t, [review])).toBe(false);
    // A review run that died, or a review holding an uncertain action of its own, is still reconstructed.
    expect(needsResumeReconciliation(t, [{ ...review, executionStatus: undefined, status: 'interrupted' as const }])).toBe(true);
    t.results['repair-review']!.receipts.push({ id: 'x', action: 'jira-comment', target: t.key, verified: false, uncertain: true, detail: 'Unknown outcome' });
    expect(needsResumeReconciliation(t, [review])).toBe(true);    t.results['repair-review']!.receipts.pop();
    // Another episode's blocker, or a repair cycle whose one revised-approach assessment was already made, keeps the old route.
    t.blocker = 'Interrupted stage; external effects require reconciliation. Error: codex timed out; previous action outcome must be reconciled';
    expect(needsResumeReconciliation(t, [review])).toBe(true);
    t.blocker = t.results['repair-review']!.blocker;
    expect(needsResumeReconciliation(t, [review])).toBe(false);
    t.repairCycle = { phase: 'diagnosis', diagnosisAttempted: true } as any;
    expect(needsResumeReconciliation(t, [review])).toBe(true);
});
test('a developer stage that returned its own result runs again, whatever its blocker says; anything left unknown is still reconstructed', () => {
    // CEC-154's shape: the repair finished and returned, and its blocker says two tests "timed out".
    const blocker = 'The two database tests that timed out need to be rerun on their own, and typecheck and the build check still need to run; Alex owns both.';
    const t = blockedQA(blocker);
    t.results.repair = decision('', { outcome: 'failed', paidRuns: 0, commit: 'c'.repeat(40), blocker, receipts: [] }); t.stage = 'repair';
    const run = { ticket: t.key, role: 'developer' as const, stage: 'repair', status: 'failed' as const, executionStatus: 'completed' as const };
    expect(needsResumeReconciliation(t, [run])).toBe(false);
    // A run that was cut off, or that failed, returned nothing of its own.
    expect(needsResumeReconciliation(t, [{ ...run, executionStatus: undefined, status: 'interrupted' as const }])).toBe(true);
    expect(needsResumeReconciliation(t, [{ ...run, failure: { category: 'uncertain-effect' as const, detail: 'Connection lost', dispatched: true } }])).toBe(true);
    // An unverified or unknown write, or an unknown paid-run count, leaves something outside unknown.
    t.results.repair!.receipts = [{ id: 'push', action: 'git-push', target: t.key, verified: false, uncertain: false, detail: 'Not read back' }];
    expect(needsResumeReconciliation(t, [run])).toBe(true);
    t.results.repair!.receipts = [{ id: 'push', action: 'git-push', target: t.key, verified: false, uncertain: true, detail: 'Unknown outcome' }];
    expect(needsResumeReconciliation(t, [run])).toBe(true);
    t.results.repair!.receipts = []; t.results.repair!.paidRuns = null;
    expect(needsResumeReconciliation(t, [run])).toBe(true);
    t.results.repair!.paidRuns = 0;
    // A blocker from another episode is not this result's own words.
    t.blocker = 'Interrupted stage; external effects require reconciliation. Error: codex timed out; previous action outcome must be reconciled';
    expect(needsResumeReconciliation(t, [run])).toBe(true);
    t.blocker = blocker;
    expect(needsResumeReconciliation(t, [run])).toBe(false);
    // A run that returned but is recorded with a failure of any kind is not a clean return.
    expect(needsResumeReconciliation(t, [{ ...run, failure: { category: 'process' as any, detail: 'Exited 1', dispatched: false } }])).toBe(true);
});
test.each(['enhance', 'draft-pr', 'publish', 'preview', 'ready-for-staging'])('a %s stage writes to a provider, so the same shape is still reconstructed on its wording', stage => {
    const blocker = 'The request timed out before its read-back.';
    const t = blockedQA(blocker);
    Object.assign(t, { stage });
    (t.results as any)[stage] = decision('', { outcome: 'blocked', paidRuns: 0, commit: t.commit, blocker, receipts: [] });
    expect(needsResumeReconciliation(t, [{ ticket: t.key, role: 'developer', stage, status: 'blocked', executionStatus: 'completed' }])).toBe(true);
});
test('a QA stage that returned its own verdict with every write read back and its paid runs counted also runs again', () => {
    const blocker = 'Two cases timed out in the browser and remain untested.';
    const t = blockedQA(blocker);
    Object.assign(t.results.retest!, { outcome: 'blocked', paidRuns: 2, blocker });
    const run = { ticket: t.key, role: 'qa' as const, stage: 'retest', status: 'blocked' as const, executionStatus: 'completed' as const };
    expect(needsResumeReconciliation(t, [run])).toBe(false);
    t.results.retest!.paidRuns = null;
    expect(needsResumeReconciliation(t, [run])).toBe(true);
});
test('a non-QA stage never takes the setup-stop route', () => {
    const t = setupStop(WORDING); t.results.repair = t.results.retest; t.stage = 'repair';
    expect(needsResumeReconciliation(t, [{ ...qaStop, stage: 'repair' }])).toBe(true);
});
test.each(['qa', 'staging-qa'] as const)('the %s stage takes the same route as retest', stage => {
    const t = setupStop(); (t.results as any)[stage] = t.results.retest; t.stage = stage;
    expect(needsResumeReconciliation(t, [{ ...qaStop, stage }])).toBe(false);
});

const stores: Store[] = [];
afterEach(() => { for (const store of stores.splice(0)) store.close(); });
test.each(['reader-timeout', 'incidental-prose'])('ordinary resume retains every QA requirement and counter after %s', async reason => {
    const store = new Store(':memory:'); stores.push(store);
    const t = blockedQA(reason === 'reader-timeout' ? `Error: ${timeout}` : 'Membership read was blocked. The harness owns saved-plan reconciliation.');
    t.pilot = true; t.parked = undefined; store.state.tickets = [t];
    if (reason === 'reader-timeout') store.state.workLog = [failedRead() as any];
    const before = structuredClone(t), engine = new Engine(store);
    engine.agents.readback = vi.fn(async () => ({ key: t.key, assignee: CEC.account, subtask: false, boardMember: true, status: 'QA', statusId: '10300', updated: '', existingPrId: t.prId, existingOwner: '', blocker: '' }));
    engine.agents.reconcile = vi.fn(); engine.agents.stage = vi.fn();
    await engine.resume(t.key, false);
    expect(engine.agents.readback).toHaveBeenCalledOnce(); expect(engine.agents.reconcile).not.toHaveBeenCalled(); expect(engine.agents.stage).not.toHaveBeenCalled();
    expect(t.activity).toBe('waiting'); expect(t.stage).toBe('retest'); expect(t.blocker).toBe('');
    expect(t.results).toEqual(before.results); expect(t.attempt).toBe(4); expect(t.repairAttempts).toEqual(before.repairAttempts); expect(t.commit).toBe(before.commit);
});

test('a revised-approach assessment that has not run is dispatched, not reconstructed, whatever the refused dispatch said', () => {
    const assessment = (blocker: string) => {
        const t = ticket();
        Object.assign(t, { key: 'CEC-999', stage: 'code-review', activity: 'blocked', blocker,
            repairCycle: { owner: 'developer', findingAttempts: { F1: 2 }, attempts: 6, pendingFindingIds: ['F1'], sourceStage: 'retest', sourceHead: t.commit, phase: 'diagnosis' } });
        return t;
    };
    const refused = [{ ticket: 'CEC-999', role: 'pm' as const, stage: 'reconcile', status: 'blocked' as const }];
    for (const blocker of ['Error: Reconciliation incomplete: The request-size finding remains open and the six-attempt repair budget remains exhausted.',
        'Error: Dispatch requires Morgan/stage-owner reconciliation of the exhausted six-attempt budget.'])
        expect(needsResumeReconciliation(assessment(blocker), refused), blocker).toBe(false);
    // Once the assessment has run, or when a worker on the ticket failed with an unknown write, the existing rules apply.
    const attempted = assessment('Error: Reconciliation incomplete: missing receipt'); attempted.repairCycle!.diagnosisAttempted = true;
    expect(needsResumeReconciliation(attempted, refused)).toBe(true);
    expect(needsResumeReconciliation(assessment('Error: Reconciliation incomplete: missing receipt'),
        [{ ticket: 'CEC-999', role: 'lead' as const, stage: 'code-review', status: 'failed' as const, failure: { category: 'uncertain-effect' as const, detail: 'Connection lost', dispatched: true } }])).toBe(true);
    const review = assessment('Error: Reconciliation incomplete: missing receipt'); delete review.repairCycle;
    expect(needsResumeReconciliation(review, refused)).toBe(true);
});
