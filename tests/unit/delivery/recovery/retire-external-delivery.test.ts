import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../../server/store/store';
import { projectById } from '../../../../server/office/projects';
import { coordination } from '../../../../server/scheduling/coordination';
import { GitHubDelivery } from '../../../../server/delivery/pipeline/github-delivery';
import { pmQueueItems } from '../../../../src/work/pm-queue';
import { workKey, type TicketJob } from '../../../../src/shared';

const stores: Store[] = [], roots: string[] = [];
afterEach(() => { stores.splice(0).forEach(s => s.close()); roots.splice(0).forEach(r => rmSync(r, { recursive: true, force: true })); });
function fixture() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-external-delivery-')); roots.push(root);
    const store = new Store(':memory:', projectById('cms-field-vocabulary'), root); stores.push(store);
    store.state.coordination = coordination();
    const job: TicketJob = { id: 'external', key: 'GH-126', status: 'blocked', stage: 'lead-pr',
        requestedAt: '', head: 'a'.repeat(40), worktree: '', branch: 'codex/126-notify', pr: 127,
        prUrl: 'https://github.com/JFusco/cms-field-vocabulary/pull/127', existingPR: true,
        detail: 'Error: Issue has no existing card on its configured board; no card was created',
        steps: [{ stage: 'prepare-pr', result: { outcome: 'passed', summary: 'Already ready; no write.',
            commit: 'a'.repeat(40), receipts: [], evidence: [], findings: [], previewUrl: '', worktree: '',
            branch: 'codex/126-notify', prId: 127, qaRunDir: '', paidRuns: 0, blocker: '' } }] };
    store.state.coordination.jobs = [job];
    const issue = { number: 126, html_url: 'https://github.com/JFusco/cms-field-vocabulary/issues/126', state: 'closed', state_reason: 'completed' };
    const pull = { number: 127, html_url: job.prUrl, state: 'closed', merged_at: '2026-11-03T14:06:19Z',
        merge_commit_sha: 'b'.repeat(40), head: { sha: job.head, ref: job.branch },
        base: { ref: 'main', repo: { full_name: store.project.repository } } };
    const execute = vi.fn(async (_program: string, args: string[]) => {
        if (args[0] === 'pr') return JSON.stringify({ closingIssuesReferences: [{ url: issue.html_url }] });
        if (args[1].endsWith('/issues/126')) return JSON.stringify(issue);
        if (args[1].endsWith('/pulls/127')) return JSON.stringify(pull);
        throw new Error('Unexpected command');
    });
    const delivery = new GitHubDelivery(store, {} as any, execute as any);
    store.emit('fixture', 'Stale handoff');
    return { store, job, issue, pull, execute, delivery };
}
test('polling retires externally completed metadata handoff and resolves its PM/outbox entry without writes', async () => {
    const a = fixture(), prior = structuredClone(a.job);
    expect(a.store.state.outbox.filter(o => o.status === 'open')).toHaveLength(1);
    await a.delivery.observe();
    expect(a.job.status).toBe('cancelled');
    expect(a.job.steps[0]).toEqual(prior.steps[0]);
    expect(JSON.parse(a.job.steps[1].result.receipts[0].detail)).toMatchObject({ prior, issue: a.issue, pull: a.pull });
    expect(a.store.state.outbox.filter(o => o.status === 'open')).toEqual([]);
    expect(pmQueueItems({ ...a.store.state, teamQueue: [{ project: a.store.project.id, projectName: a.store.project.name, job: a.job }] })).toEqual([]);
    expect(a.store.state.coordination!.notices?.entries || []).toEqual([]);
    expect(a.execute).toHaveBeenCalledTimes(3);
    expect(a.execute.mock.calls.every(([, args]) => args[0] === 'pr' || args[0] === 'api' && !args.includes('-X'))).toBe(true);
    await a.delivery.observe();
    expect(a.execute).toHaveBeenCalledTimes(3);
});
test('a park that never reached the board does not stop retirement', async () => {
    const a = fixture();
    a.job.parked = { stage: 'lead-pr', reason: 'PR #127 is already merged', at: '2026-11-05T23:33:56.097Z', published: false };
    a.job.detail = 'Error: Issue card is in "done", a human lane; the harness will not move it to Block';
    await a.delivery.observe();
    expect(a.job.status).toBe('cancelled');
    expect(a.job.parked).toBeUndefined();
    expect(a.store.state.outbox.filter(o => o.status === 'open')).toEqual([]);
});
test('a published park is a human decision and is retained', async () => {
    const a = fixture();
    a.job.parked = { stage: 'lead-pr', reason: 'Decision needed', at: '2026-11-05T23:33:56.097Z', published: true };
    await a.delivery.observe();
    expect(a.job.status).toBe('blocked');
});
test('a PR merged by the owner settles the handoff despite a failed park, recorded effects and a moved head', async () => {
    const a = fixture();
    (a.pull as any).merged_by = { login: 'JFusco' };
    a.pull.head.sha = 'c'.repeat(40);
    a.job.parked = { stage: 'lead-pr', reason: 'PR #127 is already merged', at: '2026-11-05T23:33:56.097Z', published: false };
    a.job.detail = 'Error: Issue card is in "done", a human lane; the harness will not move it to Block';
    a.store.db.prepare('INSERT INTO effects (id, work_key, status, body) VALUES (?, ?, ?, ?)').run(
        `harness:${a.job.id}:park-comment:1`, workKey({ projectId: a.store.project.id, kind: 'delivery', id: a.job.id }), 'verified', '{}');
    await a.delivery.observe();
    expect(a.job.status).toBe('cancelled');
    expect(a.job.parked).toBeUndefined();
    expect(a.job.detail).toContain('merged by JFusco');
    expect(a.store.state.outbox.filter(o => o.status === 'open')).toEqual([]);
});
test('a PR merged by someone else still needs the strict external read-back', async () => {
    const a = fixture();
    (a.pull as any).merged_by = { login: 'someone-else' };
    a.job.parked = { stage: 'lead-pr', reason: 'Decision needed', at: '2026-11-05T23:33:56.097Z', published: true };
    await a.delivery.observe();
    expect(a.job.status).toBe('blocked');
});
test.each(['open', 'not-planned', 'wrong-issue', 'unmerged', 'wrong-pr', 'changed-head', 'wrong-target', 'unlinked', 'read-failure', 'race', 'claim-race'])(
    '%s evidence cannot retire the original handoff', async scenario => {
        const a = fixture();
        if (scenario === 'open') a.issue.state = 'open';
        if (scenario === 'not-planned') a.issue.state_reason = 'not_planned';
        if (scenario === 'wrong-issue') a.issue.number = 999;
        if (scenario === 'unmerged') a.pull.merged_at = '';
        if (scenario === 'wrong-pr') a.pull.number = 999;
        if (scenario === 'changed-head') a.pull.head.sha = 'c'.repeat(40);
        if (scenario === 'wrong-target') a.pull.base.ref = 'other';
        if (scenario === 'read-failure') a.execute.mockRejectedValue(new Error('HTTP 403'));
        if (['unlinked', 'race', 'claim-race'].includes(scenario)) {
            const original = a.execute.getMockImplementation()!;
            a.execute.mockImplementation(async (program, args) => {
                if (args[0] === 'pr') {
                    if (scenario === 'unlinked') return JSON.stringify({ closingIssuesReferences: [] });
                    if (scenario === 'race') a.job.head = 'c'.repeat(40);
                    if (scenario === 'claim-race') vi.spyOn(a.store, 'activeClaims').mockReturnValue([{ work: { id: a.job.id } }] as any);
                }
                return original(program, args);
            });
        }
        await a.delivery.observe();
        expect(a.job.status).toBe('blocked');
        expect(a.job.steps).toHaveLength(1);
        expect(a.store.state.outbox.filter(o => o.status === 'open')).toHaveLength(1);
    });
