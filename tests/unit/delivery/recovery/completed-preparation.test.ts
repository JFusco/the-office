import { afterEach, expect, test, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../../server/store/store';
import { projectById } from '../../../../server/office/projects';
import { coordination } from '../../../../server/scheduling/coordination';
import { GitHubDelivery } from '../../../../server/delivery/pipeline/github-delivery';
import { completedPreparation, ownerMergedWorkFinished } from '../../../../server/delivery/recovery/completed-preparation';
import { completedPRReviews } from '../../../../server/delivery/recovery/completed-pr-review';
import { workKey, type TicketJob, type WorkTime } from '../../../../src/shared';

const stores: Store[] = [], roots: string[] = [];
afterEach(() => { stores.splice(0).forEach(s => s.close()); roots.splice(0).forEach(r => rmSync(r, { recursive: true, force: true })); });
/** A handoff the owner merged seconds after the Office queued it: one preparation worker ran to its end and wrote nothing. */
function fixture() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-owner-merged-')); roots.push(root);
    const store = new Store(':memory:', projectById('brain'), root); stores.push(store);
    store.state.coordination = coordination();
    const head = 'a'.repeat(40);
    const job = { id: 'handoff', key: 'GH-429', status: 'blocked', stage: 'prepare-pr', requestedAt: '2026-11-22T20:10:00Z',
        head, worktree: '', branch: 'codex/429-correction-loop', pr: 430, prUrl: 'https://github.com/JFusco/brain/pull/430', existingPR: true,
        detail: 'Error: Prepared PR state or exact head is unverified',
        steps: [{ stage: 'prepare-pr', result: { outcome: 'passed', summary: 'Already merged; no write.', commit: head, receipts: [], evidence: [], findings: [],
            previewUrl: '', worktree: '', branch: 'codex/429-correction-loop', prId: 430, qaRunDir: '', paidRuns: 0, blocker: '' } }] } as unknown as TicketJob;
    store.state.coordination.jobs = [job];
    const work = { id: 'preparation', requestId: job.id, claimId: 'claim', role: 'lead', stage: 'github-prepare-pr', provider: 'codex', sessionId: 'thread',
        status: 'completed', executionStatus: 'completed', endedAt: '2026-11-22T20:13:03Z' } as unknown as WorkTime;
    store.state.workLog = [work];
    const directory = resolve(root, 'sessions', work.id); mkdirSync(directory, { recursive: true });
    const files: Record<string, unknown> = {
        'assignment.json': { id: work.id, claimId: work.claimId, work: { projectId: store.project.id, kind: 'delivery', id: job.id }, stage: work.stage, role: 'lead', profile: 'github-native' },
        'provider.json': { project: store.project.id, repository: store.project.repository, role: 'lead', provider: 'codex', readOnly: false },
        'result.json': { result: { outcome: 'passed' } },
    };
    const save = () => {
        for (const [name, value] of Object.entries(files)) writeFileSync(resolve(directory, name), JSON.stringify(value));
        writeFileSync(resolve(directory, 'execution-completion.json'), JSON.stringify({ workerId: work.id, session: work.sessionId, provider: work.provider,
            resultSha256: createHash('sha256').update(JSON.stringify(files['result.json'])).digest('hex'), ...completion }));
    };
    const completion: Record<string, unknown> = {};
    save();
    const issue = { number: 429, html_url: 'https://github.com/JFusco/brain/issues/429', state: 'closed', state_reason: 'completed' };
    const pull = { number: 430, html_url: job.prUrl, state: 'closed', merged_at: '2026-11-22T20:10:14Z', merged_by: { login: 'JFusco' },
        merge_commit_sha: 'b'.repeat(40), head: { sha: head, ref: job.branch }, base: { ref: store.project.target, repo: { full_name: store.project.repository } } };
    const execute = vi.fn(async (_program: string, args: string[]) => {
        if (args[0] === 'pr') return JSON.stringify({ closingIssuesReferences: [{ url: issue.html_url }] });
        if (args[1].endsWith('/issues/429')) return JSON.stringify(issue);
        if (args[1].endsWith('/pulls/430')) return JSON.stringify(pull);
        throw new Error('Unexpected command');
    });
    const delivery = new GitHubDelivery(store, {} as never, execute as never);
    store.emit('fixture', 'Stale handoff');
    return { store, job, work, files, completion, save, directory, issue, pull, execute, delivery };
}

