import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../../server/store/store';
import { projectById } from '../../../../server/office/projects';
import { coordination } from '../../../../server/scheduling/coordination';
import { GitHubDelivery } from '../../../../server/delivery/pipeline/github-delivery';
import { retireExternalDeliveries } from '../../../../server/delivery/recovery/retire-external-delivery';
import { settledExternalRepair } from '../../../../server/delivery/recovery/settled-external-repair';
import { workKey, type TicketJob } from '../../../../src/shared';
const stores: Store[] = [], roots: string[] = [];
afterEach(() => { stores.splice(0).forEach(s => s.close()); roots.splice(0).forEach(r => rmSync(r, { recursive: true, force: true })); });
function fixture() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-settled-repair-')); roots.push(root);
    const store = new Store(':memory:', projectById('cms-field-vocabulary'), root); stores.push(store); store.state.coordination = coordination();
    const job = { id: 'repair', key: 'GH-142', status: 'blocked', stage: 'update-base', repairReason: 'ci', existingPR: true,
        requestedAt: '', head: 'a'.repeat(40), worktree: '/retained/local-repair', branch: 'codex/142-repair', pr: 143,
        prUrl: 'https://github.com/JFusco/cms-field-vocabulary/pull/143', detail: 'Concurrent head changed', steps: [],
        ciRepairs: [{ phase: 'done' }], parked: { published: true, reason: 'Concurrent edit', stage: 'update-base', at: '' },
    } as unknown as TicketJob;
    store.state.coordination.jobs = [job];
    store.state.workLog = [{ requestId: job.id, stage: 'github-update-base', status: 'blocked', executionStatus: 'completed', endedAt: '2026-11-08T19:39:12Z' }] as any;
    return { store, job };
}
test('owner merge retires a finished local repair with a changed PR head, preserves worktree/history and sends no writes', async () => {
    const { store, job } = fixture(), calls: string[][] = [];
    const issue = { number: 142, html_url: 'https://github.com/JFusco/cms-field-vocabulary/issues/142', state: 'closed', state_reason: 'completed' };
    const pull = { number: 143, html_url: job.prUrl, state: 'closed', merged_at: '2026-11-08T19:57:45Z', merged_by: { login: 'JFusco' }, merge_commit_sha: 'c'.repeat(40), head: { sha: 'b'.repeat(40), ref: job.branch }, base: { ref: 'main', repo: { full_name: store.project.repository } } };
    const execute: any = async (_program: string, args: string[]) => {
        calls.push(args);
        if (args[0] === 'pr') return JSON.stringify({ closingIssuesReferences: [{ url: issue.html_url }] });
        if (args[1].endsWith('/issues/142')) return JSON.stringify(issue);
        if (args[1].endsWith('/pulls/143')) return JSON.stringify(pull);
        throw new Error('Unexpected command');
    };
    await retireExternalDeliveries(new GitHubDelivery(store, {} as any, execute));
    expect(job.status).toBe('cancelled'); expect(job.worktree).toBe('/retained/local-repair'); expect(job.head).toBe('a'.repeat(40));
    expect(job.detail).toContain('local repair worktree'); expect(job.detail).toContain('not claimed');
    expect(calls.every(args => args[0] === 'pr' || args[0] === 'api' && !args.includes('-X'))).toBe(true);
    expect(JSON.parse(job.steps[0].result.receipts[0].detail).prior.worktree).toBe(job.worktree);
});
test.each(['worker', 'failed-worker', 'execution', 'effect', 'receipt', 'claim', 'request', 'board', 'repair', 'paused', 'merge', 'other-stage'])(
    '%s uncertainty prevents retirement eligibility', scenario => {
        const { store, job } = fixture();
        if (scenario === 'worker') store.state.workLog![0].status = 'running';
        if (scenario === 'failed-worker') store.state.workLog![0].status = 'failed';
        if (scenario === 'execution') store.state.workLog![0].executionStatus = undefined;
        if (scenario === 'effect') store.db.prepare('INSERT INTO effects(id,work_key,status,body) VALUES(?,?,?,?)').run('e', workKey({ projectId: store.project.id, kind: 'delivery', id: job.id }), 'uncertain', '{}');
        if (scenario === 'receipt') job.steps.push({ result: { receipts: [{ verified: false, uncertain: true }] } } as any);
        if (scenario === 'claim') store.claimWork({ projectId: store.project.id, kind: 'delivery', id: job.id }, 'owner', 'update-base');
        if (scenario === 'request') store.state.coordination!.requests = [{ key: job.key, status: 'queued' }] as any;
        if (scenario === 'board') job.boardUpdates = [{ status: 'uncertain' }] as any;
        if (scenario === 'repair') job.ciRepairs![0].phase = 'apply';
        if (scenario === 'paused') store.state.paused = true;
        if (scenario === 'merge') job.mergeIntentId = 'pending';
        if (scenario === 'other-stage') job.stage = 'implement';
        expect(settledExternalRepair(store, job)).toBe(false);
    });
