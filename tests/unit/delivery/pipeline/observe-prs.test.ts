import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD } from '../support/fake-github';
import type { StageResult } from '../../../../src/shared';
afterEach(cleanupFakes);

const passed = (commit = HEAD): StageResult => ({ outcome: 'passed', summary: 'ok', commit, blocker: '', evidence: [], findings: [], receipts: [], previewUrl: '', worktree: '', branch: '', prId: 0, qaRunDir: '', paidRuns: 0 });
function blockedMerge(mergeable: boolean | null) {
    const f = fakeGitHub(), job = f.candidate({ stage: 'merge', status: 'blocked', pr: 201, prUrl: `https://github.com/${f.store.project.repository}/pull/201`, detail: 'Error: PR readiness or reviewed commit changed; Sam must reassess' });
    f.store.state.coordination!.merges = { enabled: true, authorizedAt: '2026-10-28T00:00:00Z' };
    job.steps.push({ stage: 'review', result: passed() });
    f.state.prs.push({ number: 201, html_url: job.prUrl, state: 'open', draft: false, mergeable, body: 'Closes #5', head: { sha: HEAD, ref: job.branch, repo: { full_name: f.store.project.repository } }, base: { ref: 'main', sha: BASE, repo: { full_name: f.store.project.repository } }, merged_at: null, merge_commit_sha: null, updated_at: '2026-11-01T16:15:30Z' });
    return { f, job };
}
test('a team-reviewed merge whose PR became conflicting is refreshed instead of staying blocked', async () => {
    const { f, job } = blockedMerge(false);
    await f.delivery.observe();
    expect(job).toMatchObject({ stage: 'update-base', status: 'queued', repairReason: 'conflicts' });
});
test('a PR whose mergeability GitHub is still computing keeps the reviewed-merge path', async () => {
    const { f, job } = blockedMerge(null);
    await f.delivery.observe();
    expect(job.stage).toBe('merge');
    expect(job.detail).toContain('Team-reviewed PR is not ready to merge');
});
