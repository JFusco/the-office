import { afterEach, expect, test, vi } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { cleanupFakes, fakeGitHub, BASE, HEAD } from '../support/fake-github';
import * as policy from '../../../../server/office/project-policy';
import { HUMAN_MERGE, harnessMayMerge } from '../../../../server/delivery/readiness/merge-ceiling';
import { routeAutomationMerge, observeAutomationMerge } from '../../../../server/delivery/readiness/automation-merge';
import { commandRoute } from '../../../../server/office/http/commands';
import { recheckPR } from '../../../../server/scheduling/operator-commands';
import { resumeReviewedMerge } from '../../../../server/delivery/readiness/github-check-selection';
import type { StageResult, TicketJob } from '../../../../src/shared';

vi.mock('../../../../server/delivery/intake/dependabot/qualify', async original => ({
    ...await original<typeof import('../../../../server/delivery/intake/dependabot/qualify')>(), refusal: async () => '' }));
afterEach(() => { vi.restoreAllMocks(); cleanupFakes(); });

/** The fixture project under a `merge: "human"` policy; every other policy key keeps its resolved value. */
function humanMerge() {
    const resolved = policy.resolveProjectPolicy;
    vi.spyOn(policy, 'projectPolicy').mockImplementation(project => ({ ...resolved(project), merge: 'human' }));
}
/** A reviewed, mergeable PR with the runtime switch on AND an exact-head approval: everything short of policy says merge. */
function authorized(overrides: Partial<TicketJob> = {}) {
    const f = fakeGitHub(), job = f.candidate({ stage: 'lead-pr', status: 'working', pr: 200, ...overrides });
    const pr = { number: 200, html_url: 'https://github.com/JFusco/cms-field-vocabulary/pull/200', state: 'open', draft: false, mergeable: true, body: 'Closes #5', user: { login: 'dependabot[bot]' }, head: { sha: HEAD, ref: job.branch }, base: { ref: 'main', sha: BASE, repo: { full_name: 'JFusco/cms-field-vocabulary' } } };
    f.state.prs.push(pr);
    f.store.state.coordination!.merges = { enabled: true, authorizedAt: '2026-10-28T00:00:00Z' };
    job.mergeAuthorization = { head: HEAD, at: '2026-10-28T00:00:00Z' };
    const path = resolve(f.artifactRoot(job), 'review.json');
    writeFileSync(path, '{}');
    const result: StageResult = { outcome: 'passed', summary: 'Ready to merge', commit: HEAD, blocker: '', evidence: [{ id: 'r', kind: 'review', summary: 'review', path, commit: HEAD, environment: 'test', url: '', observedAt: '' }], findings: [], receipts: [], previewUrl: '', worktree: job.worktree, branch: job.branch, prId: 200, qaRunDir: '', paidRuns: 0 };
    return { f, job, pr, result };
}
const mergeWrites = (f: ReturnType<typeof fakeGitHub>) => f.state.calls.filter(call => call.includes('/merge'));
const mergeEffects = (f: ReturnType<typeof fakeGitHub>, job: TicketJob) => f.store.getEffect(`merge:${job.id}:${job.head}`);
const command = (f: ReturnType<typeof fakeGitHub>, body: object) => {
    const url = new URL('http://office.invalid/api/commands');
    return commandRoute(new Request(url, { method: 'POST', body: JSON.stringify(body) }), url, { store: f.store, coordinator: { state: f.store.state.coordination } } as never);
};

test('the ceiling reads the project policy', () => {
    const { f } = authorized();
    expect(harnessMayMerge(f.store)).toBe(true);
    humanMerge();
    expect(harnessMayMerge(f.store)).toBe(false);
});

test('a passed Lead review queues the merge under harness policy and only watches under human policy', async () => {
    const harness = authorized();
    await claimedDelivery(harness.f.store, harness.job, () => harness.f.delivery.finishLeadReview(harness.job, harness.result));
    expect(harness.job).toMatchObject({ stage: 'merge', status: 'queued' });
    humanMerge();
    const human = authorized();
    await claimedDelivery(human.f.store, human.job, () => human.f.delivery.finishLeadReview(human.job, human.result));
    expect(human.job).toMatchObject({ stage: 'lead-pr', status: 'watching', mergeAuthorization: { head: HEAD } });
});

test('an exact-head approval is refused before it records authorization or queues', async () => {
    humanMerge();
    const { f, job, result } = authorized({ status: 'watching', mergeApprovalRequired: true });
    delete job.mergeAuthorization;
    job.steps.push({ stage: 'lead-pr', result });
    await expect(f.delivery.approveMerge(job.key, HEAD)).rejects.toThrow(HUMAN_MERGE);
    expect(job).toMatchObject({ stage: 'lead-pr', status: 'watching', mergeApprovalRequired: true });
    expect(job.mergeAuthorization).toBeUndefined();
});

test('automation PRs are neither routed nor observed into the merge stage', async () => {
    humanMerge();
    const { f, job, pr } = authorized({ existingPR: true });
    (f.store.state.coordination!.adoptions ??= []).push({ id: 'adoption', pr: 200, issue: 5, status: 'adopted', title: 'fixture', url: pr.html_url, detail: 'fixture', at: '2026-11-11T00:00:00Z' });
    expect(await claimedDelivery(f.store, job, () => routeAutomationMerge(f.delivery, job))).toBe(false);
    expect(await observeAutomationMerge(f.delivery, job, pr)).toBe(false);
    expect(job.stage).toBe('lead-pr');
});