test.each(['paused', 'worktree', 'worker', 'effect', 'claim', 'board', 'merge', 'continuation', 'write-receipt', 'uncertain-read', 'implementation'])(
    '%s preserves owned or uncertain work without provider reads', async scenario => {
        const a = fixture();
        if (scenario === 'paused') a.store.state.paused = true;
        if (scenario === 'worktree') a.job.worktree = '/preserved';
        if (scenario === 'worker') a.store.state.workLog = [{ requestId: a.job.id, status: 'failed' }] as any;
        if (scenario === 'effect') a.store.db.prepare('INSERT INTO effects(id,work_key,status,body) VALUES(?,?,?,?)').run('effect', workKey({ projectId: a.store.project.id, kind: 'delivery', id: a.job.id }), 'uncertain', '{}');
        if (scenario === 'claim') vi.spyOn(a.store, 'activeClaims').mockReturnValue([{ work: { id: a.job.id } }] as any);
        if (scenario === 'board') a.job.boardUpdates = [{ status: 'uncertain' }] as any;
        if (scenario === 'merge') a.job.mergeIntentId = 'original';
        if (scenario === 'continuation') a.job.implementationContinuation = {} as any;
        if (scenario === 'write-receipt' || scenario === 'uncertain-read') a.job.steps[0].result.receipts = [{ action: scenario === 'write-receipt' ? 'promote PR' : 'read PR', verified: true, uncertain: scenario === 'uncertain-read' }] as any;
        if (scenario === 'implementation') a.job.steps[0].stage = 'implement';
        await a.delivery.observe();
        expect(a.job.status).toBe('blocked');
        expect(a.execute).not.toHaveBeenCalled();
    });
