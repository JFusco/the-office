import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD } from '../support/fake-github';
afterEach(cleanupFakes);
import { existsSync } from 'node:fs';
import { harnessCloseout } from '../../../../server/delivery/closeout/closeout';
import { retryCandidateCleanup } from '../../../../server/delivery/candidate/retry-candidate-cleanup';
import { syncOutbox, openActions } from '../../../../server/conversations/outbox';

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
test('closeout removes the merged candidate; a dirty candidate never holds closeout and is retried by the poll', async () => {
    const { f, job } = merged();
    f.state.localBranches.add(job.branch);f.state.remote[job.branch] = HEAD;f.state.local.head = HEAD;
    await harnessCloseout(f.delivery, job, f.artifactRoot(job));
    expect(job.candidateCleanup?.status).toBe('done');expect(existsSync(job.worktree)).toBe(false);expect(f.state.localBranches.has(job.branch)).toBe(false);expect(f.state.remote[job.branch]).toBeFalsy();
    const dirty = merged();dirty.f.state.local.head = HEAD;dirty.f.state.local.dirty = true;
    await expect(harnessCloseout(dirty.f.delivery, dirty.job, dirty.f.artifactRoot(dirty.job))).resolves.toMatchObject({ outcome: 'passed' });
    expect(dirty.job.candidateCleanup).toMatchObject({ status: 'pending' });expect(existsSync(dirty.job.worktree)).toBe(true);
    syncOutbox(dirty.f.store.state);expect(openActions(dirty.f.store.state).some(a => a.id === `candidate-cleanup:${dirty.job.id}`)).toBe(true);
    dirty.job.status = 'completed';dirty.f.state.local.dirty = false;
    await retryCandidateCleanup(dirty.f.store, dirty.f.execute as any, dirty.f.delivery.jobs);
    expect(dirty.job.candidateCleanup?.status).toBe('done');expect(existsSync(dirty.job.worktree)).toBe(false);
    syncOutbox(dirty.f.store.state);expect(openActions(dirty.f.store.state).some(a => a.id === `candidate-cleanup:${dirty.job.id}`)).toBe(false);
});
