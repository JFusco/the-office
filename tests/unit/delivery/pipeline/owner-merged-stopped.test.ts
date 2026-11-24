import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD, REPOSITORY } from '../support/fake-github';
import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { HOLDS } from '../../../../server/office/config';
import { projectById } from '../../../../server/office/projects';
import { Store } from '../../../../server/store/store';
import { coordination, Coordinator } from '../../../../server/scheduling/coordination';
import { GitHubDelivery } from '../../../../server/delivery/pipeline/github-delivery';
import type { DependencyStores } from '../../../../server/delivery/pipeline/dependencies';
import type { EffectIntent, Prerequisite, Receipt, StageResult, TicketJob } from '../../../../src/shared';

const SQUASH = 'd'.repeat(40), EARLIER = 'e'.repeat(40), PR_URL = `https://github.com/${REPOSITORY}/pull/200`;
const held: string[] = [], others: Store[] = [];
afterEach(() => { vi.restoreAllMocks(); held.splice(0).forEach(key => delete HOLDS[key]); others.splice(0).forEach(store => store.close()); cleanupFakes(); });

const read = (id: string, action: string, target = PR_URL, detail = 'read back'): Receipt => ({ id, action, target, verified: true, uncertain: false, detail });
function result(job: TicketJob, commit: string, extra: Partial<StageResult> = {}): StageResult {
    return { outcome: 'passed', summary: 'ok', commit, blocker: '', evidence: [], findings: [], receipts: [], previewUrl: '', worktree: job.worktree, branch: job.branch, prId: 200, qaRunDir: '', paidRuns: 0, ...extra };
}
/** What `harnessDraft` saves: the PR published at this head, read back. */
function draft(job: TicketJob, commit: string): StageResult {
    return result(job, commit, {
        receipts: [read('draft-pr', 'github-pr-publish', PR_URL, `PR #200 head ${commit} read back`), read('board-status', 'board In review', 'https://github.com/users/JFusco/projects/6', 'In review read back')],
        evidence: [{ id: `draft-${commit}`, kind: 'checks', summary: 'Office harness draft read-back', path: '/dev/null', commit, environment: 'Office harness', url: '', observedAt: '' }],
    });
}

