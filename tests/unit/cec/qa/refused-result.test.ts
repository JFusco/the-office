import { expect, test } from 'vitest';
import { REFUSED_RECEIPT, RefusedQAResult, officeRefusedQA, refusedQA, refusedQABlocker } from '../../../../server/cec/qa/refused-result';
import { needsResumeReconciliation } from '../../../../server/cec/resume-reconciliation';
import { ticket, decision } from '../parking/fixtures';

const legacy = 'Interrupted stage; external effects require reconciliation. Error: Prior Office QA report retained; do not overwrite or replay it';
const returned = (extra: object = {}) => ({ ticket: 'CEC-999', role: 'qa' as const, stage: 'staging-qa', status: 'blocked' as const, executionStatus: 'completed' as const, ...extra });
const uncertainFailure = { category: 'uncertain-effect' as const, detail: 'killed', dispatched: true };
function saved(kind: 'legacy' | 'current') {
    const t = ticket(), blocker = kind === 'legacy' ? legacy : refusedQABlocker('staging-qa', new Error('disk write timed out; reconciliation required'));
    Object.assign(t, { key: 'CEC-999', stage: 'staging-qa', activity: 'blocked', blocker, attempt: 12 });
    t.results['staging-qa'] = decision('', { outcome: 'blocked', summary: blocker, blocker, paidRuns: kind === 'legacy' ? null : 0, qaRunDir: '', commit: t.commit,
        receipts: [{ id: 'attempt', action: 'staging-qa', target: t.key, verified: false, uncertain: kind === 'legacy', detail: kind === 'legacy' ? 'Worker did not return a verified final result' : REFUSED_RECEIPT }] });
    return t;
}
const worker = (extra: object = {}) => decision('', { outcome: 'blocked', summary: 'Browser unavailable', paidRuns: 0, receipts: [], ...extra });

test.each(['legacy', 'current'] as const)('a %s refusal record runs the stage again on resume', kind => {
    const t = saved(kind);
    expect(officeRefusedQA(t, t.results['staging-qa'], [returned()])).toBe(true);
    expect(needsResumeReconciliation(t, [returned(), { ticket: t.key, role: 'pm', stage: 'readback', status: 'completed' }])).toBe(false);
    // A later run that finished, and a failed resume that reworded the blocker after a read timed out, change nothing.
    t.blocker = 'Error: codex read timed out';
    expect(needsResumeReconciliation(t, [returned(), { ticket: t.key, role: 'knowledge', stage: 'retrospective', status: 'completed', executionStatus: 'completed' },
        { ticket: t.key, role: 'pm', stage: 'readback', status: 'failed', failure: { category: 'transient-read', detail: 'x', dispatched: true } }])).toBe(false);
});

test('the current wording says nothing of external effects', () => {
    expect(refusedQABlocker('staging-qa', new Error('x'))).not.toMatch(/external effects|interrupted/i);
});

const cases = ['later-unknown-write', 'second-receipt', 'verified-receipt', 'other-wording', 'has-report', 'not-qa-stage'] as const;
test.each((['legacy', 'current'] as const).flatMap(kind => cases.map(reason => [kind, reason] as const)))('%s record is not a refusal: %s', (kind, reason) => {
    const t = saved(kind), attempts: any[] = [returned()], result = t.results['staging-qa']!;
    if (reason === 'later-unknown-write') attempts.push({ ticket: t.key, role: 'pm', stage: 'reconcile', status: 'failed', failure: uncertainFailure });
    if (reason === 'second-receipt') result.receipts.push({ id: 'c', action: 'staging-qa', target: t.key, verified: false, uncertain: false, detail: REFUSED_RECEIPT });
    if (reason === 'verified-receipt') result.receipts[0].verified = true;
    if (reason === 'other-wording') result.receipts[0].detail = 'I, the worker, say nothing was written';
    if (reason === 'has-report') result.qaRunDir = '/runs/x/office-qa/staging-qa-12-a';
    if (reason === 'not-qa-stage') { t.stage = 'publish'; t.results.publish = result; result.receipts[0].action = 'publish'; attempts[0].stage = 'publish'; }
    expect(officeRefusedQA(t, t.results[t.stage], attempts)).toBe(false);
});

test.each(['died', 'failed', 'other-save-error', 'no-run'])('a legacy record needs a run that returned and the report save\'s own refusal: %s', reason => {
    const t = saved('legacy'), run: any = returned(), attempts: any[] = reason === 'no-run' ? [] : [run];
    if (reason === 'died') delete run.executionStatus;
    if (reason === 'failed') run.failure = uncertainFailure;
    if (reason === 'other-save-error') t.results['staging-qa']!.summary = t.blocker = 'Interrupted stage; external effects require reconciliation. Error: worker exited 1';
    expect(officeRefusedQA(t, t.results['staging-qa'], attempts)).toBe(false);
    expect(needsResumeReconciliation(t, attempts)).toBe(true);
});

test('a current record with an unknown paid-run count is still reconstructed', () => {
    const t = saved('current'); t.results['staging-qa']!.paidRuns = null;
    expect(officeRefusedQA(t, t.results['staging-qa'], [returned()])).toBe(false);
});

test('only a refused save of a QA result with nothing unknown counts', () => {
    const cause = new Error('Prior Office QA report retained; do not overwrite or replay it');
    expect(refusedQA('staging-qa', new RefusedQAResult(worker(), cause))?.paidRuns).toBe(0);
    expect(String(new RefusedQAResult(worker(), cause))).toBe('Error: Prior Office QA report retained; do not overwrite or replay it');
    expect(refusedQA('staging-qa', cause)).toBeUndefined();
    expect(refusedQA('publish', new RefusedQAResult(worker(), cause))).toBeUndefined();
    expect(refusedQA('qa', new RefusedQAResult(worker({ paidRuns: null }), cause))).toBeUndefined();
    expect(refusedQA('retest', new RefusedQAResult(worker({ receipts: [{ id: 'c', action: 'jira-comment', target: 'CEC-999', verified: false, uncertain: true, detail: 'unknown' }] }), cause))).toBeUndefined();
});
