import {workerProfile} from '../../server/worker-profiles';
import {digest} from '../../server/readback-evidence';
import * as processHelpers from '../../server/process';
import {enqueueRequest,executeRequest} from '../../server/requests';
import {conflictOnlyAssessment} from '../../server/conflict-repair';
import {deliveryHumanInputs,deliveryInputSha256} from '../../server/github-context';
import {projectOutbox} from '../../server/outbox';
import { afterEach, expect, test, vi } from 'vitest';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../server/store';
import { Engine } from '../../server/engine';
import { projectById } from '../../server/projects';
import { coordination } from '../../server/coordination';
import { GitHubDelivery, closeoutReceipt } from '../../server/github-delivery';
import type { EffectIntent, StageResult } from '../../src/shared';
const roots: string[] = [], stores: Store[] = [];
afterEach(() => { stores.splice(0).forEach(s => s.close()); roots.splice(0).forEach(r => rmSync(r, { recursive: true, force: true })); });
const head = 'a'.repeat(40), url = 'https://github.com/JFusco/brain/issues/999';
function setup() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-github-delivery-'));
    roots.push(root);
    const store = new Store(':memory:', projectById('brain'), root);
    stores.push(store);
    store.state.coordination = coordination();
    store.state.coordination.pickup = { enabled: true, status: 'Ready' };
    store.state.tickets.push({ key: 'GH-999', summary: 'Test', type: 'Issue', status: 'open', statusId: '', assignee: 'JFusco', subtask: false, boardMember: true, url, updated: '', stage: 'mailbox', activity: 'waiting', blocker: '', runId: '', attempt: 0, commit: '', branch: '', worktree: '', previewUrl: '', prId: 0, results: {}, findings: [], evidence: [], pilot: false, observedAt: '' });
    const engine = new Engine(store), calls: string[] = [], pr: any = { number: 700, html_url: 'https://github.com/JFusco/brain/pull/700', state: 'open', draft: true, head: { sha: head, ref: 'issue-999' }, base: { ref: 'main', repo: { full_name: 'JFusco/brain' } }, mergeable: true, updated_at: '', merged_at: null };
    let linked = true, comments: any[] = [], failComment = false, runs: any[] = [], issueState = 'open', checkConclusion = 'success', unresolved = false, children: any[] = [];
    let lane = 'in-progress', rulesetPages: unknown = [[]];
    const policyBranch: any = { name: 'main', protected: false };
    const execute = async (_bin: string, args: string[], options?: any) => {
        calls.push(args.join(' '));
        if (args[0] === 'rev-parse')
            return head;
        if (args[0] === 'pr')
            return JSON.stringify({ closingIssuesReferences: linked ? [{ url }] : [] });
        const path = args[1];
        if (path.endsWith('/issues/999'))
            return JSON.stringify({ number: 999, html_url: url, updated_at: '2026-10-28T12:00:00Z', state: issueState, assignees: [{ login: 'JFusco' }] });
        if (path.endsWith('/branches/main'))
            return JSON.stringify(policyBranch);
        if (path.includes('/rulesets?'))
            return JSON.stringify(rulesetPages);
        if (path === 'graphql' && options?.input && JSON.parse(options.input).query.includes('ProjectV2')) {
            const { query } = JSON.parse(options.input);
            if (query.startsWith('mutation')) {
                lane = 'in-review';
                return JSON.stringify({ data: { updateProjectV2ItemFieldValue: { projectV2Item: { id: 'item' } } } });
            }
            if (query.includes('fields(first'))
                return JSON.stringify({ data: { user: { projectV2: { id: 'project', fields: { nodes: [{ id: 'status', name: 'Status', options: [{ id: 'in-progress', name: 'In progress' }, { id: 'in-review', name: 'In review' }] }], pageInfo: { hasNextPage: false } } } } } });
            if (query.includes('items(first'))
                return JSON.stringify({ data: { node: { items: { nodes: [{ id: 'item', content: { number: 999, repository: { nameWithOwner: 'JFusco/brain' } } }], pageInfo: { hasNextPage: false } } } } });
            return JSON.stringify({ data: { node: { id: 'item', fieldValues: { nodes: [{ field: { id: 'status' }, optionId: lane }], pageInfo: { hasNextPage: false } } } } });
        }
        if (path === 'graphql')
            return JSON.stringify({ data: { repository: { pullRequest: { headRefOid: pr.head.sha, baseRefName: pr.base.ref, mergeStateStatus: 'CLEAN', reviewDecision: null, reviewThreads: { nodes: [{ isResolved: !unresolved }], pageInfo: { hasNextPage: false } } } } } });
        if (path.endsWith('/merge')) {
            pr.merged_at = '2026-10-28T15:00:00Z';
            pr.merge_commit_sha = 'c'.repeat(40);
            return JSON.stringify({ merged: true, sha: pr.merge_commit_sha });
        }
        if (path === 'repos/JFusco/brain')
            return JSON.stringify({ allow_merge_commit: true });
        if (path.includes('/pulls?'))
            return JSON.stringify([children]);
        if (path.includes('/pulls/'))
            return JSON.stringify(pr);
        if (path.includes('issues/comments/'))
            return JSON.stringify(comments[0]);
        if (path.includes('/comments')) {
            if (args.includes('-f')) {
                if (failComment)
                    throw new Error('Comment timeout');
                const comment = { id: 1, body: args[args.length - 1].slice(5) };
                comments = [comment];
                return JSON.stringify(comment);
            }
            return JSON.stringify([comments]);
        }
        if (path.includes('check-runs'))
            return JSON.stringify({ total_count: 1, check_runs: [{ id: 1, head_sha: head, status: checkConclusion === 'pending' ? 'in_progress' : 'completed', conclusion: checkConclusion === 'pending' ? null : checkConclusion }] });
        if (path.includes('/status'))
            return JSON.stringify({ sha: head, total_count: 0, state: 'success', statuses: [] });
        if (path.includes('actions/runs'))
            return JSON.stringify({ total_count: runs.length, workflow_runs: runs });
        throw new Error(`Unexpected mock ${args}`);
    };
    const delivery = new GitHubDelivery(store, engine, execute as any);
    delivery.enqueue('GH-999');
    const job = delivery.jobs[0];
    const artifactRoot = resolve(root, 'ticket-work', job.id);
    mkdirSync(artifactRoot, { recursive: true });
    const artifact = resolve(artifactRoot, 'proof.txt');
    writeFileSync(artifact, 'Synthetic evidence only');
    const result = (kind = 'checks'): StageResult => ({ outcome: 'passed', summary: 'Synthetic stage', commit: head, evidence: [{ id: '1', kind: kind as any, summary: 'Synthetic', path: artifact, commit: head, environment: 'test', url: '', observedAt: '' }], findings: [], receipts: [], previewUrl: '', worktree: resolve(root, 'worktree'), branch: 'issue-999', prId: 700, qaRunDir: '', paidRuns: 0, blocker: '' });
    return { store, engine, delivery, job, result, pr, calls, policyBranch, setRulesetPages: (v: unknown) => rulesetPages = v, setChildren: (v: any[]) => children = v, setComments: (v: any[]) => comments = v, setIssueState: (v: string) => issueState = v, setCheckConclusion: (v: string) => checkConclusion = v, setUnresolved: (v: boolean) => unresolved = v, setLinked: (v: boolean) => linked = v, setFailComment: (v: boolean) => failComment = v, setRuns: (v: any[]) => runs = v };
}
test('readiness uses complete native policy evidence and avoids unnecessary administration reads', async () => {
    const a = setup();
    a.job.pr = 700;
    a.job.stage = 'lead-pr';
    a.pr.draft = false;
    a.engine.agents.run = async (_role, task) => { expect(task).toContain('VERIFIED NATIVE GITHUB POLICY'); expect(task).toContain('"protectionDetailRequired":false'); expect(task).toContain('MUST NOT be called'); return a.result('review') as any; };
    await a.delivery.step(a.job);
    expect(a.job.status).toBe('watching');
    expect(a.calls.some(c => c.includes('includes_parents=true') && c.includes('--paginate --slurp'))).toBe(true);
    expect(a.calls.some(c => c.includes('/branches/main/protection'))).toBe(false);
    a.setRulesetPages([[], [{ id: 1, enforcement: 'active' }]]);
    expect(await a.delivery.readinessPolicy(head)).toMatchObject({ protectionDetailRequired: true, rulesets: [{ id: 1 }] });
    a.setRulesetPages([[]]);
    a.policyBranch.protected = true;
    expect(await a.delivery.readinessPolicy(head)).toMatchObject({ protectionDetailRequired: true });
});
test('missing, malformed or denied native policy reads block review without requesting more permission', async () => {
    const a = setup();
    a.setRulesetPages([{}]);
    await expect(a.delivery.readinessPolicy(head)).rejects.toThrow('coverage');
    a.setRulesetPages([[{ id: 1 }]]);
    await expect(a.delivery.readinessPolicy(head)).rejects.toThrow('enforcement');
    a.setRulesetPages([[]]);
    a.policyBranch.protected = undefined;
    await expect(a.delivery.readinessPolicy(head)).rejects.toThrow('coverage');
    const denied = new GitHubDelivery(a.store, a.engine, async () => { throw new Error('HTTP 403 policy denied'); });
    await expect(denied.readinessPolicy(head)).rejects.toThrow('403');
    a.job.pr = 700;
    a.job.stage = 'lead-pr';
    let calls = 0;
    a.engine.agents.run = async () => { calls++; return a.result('review') as any; };
    await a.delivery.step(a.job);
    expect(calls).toBe(0);
    expect(a.job.status).toBe('blocked');
    expect(a.store.state.outbox.some(o => o.status === 'open' && o.ticket === 'GH-999')).toBe(true);
});
test('completed conflict repair advances to the same PR without another source review; draft removal remains a later step', async () => {
    const a = setup(), repaired = 'b'.repeat(40);
    Object.assign(a.job, { stage: 'update-base', status: 'blocked', repairReason: 'conflicts', pr: 700, head, branch: 'issue-999', worktree: a.result().worktree });
    const saved = a.result();
    saved.commit = repaired;
    saved.evidence[0].commit = repaired;
    saved.findings = [{ id: 'draft-blocks-merge', status: 'open', summary: 'Still draft', actual: 'Draft', expected: 'Promote later', attempts: 0 }];
    a.job.steps.push({ stage: 'update-base', result: saved });
    let writes = 0;
    a.engine.agents.run = async () => { writes++; throw Error('Must reuse the completed repair'); };
    a.engine.maintenance.verifyCandidate = async (c) => { expect(c.head).toBe(repaired); };
    const delivery = new GitHubDelivery(a.store, a.engine, async (program, args) => {
        if (program === 'git') {
            expect(args.slice(0, 2)).toEqual(['merge-base', '--is-ancestor']);
            return '';
        }
        if (args[0] === 'pr')
            return JSON.stringify({ closingIssuesReferences: [{ url }] });
        if (args[1].includes('/pulls/'))
            return JSON.stringify(a.pr);
        if (args[1].includes('/commits/'))
            return JSON.stringify({ sha: 'c'.repeat(40) });
        throw Error('Unexpected call');
    });
    await delivery.reconcileBaseUpdate('GH-999');
    expect(a.job).toMatchObject({ head: repaired, stage: 'draft', status: 'queued', pr: 700, approach: { review: 'none', validation: 'developer-checks' } });
    expect(a.job.skippedStages?.review).toContain('Joe requested');
    expect(writes).toBe(0);
    a.job.stage = 'update-base';
    a.job.status = 'blocked';
    saved.findings.push({ id: 'source-defect', status: 'open', summary: 'Unresolved defect', actual: 'Bug', expected: 'Fix', attempts: 0 });
    await expect(delivery.reconcileBaseUpdate('GH-999')).rejects.toThrow('completed, certain');
});
test('scoped delivery uses separate development/review/QA stages, links draft and hands it to Lead', async () => {
    const { engine, delivery, job, result, calls } = setup();
    const roles: string[] = [];
    engine.agents.run = async (role, _task, _schema, opts) => {
        roles.push(role);
        if (job.stage === 'review' || job.stage === 'lead-pr')
            expect(opts?.readOnly).toBe(true);
        return result(job.stage === 'review' ? 'review' : 'checks') as any;
    };
    for (let i = 0; i < 6; i++)
        await delivery.step(job);
    expect(roles).toEqual(['developer', 'lead', 'qa', 'developer', 'lead', 'lead']);
    expect(job.status).toBe('watching');
    expect(job.pr).toBe(700);
    expect(calls.some(c => c.includes('closingIssuesReferences'))).toBe(true);
    expect(calls.filter(c => c.includes(' -f body=Office delivery'))).toHaveLength(1);
    expect(calls.some(c => c.startsWith('pr merge '))).toBe(false);
});
test('missing native PR link and uncertain comment writes block without polling replay', async () => {
    const a = setup();
    a.job.stage = 'draft';
    a.job.head = head;
    a.setLinked(false);
    a.engine.agents.run = async () => a.result() as any;
    await a.delivery.step(a.job);
    expect(a.job.status).toBe('blocked');
    expect(a.job.detail).toContain('not natively linked');
    const b = setup();
    b.job.stage = 'draft';
    b.job.head = head;
    b.setFailComment(true);
    b.engine.agents.run = async () => b.result() as any;
    await b.delivery.step(b.job);
    expect(b.job.status).toBe('blocked');
    await b.delivery.observe();
    expect(b.calls.filter(c => c.includes(' -f body='))).toHaveLength(1);
});
test('changed candidate and withdrawn Ready rule block source dispatch', async () => {
    const a = setup();
    a.job.stage = 'review';
    a.job.head = 'b'.repeat(40);
    a.engine.agents.run = async () => a.result('review') as any;
    await a.delivery.step(a.job);
    expect(a.job.status).toBe('blocked');
    expect(a.job.detail).toContain('Candidate changed');
    const b = setup();
    b.job.automaticStatus = 'Ready';
    b.store.state.coordination!.pickup!.enabled = false;
    b.engine.github.board = async () => ({ error: '', items: [{ number: 999, repository: 'JFusco/brain', status: 'Ready' }] } as any);
    let called = false;
    b.engine.agents.run = async () => { called = true; return b.result() as any; };
    await b.delivery.step(b.job);
    expect(called).toBe(false);
    expect(b.job.status).toBe('blocked');
});
test('PR changes queue Lead reads, while post-merge Actions must match the merge commit', async () => {
    const { delivery, job, pr, setRuns } = setup();
    job.pr = 700;
    job.status = 'watching';
    await delivery.observe();
    expect(job.stage).toBe('lead-pr');
    expect(job.status).toBe('queued');
    job.status = 'watching';
    await delivery.observe();
    expect(job.status).toBe('watching');
    pr.merged_at = '2026-10-28T15:00Z';
    pr.merge_commit_sha = 'c'.repeat(40);
    setRuns([{ head_sha: head, event: 'push', head_branch: 'main', status: 'completed', conclusion: 'success' }]);
    await delivery.observe();
    expect(job.status).toBe('watching');
    setRuns([{ head_sha: pr.merge_commit_sha, event: 'push', head_branch: 'main', status: 'completed', conclusion: 'failure' }]);
    await delivery.observe();
    expect(job).toMatchObject({ stage: 'ci-recovery', status: 'queued' });
});
test('Office merges only after exact-head independent review, and records one non-replayed attempt', async () => {
    const a = setup();
    a.store.state.coordination!.merges = { enabled: true, authorizedAt: new Date().toISOString() };
    a.job.pr = 700;
    a.job.stage = 'lead-pr';
    a.pr.draft = false;
    a.engine.agents.run = async () => a.result('review') as any;
    await a.delivery.step(a.job);
    expect(a.job).toMatchObject({ stage: 'merge', status: 'queued', head });
    await a.delivery.step(a.job);
    expect(a.job.status).toBe('watching');
    expect(a.job.mergeAttempt?.head).toBe(head);
    expect(a.calls.filter(c => c.includes('/merge --method PUT'))).toHaveLength(1);
    expect(a.calls.some(c => c.includes(`sha=${head}`))).toBe(true);
    a.setRuns([{ head_sha: 'c'.repeat(40), event: 'push', head_branch: 'main', status: 'completed', conclusion: 'success' }]);
    await a.delivery.observe();
    expect(a.job).toMatchObject({ stage: 'closeout', status: 'queued' });
});
test('changed heads, drafts, failed reviews and disabled merging never call merge', async () => {
    for (const reason of ['head', 'draft', 'review', 'disabled']) {
        const a = setup();
        a.store.state.coordination!.merges = { enabled: reason !== 'disabled', authorizedAt: '' };
        a.job.pr = 700;
        a.job.stage = 'lead-pr';
        a.pr.draft = reason === 'draft';
        a.engine.agents.run = async () => ({ ...a.result('review'), outcome: reason === 'review' ? 'blocked' : 'passed' }) as any;
        await a.delivery.step(a.job);
        if (reason === 'head') {
            a.pr.head.sha = 'b'.repeat(40);
            await a.delivery.step(a.job);
            expect(a.job.status).toBe('blocked');
        }
        else
            expect(a.job.status).toBe('watching');
        expect(a.calls.some(c => c.includes('/merge --method PUT'))).toBe(false);
    }
});
test('stacked PRs can be reviewed but cannot merge until their base is the project target', async () => {
    const a = setup();
    a.job.pr = 700;
    a.job.stage = 'lead-pr';
    a.pr.base.ref = 'parent-issue';
    a.pr.body = 'Closes #999';
    a.setLinked(false);
    a.store.state.coordination!.merges = { enabled: true, authorizedAt: '' };
    a.engine.agents.run = async () => a.result('review') as any;
    await a.delivery.step(a.job);
    expect(a.job.status).toBe('watching');
    expect(a.job.stage).toBe('lead-pr');
    await expect(a.delivery.verifyPR(a.job, true)).rejects.toThrow('target');
    expect(a.calls.some(c => c.includes('/merge --method PUT'))).toBe(false);
});
test('ambiguous merge response is read back without sending another merge', async () => {
    const a = setup();
    a.job.pr = 700;
    a.job.stage = 'merge';
    a.job.head = head;
    a.job.mergeAttempt = { head, at: '' };
    a.job.status = 'interrupted';
    await a.delivery.observe();
    expect(a.job.status).toBe('interrupted');
    expect(a.calls.some(c => c.includes('/merge --method PUT'))).toBe(false);
    a.pr.merged_at = '2026-10-28T15:00Z';
    a.pr.merge_commit_sha = 'c'.repeat(40);
    await a.delivery.observe();
    expect(a.job.status).toBe('watching');
    expect(a.job.mergeCommit).toBe(a.pr.merge_commit_sha);
});
test('PR discovery routes published work without repeating ownership or implementation', async () => {
    const a = setup();
    a.delivery.jobs.splice(0);
    a.store.state.github = { prs: [{ number: 700, state: 'open' }] } as any;
    a.store.state.coordination!.listener.reviews = [{ id: 'r', key: 'GH-999', status: 'queued' }] as any;
    await a.delivery.discover([{ key: 'GH-999', url }] as any);
    expect(a.delivery.jobs).toHaveLength(1);
    expect(a.delivery.jobs[0]).toMatchObject({ stage: 'prepare-pr', pr: 700, status: 'queued' });
    expect(a.store.state.coordination!.listener.reviews[0].status).toBe('owned');
    a.delivery.jobs[0].stage = 'lead-pr';
    a.delivery.jobs[0].status = 'blocked';
    a.delivery.jobs[0].detail = 'Error: PR repository or target does not match this project';
    await a.delivery.discover([{ key: 'GH-999', url }] as any);
    expect(a.delivery.jobs).toHaveLength(1);
    expect(a.delivery.jobs[0].status).toBe('queued');
});
test('failed checks and unresolved threads prevent the Office merge mutation', async () => {
    for (const reason of ['checks', 'threads']) {
        const a = setup();
        a.store.state.coordination!.merges = { enabled: true, authorizedAt: '' };
        a.job.pr = 700;
        a.job.stage = 'lead-pr';
        a.pr.draft = false;
        a.engine.agents.run = async () => a.result('review') as any;
        await a.delivery.step(a.job);
        if (reason === 'checks')
            a.setCheckConclusion('failure');
        else
            a.setUnresolved(true);
        await a.delivery.step(a.job);
        expect(a.job.status).toBe('blocked');
        expect(a.calls.some(c => c.includes('/merge --method PUT'))).toBe(false);
    }
});
test('Morgan completes only after independently read-back issue closure, Done lane and receipts', async () => {
    const a = setup();
    a.job.stage = 'closeout';
    a.job.pr = 700;
    a.job.head = head;
    a.job.mergeCommit = 'c'.repeat(40);
    a.pr.merged_at = '2026-10-28T15:00Z';
    a.pr.merge_commit_sha = a.job.mergeCommit;
    a.setIssueState('closed');
    a.engine.github.board = async () => ({ error: '', items: [{ number: 999, repository: 'JFusco/brain', status: 'Done' }] } as any);
    a.engine.agents.run = async () => { const r = a.result(); r.commit = a.job.mergeCommit!; r.evidence[0].commit = r.commit; r.receipts = ['issue-close', 'issue-comment', 'board-status'].map(action => ({ id: action, action, target: url, verified: true, uncertain: false, detail: 'Synthetic fixture' })); return r as any; };
    await a.delivery.step(a.job);
    expect(a.job.status).toBe('completed');
    expect(a.store.ticket('GH-999')).toMatchObject({ stage: 'complete', status: 'closed' });
});
test('an unrelated merged PR is reconciled without closing the still-open assigned issue', async () => {
    const a = setup();
    a.job.pr = 700;
    a.job.stage = 'lead-pr';
    a.job.status = 'blocked';
    a.job.steps = [{ stage: 'lead-pr', result: { ...a.result(), receipts: [{ id: 'r', action: 'GET', target: url, verified: false, uncertain: false, detail: 'Read failed; no writes' }] } }];
    a.pr.state = 'closed';
    a.pr.merged_at = '2026-10-20T12:00Z';
    a.setLinked(false);
    await a.delivery.reconcileWrongLink('GH-999');
    expect(a.job.status).toBe('cancelled');
    expect(a.store.ticket('GH-999').status).toBe('open');
    a.delivery.enqueue('GH-999');
    expect(a.delivery.jobs).toHaveLength(2);
    expect(a.calls.some(c => c.includes('/merge --method PUT'))).toBe(false);
});
test('a historical or unlinked PR reference does not create an Office delivery', async () => {
    const a = setup();
    a.delivery.jobs.splice(0);
    a.pr.state = 'closed';
    a.pr.merged_at = '2026-10-20T12:00Z';
    expect(await a.delivery.routeExisting('GH-999', 700)).toBe(false);
    expect(a.delivery.jobs).toHaveLength(0);
    a.pr.state = 'open';
    a.setLinked(false);
    expect(await a.delivery.routeExisting('GH-999', 700)).toBe(false);
    expect(a.delivery.jobs).toHaveLength(0);
});
test('a completed closeout with readable receipt labels is reconciled without replaying its writes', async () => {
    const a = setup();
    a.job.stage = 'closeout';
    a.job.pr = 700;
    a.job.head = head;
    a.job.mergeCommit = 'c'.repeat(40);
    a.job.status = 'queued';
    a.pr.state = 'closed';
    a.pr.merged_at = '2026-10-28T15:00Z';
    a.pr.merge_commit_sha = a.job.mergeCommit;
    a.setIssueState('closed');
    const r = a.result();
    r.commit = a.job.mergeCommit;
    r.evidence[0].commit = r.commit;
    r.receipts = ['issue-close', 'issue-comment', 'board-status'].map(id => ({ id, action: 'Human-readable action', target: id === 'issue-comment' ? url + '#issuecomment-1' : url, verified: true, uncertain: false, detail: 'Synthetic proof' }));
    a.job.steps.push({ stage: 'closeout', result: r });
    a.setComments([{ id: 1, html_url: url + '#issuecomment-1', body: 'Verified PR #700.' }]);
    a.setRuns([{ head_sha: a.job.mergeCommit, event: 'push', head_branch: 'main', status: 'completed', conclusion: 'success' }]);
    a.engine.github.board = async () => ({ error: '', items: [{ number: 999, repository: 'JFusco/brain', status: 'Done' }] } as any);
    await a.delivery.reconcileCloseout('GH-999');
    expect(a.job.status).toBe('completed');
    expect(a.calls.some(c => c.includes(' -f '))).toBe(false);
});
test('a blocked closeout writer is never queued again by merge observation', async () => {
    const a = setup();
    a.job.stage = 'closeout';
    a.job.status = 'blocked';
    a.job.pr = 700;
    a.job.mergeAttempt = { head, at: '' };
    a.pr.merged_at = '2026-10-28T15:00Z';
    a.pr.merge_commit_sha = 'c'.repeat(40);
    await a.delivery.observe();
    expect(a.job.status).toBe('blocked');
    expect(a.calls.some(c => c.includes('actions/runs'))).toBe(false);
});
test('merge waits for dependent PR bases and preparation cannot claim success while one remains', async () => {
    const a = setup();
    a.job.pr = 700;
    a.job.stage = 'lead-pr';
    a.pr.draft = false;
    a.store.state.coordination!.merges = { enabled: true, authorizedAt: '' };
    a.engine.agents.run = async () => a.result('review') as any;
    await a.delivery.step(a.job);
    a.setChildren([{ number: 701, base: { ref: 'issue-999' } }]);
    await a.delivery.step(a.job);
    expect(a.job).toMatchObject({ stage: 'prepare-pr', status: 'queued' });
    expect(a.job.mergeAttempt).toBeUndefined();
    expect(a.calls.some(c => c.includes('/merge --method PUT'))).toBe(false);
    await a.delivery.step(a.job);
    expect(a.job.status).toBe('blocked');
    expect(a.job.detail).toContain('Dependent PR bases');
});
test('dependency refresh retains a closed tracked parent until its closeout completes', async () => {
    const a = setup();
    a.job.pr = 700;
    a.job.status = 'queued';
    a.job.stage = 'prepare-pr';
    a.pr.base.ref = 'parent-branch';
    const parent = { ...a.job, id: 'parent', key: 'GH-998', pr: 699, branch: 'parent-branch', status: 'blocked' as const, steps: [] };
    a.delivery.jobs.push(parent);
    const delivery = new GitHubDelivery(a.store, a.engine, (async (_bin: string, args: string[]) => JSON.stringify(args[1].endsWith('/699') ? { number: 699, state: 'closed', head: { ref: 'parent-branch' }, base: { ref: 'main' } } : a.pr)) as any);
    await delivery.refreshDependencies();
    expect(a.job.dependsOnPR).toBe(699);
    a.pr.base.ref = 'main';
    await delivery.refreshDependencies();
    expect(a.job.dependsOnPR).toBe(699);
    parent.status = 'completed' as any;
    await delivery.refreshDependencies();
    expect(a.job.dependsOnPR).toBeUndefined();
});
test('saved output-limit preparation is reconciled by reads, without repeating metadata writes', async () => {
    const a = setup();
    a.job.pr = 700;
    a.job.prUrl = a.pr.html_url;
    a.job.head = head;
    a.job.stage = 'prepare-pr';
    a.job.status = 'blocked';
    a.job.detail = 'Error: max_output_tokens';
    a.pr.draft = false;
    const path = resolve(a.store.dataRoot, 'ticket-work', a.job.id, 'prepare-refresh-result.json');
    writeFileSync(path, JSON.stringify({ ...a.result(), approach: null, receipts: [{ id: 'open', action: 'PATCH PR state open', target: a.pr.html_url, verified: true, uncertain: false, detail: 'Verified', exit: 0 }] }));
    await a.delivery.reconcilePreparation(a.job.key);
    expect(a.job).toMatchObject({ stage: 'lead-pr', status: 'queued' });
    expect(a.calls.some(c => /--method| -f /.test(c))).toBe(false);
    const b = setup();
    b.job.pr = 700;
    b.job.prUrl = b.pr.html_url;
    b.job.head = head;
    b.job.stage = 'prepare-pr';
    b.job.status = 'blocked';
    b.job.detail = 'max_output_tokens';
    writeFileSync(resolve(b.store.dataRoot, 'ticket-work', b.job.id, 'prepare-refresh-result.json'), JSON.stringify({ ...b.result(), approach: null, receipts: [{ id: 'open', action: 'PATCH PR state open', target: b.pr.html_url, verified: false, uncertain: true, detail: 'Unknown' }] }));
    await expect(b.delivery.reconcilePreparation(b.job.key)).rejects.toThrow('separate reconciliation');
});
test('running checks belong to Lead review and do not invalidate verified metadata preparation', async () => {
    const a = setup();
    a.job.pr = 700;
    a.job.head = head;
    a.job.stage = 'prepare-pr';
    a.pr.draft = false;
    a.setCheckConclusion('pending');
    a.engine.agents.run = async () => ({ ...a.result(), findings: [{ id: 'checks', summary: 'Quality remains in progress', actual: 'Quality running', expected: 'Required checks pass before merge', status: 'open', attempts: 0 }] }) as any;
    await a.delivery.step(a.job);
    expect(a.job).toMatchObject({ stage: 'lead-pr', status: 'queued' });
    expect(a.calls.some(c => c.includes('/merge --method'))).toBe(false);
    const b = setup();
    b.job.pr = 700;
    b.job.head = head;
    b.job.stage = 'prepare-pr';
    b.setCheckConclusion('failure');
    b.engine.agents.run = async () => ({ ...b.result(), findings: [{ id: 'checks', summary: 'Quality failed', actual: 'Failed check', expected: 'Successful check', status: 'open', attempts: 0 }] }) as any;
    await b.delivery.step(b.job);
    expect(b.job.status).toBe('blocked');
});
test('base update preserves the candidate identity and requires current main ancestry before new review', async () => {
    const a = setup();
    a.job.stage = 'update-base';
    a.job.head = head;
    a.job.worktree = resolve(a.store.dataRoot, 'worktree');
    a.job.branch = 'issue-999';
    let ancestry = false;
    const execute = async (_b: string, args: string[]) => {
        if (args[0] === 'rev-parse')
            return head;
        if (args[0] === 'merge-base') {
            ancestry = true;
            return '';
        }
        return JSON.stringify(args[1].includes('/issues/') ? { state: 'open', assignees: [{ login: 'JFusco' }], html_url: url } : { sha: 'b'.repeat(40) });
    };
    const delivery = new GitHubDelivery(a.store, a.engine, execute as any);
    a.engine.agents.run = async (_r, task) => { expect(task).toContain('No remote writes'); return { ...a.result(), prId: 0 } as any; };
    await delivery.step(a.job);
    expect(ancestry).toBe(true);
    expect(a.job).toMatchObject({ stage: 'review', status: 'queued' });
});
test('descriptive closeout receipts require exact known meaning, canonical target and certainty', () => {
    const r = { receipts: [{ id: 'C1', action: 'Create focused issue closeout comment', target: url + '#issuecomment-123', verified: true, uncertain: false }] } as StageResult;
    expect(closeoutReceipt(r, 'issue-comment', url, 'board')).toBeTruthy();
    r.receipts[0].target = 'https://github.com/other/repo/issues/999#issuecomment-123';
    expect(closeoutReceipt(r, 'issue-comment', url, 'board')).toBeUndefined();
    r.receipts[0].target = url + '#issuecomment-123';
    r.receipts[0].uncertain = true;
    expect(closeoutReceipt(r, 'issue-comment', url, 'board')).toBeUndefined();
});
test('source acceptance is carried from successful metadata preparation to independent Lead review', async () => {
    const a = setup();
    a.job.stage = 'prepare-pr';
    a.job.head = head;
    a.job.pr = 700;
    a.job.status = 'blocked';
    const r = a.result();
    r.findings = ['source-acceptance', 'review', 'supporting-references'].map(id => ({ id, summary: 'Lead must review this unresolved prerequisite', status: 'open', expected: '', actual: '', attempts: 0 }));
    a.job.steps = [{ stage: 'prepare-pr', result: r }];
    await a.delivery.reconcilePreparation('GH-999');
    expect(a.job.stage).toBe('lead-pr');
    expect(a.job.status).toBe('queued');
    expect(a.job.steps[0].result.findings[0].status).toBe('open');
    expect(a.calls.some(c => c.includes('/merge --method PUT'))).toBe(false);
});
test('a saved passing exact-head PR review survives read failures without another model run', async () => {
    const a = setup();
    a.job.stage = 'lead-pr';
    a.job.pr = 700;
    a.job.head = head;
    a.job.status = 'queued';
    a.pr.draft = false;
    a.store.state.coordination!.merges = { enabled: true, authorizedAt: '' };
    a.job.steps = [{ stage: 'lead-pr', result: a.result() }];
    a.pr.updated_at = '2026-10-28T12:00:00Z';
    a.pr.base.sha = 'c'.repeat(40);
    a.job.reviewContext = { head, issueUpdatedAt: a.pr.updated_at, prUpdatedAt: a.pr.updated_at, baseSha: a.pr.base.sha, target: 'main', step: 0 };
    a.engine.agents.run = async () => { throw new Error('Should reuse saved independent review'); };
    await a.delivery.step(a.job);
    expect(a.job).toMatchObject({ stage: 'merge', status: 'queued' });
    expect(a.calls.some(c => c.includes('/merge --method PUT'))).toBe(false);
});
test('a changed head or open finding requires another independent review', async () => {
    for (const changed of [false, true]) {
        const a = setup();
        a.job.stage = 'lead-pr';
        a.job.pr = 700;
        a.job.head = head;
        const saved = a.result();
        if (changed)
            a.pr.head.sha = 'b'.repeat(40);
        else
            saved.findings = [{ id: 'source-acceptance', summary: 'Unresolved source review', status: 'open', expected: '', actual: '', attempts: 0 }];
        a.job.steps = [{ stage: 'lead-pr', result: saved }];
        let called = 0;
        a.engine.agents.run = async () => { called++; throw new Error('New review required'); };
        await a.delivery.step(a.job);
        expect(called).toBe(1);
        expect(a.job.stage).toBe('lead-pr');
    }
});
test('a new issue or PR update prevents reuse even when the reviewed head is unchanged', async () => {
    const a = setup();
    a.job.stage = 'lead-pr';
    a.job.pr = 700;
    a.job.head = head;
    a.job.steps = [{ stage: 'lead-pr', result: a.result() }];
    a.pr.updated_at = '2026-10-28T13:00:00Z';
    a.pr.base.sha = 'c'.repeat(40);
    a.job.reviewContext = { head, issueUpdatedAt: '2026-10-28T12:00:00Z', prUpdatedAt: '2026-10-28T12:00:00Z', baseSha: a.pr.base.sha, target: 'main', step: 0 };
    let called = 0;
    a.engine.agents.run = async () => { called++; throw new Error('Recheck possible new hold'); };
    await a.delivery.step(a.job);
    expect(called).toBe(1);
});
test('team can omit source review and independent QA without fabricating passed stages', async () => {
    const a = setup();
    a.engine.agents.run = async () => ({ ...a.result(), approach: { plan: 'none', review: 'none', validation: 'developer-checks', checks: ['Relevant repository checks'], reason: 'Small understood change covered by developer checks.' } }) as any;
    await a.delivery.step(a.job);
    expect(a.job.stage).toBe('draft');
    expect(a.job.status).toBe('queued');
    expect(a.job.steps.map(s => s.stage)).toEqual(['implement']);
    expect(a.job.skippedStages?.review).toContain('Small understood');
    expect(a.job.skippedStages?.validate).toContain('Small understood');
    expect(a.job.decisions?.[0].role).toBe('developer');
});
test('quick and full source reviews keep separate decisions and use the Lead assignment', async () => {
    for (const mode of ['focused', 'full'] as const) {
        const a = setup();
        const approach = { plan: 'none' as const, review: mode, validation: 'developer-checks' as const, checks: ['Scoped checks'], reason: `Selected ${mode} review for this change.` };
        a.engine.agents.run = async (role, task) => {
            if (a.job.stage === 'review') {
                expect(role).toBe('lead');
                expect(task).toContain(mode === 'full' ? 'FULL IMPLEMENTATION REVIEW' : 'QUICK REVIEW');
            }
            return { ...a.result(), approach } as any;
        };
        await a.delivery.step(a.job);
        expect(a.job.stage).toBe('review');
        await a.delivery.step(a.job);
        expect(a.job.stage).toBe('draft');
        expect(a.job.steps.filter(s => s.stage === 'review')).toHaveLength(1);
        expect(a.job.approach?.review).toBe(mode);
    }
});
test('a failed review cannot be bypassed by a later no-review decision', async () => {
    const a = setup();
    a.job.stage = 'review';
    a.job.head = head;
    a.job.approach = { plan: 'none', review: 'full', validation: 'independent-checks', checks: ['Checks'], reason: 'Broad boundary risk.' };
    a.job.steps = [{ stage: 'review', result: { ...a.result('review'), outcome: 'failed', findings: [{ id: 'defect', summary: 'Real defect', status: 'open', actual: 'Broken', expected: 'Works', attempts: 0 }] } }];
    a.engine.agents.run = async () => ({ ...a.result(), approach: { plan: 'none', review: 'none', validation: 'developer-checks', checks: ['Checks'], reason: 'Skip because reviewer failed.' } }) as any;
    await a.delivery.step(a.job);
    expect(a.job.status).toBe('blocked');
    expect(a.job.approach.review).toBe('full');
});
test('QA can request full review before acting without replaying the implementation', async () => {
    const a = setup();
    a.job.head = head;
    a.job.stage = 'validate';
    a.job.approach = { plan: 'none', review: 'none', validation: 'independent-checks', checks: ['Focused checks'], reason: 'Initially understood change.' };
    a.engine.agents.run = async () => ({ ...a.result(), outcome: 'reroute', approach: { ...a.job.approach, review: 'full', reason: 'Inspection found a consequential shared boundary.' } }) as any;
    await a.delivery.step(a.job);
    expect(a.job).toMatchObject({ stage: 'review', status: 'queued' });
    expect(a.job.steps.map(s => s.stage)).toEqual(['validate']);
    expect(a.job.steps[0].result.outcome).toBe('reroute');
    expect(a.job.approach.review).toBe('full');
    expect(a.calls.some(c => c.includes(' -f '))).toBe(false);
});
test('base-update readback adopts only a clean unpublished descendant and always queues review', async () => {
    for (const scenario of ['same-head', 'dirty', 'published', 'unrelated', 'recovered']) {
        const a = setup(), recovered = 'b'.repeat(40), base = 'c'.repeat(40);
        a.job.stage = 'update-base';
        a.job.status = 'blocked';
        a.job.head = head;
        a.job.worktree = '/owned/candidate';
        a.job.branch = 'issue-999';
        a.job.pr = 0;
        a.engine.maintenance.verifyCandidate = async () => {
            if (scenario === 'dirty')
                throw new Error('dirty candidate');
        };
        const writes: string[] = [];
        const delivery = new GitHubDelivery(a.store, a.engine, async (bin, args) => {
            writes.push(`${bin} ${args.join(' ')}`);
            if (bin === 'git' && args[0] === 'rev-parse')
                return scenario === 'same-head' ? head : recovered;
            if (bin === 'git' && args[0] === 'merge-base') {
                if (scenario === 'unrelated')
                    throw new Error('not a descendant');
                return '';
            }
            if (bin === 'git' && args[0] === 'ls-remote')
                return scenario === 'published' ? `${recovered} refs/heads/issue-999` : '';
            if (bin === 'gh' && args[0] === 'api')
                return JSON.stringify({ sha: base });
            if (bin === 'gh' && args[0] === 'pr')
                return '[]';
            throw new Error('Unexpected command');
        });
        if (scenario === 'recovered') {
            await delivery.reconcileBaseUpdate('GH-999');
            expect(a.job).toMatchObject({ head: recovered, stage: 'review', status: 'queued' });
            expect(a.job.steps.at(-1)?.stage).toBe('base-update-readback');
        }
        else {
            await expect(delivery.reconcileBaseUpdate('GH-999')).rejects.toThrow();
            expect(a.job.status).toBe('blocked');
            expect(a.job.head).toBe(head);
        }
        expect(writes.some(c => /git (?:push|commit)\b|--method/.test(c))).toBe(false);
    }
});
test('saved completed independent PR review is recovered only for unchanged live metadata', async () => {
    for (const changed of [false, true]) {
        const a = setup();
        a.job.stage = 'lead-pr';
        a.job.status = 'blocked';
        a.job.pr = 700;
        a.job.head = head;
        a.pr.draft = false;
        a.pr.updated_at = changed ? '2026-10-28T14:00:00Z' : '2026-10-28T12:00:00Z';
        a.pr.base.sha = 'c'.repeat(40);
        a.store.state.coordination!.merges = { enabled: true, authorizedAt: '' };
        const dir = resolve(a.store.dataRoot, 'sessions', 'saved-review');
        mkdirSync(dir, { recursive: true });
        a.store.state.workLog = [{ id: 'saved-review', requestId: a.job.id, stage: 'github-lead-pr', status: 'completed', sessionId: 'independent-session', startedAt: '2026-10-28T13:00:00Z' }] as any;
        writeFileSync(resolve(dir, 'provider.json'), JSON.stringify({ project: 'brain', repository: 'JFusco/brain', role: 'lead', readOnly: true }));
        writeFileSync(resolve(dir, 'result.json'), JSON.stringify({ session: 'independent-session', result: { ...a.result('review'), approach: { plan: 'none', review: 'focused', validation: 'independent-checks', checks: ['Exact head and registered source evidence'], reason: 'First explicit bounded review choice' } } }));
        if (changed) {
            await expect(a.delivery.reconcileReview('GH-999')).rejects.toThrow('changed');
            expect(a.job.status).toBe('blocked');
        }
        else {
            await a.delivery.reconcileReview('GH-999');
            expect(a.job).toMatchObject({ stage: 'merge', status: 'queued' });
            expect(a.job.mergeApprovalRequired).not.toBe(true);
            expect(a.job.approach?.review).toBe('focused');
        }
        expect(a.calls.some(c => c.includes('/merge --method PUT'))).toBe(false);
    }
});
test('a PR waiting on explicit approval is not redispatched or merged by observation', async () => {
    const a = setup();
    a.job.pr = 700;
    a.job.head = head;
    a.job.stage = 'lead-pr';
    a.job.status = 'watching';
    a.job.mergeApprovalRequired = true;
    a.pr.draft = false;
    a.store.state.coordination!.merges = { enabled: true, authorizedAt: '' };
    await a.delivery.observe();
    expect(a.job).toMatchObject({ stage: 'lead-pr', status: 'watching', mergeApprovalRequired: true });
    a.job.stage = 'merge';
    a.job.status = 'queued';
    await a.delivery.step(a.job);
    expect(a.job.status).toBe('blocked');
    expect(a.calls.some(c => c.includes('/merge --method PUT'))).toBe(false);
});
test('owned published merge conflicts queue one repair while uncertainty and foreign candidates remain stopped', async () => {
    const a = conflictSetup();
    await a.delivery.queueConflictRepair('GH-999');
    expect(a.job).toMatchObject({ stage: 'update-base', status: 'queued', pr: 700, head });
    await expect(a.delivery.queueConflictRepair('GH-999')).rejects.toThrow();
    a.job.stage = 'lead-pr'; a.job.status = 'watching';
    a.job.steps[0].result.receipts = [{ uncertain: true, verified: false }] as any;
    await expect(a.delivery.queueConflictRepair('GH-999')).rejects.toThrow('certain');
    a.job.steps[0].result.receipts = []; a.job.worktree = '';
    await expect(a.delivery.queueConflictRepair('GH-999')).rejects.toThrow('owned');
});
test('failed current-head checks queue scoped repair but passing checks and unknown ownership do not', async () => {
    const a = setup();
    a.job.pr = 700;
    a.job.head = head;
    a.job.branch = 'issue-999';
    a.job.worktree = '/tmp/owned-candidate';
    a.job.stage = 'lead-pr';
    a.job.status = 'watching';
    a.job.steps = [{ stage: 'lead-pr', result: { ...a.result('review'), outcome: 'blocked' } }];
    expect(await a.delivery.queueCIRepair(a.job)).toBe(false);
    a.setCheckConclusion('failure');
    expect(await a.delivery.queueCIRepair(a.job)).toBe(true);
    expect(a.job).toMatchObject({ stage: 'update-base', status: 'queued', repairReason: 'ci' });
    expect(a.calls.some(c => c.includes('/merge --method PUT'))).toBe(false);
    a.job.stage = 'lead-pr';
    a.job.status = 'watching';
    a.job.worktree = '';
    expect(await a.delivery.queueCIRepair(a.job)).toBe(false);
});
test('failed merge Actions route to team recovery and retain the original failed run', async () => {
    const a = setup();
    a.job.pr = 700;
    a.job.head = head;
    a.job.stage = 'merge';
    a.job.status = 'watching';
    a.job.mergeCommit = 'c'.repeat(40);
    a.pr.merged_at = '2026-10-28T15:00Z';
    a.pr.merge_commit_sha = a.job.mergeCommit;
    a.setRuns([{ head_sha: a.job.mergeCommit, event: 'push', head_branch: 'main', status: 'completed', conclusion: 'failure' }]);
    await a.delivery.observe();
    expect(a.job).toMatchObject({ stage: 'ci-recovery', status: 'queued', mergeCommit: 'c'.repeat(40) });
    expect(a.calls.some(c => c.includes('/rerun'))).toBe(false);
    a.job.ciFollowupKey = 'GH-1000';
    a.job.status = 'watching';
    a.delivery.jobs.push({ ...a.job, id: 'repair', key: 'GH-1000', status: 'queued', stage: 'implement', mergeCommit: undefined, ciFollowupKey: undefined });
    await a.delivery.observe();
    expect(a.job.status).toBe('watching');
    expect(a.job.detail).toContain('GH-1000');
    a.delivery.jobs[1].status = 'completed';
    a.delivery.jobs[1].mergeCommit = 'd'.repeat(40);
    await a.delivery.observe();
    expect(a.job).toMatchObject({ stage: 'closeout', status: 'queued' });
    expect(a.job.detail).toContain('preserving the original failed');
});
test('a prior CI recovery attempt can only be read back, never create a second repair issue', async () => {
    const a = setup();
    a.job.pr = 700;
    a.job.head = head;
    a.job.mergeCommit = 'c'.repeat(40);
    a.pr.merged_at = '2026-10-28T15:00Z';
    a.pr.merge_commit_sha = a.job.mergeCommit;
    a.job.ciRecoveryAttemptAt = 'earlier';
    a.engine.agents.run = async (role, task, _schema, options) => { expect(role).toBe('pm'); expect(options?.readOnly).toBe(true); expect(task).toContain('READ-BACK ONLY'); return { outcome: 'needs-human', issue: 0, summary: 'The original issue creation is uncertain; inspect the saved receipt.', receipts: [] } as any; };
    await expect(a.delivery.recoverMergeCI(a.job)).rejects.toThrow('uncertain');
    expect(a.job.ciFollowupKey).toBeUndefined();
});
test('a published draft finding hands off to automatic preparation without replaying publication', async () => {
    const a = setup();
    Object.assign(a.job, { stage: 'draft', head, pr: 700, branch: 'issue-999', worktree: a.result().worktree, repairReason: 'conflicts' });
    a.engine.agents.run = async () => ({ ...a.result(), findings: [{ id: 'draft-blocks-merge', summary: 'Still draft', status: 'open', expected: 'Prepare next', actual: 'Draft', attempts: 0 }] }) as any;
    await a.delivery.step(a.job);
    expect(a.job).toMatchObject({ stage: 'prepare-pr', status: 'queued', pr: 700 });
    const b = setup();
    Object.assign(b.job, { stage: 'draft', head, pr: 700 });
    b.engine.agents.run = async () => ({ ...b.result(), findings: [{ id: 'source-defect', summary: 'Unresolved', status: 'open', expected: 'Fix', actual: 'Defect', attempts: 0 }] }) as any;
    await b.delivery.step(b.job);
    expect(b.job.status).toBe('blocked');
});
test('closeout read-back proves rejected non-execution without dropping uncertain effects or replaying writes', async () => {
    for (const resolved of [true, false]) {
        const a = setup();
        Object.assign(a.job, { stage: 'closeout', status: 'blocked', pr: 700, head, mergeCommit: 'c'.repeat(40) });
        a.pr.merged_at = '2026-10-28T15:00Z';
        a.pr.merge_commit_sha = a.job.mergeCommit;
        a.setIssueState('closed');
        const original = a.result();
        original.commit = a.job.mergeCommit!;
        original.receipts = [{ id: 'rejected', action: 'Comment rejected before execution', target: url, verified: false, uncertain: false, detail: 'Requires original tool evidence' }];
        a.job.steps = [{ stage: 'closeout', result: original }];
        a.setComments([{ id: 1, html_url: url + '#issuecomment-1', body: 'Verified PR #700.' }]);
        a.setRuns([{ head_sha: a.job.mergeCommit, event: 'push', head_branch: 'main', status: 'completed', conclusion: 'success' }]);
        a.engine.github.board = async () => ({ error: '', items: [{ number: 999, repository: 'JFusco/brain', status: 'Done' }] }) as any;
        let reads = 0;
        a.engine.agents.run = async (_role, task, _schema, opts) => { reads++; expect(opts?.readOnly).toBe(true); expect(task).toContain('never proves'); const r = a.result(); r.commit = a.job.mergeCommit!; r.evidence[0].commit = r.commit; r.outcome = resolved ? 'passed' : 'blocked'; r.receipts = resolved ? ['issue-close', 'issue-comment', 'board-status'].map(id => ({ id, action: 'Read-back', target: id === 'issue-comment' ? url + '#issuecomment-1' : url, verified: true, uncertain: false, detail: 'Proven' })) : [{ ...original.receipts[0], uncertain: true }]; return r as any; };
        if (resolved) {
            await a.delivery.reconcileCloseout('GH-999');
            expect(a.job.status).toBe('completed');
        }
        else {
            await expect(a.delivery.reconcileCloseout('GH-999')).rejects.toThrow('still need read-back');
            expect(a.job.status).toBe('blocked');
        }
        expect(a.job.steps[0].result.receipts[0].verified).toBe(false);
        expect(a.job.steps.at(-1)?.stage).toBe('closeout-readback');
        expect(reads).toBe(1);
        expect(a.calls.some(c => c.includes('--method') || c.includes(' -f '))).toBe(false);
    }
});
test('known preflight rejection permits one fresh merge intent while uncertain dispatch never repeats', async () => {
    const a = setup();
    a.job.pr = 700;
    a.job.head = head;
    a.job.stage = 'merge';
    a.pr.draft = false;
    a.store.state.coordination!.merges = { enabled: true, authorizedAt: 'human' };
    a.job.steps.push({ stage: 'lead-pr', result: a.result('review') });
    const verify = a.delivery.verifyPR.bind(a.delivery);
    let reads = 0;
    a.delivery.verifyPR = async (job, required) => {
        const value = await verify(job, required);
        if (++reads === 2)
            a.store.state.paused = true;
        return value;
    };
    await expect(a.delivery.merge(a.job)).rejects.toThrow('paused');
    expect(a.job.mergeAttempt).toBeUndefined();
    const rejected = a.store.getEffect(a.job.mergeIntentId!)!;
    expect(rejected.status).toBe('rejected');
    expect(rejected.dispatchedAt).toBe('');
    a.store.state.paused = false;
    a.delivery.verifyPR = verify;
    await a.delivery.merge(a.job);
    expect(a.job.mergeIntentId).not.toBe(rejected.id);
    expect(a.store.getEffect(rejected.id)?.status).toBe('rejected');
    expect(a.calls.filter(c => c.includes('/merge --method PUT'))).toHaveLength(1);
    const b = setup();
    b.job.pr = 700;
    b.job.head = head;
    b.job.stage = 'merge';
    b.pr.draft = false;
    b.store.state.coordination!.merges = { enabled: true, authorizedAt: 'human' };
    b.job.steps.push({ stage: 'lead-pr', result: b.result('review') });
    const marker = { ...rejected, id: `merge:${b.job.id}:${head}`, work: { projectId: 'brain', kind: 'delivery' as const, id: b.job.id }, attemptId: b.job.id, status: 'uncertain' as const, dispatchedAt: '2026-10-29T13:00:00Z' };
    b.store.putEffect(marker);
    await expect(b.delivery.merge(b.job)).rejects.toThrow('read-back');
    expect(b.calls.some(c => c.includes('/merge --method PUT'))).toBe(false);
});
test.each([false, true])('a prepared merge for an older head does not block a newly reviewed head (current key rejected: %s)', async rejected => {
    const a = setup(), nextHead = 'b'.repeat(40);
    Object.assign(a.job, { pr: 700, prUrl: a.pr.html_url, head, stage: 'merge' });
    a.pr.draft = false;
    a.store.state.coordination!.merges = { enabled: true, authorizedAt: 'human' };
    const prepared: EffectIntent = { id: `merge:${a.job.id}:${head}`, work: { projectId: 'brain', kind: 'delivery', id: a.job.id }, attemptId: a.job.id, operation: 'github-merge', target: a.job.prUrl, authorization: 'human', payload: { sha: head, method: 'merge' }, expectedState: { head, base: 'main' }, status: 'prepared', createdAt: '2026-10-29T14:00:00Z', dispatchedAt: '', verifiedAt: '', receipt: null, error: '', elapsedMs: null };
    a.store.putEffect(prepared);
    a.job.mergeIntentId = prepared.id;
    a.store.recover();
    a.job.head = nextHead;
    a.pr.head.sha = nextHead;
    const review = a.result('review');
    review.commit = nextHead;
    review.evidence[0].commit = nextHead;
    a.job.steps.push({ stage: 'lead-pr', result: review });
    const currentId = `merge:${a.job.id}:${nextHead}`;
    const rejectedIntent: EffectIntent = { ...prepared, id: currentId, payload: { sha: nextHead, method: 'merge' }, expectedState: { head: nextHead, base: 'main' }, status: 'rejected', error: 'Synthetic preflight rejection' };
    if (rejected)
        a.store.putEffect(rejectedIntent);
    const api = a.delivery.api.bind(a.delivery);
    a.delivery.api = async path => path.includes(`commits/${nextHead}/check-runs`) ? { total_count: 1, check_runs: [{ id: 1, head_sha: nextHead, status: 'completed', conclusion: 'success' }] } : path === `commits/${nextHead}/status` ? { sha: nextHead, total_count: 0, statuses: [], state: 'success' } : api(path);
    await a.delivery.merge(a.job);
    const writes = a.calls.filter(call => call.includes('/merge --method PUT'));
    expect(writes).toHaveLength(1);
    expect(writes[0]).toContain(`sha=${nextHead}`);
    expect(a.store.getEffect(prepared.id)).toEqual(prepared);
    expect(a.store.getEffect(a.job.mergeIntentId!)).toMatchObject({ status: 'verified', payload: { sha: nextHead } });
    expect(a.job.mergeAttempt?.head).toBe(nextHead);
    if (rejected) {
        expect(a.job.mergeIntentId).not.toBe(currentId);
        expect(a.store.getEffect(currentId)).toEqual(rejectedIntent);
    }
    else
        expect(a.job.mergeIntentId).toBe(currentId);
});

