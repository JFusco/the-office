import { afterEach, expect, test, vi } from 'vitest';
import { fakeGitHub, cleanupFakes, HEAD, BASE } from '../support/fake-github';
import { automationMergePolicy, routeAutomationMerge } from '../../../../server/delivery/readiness/automation-merge';
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
    const pr = { number: 200, html_url: `https://github.com/${f.store.project.repository}/pull/200`, state: 'open', draft: false,
        user: { login: bot === 'dependabot' ? 'dependabot[bot]' : bot }, head: { sha: HEAD, ref: job.branch },
        base: { ref: 'main', sha: BASE, repo: { full_name: f.store.project.repository } }, body: 'Closes #5' };
    f.state.prs.push(pr);
    (f.store.state.coordination!.adoptions ??= []).push({ id: 'adoption', pr: 200, issue: 5, status: 'adopted', ...(bot === 'dependabot' ? {} : { bot }), title: 'fixture', url: pr.html_url, detail: 'fixture', at: '2026-11-11T00:00:00Z' });
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: job.id }, 'owner', 'lead-pr')!;
    return { ...f, job, pr, run: () => withAssignment(claim, 'delivery', () => routeAutomationMerge(f.delivery, job)) };
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
