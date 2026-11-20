import { afterEach, expect, test } from 'vitest';
import { existsSync } from 'node:fs';
import { cleanupFakes, fakeGitHub, HEAD } from '../support/fake-github';
import { retryCandidateCleanup } from '../../../../server/delivery/candidate/retry-candidate-cleanup';
afterEach(cleanupFakes);

function delivered(cleanup: any, maintenance = true) {
    const f = fakeGitHub(), job = f.candidate({ status: 'completed', stage: 'closeout' });
    f.state.localBranches.add(job.branch); f.state.remote[job.branch] = HEAD; f.state.local.head = HEAD;
    delete job.candidateBase;
    job.candidateCleanup = cleanup;
    if (maintenance) f.store.state.maintenance = { runs: [{ id: 'run-1', status: 'completed', steps: [{ role: 'developer', stage: 'draft-pr', result: { outcome: 'passed', summary: '', receipts: [{ id: 'pr', action: 'gh-pr-create-draft', target: '', verified: true, uncertain: false, detail: '' }], candidates: [{ issue: Number(job.key.slice(3)), worktree: job.worktree, branch: job.branch, head: HEAD, summary: '' }] } }] }] } as any;
    return { f, job };
}
const DONE = { status: 'done', detail: 'Removed the candidate worktree.', at: '2026-11-19T22:47:48.875Z' };

test('a cleanup recorded before a maintenance run\'s candidate counted is tried once more, and only once', async () => {
    const { f, job } = delivered({ ...DONE });
    await retryCandidateCleanup(f.store, f.execute as any, f.delivery.jobs);
    expect([existsSync(job.worktree), f.state.localBranches.has(job.branch), !!f.state.remote[job.branch]]).toEqual([false, false, false]);
    expect(job.candidateCleanup).toMatchObject({ status: 'done', created: true, detail: 'Removed the candidate worktree, local branch, remote branch.' });
    const calls = f.state.calls.length;
    await retryCandidateCleanup(f.store, f.execute as any, f.delivery.jobs);
    expect(f.state.calls.length).toBe(calls);
});

test('a skipped cleanup is retried the same way', async () => {
    const { f, job } = delivered({ status: 'skipped', detail: 'Candidate not removed: the Office did not create this candidate.', at: DONE.at });
    await retryCandidateCleanup(f.store, f.execute as any, f.delivery.jobs);
    expect(job.candidateCleanup).toMatchObject({ status: 'done', created: true });
});

test('a refusal becomes a pending cleanup, which the poll keeps retrying', async () => {
    const { f, job } = delivered({ ...DONE });
    f.state.local.dirty = true;
    await retryCandidateCleanup(f.store, f.execute as any, f.delivery.jobs);
    expect(job.candidateCleanup).toMatchObject({ status: 'pending' });
    expect(job.candidateCleanup!.detail).toContain('uncommitted changes');
    f.state.local.dirty = false;
    await retryCandidateCleanup(f.store, f.execute as any, f.delivery.jobs);
    expect(job.candidateCleanup).toMatchObject({ status: 'done', created: true });
});

test('a finished cleanup with no maintenance-created candidate, a job with no cleanup record, and an unfinished job are left alone', async () => {
    const plain = delivered({ ...DONE }, false);
    await retryCandidateCleanup(plain.f.store, plain.f.execute as any, plain.f.delivery.jobs);
    expect([plain.f.state.calls.some(c => /branch -D|push origin :|-X DELETE/.test(c)), existsSync(plain.job.worktree)]).toEqual([false, true]);
    const unrecorded = delivered(undefined);
    await retryCandidateCleanup(unrecorded.f.store, unrecorded.f.execute as any, unrecorded.f.delivery.jobs);
    expect(existsSync(unrecorded.job.worktree)).toBe(true);
    const working = delivered({ ...DONE }); working.job.status = 'blocked';
    await retryCandidateCleanup(working.f.store, working.f.execute as any, working.f.delivery.jobs);
    expect(existsSync(working.job.worktree)).toBe(true);
});
