import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../../server/store/store';
import { projectById } from '../../../../server/office/projects';
import { coordination } from '../../../../server/scheduling/coordination';
import { GitHubDelivery } from '../../../../server/delivery/pipeline/github-delivery';
import { retireInactiveDeliveries, retireUnstartedDelivery } from '../../../../server/delivery/recovery/retire-unstarted-delivery';
import { ticketUpdates } from '../../../../src/work/TeamUpdates';
import { claimedDelivery, registerDeliveryFixture } from '../../../fixtures/delivery-claim';
import { workKey, type TicketJob } from '../../../../src/shared';

const stores: Store[] = [], roots: string[] = [];
afterEach(() => { stores.splice(0).forEach(s => s.close()); roots.splice(0).forEach(r => rmSync(r, { recursive: true, force: true })); });
function fixture() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-retire-delivery-')); roots.push(root);
    const store = new Store(':memory:', projectById('brain'), root); stores.push(store);
    store.state.coordination = coordination();
    const job: TicketJob = { id: 'mirror', key: 'GH-312', status: 'blocked', stage: 'prepare-pr',
        requestedAt: '', head: '', worktree: '', branch: 'codex/312-guidance', pr: 313,
        prUrl: 'https://github.com/JFusco/brain/pull/313', existingPR: true, steps: [],
        detail: 'Error: Issue is closed or no longer assigned to Joe; delivery stopped' };
    store.state.coordination.jobs = [job];
    const issue = { number: 312, html_url: 'https://github.com/JFusco/brain/issues/312', state: 'closed' };
    const pull = { number: 313, html_url: job.prUrl, state: 'closed', merged_at: '2026-11-03T22:25:40Z',
        merge_commit_sha: 'b'.repeat(40), head: { sha: 'a'.repeat(40) }, base: { ref: 'main', repo: { full_name: 'JFusco/brain' } } };
    const execute = vi.fn(async (_program: string, args: string[]) => {
        if (args[0] === 'pr') return JSON.stringify({ closingIssuesReferences: [{ url: issue.html_url }] });
        if (args[1].endsWith('/issues/312')) return JSON.stringify(issue);
        if (args[1].endsWith('/pulls/313')) return JSON.stringify(pull);
        throw new Error('Unexpected command');
    });
    const delivery = new GitHubDelivery(store, {} as any, execute as any);
    store.emit('fixture', 'Stale blocked queue record');
    return { store, job, issue, pull, delivery, execute };
}
test('closed issue retires an empty mirror, clears its outbox and removes its blocked team update', async () => {
    const a = fixture(), prior = structuredClone(a.job);
    expect(a.store.state.outbox.some(o => o.status === 'open')).toBe(true);
    expect(ticketUpdates(a.store.state)[0].status).toBe('blocked');
    await a.delivery.observe();
    expect(a.job.status).toBe('cancelled');
    expect(a.job.detail).toContain('GitHub issue is closed');
    expect(JSON.parse(a.job.steps[0].result.receipts[0].detail)).toMatchObject({ prior });
    expect(a.store.state.outbox.filter(o => o.status === 'open')).toEqual([]);
    expect(ticketUpdates(a.store.state)).toEqual([]);
    expect(a.execute).toHaveBeenCalledTimes(1);
    await a.delivery.observe();
    expect(a.execute).toHaveBeenCalledTimes(1);
    expect(a.store.state.coordination!.notices?.entries || []).toEqual([]);
});
test('an already merged linked PR retires its unstarted mirror even if the issue remains open', async () => {
    const a = fixture(); a.issue.state = 'open';
    expect(await retireUnstartedDelivery(a.delivery, a.job)).toBe(true);
    expect(a.job.detail).toContain('Linked PR #313 is merged');
    expect(a.execute.mock.calls.every(([, args]) => args[0] === 'pr' || args[0] === 'api' && !args.includes('-X'))).toBe(true);
});
test.each(['open', 'unmerged', 'wrong-issue', 'unlinked', 'read-failure', 'changed-during-read', 'paused'])(
    '%s source evidence preserves the original blocker', async scenario => {
        const a = fixture();
        if (scenario === 'open' || scenario === 'unmerged') { a.issue.state = 'open'; a.pull.state = 'open'; a.pull.merged_at = ''; }
        if (scenario === 'open') a.job.existingPR = false;
        if (scenario === 'wrong-issue') a.issue.number = 999;
        if (scenario === 'unlinked') {
            a.issue.state = 'open'; const original = a.execute.getMockImplementation()!;
            a.execute.mockImplementation(async (program, args) => args[0] === 'pr' ? JSON.stringify({ closingIssuesReferences: [] }) : original(program, args));
        }
        if (scenario === 'read-failure') a.execute.mockRejectedValue(new Error('HTTP 403'));
        if (scenario === 'changed-during-read') a.execute.mockImplementation(async () => { a.job.head = 'a'.repeat(40); return JSON.stringify(a.issue); });
        if (scenario === 'paused') a.store.state.paused = true;
        await retireInactiveDeliveries(a.delivery);
        expect(a.job.status).toBe('blocked');
        expect(a.job.steps).toEqual([]);
    });
test.each(['head', 'worktree', 'steps', 'worker', 'effect', 'claim', 'board', 'merge', 'continuation'])(
    'recorded %s keeps unfinished Office work available for reconciliation', async scenario => {
        const a = fixture();
        if (scenario === 'head') a.job.head = 'a'.repeat(40);
        if (scenario === 'worktree') a.job.worktree = '/preserved';
        if (scenario === 'steps') a.job.steps.push({ stage: 'prepare-pr', result: {} } as any);
        if (scenario === 'worker') a.store.state.workLog = [{ requestId: a.job.id, status: 'failed' }] as any;
        if (scenario === 'effect') a.store.db.prepare('INSERT INTO effects(id,work_key,status,body) VALUES(?,?,?,?)').run('effect', workKey({ projectId: 'brain', kind: 'delivery', id: a.job.id }), 'uncertain', '{}');
        if (scenario === 'claim') vi.spyOn(a.store, 'activeClaims').mockReturnValue([{ work: { id: a.job.id } }] as any);
        if (scenario === 'board') a.job.boardUpdates = [{ status: 'uncertain' }] as any;
        if (scenario === 'merge') a.job.mergeIntentId = 'original';
        if (scenario === 'continuation') a.job.implementationContinuation = {} as any;
        await retireInactiveDeliveries(a.delivery);
        expect(a.job.status).toBe('blocked');
        expect(a.execute).not.toHaveBeenCalled();
    });
test('a claimed stage retires a closed issue before starting a worker', async () => {
    const a = fixture();
    registerDeliveryFixture(a.store, a.job);
    await claimedDelivery(a.store, a.job, () => a.delivery.step(a.job));
    expect(a.job.status).toBe('cancelled');
    expect(a.execute).toHaveBeenCalledTimes(1);
});