function conflictSetup(kind:'legacy'|'typed'='legacy'){
 const a=setup(),base='b'.repeat(40);a.job.pr=700;a.job.prUrl=a.pr.html_url;a.job.head=head;a.job.branch='issue-999';a.job.worktree=a.result().worktree;a.job.stage='lead-pr';a.job.status='watching';
 a.pr.draft=false;a.pr.mergeable=false;a.pr.head.repo={full_name:a.store.project.repository};a.pr.base.sha=base;
 const assessment:any={...a.result('review'),outcome:'blocked',worktree:a.job.worktree,findings:[{id:kind==='legacy'?'main-integration-conflict':'any-scoped-conflict-id',status:'open',summary:'Conflict only',expected:'Clean integration',actual:'GitHub conflict',attempts:1}],resolution:{kind:kind==='legacy'?'source-repair':'conflict-repair',findingIds:[kind==='legacy'?'main-integration-conflict':'any-scoped-conflict-id'],evidenceIds:['1']}};
 a.job.steps=[{stage:'review',result:a.result('review')},{stage:'validate',result:a.result('checks')},{stage:'lead-pr',result:assessment}];
 const graph:any={number:700,url:a.pr.html_url,state:'OPEN',isDraft:false,headRefOid:head,headRefName:a.job.branch,baseRefOid:base,baseRefName:'main',mergeable:'CONFLICTING',mergeStateStatus:'DIRTY',headRepository:{nameWithOwner:a.store.project.repository},baseRepository:{nameWithOwner:a.store.project.repository}};
 const original=a.delivery.execute;let localHead=head;
 a.delivery.execute=async(program,args,options)=>{
  if(program==='git'){
   a.calls.push(args.join(' '));if(args[0]==='remote')return `https://github.com/${a.store.project.repository}.git`;if(args[0]==='rev-parse')return localHead;if(args[0]==='branch')return a.job.branch;if(args[0]==='status'||args[0]==='merge-base')return '';
  }
  if(args[1]==='graphql'&&options?.input&&JSON.parse(options.input).query.includes('headRefName')){a.calls.push('canonical-conflict-graphql');return JSON.stringify({data:{repository:{pullRequest:graph}}});}
  if(args[1]===`repos/${a.store.project.repository}/commits/main`){a.calls.push(args.join(' '));return JSON.stringify({sha:base});}
  return original(program,args,options);
 };
 return {...a,assessment,graph,base,setLocalHead:(value:string)=>localHead=value};
}
function addAuthenticatedConflictHold(a:ReturnType<typeof conflictSetup>){
 const requestId='conflict-hold',createdAt='2026-10-30T12:00:00Z';
 const message={ticket:a.job.key,actionId:'',status:'answered' as const,createdAt,sessionId:'',recheck:false,error:'',recipients:[],receipts:[]};
 a.store.state.messages.push({...message,id:requestId,requestId,from:'human',to:'pm',body:'Stop source changes'},
  {...message,id:'conflict-hold-answer',requestId,from:'pm',to:'pm',body:'Hold recorded'});
 a.store.state.projectNotes.push({id:'conflict-hold-note',ticket:a.job.key,requestId,summary:'Human hold',detail:'Stop source changes',createdAt});
}
test.each(['pr-update','human-input','head-change'])('conflict observation queues a fresh Lead assessment after %s',async change=>{
 const a=conflictSetup();a.pr.updated_at='2026-10-28T12:00:00Z';
 a.job.reviewContext={head,issueUpdatedAt:a.pr.updated_at,prUpdatedAt:a.pr.updated_at,baseSha:a.base,target:'main',step:a.job.steps.length-1};
 a.job.reviewInputSha256=deliveryInputSha256(a.store,a.job.key);a.job.lastPRFingerprint='previous PR observation';
 const steps=structuredClone(a.job.steps),queue=vi.spyOn(a.delivery,'queueConflictRepair');
 try{
  if(change==='pr-update')a.pr.updated_at='2026-10-28T13:00:00Z';
  if(change==='human-input')addAuthenticatedConflictHold(a);
  if(change==='head-change')a.pr.head.sha='d'.repeat(40);
  await a.delivery.observe();
  expect(a.job).toMatchObject({stage:'lead-pr',status:'queued',head});expect(a.job.steps).toEqual(steps);
  expect(a.job.lastPRFingerprint).not.toBe('previous PR observation');expect(queue).toHaveBeenCalledTimes(change==='head-change'?0:1);
  if(change!=='head-change')expect(a.job.detail).toContain('Conflict assessment scope or current target changed');
  expect(a.calls.some(c=>c.includes('/merge --method PUT'))).toBe(false);
 }finally{queue.mockRestore();}
});
test('unchanged conflict observation queues the proved repair without a merge',async()=>{
 const a=conflictSetup();await a.delivery.observe();
 expect(a.job).toMatchObject({stage:'update-base',status:'queued',repairReason:'conflicts'});
 expect(a.job.steps.filter(s=>s.stage==='conflict-readback')).toHaveLength(1);
 expect(a.calls.some(c=>c.includes('/merge --method PUT'))).toBe(false);
});
test.each(['human-input','foreign-claim'])('rejected conflict observation cannot queue a CI writer after %s',async change=>{
 const a=conflictSetup();a.job.reviewInputSha256=deliveryInputSha256(a.store,a.job.key);a.setCheckConclusion('failure');
 let claim:{mockRestore:()=>void}|undefined;
 if(change==='human-input')addAuthenticatedConflictHold(a);
 else claim=vi.spyOn(a.store,'activeClaims').mockReturnValue([{id:'other-claim',work:{projectId:a.store.project.id,kind:'delivery',id:a.job.id},status:'running'}]as any);
 try{
  await a.delivery.observe();
  expect(a.job).toMatchObject({stage:'lead-pr',status:'queued'});expect(a.job.repairReason).toBeUndefined();
  expect(a.job.steps.some(s=>s.stage==='conflict-readback')).toBe(false);
  expect(a.store.state.events.some(e=>e.kind==='pr-conflict-repair-queued')).toBe(false);
  expect(a.calls.some(c=>c.includes('/merge --method PUT'))).toBe(false);
 }finally{claim?.mockRestore();}
});
test.each([false,true])('conflict proof fences authenticated input drift during GraphQL (saved digest: %s)',async savedDigest=>{
 for(const changed of [false,true]){
  const a=conflictSetup(),original=a.delivery.execute;
  if(savedDigest)a.job.reviewInputSha256=deliveryInputSha256(a.store,a.job.key);
  const expected=structuredClone(a.job),input=deliveryInputSha256(a.store,a.job.key);let graphRead=false;
  a.delivery.execute=async(program,args,options)=>{
   const value=await original(program,args,options);
   if(args[1]==='graphql'&&options?.input&&JSON.parse(options.input).query.includes('headRefName')){
    graphRead=true;if(changed)addAuthenticatedConflictHold(a);
   }
   return value;
  };
  if(changed){
   await expect(a.delivery.queueConflictRepair(a.job.key)).rejects.toThrow('authorization changed');
   expect(a.job).toEqual(expected);
   expect(deliveryHumanInputs(a.store,a.job.key)).toEqual([expect.objectContaining({human:'Stop source changes'})]);
   expect(deliveryInputSha256(a.store,a.job.key)).not.toBe(input);
   expect(a.store.state.events.some(e=>e.kind==='pr-conflict-repair-queued')).toBe(false);
  }else{
   await a.delivery.queueConflictRepair(a.job.key);expect(a.job).toMatchObject({stage:'update-base',status:'queued',repairReason:'conflicts'});
   expect(a.job.steps.filter(s=>s.stage==='conflict-readback')).toHaveLength(1);
   expect(a.store.state.events.filter(e=>e.kind==='pr-conflict-repair-queued')).toHaveLength(1);
  }
  expect(graphRead).toBe(true);expect(a.calls.some(c=>c.includes('/merge --method PUT'))).toBe(false);
 }
});
test.each(['legacy','typed']as const)('actual lead stage routes %s conflict-only findings past historical preflight metadata to same-PR repair',async kind=>{
 const a=conflictSetup(kind);a.job.implementationRecovery={workId:'original-preflight',kind:'preflight',at:'preserved'};a.job.status='queued';const before=JSON.stringify(a.job.implementationRecovery),reviews=JSON.stringify(a.job.steps.slice(0,2));
 a.engine.agents.run=async()=>a.assessment;
 await a.delivery.step(a.job);
 expect(a.job).toMatchObject({stage:'update-base',status:'queued',repairReason:'conflicts',head,pr:700,branch:'issue-999'});expect(a.delivery.jobs).toHaveLength(1);expect(a.job.repairCycle).toBeUndefined();expect(JSON.stringify(a.job.implementationRecovery)).toBe(before);expect(JSON.stringify(a.job.steps.slice(0,2))).toBe(reviews);expect(a.calls).toContain('canonical-conflict-graphql');expect(a.calls.some(c=>c.includes('/merge --method PUT'))).toBe(false);
 const readback=a.job.steps.find(step=>step.stage==='conflict-readback')!.result;expect(conflictOnlyAssessment(readback)).toBe(true);expect(readback.evidence).toEqual(expect.arrayContaining(a.assessment.evidence));
});
test('checked conflict repair advances to same-PR publication without another source review or QA assignment',async()=>{
 const a=conflictSetup('typed');await a.delivery.queueConflictRepair(a.job.key);const oldReview=JSON.stringify(a.job.steps.slice(0,2)),newHead='c'.repeat(40);a.setLocalHead(newHead);
 a.engine.agents.run=async(role,task)=>{expect(role).toBe('developer');expect(task).toContain('CONFLICT-ONLY APPROVAL CONTINUITY');expect(task).toContain(`pre-integration approval anchor ${head}`);expect(task).toContain('approved claim and source-lock delta is unchanged');return {...a.result('checks'),commit:newHead,evidence:a.result('checks').evidence.map(e=>({...e,commit:newHead})),worktree:a.job.worktree,branch:a.job.branch,prId:700}as any;};
 await a.delivery.step(a.job);expect(a.job).toMatchObject({stage:'draft',status:'queued',head:newHead,pr:700,approach:{review:'none',validation:'developer-checks'}});expect(JSON.stringify(a.job.steps.slice(0,2))).toBe(oldReview);expect(a.job.skippedStages?.review).toContain('no repeated source review');
});
test.each(['arbitrary-source-id','mixed','permission','missing-classification-evidence','missing-source-review','failed-QA','source-hold','unknown-provider','clean-provider','foreign-pr','foreign-head','foreign-base','foreign-repository','graph-head','graph-base','graph-ref','graph-clean','graph-unknown','paused','draining','uncertain-effect','pending-native-phase'])('conflict exception cannot bypass unrelated findings or identity/hold gates: %s',async scenario=>{
 const a=conflictSetup();
 if(scenario==='arbitrary-source-id')a.assessment.findings[0].id='unrelated-source-bug';
 if(scenario==='mixed')a.assessment.findings.push({id:'source-bug',status:'open'});
 if(scenario==='permission')a.assessment.resolution.kind='permission';
 if(scenario==='missing-classification-evidence'){a.assessment.resolution.kind='conflict-repair';a.assessment.resolution.evidenceIds=['missing'];}
 if(scenario==='missing-source-review')a.job.steps=a.job.steps.filter(s=>s.stage!=='review');
 if(scenario==='failed-QA')a.job.steps.find(s=>s.stage==='validate')!.result.outcome='blocked';
 if(scenario==='source-hold')a.job.steps.find(s=>s.stage==='review')!.result.findings=[{id:'human-source-acceptance',status:'open'}]as any;
 if(scenario==='unknown-provider')a.pr.mergeable=null;if(scenario==='clean-provider')a.pr.mergeable=true;if(scenario==='foreign-pr')a.pr.number=701;if(scenario==='foreign-head')a.pr.head.sha='d'.repeat(40);if(scenario==='foreign-base')a.pr.base.ref='other';if(scenario==='foreign-repository')a.pr.head.repo.full_name='Other/repo';
 if(scenario==='graph-head')a.graph.headRefOid='d'.repeat(40);if(scenario==='graph-base')a.graph.baseRefOid='d'.repeat(40);if(scenario==='graph-ref')a.graph.headRefName='other';if(scenario==='graph-clean')a.graph.mergeStateStatus='CLEAN';if(scenario==='graph-unknown')a.graph.mergeable='UNKNOWN';
 if(scenario==='paused')a.store.state.paused=true;if(scenario==='draining')a.store.state.draining=true;
 if(scenario==='uncertain-effect')a.assessment.receipts=[{id:'uncertain',action:'write',target:'provider',verified:false,uncertain:true}];
 if(scenario==='pending-native-phase')a.job.implementationContinuation={phase:'technical-review'}as any;
 const before=JSON.stringify(a.job);await expect(a.delivery.queueConflictRepair(a.job.key)).rejects.toThrow();expect(JSON.stringify(a.job)).toBe(before);expect(a.calls.some(c=>c.includes('/merge --method PUT'))).toBe(false);
});
test('canonical proof rechecks pause and same candidate after asynchronous provider reads',async()=>{
 const a=conflictSetup(),original=a.delivery.execute;a.delivery.execute=async(program,args,options)=>{const value=await original(program,args,options);if(args[1]==='graphql'&&options?.input&&JSON.parse(options.input).query.includes('headRefName'))a.store.state.paused=true;return value;};
 await expect(a.delivery.queueConflictRepair(a.job.key)).rejects.toThrow('ownership, hold or authorization');expect(a.job.stage).toBe('lead-pr');
});
test('durable conflict command queues without execution then scheduler handler awaits the same original repair',async()=>{
 const a=conflictSetup(),request=enqueueRequest(a.store,'repair-pr-conflicts',a.job.key,head);expect(request.status).toBe('queued');expect(a.job.stage).toBe('lead-pr');expect(a.calls).toHaveLength(0);
 const real=a.delivery.queueConflictRepair.bind(a.delivery),spy=vi.spyOn(GitHubDelivery.prototype,'queueConflictRepair').mockImplementation(async(key,reason)=>real(key,reason));
 try{await executeRequest(a.store,a.engine,{}as any,request);expect(request.status).toBe('completed');expect(a.job).toMatchObject({stage:'update-base',status:'queued',pr:700});expect(spy).toHaveBeenCalledTimes(1);}finally{spy.mockRestore();}
});
test('future conflict classification remains explicit while unknown historical IDs stay ordinary source findings',()=>{
 const a=conflictSetup('typed');expect(conflictOnlyAssessment(a.assessment)).toBe(true);a.assessment.resolution.kind='source-repair';expect(conflictOnlyAssessment(a.assessment)).toBe(false);
});
test('another delivery claim cannot enqueue conflict work before its owner terminates',async()=>{
 const a=conflictSetup(),spy=vi.spyOn(a.store,'activeClaims').mockReturnValue([{id:'other-claim',work:{projectId:a.store.project.id,kind:'delivery',id:a.job.id},lane:'delivery',stage:'lead-pr',status:'running',claimedAt:'now'}]as any);
 try{await expect(a.delivery.queueConflictRepair(a.job.key)).rejects.toThrow('ownership');expect(a.job.stage).toBe('lead-pr');}finally{spy.mockRestore();}
});
test('conflict queue commits its proof step, stage and event atomically',async()=>{
 const a=conflictSetup(),prior=structuredClone(a.job),spy=vi.spyOn(a.store,'emit').mockImplementation(()=>{throw new Error('Injected persistence error');});
 try{await expect(a.delivery.queueConflictRepair(a.job.key)).rejects.toThrow('Injected');expect(a.store.state.coordination!.jobs![0]).toEqual(prior);}finally{spy.mockRestore();}
});