/** The GH-189 shape: a conflict-refreshed, republished candidate whose last two Lead reviews blocked with open findings. */
function stopped() {
    const f = fakeGitHub();
    const job = f.candidate({ stage: 'lead-pr', status: 'blocked', pr: 200, prUrl: PR_URL, existingPR: true, repairReason: 'conflicts',
        stop: { kind: 'unclassified', at: '2026-11-23T19:47:48.020Z' }, detail: 'Error: Sam blocked the review on PR metadata', lastPRFingerprint: '["fingerprint"]' });
    const blocked = result(job, HEAD, { outcome: 'blocked', summary: 'PR metadata needs a fix', blocker: 'PR metadata needs a fix',
        findings: [{ id: 'pr-metadata', summary: 'Body lacks the source acceptance note', expected: 'note', actual: 'none', status: 'open', attempts: 1 }],
        receipts: [read('local-merge-commit', 'git merge commit (local only)'), read('draft-pr', 'github-pr-publish', PR_URL, `PR #200 head ${HEAD} read back`)] });
    job.steps.push(
        { stage: 'implement', result: result(job, EARLIER) }, { stage: 'review', result: result(job, EARLIER) },
        { stage: 'draft', result: draft(job, EARLIER) }, { stage: 'prepare-pr', result: result(job, EARLIER, { receipts: [read('pr-ready', 'github-pr-ready')] }) },
        { stage: 'update-base', result: result(job, HEAD, { receipts: [read('local-merge-commit', 'git merge commit (local only)')] }) },
        { stage: 'draft', result: draft(job, HEAD) }, { stage: 'prepare-pr', result: result(job, HEAD) },
        { stage: 'lead-pr', result: blocked }, { stage: 'lead-pr', result: structuredClone(blocked) });
    job.boardUpdates = [{ stage: 'lead-pr', head: HEAD, project: 'project', item: 'issue-card', field: 'status', option: 'review', target: 'In review', at: '2026-11-23T19:00:00Z', status: 'verified', detail: 'In review lane verified after the Office claimed this review.' }];
    f.store.state.workLog = [{ id: 'lead-run', role: 'lead', task: 'review', ticket: 'GH-5', stage: 'github-lead-pr', requestId: job.id, sessionId: 'lead-session', provider: 'claude', model: 'm', effort: 'e',
        executionStatus: 'completed', status: 'blocked', startedAt: '2026-11-23T19:40:00Z', lastHeartbeatAt: '2026-11-23T19:47:00Z', endedAt: '2026-11-23T19:47:00Z', elapsedMs: 1, queuedMs: 0,
        inputTokens: null, outputTokens: null, durationUncertain: false, reportedAt: '' }];
    const pull: any = { number: 200, html_url: PR_URL, title: 'docs(operating): require explicit source acceptance', body: 'Closes #5', state: 'closed', draft: false, mergeable: null,
        merged: true, merged_at: '2026-11-23T20:00:00Z', merged_by: { login: 'JFusco' }, merge_commit_sha: SQUASH, updated_at: '2026-11-23T20:00:00Z',
        head: { sha: HEAD, ref: job.branch, repo: { full_name: REPOSITORY } }, base: { ref: 'main', sha: BASE, repo: { full_name: REPOSITORY } } };
    f.state.prs.push(pull);
    // The squash's closing directive already closed the issue.
    Object.assign(f.state.issue, { state: 'closed', state_reason: 'completed' });
    f.state.cards[0].status = 'review';
    f.state.cards.push({ id: 'pr-card', kind: 'PullRequest', number: 200, status: 'review' });
    f.state.runs = [{ name: 'Quality', head_sha: SQUASH, event: 'push', head_branch: 'main', status: 'completed', conclusion: 'success' }];
    f.state.localBranches.add(job.branch);
    f.state.remote[job.branch] = HEAD;
    // The squash commit is not related by ancestry to the PR head; cleanup must not need it to be.
    f.state.notAncestor = true;
    const writes: string[] = [], base = f.delivery.execute;
    f.delivery.execute = (async (program: string, args: string[], options: any = {}) => {
        const line = `${program} ${args.join(' ')}`;
        if (args[1] === 'graphql' && String(JSON.parse(options.input).query).startsWith('mutation')) writes.push(`board ${JSON.parse(options.input).variables.option}`);
        else if (/^gh issue close|^gh api -X DELETE|\/comments -f|^git (push|branch -D|worktree (add|remove|prune))|\/merge\b/.test(line)) writes.push(line);
        return base(program, args, options);
    }) as typeof base;
    return { f, job, pull, writes };
}
const settlements = (f: ReturnType<typeof fakeGitHub>) => f.store.state.events.filter(event => event.kind === 'github-delivery-owner-merged');
const effects = (f: ReturnType<typeof fakeGitHub>) => (f.store.db.prepare('SELECT body FROM effects').all() as { body: string }[]).map(row => JSON.parse(row.body) as EffectIntent);

test('an owner squash of a stopped Office-published review is closed out once through the ordinary merged path', async () => {
    const { f, job, writes } = stopped(), history = structuredClone(job.steps);
    await f.delivery.observe();
    // Recognised, then the ordinary merged branch read the squash commit's Actions and queued closeout.
    expect(job).toMatchObject({ stage: 'closeout', status: 'queued', mergeCommit: SQUASH, head: HEAD });
    expect(job.stop).toBeUndefined();
    expect(settlements(f)).toHaveLength(1);
    expect(settlements(f)[0].message).toContain(`by its owner JFusco: head ${HEAD}, merge commit ${SQUASH}`);
    expect(f.state.calls.filter(call => call.includes(`actions/runs?head_sha=${SQUASH}`))).toHaveLength(1);
    expect(writes).toEqual([]);
    await claimedDelivery(f.store, job, () => f.delivery.step(job));
    expect(job.status, job.detail).toBe('completed');
    expect(job.steps.filter(step => step.stage === 'closeout')).toHaveLength(1);
    expect(job.steps.slice(0, history.length)).toEqual(history);
    expect(f.state.comments).toHaveLength(1);
    expect(f.state.cards.map(card => card.status)).toEqual(['done', 'done']);
    expect(effects(f).filter(effect => effect.operation === 'github-project-status').map(effect => effect.id))
        .toEqual(['issue-card', 'pr-card'].map(item => `harness:${job.id}:closeout:${SQUASH}:lane:${item}`));
    // No merge was dispatched; the already-closed issue was not closed again; cleanup is guarded by the PR head.
    expect(writes.some(write => /\/merge\b|gh issue close/.test(write))).toBe(false);
    expect(effects(f).filter(effect => effect.operation === 'github-merge')).toEqual([]);
    expect(effects(f).filter(effect => effect.status !== 'verified')).toEqual([]);
    expect(job.candidateCleanup?.status).toBe('done');
    expect(existsSync(job.worktree)).toBe(false);
    expect(f.state.localBranches.has(job.branch)).toBe(false);
    expect(f.state.remote[job.branch]).toBeFalsy();
    expect(f.state.calls.some(call => call.includes('merge-base') && call.includes(SQUASH))).toBe(false);
    const sent = writes.length;
    await f.delivery.observe();
    expect(writes).toHaveLength(sent);
    expect(settlements(f)).toHaveLength(1);
});