test('a preparation that ran to its end is finished work, though it is not a read-only review', () => {
    const a = fixture();
    expect(completedPRReviews(a.store, a.job)).toBe(false);
    expect(completedPreparation(a.store, a.job, a.work)).toBe(true);
    expect(ownerMergedWorkFinished(a.store, a.job)).toBe(true);
});

test('a PR the owner merged while preparation ran is settled: the handoff retires and its read-back leaves the outbox, with no write', async () => {
    const a = fixture(), prior = structuredClone(a.job);
    expect(a.store.state.outbox.filter(item => item.status === 'open')).toHaveLength(1);
    await a.delivery.observe();
    expect(a.job.status).toBe('cancelled');
    expect(a.job.detail).toContain('merged by JFusco');
    expect(a.job.detail).toContain('Office review and closeout completion are not claimed');
    expect(a.job.steps[0]).toEqual(prior.steps[0]);
    expect(a.job.steps[1].stage).toBe('external-delivery-readback');
    expect(a.store.state.outbox.filter(item => item.status === 'open')).toEqual([]);
    expect(a.execute.mock.calls.every(([, args]) => args[0] === 'pr' || args[0] === 'api' && !args.includes('-X'))).toBe(true);
});

test('the same PR merged by someone else still needs read-only reviews only, and stays blocked', async () => {
    const a = fixture();
    a.pull.merged_by = { login: 'someone-else' };
    await a.delivery.observe();
    expect(a.job.status).toBe('blocked');
    expect(a.store.state.outbox.filter(item => item.status === 'open')).toHaveLength(1);
});

test.each<[string, (a: ReturnType<typeof fixture>) => void]>([
    ['the worker failed', a => { a.work.status = 'failed'; }],
    ['the worker is still running', a => { a.work.status = 'running'; a.work.endedAt = ''; }],
    ['its execution did not complete', a => { a.work.executionStatus = 'failed' as never; }],
    ['it has no claim', a => { a.work.claimId = ''; }],
    ['it has no native session', a => { a.work.sessionId = ''; }],
    ['it is another stage', a => { a.work.stage = 'github-implement'; }],
    ['it left an error record', a => { writeFileSync(resolve(a.directory, 'error.json'), '{}'); }],
    ['its completion proof is missing', a => { rmSync(resolve(a.directory, 'execution-completion.json')); }],
    ['its completion proof names another result', a => { a.completion.resultSha256 = 'c'.repeat(64); a.save(); }],
    ['its completion proof names another worker', a => { a.completion.workerId = 'other'; a.save(); }],
    ['its assignment is for another job', a => { (a.files['assignment.json'] as { work: { id: string } }).work.id = 'other'; a.save(); }],
    ['its assignment is for another claim', a => { (a.files['assignment.json'] as { claimId: string }).claimId = 'other'; a.save(); }],
    ['its provider record is for another repository', a => { (a.files['provider.json'] as { repository: string }).repository = 'JFusco/other'; a.save(); }],
    ['its assignment cannot be read', a => { rmSync(resolve(a.directory, 'assignment.json')); }],
    ['another worker on the job did not finish', a => { a.store.state.workLog!.push({ ...a.work, id: 'second', status: 'failed' }); }],
])('the handoff is held when %s', async (_name, change) => {
    const a = fixture();
    change(a);
    expect(ownerMergedWorkFinished(a.store, a.job)).toBe(false);
    await a.delivery.observe();
    expect(a.job.status).toBe('blocked');
    expect(a.execute).not.toHaveBeenCalled();
});

test.each<[string, (a: ReturnType<typeof fixture>) => void]>([
    ['the step recorded a write', a => { a.job.steps[0].result.receipts = [{ id: 'w', action: 'edit PR body', target: '', verified: true, uncertain: false, detail: '' }] as never; }],
    ['the step recorded an uncertain read', a => { a.job.steps[0].result.receipts = [{ id: 'r', action: 'read PR', target: '', verified: true, uncertain: true, detail: '' }] as never; }],
    ['an effect of the job is not verified', a => { a.store.db.prepare('INSERT INTO effects(id,work_key,status,body) VALUES(?,?,?,?)').run('effect', workKey({ projectId: a.store.project.id, kind: 'delivery', id: a.job.id }), 'uncertain', '{}'); }],
    ['the job has a worktree', a => { a.job.worktree = '/preserved'; }],
    ['the project is paused', a => { a.store.state.paused = true; }],
])('a completed preparation does not lift the rule\'s other conditions: %s', async (_name, change) => {
    const a = fixture();
    change(a);
    await a.delivery.observe();
    expect(a.job.status).toBe('blocked');
});