test('post-conflict live readiness keeps exact claim approval anchor without reasking unchanged source acceptance',async()=>{
 const a=conflictSetup('typed');await a.delivery.queueConflictRepair(a.job.key);a.job.stage='lead-pr';a.job.status='queued';a.job.approach={plan:'none',review:'none',validation:'developer-checks',checks:['Required current-head checks'],reason:'Authorized conflict-only repair'};
 let calls=0;a.engine.agents.run=async(role,task)=>{calls++;expect(role).toBe('lead');expect(task).toContain(`pre-integration approval anchor ${head}`);expect(task).toContain('not a reason to ask for the same source acceptance again');expect(task).toContain('never infer an absent approval, expand claims, accept additional locks/baselines');expect(task).toContain('required repaired-head developer/hosted checks, current-head readiness');return a.result('review')as any;};
 await a.delivery.step(a.job);expect(calls).toBe(1);expect(a.job.status).toBe('watching');expect(a.job.mergeAuthorization).toBeUndefined();expect(a.calls.some(c=>c.includes('/merge --method PUT'))).toBe(false);
});
test('ordinary CI/source readiness receives no conflict-only approval carry-forward instruction',async()=>{
 const a=setup();a.job.pr=700;a.job.stage='lead-pr';a.pr.draft=false;a.job.repairReason='source';a.engine.agents.run=async(_role,task)=>{expect(task).not.toContain('CONFLICT-ONLY APPROVAL CONTINUITY');return a.result('review')as any;};await a.delivery.step(a.job);expect(a.job.status).toBe('watching');
});