test('missing or running merge Actions wait in watching; failed Actions take the existing CI route', async () => {
    const waiting = stopped();
    waiting.f.state.runs = [];
    await waiting.f.delivery.observe();
    expect(waiting.job).toMatchObject({ stage: 'lead-pr', status: 'watching', mergeCommit: SQUASH, detail: 'Merged; waiting for GitHub Actions on the merge commit.' });
    waiting.f.state.runs = [{ name: 'Quality', head_sha: SQUASH, event: 'push', head_branch: 'main', status: 'in_progress', conclusion: null }];
    await waiting.f.delivery.observe();
    expect(waiting.job).toMatchObject({ stage: 'lead-pr', status: 'watching', detail: 'Merged; GitHub Actions are running.' });
    waiting.f.state.runs[0] = { ...waiting.f.state.runs[0], status: 'completed', conclusion: 'success' };
    await waiting.f.delivery.observe();
    expect(waiting.job).toMatchObject({ stage: 'closeout', status: 'queued' });
    expect(settlements(waiting.f)).toHaveLength(1);
    expect(waiting.writes).toEqual([]);

    const failed = stopped();
    failed.f.state.runs[0].conclusion = 'failure';
    await failed.f.delivery.observe();
    expect(failed.job).toMatchObject({ stage: 'ci-recovery', status: 'queued', mergeCommit: SQUASH });
    expect(failed.writes).toEqual([]);
});

test('an open pull request changes nothing and queues nothing', async () => {
    const { f, job, pull, writes } = stopped();
    Object.assign(pull, { state: 'open', merged: false, merged_at: null, merged_by: null, merge_commit_sha: null });
    f.state.issue.state = 'open';
    const before = structuredClone({ stage: job.stage, status: job.status, stop: job.stop, fingerprint: job.lastPRFingerprint, detail: job.detail });
    const requests = f.store.state.coordination!.requests?.length ?? 0;
    await f.delivery.observe();
    expect({ stage: job.stage, status: job.status, stop: job.stop, fingerprint: job.lastPRFingerprint, detail: job.detail }).toEqual(before);
    expect(job.mergeCommit).toBeUndefined();
    expect(f.store.state.coordination!.requests?.length ?? 0).toBe(requests);
    expect(settlements(f)).toEqual([]);
    expect(writes).toEqual([]);
    // An open PR costs one read per poll: its issue link is read only once it is merged.
    expect(f.state.calls.filter(call => call.includes('closingIssuesReferences'))).toEqual([]);
});

