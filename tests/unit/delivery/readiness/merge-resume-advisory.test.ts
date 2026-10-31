import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD } from '../support/fake-github';
import { resumeReviewedMerge } from '../../../../server/delivery/readiness/github-check-selection';
afterEach(cleanupFakes);

function reviewedMerge(projectId: string) {
    const f = fakeGitHub(), job = f.candidate({ stage: 'merge', status: 'blocked', pr: 119 });
    (f.store.project as any).id = projectId;
    f.store.state.coordination!.merges = { enabled: true, authorizedAt: '2026-10-28T00:00:00Z' };
    job.steps.push({ stage: 'lead-pr', result: { outcome: 'passed', summary: 'Ready', commit: HEAD, blocker: '', evidence: [], receipts: [], previewUrl: '', worktree: job.worktree, branch: job.branch, prId: 119, qaRunDir: '', paidRuns: 0,
        findings: [{ id: 'later-source-drift', summary: 'Advisory: later observations are outside this proposal', expected: '', actual: '', status: 'open', attempts: 0 }] } });
    const pr = { number: 119, state: 'open', draft: false, mergeable: true, updated_at: '2026-10-31T12:00:00Z', head: { sha: HEAD, ref: job.branch }, base: { ref: 'main', sha: BASE } };
    job.reviewContext = { head: HEAD, issueUpdatedAt: '', prUpdatedAt: pr.updated_at, baseSha: BASE, target: 'main', step: job.steps.length - 1 };
    return { f, job, pr };
}
test('an advisory open finding on a passed Lead review does not block a hands-off merge resume', async () => {
    const { f, job, pr } = reviewedMerge('cms-field-vocabulary');
    await expect(resumeReviewedMerge(f.delivery, job, pr)).rejects.toThrow('One accepted actual Lead execution required');
});
test('other projects keep the strict open-finding gate', async () => {
    const { f, job, pr } = reviewedMerge('cec');
    await expect(resumeReviewedMerge(f.delivery, job, pr)).rejects.toThrow('Saved merge review context changed');
});