test('URL-only conflict diagnosis routes actual Lead handoff using Office-owned assessment and fresh provider facts',async()=>{
 const a=conflictSetup('typed');a.job.status='queued';a.assessment.evidence=[{id:'live-conflict',kind:'pr',path:'',url:a.job.prUrl,commit:head,environment:'GitHub current provider read',summary:'Canonical conflict observation',observedAt:''}];a.assessment.resolution.evidenceIds=['live-conflict'];const original=structuredClone(a.assessment);
 a.engine.agents.run=async()=>structuredClone(original);await a.delivery.step(a.job);
 expect(a.job).toMatchObject({stage:'update-base',status:'queued',repairReason:'conflicts',pr:700,head});expect(a.assessment).toEqual(original);
 const proofStep=a.job.steps.find(s=>s.stage==='conflict-readback')!,proof=JSON.parse(readFileSync(proofStep.result.evidence.at(-1)!.path,'utf8'));
 expect(proof.assessment.path).toContain('/lead-review-');expect(proof.head).toBe(head);expect(proofStep.result.resolution?.evidenceIds).toEqual(['live-conflict']);expect(proofStep.result.evidence.find(e=>e.id==='live-conflict')?.path).toBe('');expect(a.calls).toContain('canonical-conflict-graphql');
});
test.each(['empty-url','invalid-url','unknown-id','duplicate-reference','duplicate-evidence','stale-head','uncertain-effect','missing-owned-artifact'])('remote advisory conflict locator cannot authorize repair with %s',async scenario=>{
 const a=conflictSetup('typed');a.assessment.evidence=[{id:'live-conflict',kind:'pr',path:'',url:a.job.prUrl,commit:head,environment:'GitHub',summary:'Current',observedAt:''}];a.assessment.resolution.evidenceIds=['live-conflict'];
 if(scenario==='empty-url')a.assessment.evidence[0].url='';if(scenario==='invalid-url')a.assessment.evidence[0].url='file:///private/source';if(scenario==='unknown-id')a.assessment.resolution.evidenceIds=['unknown'];if(scenario==='duplicate-reference')a.assessment.resolution.evidenceIds.push('live-conflict');if(scenario==='duplicate-evidence')a.assessment.evidence.push({...a.assessment.evidence[0]});if(scenario==='stale-head')a.assessment.evidence[0].commit='e'.repeat(40);if(scenario==='uncertain-effect')a.assessment.receipts.push({id:'uncertain',action:'write',target:'provider',verified:false,uncertain:true});
 const before=JSON.stringify(a.job);await expect(a.delivery.queueConflictRepair(a.job.key)).rejects.toThrow();expect(JSON.stringify(a.job)).toBe(before);expect(a.calls.some(c=>c.includes('canonical-conflict-graphql'))).toBe(false);
});