const refusals: [string, (fixture: ReturnType<typeof stopped>) => void][] = [
    ['a merge by anyone but the owner', ({ pull }) => { pull.merged_by = { login: 'octocat' }; }],
    ['a head that moved after publication', ({ pull }) => { pull.head.sha = 'f'.repeat(40); }],
    ['no native link to the issue', ({ pull }) => { pull.body = 'Closes #6'; }],
    ['another target branch', ({ pull }) => { pull.base.ref = 'develop'; }],
    ['no harness publication receipt for the head', ({ job }) => {
        for (const step of job.steps.filter(step => step.stage === 'draft')) step.result.receipts = step.result.receipts.filter(receipt => receipt.id !== 'draft-pr');
    }],
    ['an unfinished worker', ({ f, job }) => {
        f.store.state.workLog!.push({ ...f.store.state.workLog![0], id: 'writer-run', role: 'developer', stage: 'github-update-base', status: 'running', executionStatus: undefined, endedAt: '', requestId: job.id });
    }],
    ['an unsettled Effect', ({ f, job }) => {
        f.store.putEffect({ id: `harness:${job.id}:closeout-comment`, work: { projectId: f.store.project.id, kind: 'delivery', id: job.id }, attemptId: job.id, operation: 'github-issue-comment',
            target: f.issueUrl, authorization: 'office-harness', payload: {}, expectedState: {}, status: 'uncertain', createdAt: '2026-11-23T19:00:00Z', dispatchedAt: '2026-11-23T19:00:01Z', verifiedAt: '', receipt: null, error: 'timeout', elapsedMs: 1 });
    }],
    ['the linked issue is another one', ({ f }) => { f.state.issue.number = 6; }],
    ['the issue closed as not planned', ({ f }) => { f.state.issue.state_reason = 'not_planned'; }],
    ['a merge the Office itself sent', ({ f, job }) => {
        f.store.putEffect({ id: `merge:${job.id}:${HEAD}`, work: { projectId: f.store.project.id, kind: 'delivery', id: job.id }, attemptId: job.id, operation: 'github-merge',
            target: PR_URL, authorization: 'office-harness', payload: {}, expectedState: {}, status: 'verified', createdAt: '2026-11-23T19:50:00Z', dispatchedAt: '2026-11-23T19:50:01Z', verifiedAt: '2026-11-23T19:50:02Z', receipt: {}, error: '', elapsedMs: 1 });
    }],
    ['a queued recovery request', ({ f }) => {
        (f.store.state.coordination!.requests ??= []).push({ id: 'recovery', action: 'reconcile-review', key: 'GH-5', head: '', status: 'queued', requestedAt: '2026-11-23T19:49:00Z', detail: '' } as any);
    }],
    ['an uncertain step receipt', ({ job }) => {
        job.steps.at(-1)!.result.receipts.push({ id: 'pr-edit', action: 'github-pr-edit', target: PR_URL, verified: false, uncertain: true, detail: 'timed out' });
    }],
    ['a merge attempt', ({ job }) => { job.mergeAttempt = { at: '2026-11-23T19:50:00Z' } as any; }],
    ['a merge intent', ({ job }) => { job.mergeIntentId = `merge:${job.id}:${HEAD}`; }],
    ['a merge approval wait', ({ job }) => { job.mergeApprovalRequired = true; }],
    ['a worker that crashed before it finished', ({ f, job }) => {
        f.store.state.workLog!.push({ ...structuredClone(f.store.state.workLog![0]), id: 'prepare-run', stage: 'github-prepare-pr', executionStatus: undefined, status: 'interrupted' } as any);
    }],
    ['an unfinished parent pull request', ({ job }) => { job.dependsOnPR = 199; }],
    ['harness validation still running', ({ f, job }) => {
        f.store.state.workLog!.push({ ...structuredClone(f.store.state.workLog![0]), id: 'harness-validate', provider: 'harness', stage: 'harness-validate', executionStatus: undefined, status: 'running', endedAt: '' } as any);
    }],
    ['harness validation interrupted', ({ f, job }) => {
        f.store.state.workLog!.push({ ...structuredClone(f.store.state.workLog![0]), id: 'harness-validate', provider: 'harness', stage: 'harness-validate', executionStatus: undefined, status: 'interrupted' } as any);
    }],
    ['a claim taken during the provider read', ({ f, job }) => {
        const base = f.delivery.execute;
        f.delivery.execute = (async (program: string, args: string[], options: any) => {
            if (args[1]?.endsWith('/pulls/200') && !f.store.activeClaims().length) f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: job.id }, 'competing', 'lead-pr', 'delivery');
            return base(program, args, options);
        }) as typeof base;
    }],
    ['a hold placed during the provider read', ({ f }) => {
        const base = f.delivery.execute;
        f.delivery.execute = (async (program: string, args: string[], options: any) => {
            if (args[1]?.endsWith('/pulls/200')) { HOLDS['GH-5'] = 'Joe is deciding'; held.push('GH-5'); }
            return base(program, args, options);
        }) as typeof base;
    }],
];
test.each(refusals)('%s settles nothing', async (_name, change) => {
    const fixture = stopped(), { f, job, writes } = fixture;
    change(fixture);
    const stop = structuredClone(job.stop), detail = job.detail;
    await f.delivery.observe();
    expect(job).toMatchObject({ stage: 'lead-pr', status: 'blocked', detail });
    expect(job.stop).toEqual(stop);
    expect(job.mergeCommit).toBeUndefined();
    expect(settlements(f)).toEqual([]);
    expect(writes).toEqual([]);
});

