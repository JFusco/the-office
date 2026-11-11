import { afterEach, expect, test, vi } from 'vitest';
import { fakeGitHub, cleanupFakes, HEAD, BASE } from '../support/fake-github';
import { automationMergePolicy, routeAutomationMerge, observeAutomationMerge } from '../../../../server/delivery/readiness/automation-merge';
import { withAssignment } from '../../../../server/workers/assignment-context';
const facts = vi.hoisted(() => ({ refusal: '' }));
vi.mock('../../../../server/delivery/intake/dependabot/qualify', async original => ({
    ...await original<typeof import('../../../../server/delivery/intake/dependabot/qualify')>(), refusal: async () => facts.refusal }));
vi.mock('../../../../server/delivery/intake/dependency-bots/pin-courier', async original => ({
    ...await original<typeof import('../../../../server/delivery/intake/dependency-bots/pin-courier')>(), pinCourier: { refusal: async () => facts.refusal } }));
vi.mock('../../../../server/delivery/intake/dependency-bots/wiki-sync', async original => ({
    ...await original<typeof import('../../../../server/delivery/intake/dependency-bots/wiki-sync')>(), wikiSync: { refusal: async () => facts.refusal } }));
afterEach(() => { facts.refusal = ''; cleanupFakes(); });
function fixture(bot: 'dependabot' | 'pin-courier' | 'wiki-sync') {
    const f = fakeGitHub(), job = f.candidate({ existingPR: true, pr: 200, stage: 'lead-pr', status: 'working' });
    const pr = { number: 200, html_url: `https://github.com/${f.store.project.repository}/pull/200`, state: 'open', draft: false, mergeable: true,
        user: { login: bot === 'dependabot' ? 'dependabot[bot]' : bot }, head: { sha: HEAD, ref: job.branch },
        base: { ref: 'main', sha: BASE, repo: { full_name: f.store.project.repository } }, body: 'Closes #5' };
    f.state.prs.push(pr);
    (f.store.state.coordination!.adoptions ??= []).push({ id: 'adoption', pr: 200, issue: 5, status: 'adopted', ...(bot === 'dependabot' ? {} : { bot }), title: 'fixture', url: pr.html_url, detail: 'fixture', at: '2026-11-11T00:00:00Z' });
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: job.id }, 'owner', 'lead-pr')!;
    return { ...f, job, pr, claim, run: () => withAssignment(claim, 'delivery', () => routeAutomationMerge(f.delivery, job)) };
}
test.each(['dependabot', 'pin-courier', 'wiki-sync'] as const)('%s routes directly to hosted-check merge without a review or QA result', async bot => {
    const f = fixture(bot); expect(await f.run()).toBe(true);
    expect(f.job.stage).toBe('merge'); expect(f.job.status).toBe('queued'); expect(f.job.steps).toEqual([]);
    expect(f.store.state.workLog || []).toEqual([]);
});
test.each(['foreign-commits', 'stopped-attempt', 'target', 'author'])('%s cannot inherit automation merge permission', async kind => {
    const f = fixture('dependabot');
    if (kind === 'foreign-commits') facts.refusal = 'foreign commits';
    if (kind === 'stopped-attempt') f.job.stoppedBaseUpdate = {} as any;
    if (kind === 'target') f.pr.base.ref = 'other';
    if (kind === 'author') f.pr.user.login = 'someone-else';
    await expect(f.run()).rejects.toThrow(); expect(f.job.stage).toBe('lead-pr'); expect(f.job.steps).toEqual([]);
});
test('an ordinary PR or withdrawn adoption keeps its normal delivery policy', async () => {
    const f = fixture('dependabot'); f.store.state.coordination!.adoptions![0].status = 'blocked';
    expect(await automationMergePolicy(f.delivery, f.job, f.pr)).toBeNull(); expect(await f.run()).toBe(false);
});
test('a qualified bot rebase waits on its new-head checks, then queues merge without a review result', async () => {
    const f = fixture('dependabot'); f.store.finishClaim(f.claim.id, 'completed');
    f.job.status = 'watching'; f.job.stage = 'merge'; f.pr.head.sha = 'e'.repeat(40);
    let success = false;
    f.delivery.api = (async (path: string) => path.includes('check-runs')
        ? { total_count: 1, check_runs: [{ id: 1, head_sha: f.pr.head.sha, status: success ? 'completed' : 'in_progress', conclusion: success ? 'success' : null }] }
        : { sha: f.pr.head.sha, state: 'pending', total_count: 0, statuses: [] }) as typeof f.delivery.api;
    await expect(observeAutomationMerge(f.delivery, f.job, f.pr)).rejects.toThrow('still running');
    expect(f.job.head).toBe(f.pr.head.sha); expect(f.job.status).toBe('watching');
    success = true; expect(await observeAutomationMerge(f.delivery, f.job, f.pr)).toBe(true);
    expect(f.job).toMatchObject({ stage: 'merge', status: 'queued', head: f.pr.head.sha });
    expect(f.job.steps).toEqual([]); expect(f.store.state.workLog || []).toEqual([]);
});