function acceptedMergeResume(){
 const a=setup(),at='2026-10-28T15:00:00Z';a.pr.draft=false;a.pr.base.sha='b'.repeat(40);a.pr.updated_at=at;
 Object.assign(a.job,{pr:700,prUrl:a.pr.html_url,head,stage:'merge',status:'blocked',detail:'Current-head checks have not all passed'});
 a.store.state.coordination!.merges={enabled:true,authorizedAt:'human-existing'};const result=a.result('review');a.job.steps=[{stage:'lead-pr',result}];a.job.reviewInputSha256=deliveryInputSha256(a.store,a.job.key);a.job.reviewContext={head,issueUpdatedAt:'2026-10-28T12:00:00Z',prUpdatedAt:at,baseSha:a.pr.base.sha,target:'main',step:0};
 const claim=a.store.claimWork({projectId:'brain',kind:'delivery',id:a.job.id},'original-lead','lead-pr')!;a.store.finishClaim(claim.id,'completed');
 const work:any={id:'accepted-lead',sessionId:'native-accepted-lead',claimId:claim.id,lane:'delivery',requestId:a.job.id,ticket:a.job.key,role:'lead',provider:'codex',stage:'github-lead-pr',status:'completed',executionStatus:'completed',endedAt:at,startedAt:'2026-10-28T14:00:00Z',processId:2147483400};a.store.state.workLog=[work];
 const dir=resolve(a.store.dataRoot,'sessions',work.id);mkdirSync(dir,{recursive:true});const put=(n:string,v:unknown)=>writeFileSync(resolve(dir,n),JSON.stringify(v));const profile=workerProfile(work.stage,true);
 put('provider.json',{project:'brain',repository:a.store.project.repository,role:'lead',provider:'codex',readOnly:true});const wrapper={session:work.sessionId,provider:'codex',result};put('result.json',wrapper);
 put('assignment.json',{id:work.id,stage:work.stage,role:'lead',lane:'delivery',claimId:claim.id,work:claim.work,scope:{repository:a.store.project.repository,worktree:a.store.project.repo,artifacts:dir},profile:profile.name});put('assignment-identity.json',{attemptId:work.id,requestId:a.job.id,projectId:'brain',repository:a.store.project.repository,role:'lead',threadId:work.sessionId});put('capabilities.json',profile);put('execution-completion.json',{workerId:work.id,session:work.sessionId,provider:'codex',resultSha256:digest(wrapper)});
 vi.spyOn(processHelpers,'processGroupAlive').mockReturnValue(false);const run=vi.spyOn(a.engine.agents,'run');return{...a,work,claim,put,run};
}
test('blocked unchanged accepted Lead merge resumes through scheduler queue without model/review repeat or direct mutation',async()=>{
 const a=acceptedMergeResume(),prior=JSON.stringify(a.job.steps);await a.delivery.observe();expect(a.job).toMatchObject({stage:'merge',status:'queued'});expect(JSON.stringify(a.job.steps)).toBe(prior);expect(a.run).not.toHaveBeenCalled();expect(a.calls.some(c=>c.includes('/merge --method PUT'))).toBe(false);
 await a.delivery.step(a.job);expect(a.calls.filter(c=>c.includes('/merge --method PUT'))).toHaveLength(1);expect(a.run).not.toHaveBeenCalled();
});
test.each(['latest-failure','latest-pending','approval','disabled','paused','draining','head','base','updated','human-input','native-result','missing-completion','uncertain-effect','attempted','open-source-finding','foreign-claim','retained-result','active-claim'])('merge resumption preserves %s restriction and never repeats review or writes',async scenario=>{
 const a=acceptedMergeResume();if(scenario==='latest-failure')a.setCheckConclusion('failure');if(scenario==='latest-pending')a.setCheckConclusion('pending');if(scenario==='approval')a.job.mergeApprovalRequired=true;if(scenario==='disabled')a.store.state.coordination!.merges!.enabled=false;if(scenario==='paused')a.store.state.paused=true;if(scenario==='draining')a.store.state.draining=true;if(scenario==='head')a.pr.head.sha='c'.repeat(40);if(scenario==='base')a.pr.base.sha='c'.repeat(40);if(scenario==='updated')a.pr.updated_at='2026-10-29T01:00:00Z';
 if(scenario==='human-input')a.job.reviewInputSha256='old';if(scenario==='native-result')a.put('result.json',{});if(scenario==='missing-completion')a.put('execution-completion.json',{});if(scenario==='foreign-claim')a.store.finishClaim(a.claim.id,'interrupted');if(scenario==='retained-result')a.job.steps[0].result.previewUrl='https://changed.invalid';if(scenario==='active-claim')a.store.claimWork({projectId:'brain',kind:'delivery',id:a.job.id},'other-reader','merge');if(scenario==='open-source-finding')a.job.steps[0].result.findings.push({id:'source-acceptance',summary:'Human acceptance absent',actual:'Pending',expected:'Approval',status:'open',attempts:0});
 if(scenario==='attempted')a.job.mergeAttempt={head,at:'before'};if(scenario==='uncertain-effect')a.store.putEffect({id:`merge:${a.job.id}:${head}`,work:{projectId:'brain',kind:'delivery',id:a.job.id},status:'uncertain',dispatchedAt:'before'}as any);
 await a.delivery.observe();expect(a.job.status).not.toBe('queued');expect(a.run).not.toHaveBeenCalled();expect(a.calls.some(c=>c.includes('/merge --method PUT'))).toBe(false);
});
test('new current-head checks at merge effect preflight retain failure rather than sending a merge',async()=>{
 const a=setup();a.job.pr=700;a.job.prUrl=a.pr.html_url;a.job.head=head;a.pr.draft=false;a.store.state.coordination!.merges={enabled:true,authorizedAt:'human'};a.job.stage='merge';a.job.steps=[{stage:'lead-pr',result:a.result('review')}];const api=a.delivery.api.bind(a.delivery);let reads=0;
 a.delivery.api=async path=>{if(path.includes('/check-runs')&&++reads===2)a.setCheckConclusion('failure');return api(path);};
 await expect(a.delivery.merge(a.job)).rejects.toThrow('Current-head checks');expect(reads).toBe(2);expect(a.calls.some(c=>c.includes('/merge --method PUT'))).toBe(false);expect(a.store.getEffect(a.job.mergeIntentId!)?.dispatchedAt).toBeFalsy();
});