test('a parked merged job keeps its decision and its lane', async () => {
    const { f, job, writes } = stopped();
    job.parked = { stage: 'lead-pr', reason: 'Joe decides the metadata wording', at: '2026-11-23T19:48:00Z', published: true };
    job.detail = 'Parked in Block: Joe decides the metadata wording';
    f.state.cards[0].status = 'block';
    const parked = structuredClone(job.parked);
    await f.delivery.observe();
    expect(job).toMatchObject({ stage: 'lead-pr', status: 'blocked', detail: 'Parked in Block: Joe decides the metadata wording', parked });
    expect(job.mergeCommit).toBeUndefined();
    expect(f.state.cards[0].status).toBe('block');
    expect(settlements(f)).toEqual([]);
    expect(writes).toEqual([]);
});

test('a partial park that never reached the board also holds the job', async () => {
    const { f, job } = stopped();
    job.parked = { stage: 'lead-pr', reason: 'Joe decides', at: '2026-11-23T19:48:00Z', published: false };
    await f.delivery.observe();
    expect(job).toMatchObject({ stage: 'lead-pr', status: 'blocked' });
    expect(settlements(f)).toEqual([]);
});

test('a stopped preparation of an Office-published head settles the same way', async () => {
    const { f, job } = stopped();
    job.steps.splice(-2);
    job.stage = 'prepare-pr';
    job.status = 'interrupted';
    await f.delivery.observe();
    expect(job).toMatchObject({ stage: 'closeout', status: 'queued', mergeCommit: SQUASH });
    expect(settlements(f)).toHaveLength(1);
});

test('the job must be registered once in the store', async () => {
    const { f, job } = stopped();
    f.delivery.jobs.push(job);
    await f.delivery.observe();
    expect(job.mergeCommit).toBeUndefined();
    expect(settlements(f)).toEqual([]);
});

test('a candidate the harness validated settles: its own record ended without an execution marker', async () => {
    const { f, job, writes } = stopped();
    // What withHarnessWork leaves for a finished local validation: no execution marker, no provider write.
    f.store.state.workLog!.push({ ...structuredClone(f.store.state.workLog![0]), id: 'harness-validate', role: 'qa', provider: 'harness', stage: 'harness-validate', executionStatus: undefined, status: 'completed' } as any);
    await f.delivery.observe();
    expect(job).toMatchObject({ stage: 'closeout', status: 'queued', mergeCommit: SQUASH });
    expect(settlements(f)).toHaveLength(1);
    expect(writes).toEqual([]);
});

// Issue 507: a prerequisite the job retains is checked by the scheduler's own gate, before and after the reads.
type Fixture = ReturnType<typeof stopped>;
const OWN = 'cms-field-vocabulary';
/** The provider and git commands a pass sent, without the fixture's temporary root. */
const trace = (f: Fixture['f']) => f.state.calls.map(call => call.replaceAll(f.root, '<root>'));
/** The configured Brain project's store, holding the prerequisite's target job. */
function brain(f: Fixture['f'], status = 'completed') {
    const store = new Store(':memory:', projectById('brain'), resolve(f.root, 'brain-data'));
    others.push(store);
    store.state.coordination = coordination();
    store.state.coordination.jobs = [{ id: 'parent', key: 'GH-1', status, stage: 'closeout', steps: [] } as any];
    return store;
}
const needs = (projectId: string, id = 'parent', observedAt = new Date().toISOString()): Prerequisite =>
    ({ target: { projectId, kind: 'delivery', id }, condition: 'job-completed', evidence: 'Synthetic record', observedAt });
