import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD } from '../support/fake-github';
afterEach(cleanupFakes);
import { harnessCloseout } from '../../../../server/delivery/closeout/closeout';

const MERGE = 'f'.repeat(40);
function merged() {
    const f = fakeGitHub(), job = f.candidate({ pr: 200, mergeCommit: MERGE, stage: 'closeout' });
    f.state.prs.push({ number: 200, html_url: 'https://github.com/JFusco/cms-field-vocabulary/pull/200', state: 'closed', draft: false, body: 'Closes #5', head: { sha: HEAD, ref: job.branch }, base: { ref: 'main', sha: BASE, repo: { full_name: 'JFusco/cms-field-vocabulary' } }, merged_at: '2026-10-31T13:00:00Z', merge_commit_sha: MERGE });
    f.state.cards[0].status = 'review';
    f.state.runs = [{ name: 'Quality', head_sha: MERGE, event: 'push', head_branch: 'main', status: 'completed', conclusion: 'success' }];
    return { f, job };
}
test('closes an open issue once, posts one marker comment and moves the card to Done', async () => {
    const { f, job } = merged();
    const result = await harnessCloseout(f.delivery, job, f.artifactRoot(job));
    expect(result).toMatchObject({ outcome: 'passed', commit: MERGE });
    expect(result.receipts.map(r => r.id)).toEqual(['issue-close', 'issue-comment', 'board-status']);
    expect(f.state.issue.state).toBe('closed');
    expect(f.state.comments).toHaveLength(1);
    expect(f.state.cards[0].status).toBe('done');
    await harnessCloseout(f.delivery, job, f.artifactRoot(job));
    expect(f.state.comments).toHaveLength(1);
    expect(f.state.calls.filter(c => c.startsWith('gh issue close')).length).toBe(1);
});
test('failed or missing merge Actions block closeout before any write', async () => {
    const { f, job } = merged();
    f.state.runs[0].conclusion = 'failure';
    await expect(harnessCloseout(f.delivery, job, f.artifactRoot(job))).rejects.toThrow('Actions');
    f.state.runs = [];
    await expect(harnessCloseout(f.delivery, job, f.artifactRoot(job))).rejects.toThrow('Actions');
    expect(f.state.issue.state).toBe('open');
    expect(f.state.comments).toHaveLength(0);
});
test('a completed CI repair chain stands in for the failed original merge run', async () => {
    const { f, job } = merged();
    f.state.runs[0].conclusion = 'failure';
    job.ciFollowupKey = 'GH-9';
    f.delivery.jobs.push({ ...job, id: 'repair', key: 'GH-9', status: 'completed', mergeCommit: 'e'.repeat(40) } as any);
    const result = await harnessCloseout(f.delivery, job, f.artifactRoot(job));
    expect(result.outcome).toBe('passed');
    expect(f.state.comments[0].body).toContain('repair GH-9');
});
