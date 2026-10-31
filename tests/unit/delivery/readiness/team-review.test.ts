import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD } from '../support/fake-github';
import { teamReviewedHead } from '../../../../server/delivery/readiness/team-review';
import type { StageResult } from '../../../../src/shared';
afterEach(cleanupFakes);

const passed = (commit = HEAD): StageResult => ({ outcome: 'passed', summary: 'ok', commit, blocker: '', evidence: [], findings: [], receipts: [], previewUrl: '', worktree: '', branch: '', prId: 0, qaRunDir: '', paidRuns: 0 });
const approach = (validation: 'developer-checks' | 'independent-checks') => ({ plan: 'none' as const, review: 'focused' as const, validation, checks: [], reason: 'Synthetic' });

test('an exact-head passed review, plus validation when selected, makes the team verdict', () => {
    const f = fakeGitHub(), job = f.candidate({ approach: approach('independent-checks') });
    job.steps.push({ stage: 'review', result: passed() });
    expect(teamReviewedHead(f.store, job)).toBeNull();
    job.steps.push({ stage: 'validate', result: passed() });
    expect(teamReviewedHead(f.store, job)?.commit).toBe(HEAD);
});
test('developer-checks needs only the review; stale heads, failures, legacy jobs and other projects never count', () => {
    const f = fakeGitHub(), job = f.candidate({ approach: approach('developer-checks') });
    job.steps.push({ stage: 'review', result: passed() });
    expect(teamReviewedHead(f.store, job)).not.toBeNull();
    job.steps.push({ stage: 'review', result: passed(BASE) });
    expect(teamReviewedHead(f.store, job)).toBeNull();
    job.steps.push({ stage: 'review', result: { ...passed(), outcome: 'blocked' } });
    expect(teamReviewedHead(f.store, job)).toBeNull();
    job.steps.push({ stage: 'review', result: passed() });
    job.sourceAmendment = {} as any;
    expect(teamReviewedHead(f.store, job)).toBeNull();
    delete job.sourceAmendment;
    (f.store.project as any).id = 'brain';
    expect(teamReviewedHead(f.store, job)).toBeNull();
});