const office = (f: Fixture['f'], other?: Store): DependencyStores => new Map([[f.store.project.id, f.store], ...(other ? [['brain', other] as const] : [])]);
/** Runs `hook` once, on the first read of `pulls/<pr>`. */
function onPullRead(f: Fixture['f'], hook: () => void, pr = 200) {
    const base = f.delivery.execute;
    let ran = false;
    f.delivery.execute = (async (program: string, args: string[], options: any) => {
        if (!ran && args[1]?.endsWith(`/pulls/${pr}`)) { ran = true; hook(); }
        return base(program, args, options);
    }) as typeof base;
    return () => ran;
}
/** A completed target job in this project, present in both fixtures so that only the prerequisite differs. */
const parent = (f: Fixture['f']) => f.delivery.jobs.unshift({ id: 'parent', key: 'GH-9', status: 'completed', stage: 'closeout', requestedAt: '2026-11-20T12:00:00Z', detail: '', head: '', worktree: '', branch: '', pr: 0, prUrl: '', existingPR: false, steps: [] } as TicketJob);

const satisfied: [string, (fixture: Fixture) => (() => DependencyStores) | undefined][] = [
    ['in this project, through the default stores', ({ job }) => { job.prerequisites = [needs(OWN)]; return undefined; }],
    ['in another project', ({ f, job }) => { const other = brain(f); job.prerequisites = [needs('brain')]; return () => office(f, other); }],
];
test.each(satisfied)('a completed job-completed prerequisite %s settles like a job without one', async (_name, given) => {
    const baseline = stopped(), fixture = stopped(), { f, job, writes } = fixture, history = structuredClone(job.steps);
    parent(baseline.f); parent(f);
    const stores = given(fixture), prerequisites = structuredClone(job.prerequisites);
    await baseline.f.delivery.observe();
    await f.delivery.observe(stores);
    expect(trace(f)).toEqual(trace(baseline.f));
    expect(job).toMatchObject({ stage: 'closeout', status: 'queued', mergeCommit: SQUASH, prerequisites });
    expect(settlements(f)).toHaveLength(1);
    expect(f.state.calls.filter(call => call.includes(`actions/runs?head_sha=${SQUASH}`))).toHaveLength(1);
    expect(writes).toEqual([]);
    await claimedDelivery(f.store, job, () => f.delivery.step(job));
    expect(job.status, job.detail).toBe('completed');
    expect(job.prerequisites).toEqual(prerequisites);
    expect(job.steps.slice(0, history.length)).toEqual(history);
    await f.delivery.observe(stores);
    expect(settlements(f)).toHaveLength(1);
});

const unmet: [string, (fixture: Fixture) => () => DependencyStores][] = [
    ['an unfinished target', ({ f, job }) => { const other = brain(f, 'queued'); job.prerequisites = [needs('brain')]; return () => office(f, other); }],
    ['a target that does not exist', ({ f, job }) => { const other = brain(f); job.prerequisites = [needs('brain', 'missing')]; return () => office(f, other); }],
    ['a project missing from the dependency stores', ({ f, job }) => { brain(f); job.prerequisites = [needs('brain')]; return () => office(f); }],
    ['a completed target the scheduler rejects (invalid observation time)', ({ f, job }) => {
        const other = brain(f); job.prerequisites = [needs('brain', 'parent', 'not a time')]; return () => office(f, other);
    }],
];
test.each(unmet)('%s settles nothing and costs no settlement read', async (_name, given) => {
    const local = stopped(), fixture = stopped(), { f, job, writes } = fixture;
    // The same job refused by a local guard: no settlement read at all.
    local.job.mergeApprovalRequired = true;
    const stores = given(fixture), stop = structuredClone(job.stop), detail = job.detail;
    await local.f.delivery.observe();
    await f.delivery.observe(stores);
    expect(trace(f)).toEqual(trace(local.f));
    expect(job).toMatchObject({ stage: 'lead-pr', status: 'blocked', detail });
    expect(job.stop).toEqual(stop);
    expect(job.mergeCommit).toBeUndefined();
    expect(settlements(f)).toEqual([]);
    expect(writes).toEqual([]);
});

test.each(['the target is reopened', 'its project leaves the office'])('a prerequisite that changes during the PR read (%s) settles nothing', async change => {
    const { f, job, writes } = stopped(), other = brain(f), earlier = office(f, other);
    job.prerequisites = [needs('brain')];
    let current = earlier;
    const ran = onPullRead(f, () => {
        if (change === 'the target is reopened') other.state.coordination!.jobs![0].status = 'working';
        else current = office(f);
    });
    const stop = structuredClone(job.stop), detail = job.detail;
    await f.delivery.observe(() => current);
    expect(ran()).toBe(true);
    expect(earlier.has('brain')).toBe(true);
    expect(job).toMatchObject({ stage: 'lead-pr', status: 'blocked', detail });
    expect(job.stop).toEqual(stop);
    expect(job.mergeCommit).toBeUndefined();
    expect(settlements(f)).toEqual([]);
    expect(writes).toEqual([]);
});

