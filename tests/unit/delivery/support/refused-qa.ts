import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ciFixture, newHead, oldHead } from '../../../fixtures/ci-repair';
import { officeQAEvidenceGap } from '../../../../server/qa/report-evidence';
import { withoutReviewAdvisories } from '../../../../server/delivery/findings/review-advisories';
import { saveQAReport } from '../../../../server/qa/save-report';
import { qaCriteria } from '../../../../server/qa/criteria';
import type { Finding, StageResult, WorkApproach } from '../../../../src/shared';

export const finding = (id: string, status: Finding['status']): Finding => ({ id, summary: id, expected: '', actual: '', status, attempts: 0 });
export const approach: WorkApproach = { plan: 'none', review: 'focused', validation: 'independent-checks', checks: ['Required current-head repository checks'], reason: 'Unit route' };
/** A hands-off job whose review passed with one advisory finding open, and whose passing QA carried it forward and was refused by the gate. */
export function refused() {
    const f = ciFixture(), root = f.artifactRoot, directory = resolve(root, 'office-qa', 'validate-0'), checks = resolve(root, 'checks.txt'), worktree = resolve(f.root, 'candidate');
    mkdirSync(worktree, { recursive: true }); writeFileSync(checks, 'Synthetic check output');
    const base = f.job.steps[0].result, [criterion] = qaCriteria(approach.checks);
    const review: StageResult = { ...base, outcome: 'passed', summary: 'Reviewed', blocker: '', findings: [finding('main-integration-conflict', 'verified'), finding('pr-body-refresh', 'open')] };
    const qa: StageResult = { ...base, outcome: 'passed', summary: 'Verified', blocker: '', qaRunDir: directory, findings: [finding('main-integration-conflict', 'verified'), finding('pr-body-refresh', 'open')],
        evidence: [{ id: 'checks', kind: 'checks', commit: oldHead, path: checks, url: '', environment: 'unit', summary: 'Checks', observedAt: '' }],
        qa: { version: 2, ticket: f.job.key, commit: oldHead, stage: 'github-validate', validation: 'independent-checks',
            setup: { status: 'ready', summary: 'Ready', owner: 'Riley', nextAction: 'None', url: '', actor: '', resources: [] }, nextOwner: 'Morgan', nextAction: 'Publish',
            cases: [{ id: 'required', check: 'Required checks', kind: 'acceptance', status: 'passed', expected: 'Pass', observed: 'Passed', evidenceIds: ['checks'], criterionId: criterion.id },
                { id: 'adjacent', check: 'Adjacent', kind: 'regression', status: 'passed', expected: 'Pass', observed: 'Passed', evidenceIds: ['checks'], criterionId: null }] } as any };
    saveQAReport(qa, directory, root);
    f.job.steps = [{ stage: 'review', result: review }, { stage: 'validate', result: qa }];
    Object.assign(f.job, { stage: 'validate', status: 'blocked', detail: 'Error: QA has unresolved findings', stop: { kind: 'unclassified', at: '' }, approach, worktree });
    f.store.state.workLog = [{ id: 'qa', requestId: f.job.id, stage: 'github-validate', status: 'completed', executionStatus: 'completed' }] as any;
    const gap = (store: any = f.store) => officeQAEvidenceGap(withoutReviewAdvisories(store, f.job, qa), { key: f.job.key, head: oldHead, stage: 'github-validate', approach }, root);
    return { ...f, review, qa, gap };
}
