import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { afterEach, expect, test } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanupFakes, fakeGitHub, BASE, HEAD } from '../support/fake-github';
import { refreshConflicted, refreshEligible, refreshSettled } from '../../../../server/delivery/repairs/refresh-conflicted';
import { readReviewWait } from '../../../../server/delivery/readiness/review-wait';
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
test('the record of a finished repair does not send a later conflict down the older route: the job is refreshed and stays on harness delivery', () => {
    const { f, job, pr } = conflicted();
    // As left by an earlier conflict repair that was reviewed, verified and published: nothing pending.
    job.repairCycle = { owner: 'developer', findingAttempts: { 'main-integration-conflict': 1 }, attempts: 1, pendingFindingIds: [], sourceStage: 'lead-pr', sourceHead: BASE, phase: 'verify', publishedHead: HEAD } as any;
    expect(refreshEligible(f.store, job, pr)).toBe(true);
    expect(refreshConflicted(f.store, job, pr)).toBe(true);
    expect(job).toMatchObject({ stage: 'update-base', status: 'queued', repairReason: 'conflicts' });
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
        ['a source repair cycle with findings still pending', x => { x.job.repairCycle = { phase: 'review', pendingFindingIds: ['main-integration-conflict'] } as any; }],
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
    await claimedDelivery(f.store, job, () => f.delivery.step(job));
    expect(job.detail).not.toMatch(/Error/);
    expect(job).toMatchObject({ stage: 'draft', status: 'queued', head: MERGED });
    expect(f.state.cards[0].status).toBe('progress');
    pr.mergeable = true;
    await claimedDelivery(f.store, job, () => f.delivery.step(job));
    expect(job.detail).not.toMatch(/Error/);
    expect(job).toMatchObject({ stage: 'prepare-pr', pr: 200 });
    expect(f.state.prs).toHaveLength(1);expect(pr.head.sha).toBe(MERGED);expect(f.state.cards[0].status).toBe('review');
    await claimedDelivery(f.store, job, () => f.delivery.step(job));
    expect(job.detail).not.toMatch(/Error/);
    expect(job).toMatchObject({ stage: 'lead-pr', status: 'queued' });
    await claimedDelivery(f.store, job, () => f.delivery.step(job));
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
/** Refresh once, then a sibling merges while Sam reviews the refreshed head. */
async function conflictDuringReview(priorBaseUpdates = 0) {
    const { f, job, pr } = conflicted();
    for (let i = 0; i < priorBaseUpdates; i++) job.steps.push({ stage: 'update-base', result: result(job, BASE) });
    const root = f.artifactRoot(job), checks = resolve(root, 'checks.log'), review = resolve(root, 'lead.json');
    writeFileSync(checks, 'pass');writeFileSync(review, '{}');
    f.engine.agents.run = (async (role: string) => {
        if (role === 'developer') {
            f.state.local.head = MERGED;
            return result(job, MERGED, { evidence: [{ id: 'checks', kind: 'checks', summary: 'Required checks', path: checks, commit: MERGED, environment: 'Synthetic', url: '', observedAt: '' }] });
        }
        // A sibling merged while Sam reviewed: a conflict-only not-ready assessment.
        pr.mergeable = false;
        return result(job, MERGED, { outcome: 'blocked', blocker: 'Conflicts with main', findings: [{ id: 'merge-conflicts', summary: 'Conflicts', expected: '', actual: '', status: 'open', attempts: 0 }], evidence: [{ id: 'lead', kind: 'review', summary: 'Conflicting', path: review, commit: MERGED, environment: 'Synthetic', url: '', observedAt: '' }] });
    }) as any;
    await f.delivery.observe();
    await claimedDelivery(f.store, job, () => f.delivery.step(job));
    pr.mergeable = true;
    for (const stage of ['draft', 'prepare-pr', 'lead-pr']) { expect(job.stage).toBe(stage);await claimedDelivery(f.store, job, () => f.delivery.step(job)); }
    return { f, job };
}
test('a conflict found during Sam\'s post-refresh readiness review refreshes again instead of taking the legacy repair route', async () => {
    const { f, job } = await conflictDuringReview();
    expect(job).toMatchObject({ stage: 'lead-pr', status: 'watching', head: MERGED });
    expect(job.steps.some(s => s.stage === 'conflict-readback')).toBe(false);
    await f.delivery.observe();
    expect(job).toMatchObject({ stage: 'update-base', status: 'queued', head: MERGED });
    expect(job.steps.some(s => s.stage === 'conflict-readback')).toBe(false);
});
test('a conflict on a team-reviewed head waiting at the readiness review is refreshed without Sam assessing it', async () => {
    const { f, job, pr } = conflicted();
    Object.assign(job, { stage: 'lead-pr', status: 'queued' });
    let reviews = 0;
    f.engine.agents.run = (async () => { reviews++; throw new Error('No review expected'); }) as any;
    await claimedDelivery(f.store, job, () => f.delivery.step(job));
    expect(reviews).toBe(0);
    expect(job).toMatchObject({ stage: 'lead-pr', status: 'watching', stop: { kind: 'pr-not-ready' } });
    expect(job.steps.some(s => s.stage === 'lead-pr')).toBe(false);
    await f.delivery.observe();
    expect(job).toMatchObject({ stage: 'update-base', status: 'queued', repairReason: 'conflicts', head: HEAD });
    // An unreviewed head is not the harness's to refresh: Sam still assesses it.
    const unreviewed = conflicted();
    Object.assign(unreviewed.job, { stage: 'lead-pr', status: 'queued', steps: [] });
    unreviewed.f.engine.agents.run = (async () => { reviews++; throw new Error('Assessed'); }) as any;
    await claimedDelivery(unreviewed.f.store, unreviewed.job, () => unreviewed.f.delivery.step(unreviewed.job));
    expect(reviews).toBe(1);
    expect(unreviewed.job).toMatchObject({ stage: 'lead-pr', status: 'blocked' });
    expect(pr.mergeable).toBe(false);
});
test('a claimed review step counts as eligible only when asked, and an unsettled refresh leaves the conflict to Sam', async () => {
    const { f, job, pr } = conflicted();
    Object.assign(job, { stage: 'lead-pr', status: 'working' });
    expect(refreshEligible(f.store, job, pr)).toBe(false);
    expect(refreshEligible(f.store, job, pr, true)).toBe(true);
    // An unconfirmed board move means the refresh cannot run, so the gate must not promise one.
    job.boardUpdates = [{ status: 'uncertain' } as any];
    expect(refreshSettled(f.store, job)).toBe(false);
    expect(await readReviewWait(f.delivery, job, pr)).toBeNull();
    job.boardUpdates = [];
    expect(await readReviewWait(f.delivery, job, pr)).toMatchObject({ kind: 'pr-not-ready' });
});
test('a conflict the refresh cannot take (base-update cap reached) blocks with its reason instead of watching silently', async () => {
    const { job } = await conflictDuringReview(2);
    expect(job).toMatchObject({ stage: 'lead-pr', status: 'blocked' });
    expect(job.detail).toContain('Repeated base changes need Morgan reconciliation');
    expect(job.steps.some(s => s.stage === 'conflict-readback')).toBe(false);
});
