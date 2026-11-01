import { afterEach, expect, test } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanupFakes, fakeGitHub, BASE, HEAD } from '../support/fake-github';
import { refreshConflicted } from '../../../../server/delivery/repairs/refresh-conflicted';
import { HOLDS } from '../../../../server/office/config';
import type { StageResult } from '../../../../src/shared';
afterEach(cleanupFakes);

const MERGED = 'd'.repeat(40);
const result = (job: any, commit: string, extra: Partial<StageResult> = {}): StageResult => ({ outcome: 'passed', summary: 'ok', commit, blocker: '', evidence: [], findings: [], receipts: [], previewUrl: '', worktree: job.worktree, branch: job.branch, prId: 200, qaRunDir: '', paidRuns: 0, ...extra });
/** A hands-off job whose team-reviewed PR #200 became conflicting while it waited at the guarded merge. */
function conflicted() {
    const f = fakeGitHub(), job = f.candidate({ stage: 'merge', status: 'blocked', pr: 200, prUrl: 'https://github.com/JFusco/cms-field-vocabulary/pull/200', detail: 'Error: PR readiness or reviewed commit changed; Sam must reassess' });
    f.store.state.coordination!.merges = { enabled: true, authorizedAt: '2026-10-28T00:00:00Z' };
    f.state.cards[0].status = 'review';f.state.remote[job.branch] = HEAD;
    job.steps.push({ stage: 'review', result: result(job, HEAD) });
    f.state.prs.push({ number: 200, html_url: job.prUrl, state: 'open', draft: false, mergeable: false, body: 'Closes #5', head: { sha: HEAD, ref: job.branch, repo: { full_name: 'JFusco/cms-field-vocabulary' } }, base: { ref: 'main', sha: BASE, repo: { full_name: 'JFusco/cms-field-vocabulary' } }, merged_at: null, merge_commit_sha: null, updated_at: '2026-11-01T16:15:30Z' });
    return { f, job, pr: f.state.prs[0] };
}
test('a conflicting team-reviewed PR is requeued for Alex to merge current main into the same branch', () => {
    const { f, job, pr } = conflicted();
    expect(refreshConflicted(f.store, job, pr)).toBe(true);
    expect(job).toMatchObject({ stage: 'update-base', status: 'queued', repairReason: 'conflicts', pr: 200, head: HEAD });
    expect(job.steps.some(s => s.stage === 'conflict-readback')).toBe(false);
});
test('mergeable or still-computing PRs, holds, pauses, merge attempts, unreviewed heads and legacy projects are left alone', () => {
    const cases: [string, (x: ReturnType<typeof conflicted>) => void][] = [
        ['mergeable', x => { x.pr.mergeable = true; }],
        ['computing', x => { x.pr.mergeable = null; }],
        ['head moved', x => { x.pr.head.sha = 'c'.repeat(40); }],
        ['held', x => { HOLDS[x.job.key] = 'Synthetic hold'; }],
        ['paused', x => { x.f.store.state.paused = true; }],
        ['merge attempt', x => { x.job.mergeAttempt = { head: HEAD, at: 'before' } as any; }],
        ['dispatched merge intent', x => { x.f.store.putEffect({ id: `merge:${x.job.id}:${HEAD}`, work: { projectId: x.f.store.project.id, kind: 'delivery', id: x.job.id }, status: 'uncertain', dispatchedAt: 'before' } as any); }],
        ['unreviewed head', x => { x.job.steps = []; }],
        ['legacy project', x => { (x.f.store.project as any).id = 'cec'; }],
        ['draining', x => { x.f.store.state.draining = true; }],
        ['approval required', x => { x.job.mergeApprovalRequired = true; }],
        ['merges disabled', x => { x.f.store.state.coordination!.merges = { enabled: false } as any; }],
        ['retained source repair cycle', x => { x.job.repairCycle = { phase: 'verify', pendingFindingIds: [] } as any; }],
        ['draft PR', x => { x.pr.draft = true; }],
        ['unconfirmed board move', x => { x.job.boardUpdates = [{ status: 'uncertain' } as any]; }],
        ['running worker', x => { x.f.store.state.workLog = [{ id: 'w', requestId: x.job.id, status: 'running' } as any]; }],
        ['repeated base updates', x => { for (let i = 0; i < 3; i++) x.job.steps.push({ stage: 'update-base', result: result(x.job, HEAD) }); }],
    ];
    for (const [name, arrange] of cases) {
        const x = conflicted();arrange(x);
        try { expect(refreshConflicted(x.f.store, x.job, x.pr), name).toBe(false);expect(x.job.stage, name).toBe('merge'); }
        finally { delete HOLDS[x.job.key]; }
    }
});
test('the observer refreshes the conflicting job, which reaches the guarded merge again on the same PR', async () => {
    const { f, job, pr } = conflicted();
    const root = f.artifactRoot(job), checks = resolve(root, 'checks.log'), review = resolve(root, 'lead.json');
    writeFileSync(checks, 'pass');writeFileSync(review, '{}');
    const roles: string[] = [];
    f.engine.agents.run = (async (role: string, task: string) => {
        roles.push(role);
        if (role === 'developer') {
            expect(task).toContain('forward-merge it into this same branch');
            f.state.local.head = MERGED;
            return result(job, MERGED, { evidence: [{ id: 'checks', kind: 'checks', summary: 'Required checks', path: checks, commit: MERGED, environment: 'Synthetic', url: '', observedAt: '' }] });
        }
        return result(job, MERGED, { evidence: [{ id: 'lead', kind: 'review', summary: 'Merged head ready', path: review, commit: MERGED, environment: 'Synthetic', url: '', observedAt: '' }] });
    }) as any;

    await f.delivery.observe();
    expect(job).toMatchObject({ stage: 'update-base', status: 'queued' });
    await f.delivery.step(job);
    expect(job.detail).not.toMatch(/Error/);
    expect(job).toMatchObject({ stage: 'draft', status: 'queued', head: MERGED });
    expect(f.state.cards[0].status).toBe('progress');
    pr.mergeable = true;
    await f.delivery.step(job);
    expect(job.detail).not.toMatch(/Error/);
    expect(job).toMatchObject({ stage: 'prepare-pr', pr: 200 });
    expect(f.state.prs).toHaveLength(1);expect(pr.head.sha).toBe(MERGED);expect(f.state.cards[0].status).toBe('review');
    await f.delivery.step(job);
    expect(job.detail).not.toMatch(/Error/);
    expect(job).toMatchObject({ stage: 'lead-pr', status: 'queued' });
    await f.delivery.step(job);
    expect(job.detail).not.toMatch(/Error/);
    expect(job).toMatchObject({ stage: 'merge', status: 'queued', head: MERGED });
    expect(roles).toEqual(['developer', 'lead']);

    // A second sibling merge conflicts the refreshed head; Sam's exact-head review lets it refresh again.
    Object.assign(job, { status: 'blocked' });pr.mergeable = false;
    expect(job.reviewContext?.head).toBe(MERGED);
    await f.delivery.observe();
    expect(job).toMatchObject({ stage: 'update-base', status: 'queued', head: MERGED });
    expect(job.steps.some(s => s.stage === 'conflict-readback')).toBe(false);
    expect(f.state.calls.some(c => c.includes('--force') || c.includes('/merge --method PUT'))).toBe(false);
});