test('known pending current-head checks remain provider wait then release the same accepted merge without another review',async()=>{
 const a=acceptedMergeResume(),prior=JSON.stringify(a.job.steps);a.setCheckConclusion('pending');
 await a.delivery.observe();expect(a.job).toMatchObject({stage:'merge',status:'watching'});expect(a.job.detail).toContain('Waiting for current GitHub check coverage');
 await a.delivery.observe();expect(a.job.status).toBe('watching');expect(a.run).not.toHaveBeenCalled();
 a.setCheckConclusion('success');await a.delivery.observe();expect(a.job).toMatchObject({stage:'merge',status:'queued'});expect(JSON.stringify(a.job.steps)).toBe(prior);expect(a.run).not.toHaveBeenCalled();expect(a.calls.some(c=>c.includes('/merge --method PUT'))).toBe(false);
});
test('a provider wait that becomes a failure stays denied rather than queuing source repair or repeating review',async()=>{
 const a=acceptedMergeResume();a.setCheckConclusion('pending');await a.delivery.observe();expect(a.job.status).toBe('watching');
 a.setCheckConclusion('failure');await a.delivery.observe();expect(a.job).toMatchObject({stage:'merge',status:'blocked'});expect(a.job.detail).toContain('Current-head checks have not all passed');expect(a.run).not.toHaveBeenCalled();expect(a.job.repairReason).toBeUndefined();expect(a.calls.some(c=>c.includes('/merge --method PUT'))).toBe(false);
});
test('merge-stage pending preflight is a reversible provider wait and preserves the prepared effect without sending it',async()=>{
 const a=acceptedMergeResume();await a.delivery.observe();a.setCheckConclusion('pending');await a.delivery.step(a.job);
 expect(a.job).toMatchObject({stage:'merge',status:'watching'});expect(a.calls.some(c=>c.includes('/merge --method PUT'))).toBe(false);expect(a.run).not.toHaveBeenCalled();
 a.setCheckConclusion('success');await a.delivery.observe();expect(a.job.status).toBe('queued');expect(a.run).not.toHaveBeenCalled();
});

