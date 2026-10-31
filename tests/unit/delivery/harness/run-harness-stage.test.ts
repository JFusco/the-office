import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD } from '../support/fake-github';
import { runHarnessStage } from '../../../../server/delivery/harness/run-harness-stage';
afterEach(cleanupFakes);

test('draft, prepare-pr and closeout run through GitHubDelivery.step with zero model calls', async () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'draft', status: 'queued', approach: { plan: 'none', review: 'none', validation: 'developer-checks', checks: ['pnpm run verify:ci'], reason: 'Synthetic low-risk change' } });
    f.state.cards[0].status = 'progress';
    let modelCalls = 0;
    f.engine.agents.run = async () => { modelCalls++; throw new Error('No model expected'); };

    await f.delivery.step(job);
    expect(job.detail).not.toMatch(/Error/);
    expect(job).toMatchObject({ stage: 'prepare-pr', status: 'queued', pr: 200 });
    expect(f.state.prs[0]).toMatchObject({ draft: true, head: { sha: HEAD } });
    expect(f.state.cards[0].status).toBe('review');

    await f.delivery.step(job);
    expect(job.detail).not.toMatch(/Error/);
    expect(job).toMatchObject({ stage: 'lead-pr', status: 'queued' });
    expect(f.state.prs[0].draft).toBe(false);

    const merge = 'f'.repeat(40);
    Object.assign(f.state.prs[0], { state: 'closed', merged_at: '2026-10-31T13:00:00Z', merge_commit_sha: merge });
    f.state.runs = [{ name: 'Quality', head_sha: merge, event: 'push', head_branch: 'main', status: 'completed', conclusion: 'success' }];
    Object.assign(job, { stage: 'closeout', status: 'queued', mergeCommit: merge });
    await f.delivery.step(job);
    expect(job.detail).toContain('Done lane verified');
    expect(job.status).toBe('completed');
    expect(f.state.issue.state).toBe('closed');
    expect(f.state.cards[0].status).toBe('done');
    expect(modelCalls).toBe(0);
    expect(f.state.calls.some(c => c.includes('--force'))).toBe(false);
});
test('a stacked PR or one with dependents falls back to the guarded metadata worker', async () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'prepare-pr', pr: 200 });
    f.state.prs.push({ number: 200, html_url: 'u', state: 'open', draft: true, body: 'Closes #5', head: { sha: HEAD, ref: job.branch }, base: { ref: 'codex/parent', sha: BASE, repo: { full_name: 'JFusco/cms-field-vocabulary' } } });
    expect(await runHarnessStage(f.delivery, job, f.artifactRoot(job), true)).toBeNull();
    f.state.prs[0].base.ref = 'main';
    f.state.prs.push({ number: 201, html_url: 'u2', state: 'open', draft: true, head: { sha: 'c'.repeat(40), ref: 'child' }, base: { ref: job.branch, sha: HEAD, repo: { full_name: 'JFusco/cms-field-vocabulary' } } });
    expect(await runHarnessStage(f.delivery, job, f.artifactRoot(job), true)).toBeNull();
});
test('an unreviewed draft stays draft and still proceeds to read-only Lead assessment', async () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'prepare-pr', pr: 200 });
    f.state.prs.push({ number: 200, html_url: 'u', state: 'open', draft: true, body: 'Closes #5', head: { sha: HEAD, ref: job.branch }, base: { ref: 'main', sha: BASE, repo: { full_name: 'JFusco/cms-field-vocabulary' } } });
    const result = await runHarnessStage(f.delivery, job, f.artifactRoot(job), false);
    expect(result?.summary).toContain('left as draft');
    expect(f.state.prs[0].draft).toBe(true);
});