/** A second locally eligible stopped job, GH-6 on PR 201, published by the harness like the first. */
function later(f: Fixture['f'], job: TicketJob): TicketJob {
    const copy = JSON.parse(JSON.stringify(job).replaceAll(job.id, 'later-job').replaceAll('GH-5', 'GH-6').replaceAll('5-restore-release-scans', '6-restore-release-scans')
        .replaceAll('pull/200', 'pull/201').replaceAll('PR #200', 'PR #201').replaceAll('"prId":200', '"prId":201').replaceAll('"pr":200', '"pr":201')) as TicketJob;
    f.delivery.jobs.push(copy);
    return copy;
}
test.each([[true], [false]])('a later job in the pass reads its PR only while its prerequisite holds (project kept: %s)', async keep => {
    const { f, job } = stopped(), other = brain(f), second = later(f, job);
    second.prerequisites = [needs('brain')];
    let current = office(f, other);
    const ran = onPullRead(f, () => { if (!keep) current = office(f); });
    await f.delivery.observe(() => current);
    expect(ran()).toBe(true);
    expect(job).toMatchObject({ mergeCommit: SQUASH });
    expect(f.state.calls.some(call => call.endsWith('/pulls/201'))).toBe(keep);
    expect(second).toMatchObject({ stage: 'lead-pr', status: 'blocked' });
    expect(second.mergeCommit).toBeUndefined();
});

test.each([[false], [true]])('a closed-issue prerequisite settles on a cached observation still fresh, not one that expires during the reads (expires: %s)', async expires => {
    const baseline = stopped(), { f, job, writes } = stopped(), at = Date.parse('2026-11-23T20:05:00Z'), observedAt = new Date(at - 149_999).toISOString();
    let now = at;
    for (const store of [baseline.f.store, f.store]) { const real = store.clock; store.clock = { now: () => new Date(now), monotonic: () => real.monotonic() }; }
    const target = { projectId: OWN, kind: 'issue' as const, id: '7' };
    f.store.state.coordination!.dependencyObservations = [{ target, condition: 'issue-closed', exists: true, complete: true, version: '2026-11-23T19:00:00Z', observedAt, error: '' }];
    job.prerequisites = [{ target, condition: 'issue-closed', evidence: 'Synthetic record', observedAt }];
    const stop = structuredClone(job.stop);
    const ran = onPullRead(f, () => { if (expires) now += 2; });
    await baseline.f.delivery.observe();
    await f.delivery.observe();
    expect(ran()).toBe(true);
    expect(f.state.calls.some(call => /issues\/7\b/.test(call))).toBe(false);
    if (expires) {
        expect(job).toMatchObject({ stage: 'lead-pr', status: 'blocked' });
        expect(job.stop).toEqual(stop);
        expect(settlements(f)).toEqual([]);
    }
    else {
        expect(trace(f)).toEqual(trace(baseline.f));
        expect(job).toMatchObject({ stage: 'closeout', status: 'queued', mergeCommit: SQUASH });
        expect(settlements(f)).toHaveLength(1);
    }
    expect(writes).toEqual([]);
});

test("the poll hands the settlement the coordinator's current dependency stores", async () => {
    const f = fakeGitHub(), other = brain(f), both = office(f, other), own = office(f);
    const c = new Coordinator(f.store, f.engine, f.execute as any);
    c.activate(new Date('2026-11-23T20:00:00Z'));
    c.readAssignments = async () => [];
    c.dependencyStores = () => both;
    const observe = vi.spyOn(GitHubDelivery.prototype, 'observe').mockResolvedValue(undefined);
    await c.poll(new Date('2026-11-23T20:01:00Z'));
    expect(c.state.listener.error).toBe('');
    expect(observe).toHaveBeenCalledTimes(1);
    const supplied = observe.mock.calls[0][0];
    expect(supplied).toBeTypeOf('function');
    expect(supplied!()).toBe(both);
    c.dependencyStores = () => own;
    expect(supplied!()).toBe(own);
});