function queuedWorkflowCoverage(a:ReturnType<typeof setup>){
 const repo=a.store.project.repository,pr=a.pr,original=a.delivery.api.bind(a.delivery);let appeared=false;
 const makeRun=(n:number)=>({id:100+n,workflow_id:50,run_number:n,run_attempt:1,check_suite_id:200+n,path:'.github/workflows/check.yml',event:'pull_request',head_branch:pr.head.ref,head_sha:head,created_at:`2026-10-28T14:0${n}:00Z`,status:n===3&&!appeared?'queued':'completed',conclusion:n===3&&!appeared?null:n===1?'cancelled':'success',repository:{id:1,full_name:repo},head_repository:{id:1,full_name:repo},pull_requests:[{number:700,id:70,head:{sha:head,ref:pr.head.ref,repo:{id:1}},base:{sha:pr.base.sha,ref:'main',repo:{id:1}}}]});
 const makeCheck=(n:number)=>({id:300+n,name:'check',app:{id:15368,slug:'github-actions'},head_sha:head,status:'completed',conclusion:n===1?'cancelled':'success',started_at:`2026-10-28T14:0${n}:01Z`,completed_at:`2026-10-28T14:0${n}:05Z`,details_url:`https://github.com/${repo}/actions/runs/${100+n}/job/${300+n}`,check_suite:{id:200+n}});
 a.delivery.api=async path=>{
  if(path.includes('/check-runs')){const check_runs=(appeared?[1,2,3]:[1,2]).map(makeCheck);return {total_count:check_runs.length,check_runs};}
  if(path.startsWith('actions/jobs/')){const n=Number(path.split('/').at(-1))-300,c=makeCheck(n);return{id:c.id,run_id:100+n,run_attempt:1,head_sha:head,name:c.name,html_url:c.details_url,check_run_url:`https://api.github.com/repos/${repo}/check-runs/${c.id}`,status:c.status,conclusion:c.conclusion,started_at:c.started_at,completed_at:c.completed_at};}
  if(path.startsWith('actions/runs/'))return makeRun(Number(path.split('/')[2])-100);
  if(path.startsWith('actions/workflows/'))return{total_count:3,workflow_runs:[3,2,1].map(makeRun)};
  if(path===`commits/${head}/status`)return{sha:head,state:'pending',total_count:0,statuses:[]};
  return original(path);
 };
 return()=>{appeared=true;};
}
test('positively bound newer queued workflow with no check row waits, then its actual check releases the retained merge',async()=>{
 const a=acceptedMergeResume(),appear=queuedWorkflowCoverage(a);
 const before=JSON.stringify(a.job.steps);await a.delivery.observe();expect(a.job).toMatchObject({stage:'merge',status:'watching'});expect(a.job.detail).toContain('matching check/job coverage');expect(a.run).not.toHaveBeenCalled();
 appear();await a.delivery.observe();expect(a.job).toMatchObject({stage:'merge',status:'queued'});expect(JSON.stringify(a.job.steps)).toBe(before);expect(a.run).not.toHaveBeenCalled();expect(a.calls.some(c=>c.includes('/merge --method PUT'))).toBe(false);
});