test('a team-reviewed prepared PR goes to Lead review instead of the guarded merge', async () => {
    humanMerge();
    const { f, job } = authorized({ stage: 'prepare-pr', status: 'queued', approach: { plan: 'none', review: 'focused', validation: 'developer-checks', checks: ['pnpm run verify:ci'], reason: 'Synthetic' } });
    job.steps.push({ stage: 'review', result: { outcome: 'passed', summary: 'Reviewed', commit: HEAD, blocker: '', evidence: [], findings: [], receipts: [], previewUrl: '', worktree: job.worktree, branch: job.branch, prId: 200, qaRunDir: '', paidRuns: 0 } });
    await claimedDelivery(f.store, job, () => f.delivery.step(job));
    expect(job.detail).not.toMatch(/Error/);
    expect(job).toMatchObject({ stage: 'lead-pr', status: 'queued' });
});

test('a merge job queued before the policy changed is blocked with the reason; nothing is dispatched and nothing is erased', async () => {
    humanMerge();
    const { f, job, result } = authorized({ stage: 'merge', status: 'queued' });
    job.steps.push({ stage: 'lead-pr', result });
    await claimedDelivery(f.store, job, () => f.delivery.step(job), false);
    expect(job).toMatchObject({ stage: 'merge', status: 'blocked', head: HEAD, mergeAuthorization: { head: HEAD } });
    expect(job.detail).toContain(HUMAN_MERGE);
    expect(f.store.state.coordination!.merges).toMatchObject({ enabled: true });
    expect(job.mergeAttempt).toBeUndefined();
    expect(mergeEffects(f, job)).toBeUndefined();
    expect(mergeWrites(f)).toEqual([]);
});

test('a merge that was already attempted keeps its read-back route under human policy', async () => {
    humanMerge();
    const { f, job } = authorized({ stage: 'merge', status: 'queued' });
    job.mergeAttempt = { head: HEAD, at: '2026-10-29T13:00:00Z' };
    await expect(claimedDelivery(f.store, job, () => f.delivery.merge(job))).rejects.toThrow('read-back');
    expect(mergeWrites(f)).toEqual([]);
});

test('the runtime switch cannot be turned on, can be turned off, and approval requests are refused', async () => {
    humanMerge();
    const { f, job } = authorized();
    await expect(command(f, { action: 'configure-merges', merges: { enabled: true } })).rejects.toThrow(HUMAN_MERGE);
    expect(f.store.state.coordination!.merges!.authorizedAt).toBe('2026-10-28T00:00:00Z');
    expect((await command(f, { action: 'configure-merges', merges: { enabled: false } }))!.ok).toBe(true);
    expect(f.store.state.coordination!.merges!.enabled).toBe(false);
    await expect(command(f, { action: 'approve-merge', key: job.key, head: HEAD })).rejects.toThrow(HUMAN_MERGE);
    expect(f.store.state.coordination!.requests || []).toEqual([]);
});

test('the policy reason is reported even when the runtime switch is off and no approval exists', async () => {
    humanMerge();
    const { f, job } = authorized({ stage: 'merge', status: 'queued' });
    f.store.state.coordination!.merges = { enabled: false, authorizedAt: '' };
    delete job.mergeAuthorization;
    await expect(claimedDelivery(f.store, job, () => f.delivery.merge(job))).rejects.toThrow(HUMAN_MERGE);
});

test('an operator recheck cannot re-queue a blocked merge preflight', () => {
    const blocked = () => { const a = authorized({ stage: 'merge', status: 'blocked', detail: HUMAN_MERGE }); return { ...a, recheck: () => recheckPR.call({ state: a.f.store.state.coordination, store: a.f.store } as never, a.job.key) }; };
    const harness = blocked();
    harness.recheck();
    expect(harness.job.status).toBe('queued');
    humanMerge();
    const human = blocked();
    expect(human.recheck).toThrow(HUMAN_MERGE);
    expect(human.job).toMatchObject({ stage: 'merge', status: 'blocked', detail: HUMAN_MERGE });
});

test('PR observation does not resume a blocked merge: no provider reads, no status change', async () => {
    const blocked = () => {
        const a = authorized({ stage: 'merge', status: 'blocked', detail: HUMAN_MERGE, approach: { plan: 'none', review: 'focused', validation: 'developer-checks', checks: ['pnpm run verify:ci'], reason: 'Synthetic' } });
        a.job.steps.push({ stage: 'review', result: { ...a.result, evidence: [] } });
        return a;
    };
    // Under harness policy the same job passes the gate and goes on to read current checks from the provider.
    const harness = blocked(); let reads = 0;
    harness.f.delivery.api = (async () => { reads++; throw new Error('provider read'); }) as never;
    await expect(resumeReviewedMerge(harness.f.delivery, harness.job, harness.pr)).rejects.toThrow();
    expect(reads).toBeGreaterThan(0);
    humanMerge();
    const human = blocked(); reads = 0;
    human.f.delivery.api = (async () => { reads++; throw new Error('provider read'); }) as never;
    expect(await resumeReviewedMerge(human.f.delivery, human.job, human.pr)).toBe(false);
    expect(reads).toBe(0);
    expect(human.job).toMatchObject({ status: 'blocked', detail: HUMAN_MERGE });
});
