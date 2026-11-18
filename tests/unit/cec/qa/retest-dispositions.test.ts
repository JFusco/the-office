import { expect, test } from 'vitest';
import { findingsOwedToRetest, missingRetestDispositions } from '../../../../server/cec/qa/retest-dispositions';
import { qaEvidenceGap } from '../../../../server/cec/workflow';
import { decision, ticket } from '../parking/fixtures';

const finding = (id: string, status: 'open' | 'fixed' | 'verified' = 'verified') => ({ id, summary: id, expected: '', actual: '', status, attempts: 1 }) as any;
const cycle = (pending: string[]): any => ({ owner: 'developer', findingAttempts: {}, attempts: 8, pendingFindingIds: pending, sourceStage: 'retest', sourceHead: 'a'.repeat(40), phase: 'repair' });
/** CEC-154 going into its retest: two findings QA raised and the repair fixed, and one the developer raised against itself. */
function carried() {
    const t = { ...ticket('QA'), stage: 'retest' as const, findings: [finding('QA8-DECISION-001'), finding('QA8-CHECK-001'), finding('REPAIR9-CHECK-001')], repairCycle: cycle(['QA8-CHECK-001', 'QA8-DECISION-001']) };
    t.results.retest = decision('', { outcome: 'failed', findings: [finding('QA6-REGEN-002'), finding('QA8-CHECK-001', 'open'), finding('QA8-DECISION-001', 'open')] });
    return t;
}

test('a retest owes its own disposition for findings QA reported and for those the repair was sent to fix, not for a developer\'s own', () => {
    const t = carried();
    expect(findingsOwedToRetest(t)).toEqual(['QA8-DECISION-001', 'QA8-CHECK-001']);
    // Riley's passing result on CEC-154: the two repaired findings and two older ones, with no mention of the developer's.
    const passed = { findings: [finding('QA8-DECISION-001'), finding('QA8-CHECK-001'), finding('QA6-REGEN-002'), finding('QA5-REGEN-001')] };
    expect(missingRetestDispositions(t, passed)).toEqual([]);
});

test('an owed finding the retest leaves out, or does not mark verified, is named', () => {
    const t = carried();
    expect(missingRetestDispositions(t, { findings: [finding('QA8-DECISION-001')] })).toEqual(['QA8-CHECK-001']);
    expect(missingRetestDispositions(t, { findings: [finding('QA8-DECISION-001'), finding('QA8-CHECK-001', 'fixed')] })).toEqual(['QA8-CHECK-001']);
    expect(missingRetestDispositions(t, { findings: [] })).toEqual(['QA8-DECISION-001', 'QA8-CHECK-001']);
});

test('a finding from an archived QA run or a staging QA run is QA\'s; a finding the repair was sent to fix is owed whoever raised it', () => {
    const archived = carried(); archived.results.retest = undefined as any;
    archived.qaHistory = [{ stage: 'qa', result: decision('', { findings: [finding('QA8-DECISION-001', 'open')] }) }];
    archived.repairCycle = cycle([]);
    expect(findingsOwedToRetest(archived)).toEqual(['QA8-DECISION-001']);
    const review = carried(); review.findings = [finding('REVIEW-001'), finding('REPAIR9-CHECK-001')]; review.repairCycle = cycle(['REVIEW-001']); review.results = {};
    expect(findingsOwedToRetest(review)).toEqual(['REVIEW-001']);
});

test('a finding nobody has verified is owed whoever raised it: nothing unsettled is dropped by a passing retest', () => {
    for (const status of ['open', 'fixed'] as const) {
        const t = carried(); t.findings[2] = finding('REPAIR9-CHECK-001', status);
        expect(findingsOwedToRetest(t), status).toEqual(['QA8-DECISION-001', 'QA8-CHECK-001', 'REPAIR9-CHECK-001']);
        expect(missingRetestDispositions(t, { findings: [finding('QA8-DECISION-001'), finding('QA8-CHECK-001')] }), status).toEqual(['REPAIR9-CHECK-001']);
    }
});

test('a ticket with no repair cycle keeps the older rule: every finding is owed', () => {
    const t = carried(); t.repairCycle = undefined as any;
    expect(findingsOwedToRetest(t)).toEqual(['QA8-DECISION-001', 'QA8-CHECK-001', 'REPAIR9-CHECK-001']);
});

test('a retest of a scoped change owes what is not yet verified and what the repair was sent to fix: the rest was verified on the commit the change was made on', () => {
    const t = { ...carried(), changeScope: { base: 'a'.repeat(40), approach: {} as any } };
    // Sent to fix, so owed even though another stage already wrote them verified; the developer's own verified note is not.
    expect(findingsOwedToRetest(t)).toEqual(['QA8-DECISION-001', 'QA8-CHECK-001']);
    t.repairCycle = cycle([]);
    expect(findingsOwedToRetest(t)).toEqual([]);
    t.findings = [...t.findings, finding('MERGE-001', 'fixed')];
    expect(findingsOwedToRetest(t)).toEqual(['MERGE-001']);
    expect(missingRetestDispositions(t, { findings: [finding('MERGE-001')] })).toEqual([]);
});

test('the gate refuses a passed retest only over an owed finding, and names it', () => {
    const t = carried(), root = '/synthetic';
    const result = (ids: string[]) => decision('', { outcome: 'passed', blocker: '', resolution: null, paidRuns: 6, commit: t.commit, findings: ids.map(id => finding(id)) });
    expect(qaEvidenceGap(t, 'retest', result(['QA8-DECISION-001']), root)).toBe('Every prior finding needs an explicit independent retest disposition: QA8-CHECK-001');
    // With both owed findings verified the gate moves on to its later checks; the developer's finding no longer stops it.
    expect(qaEvidenceGap(t, 'retest', result(['QA8-DECISION-001', 'QA8-CHECK-001']), root)).not.toContain('retest disposition');
});