test('unready Lead step keeps watching queued workflow coverage and later observes its successful check',async()=>{
 const a=setup();Object.assign(a.job,{pr:700,prUrl:a.pr.html_url,head,stage:'lead-pr',worktree:a.result().worktree,branch:a.pr.head.ref});a.pr.draft=false;a.pr.base.sha='b'.repeat(40);
 a.store.state.coordination!.merges={enabled:true,authorizedAt:'human-existing'};const appear=queuedWorkflowCoverage(a);
 const result:StageResult={...a.result('review'),outcome:'blocked',summary:'Current checks are still running',blocker:'Waiting for current workflow coverage',resolution:{kind:'provider-wait',findingIds:['checks'],evidenceIds:['1']},findings:[{id:'checks',status:'open',summary:'Checks are running',actual:'Queued workflow',expected:'Matching passing checks',attempts:0}]};
 const run=vi.spyOn(a.engine.agents,'run').mockResolvedValue(result as any),repair=vi.spyOn(a.delivery,'queueConflictRepair');
 await a.delivery.step(a.job);expect(a.job).toMatchObject({stage:'lead-pr',status:'watching'});expect(run).toHaveBeenCalledTimes(1);expect(repair).not.toHaveBeenCalled();expect(a.job.repairReason).toBeUndefined();expect(a.job.mergeAttempt).toBeUndefined();
 const before=JSON.stringify(a.job.steps);appear();await a.delivery.observe();
 expect(a.job).toMatchObject({stage:'lead-pr',status:'queued'});expect(a.job.detail).toContain('current-head review');expect(JSON.stringify(a.job.steps)).toBe(before);expect(run).toHaveBeenCalledTimes(1);expect(repair).not.toHaveBeenCalled();expect(a.calls.some(c=>c.includes('/merge --method PUT'))).toBe(false);
});

test('non-wait check selection errors still block an unready Lead step',async()=>{
 const a=setup();Object.assign(a.job,{pr:700,prUrl:a.pr.html_url,head,stage:'lead-pr',worktree:a.result().worktree,branch:a.pr.head.ref});a.pr.draft=false;
 const original=a.delivery.api.bind(a.delivery);a.delivery.api=async path=>path.includes('/check-runs')?{total_count:1,check_runs:[]}:original(path);
 a.engine.agents.run=async()=>({...a.result('review'),outcome:'blocked'})as any;const repair=vi.spyOn(a.delivery,'queueConflictRepair');
 await a.delivery.step(a.job);expect(a.job).toMatchObject({stage:'lead-pr',status:'blocked'});expect(a.job.detail).toContain('Complete bounded check-run coverage required');expect(repair).not.toHaveBeenCalled();expect(a.calls.some(c=>c.includes('/merge --method PUT'))).toBe(false);
});

test('transient merged Actions read failure keeps watching without creating a human action',async()=>{
 const a=setup(),mergeCommit='c'.repeat(40);Object.assign(a.job,{pr:700,prUrl:a.pr.html_url,head,stage:'merge',status:'watching',mergeAttempt:{head,at:'2026-10-28T15:00:00Z'},mergeCommit});
 Object.assign(a.pr,{state:'closed',merged_at:'2026-10-28T15:00:00Z',merge_commit_sha:mergeCommit});
 const original=a.delivery.api.bind(a.delivery);a.delivery.api=async path=>{if(path.startsWith('actions/runs?'))throw new Error('Transient Actions read failure');return original(path);};
 const run=vi.spyOn(a.engine.agents,'run');await a.delivery.observe();
 expect(a.job).toMatchObject({stage:'merge',status:'watching',mergeCommit});expect(a.job.detail).toContain('PR observation unavailable');expect(a.job.detail).toContain('Transient Actions read failure');
 expect(projectOutbox(a.store.state).some(action=>action.ticket===a.job.key&&action.status==='open')).toBe(false);expect(a.store.state.outbox.some(action=>action.ticket===a.job.key&&action.status==='open')).toBe(false);expect(run).not.toHaveBeenCalled();expect(a.calls.some(c=>c.includes('/merge --method PUT'))).toBe(false);
});
