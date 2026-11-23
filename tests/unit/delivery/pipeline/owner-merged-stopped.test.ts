import { existsSync } from 'node:fs';
import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD, REPOSITORY } from '../support/fake-github';
import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { HOLDS } from '../../../../server/office/config';
import type { EffectIntent, Receipt, StageResult, TicketJob } from '../../../../src/shared';

const SQUASH = 'd'.repeat(40), EARLIER = 'e'.repeat(40), PR_URL = `https://github.com/${REPOSITORY}/pull/200`;
const held: string[] = [];
afterEach(() => { held.splice(0).forEach(key => delete HOLDS[key]); cleanupFakes(); });

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
