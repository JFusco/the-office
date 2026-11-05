import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../../server/store/store';
import { projectById } from '../../../../server/office/projects';
import { coordination } from '../../../../server/scheduling/coordination';
import { GitHubDelivery } from '../../../../server/delivery/pipeline/github-delivery';
import { retireExternalDeliveries } from '../../../../server/delivery/recovery/retire-external-delivery';
import { completedPRReviews } from '../../../../server/delivery/recovery/completed-pr-review';
import { pmQueueItems } from '../../../../src/work/pm-queue';
import { workKey } from '../../../../src/shared';

const stores: Store[] = [], roots: string[] = [];
afterEach(() => { stores.splice(0).forEach(s => s.close()); roots.splice(0).forEach(r => rmSync(r, { recursive: true, force: true })); });
function fixture() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-completed-review-')); roots.push(root);
    const store = new Store(':memory:', projectById('cms-field-vocabulary'), root); stores.push(store);
    store.state.coordination = coordination();
    const job = { id: 'handoff', key: 'GH-131', status: 'blocked', stage: 'lead-pr', requestedAt: '',
        existingPR: true, head: 'a'.repeat(40), branch: 'codex/131-renovate', worktree: '', pr: 133,
        prUrl: 'https://github.com/JFusco/cms-field-vocabulary/pull/133', detail: 'Reconcile completed maintainer merge',
        boardUpdates: [{ status: 'verified', stage: 'lead-pr', head: 'a'.repeat(40), target: 'In review' }],
        steps: [{ stage: 'lead-pr', result: { outcome: 'blocked', findings: [{ id: 'review-note', status: 'open' }], receipts: [] } }] } as any;
    store.state.coordination.jobs = [job];
    const work = { id: 'reader', requestId: job.id, claimId: 'original-claim', role: 'lead', stage: 'github-lead-pr',
        status: 'blocked', executionStatus: 'completed', endedAt: '2026-11-04T14:36:05Z' } as any;
    store.state.workLog = [work];
    const directory = resolve(root, 'sessions', work.id); mkdirSync(directory, { recursive: true });
    const assignment = { id: work.id, claimId: work.claimId, work: { projectId: store.project.id, kind: 'delivery', id: job.id }, stage: work.stage, role: 'lead', profile: 'reader' };
    const provider = { project: store.project.id, repository: store.project.repository, role: 'lead', readOnly: true };
    const capabilities = { name: 'reader', readOnly: true };
    const save = () => { for (const [name, value] of Object.entries({ assignment, provider, capabilities })) writeFileSync(resolve(directory, `${name}.json`), JSON.stringify(value)); };
    save();
    const issue = { number: 131, html_url: 'https://github.com/JFusco/cms-field-vocabulary/issues/131', state: 'closed', state_reason: 'completed' };
    const pull = { number: 133, html_url: job.prUrl, state: 'closed', merged_at: '2026-11-04T14:33:55Z', merge_commit_sha: 'b'.repeat(40), head: { sha: job.head, ref: job.branch }, base: { ref: 'main', repo: { full_name: store.project.repository } } };
    const execute = vi.fn(async (_program: string, args: string[]) => {
        if (args[0] === 'pr') return JSON.stringify({ closingIssuesReferences: [{ url: issue.html_url }] });
        if (args[1].endsWith('/issues/131')) return JSON.stringify(issue);
        if (args[1].endsWith('/pulls/133')) return JSON.stringify(pull);
        throw new Error('Unexpected command');
    });
    const delivery = new GitHubDelivery(store, {} as any, execute as any);
    store.emit('fixture', 'External merge during completed reader');
    return { store, job, work, assignment, provider, capabilities, save, execute, delivery };
}
test('a terminated verified reader and settled review lane retire after exact external completion; findings and worker history survive', async () => {
    const a = fixture(), original = structuredClone(a.job.steps), worker = structuredClone(a.work);
    expect(completedPRReviews(a.store, a.job)).toBe(true);
    await retireExternalDeliveries(a.delivery);
    expect(a.job.status).toBe('cancelled');
    expect(a.job.steps.slice(0, original.length)).toEqual(original);
    expect(a.work).toEqual(worker);
    expect(a.store.state.outbox.filter(a => a.status === 'open')).toEqual([]);
    expect(pmQueueItems({ ...a.store.state, teamQueue: [{ project: a.store.project.id, projectName: a.store.project.name, job: a.job }] })).toEqual([]);
    expect(a.execute).toHaveBeenCalledTimes(3);
    expect(a.execute.mock.calls.every(([, args]) => args[0] === 'pr' || args[0] === 'api' && !args.includes('-X'))).toBe(true);
});
test.each(['running', 'unterminated', 'writer', 'wrong-work', 'wrong-claim', 'wrong-project', 'wrong-profile', 'missing-evidence', 'uncertain-board', 'effect', 'active-claim'])(
    '%s cannot retire a potentially unfinished handoff', async scenario => {
        const a = fixture();
        if (scenario === 'running') a.work.status = 'running';
        if (scenario === 'unterminated') a.work.executionStatus = 'unknown';
        if (scenario === 'writer') a.provider.readOnly = false;
        if (scenario === 'wrong-work') a.assignment.work.id = 'different';
        if (scenario === 'wrong-claim') a.assignment.claimId = 'different';
        if (scenario === 'wrong-project') a.assignment.work.projectId = 'brain';
        if (scenario === 'wrong-profile') a.capabilities.name = 'github-native';
        if (scenario === 'uncertain-board') a.job.boardUpdates[0].status = 'uncertain';
        if (scenario === 'effect') a.store.db.prepare('INSERT INTO effects(id,work_key,status,body) VALUES(?,?,?,?)').run('effect', workKey({ projectId: a.store.project.id, kind: 'delivery', id: a.job.id }), 'uncertain', '{}');
        if (scenario === 'active-claim') vi.spyOn(a.store, 'activeClaims').mockReturnValue([{ work: { id: a.job.id } }] as any);
        a.save();
        if (scenario === 'missing-evidence') rmSync(resolve(a.store.dataRoot, 'sessions', a.work.id, 'assignment.json'));
        await retireExternalDeliveries(a.delivery);
        expect(a.job.status).toBe('blocked');
        expect(a.execute).not.toHaveBeenCalled();
    });
