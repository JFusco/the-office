import { afterEach, expect, test, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../../server/store/store';
import { projectById } from '../../../../server/office/projects';
import { coordination } from '../../../../server/scheduling/coordination';
import { GitHubDelivery } from '../../../../server/delivery/pipeline/github-delivery';
import { completedPreparation } from '../../../../server/delivery/recovery/completed-preparation';
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
    // No process has this group id, so the worker's group reads as gone.
    const work = { id: 'preparation', requestId: job.id, ticket: job.key, claimId: 'claim', role: 'lead', stage: 'github-prepare-pr', provider: 'codex', sessionId: 'thread',
        status: 'completed', executionStatus: 'completed', startedAt: '2026-11-22T20:10:17Z', endedAt: '2026-11-22T20:13:03Z', processId: 999999 } as unknown as WorkTime;
    store.state.workLog = [work];
    const directory = resolve(root, 'sessions', work.id); mkdirSync(directory, { recursive: true });
    const claim = { id: work.claimId as string, work: { projectId: store.project.id, kind: 'delivery', id: job.id }, owner: 'scheduler', stage: 'prepare-pr', lane: 'delivery', status: 'completed', claimedAt: '2026-11-22T20:10:03Z', endedAt: '2026-11-22T20:13:08Z' };
    store.db.prepare('INSERT INTO work_claims VALUES(?,?,?,?)').run(claim.id, workKey(claim.work as never), claim.status, JSON.stringify(claim));
    const files: Record<string, any> = {
        'assignment.json': { id: work.id, claimId: work.claimId, lane: 'delivery', work: { projectId: store.project.id, kind: 'delivery', id: job.id }, stage: work.stage, role: 'lead', profile: 'github-native',
            scope: { repository: store.project.repository, worktree: store.project.repo, artifacts: directory } },
        'assignment-identity.json': { attemptId: work.id, requestId: job.id, projectId: store.project.id, repository: store.project.repository, role: 'lead', threadId: work.sessionId },
        'capabilities.json': { name: 'github-native', readOnly: false },
        'provider.json': { project: store.project.id, repository: store.project.repository, role: 'lead', provider: 'codex', readOnly: false },
        'result.json': { session: work.sessionId, provider: 'codex', result: { outcome: 'passed', summary: 'Already merged; no write.', commit: head, prId: 430, receipts: [], findings: [], evidence: [] } },
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
    return { store, job, work, claim, files, completion, save, directory, issue, pull, execute, delivery };
}

test('a preparation that ran to its end is finished work, though it is not a read-only review', () => {
    const a = fixture();
    expect(completedPRReviews(a.store, a.job)).toBe(false);
    expect(completedPreparation(a.store, a.job, a.work)).toBe(true);
    expect(completedPreparation(a.store, a.job, a.work, () => true)).toBe(false);
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

const receipt = (action: string, extra: Record<string, unknown> = {}) => ({ id: 'r', action, target: 'https://github.com/JFusco/brain/pull/430', verified: true, uncertain: false, detail: '', ...extra });
const reclaim = (a: ReturnType<typeof fixture>, change: (claim: any) => void) => { const claim = structuredClone(a.claim); change(claim); a.store.db.prepare('UPDATE work_claims SET status=?,body=? WHERE id=?').run(claim.status, JSON.stringify(claim), a.claim.id); };
test.each<[string, (a: ReturnType<typeof fixture>) => void]>([
    ['the worker failed', a => { a.work.status = 'failed'; }],
    ['the worker is still running', a => { a.work.status = 'running'; a.work.endedAt = ''; }],
    ['its execution did not complete', a => { a.work.executionStatus = 'failed' as never; }],
    ['it has no claim', a => { a.work.claimId = ''; }],
    ['it has no native session', a => { a.work.sessionId = ''; }],
    ['it has no process group on record', a => { delete a.work.processId; }],
    ['it worked another ticket', a => { a.work.ticket = 'GH-1'; }],
    ['it is another stage', a => { a.work.stage = 'github-implement'; }],
    ['another worker shares its native session', a => { a.store.state.workLog!.push({ ...a.work, id: 'twin', requestId: 'other-job' }); }],
    ['it left an error record', a => { writeFileSync(resolve(a.directory, 'error.json'), '{}'); }],
    ['its completion proof is missing', a => { rmSync(resolve(a.directory, 'execution-completion.json')); }],
    ['its completion proof names another result', a => { a.completion.resultSha256 = 'c'.repeat(64); a.save(); }],
    ['its completion proof names another worker', a => { a.completion.workerId = 'other'; a.save(); }],
    ['its assignment is for another job', a => { a.files['assignment.json'].work.id = 'other'; a.save(); }],
    ['its assignment is for another claim', a => { a.files['assignment.json'].claimId = 'other'; a.save(); }],
    ['its assignment is on another lane', a => { a.files['assignment.json'].lane = 'operations'; a.save(); }],
    ['its assignment kept its files elsewhere', a => { a.files['assignment.json'].scope.artifacts = '/elsewhere'; a.save(); }],
    ['its profile is not the one its capabilities name', a => { a.files['capabilities.json'].name = 'reader'; a.save(); }],
    ['its provider record is for another repository', a => { a.files['provider.json'].repository = 'JFusco/other'; a.save(); }],
    ['its provider record is for another provider', a => { a.files['provider.json'].provider = 'claude'; a.save(); }],
    ['its identity record is for another thread', a => { a.files['assignment-identity.json'].threadId = 'other'; a.save(); }],
    ['its identity record is missing', a => { rmSync(resolve(a.directory, 'assignment-identity.json')); }],
    ['its assignment cannot be read', a => { rmSync(resolve(a.directory, 'assignment.json')); }],
    ['its claim is still running', a => reclaim(a, claim => { claim.status = 'running'; claim.endedAt = ''; })],
    ['its claim was for another stage', a => reclaim(a, claim => { claim.stage = 'lead-pr'; })],
    ['its claim was for another job', a => reclaim(a, claim => { claim.work.id = 'other'; })],
    ['its claim is gone', a => { a.store.db.prepare('DELETE FROM work_claims WHERE id=?').run(a.claim.id); }],
    ['its saved result did not pass', a => { a.files['result.json'].result.outcome = 'blocked'; a.save(); }],
    ['its saved result is for another head', a => { a.files['result.json'].result.commit = 'd'.repeat(40); a.save(); }],
    ['its saved result is for another pull request', a => { a.files['result.json'].result.prId = 431; a.save(); }],
    ['its saved result records a write', a => { a.files['result.json'].result.receipts = [receipt('mark PR ready for review')]; a.save(); }],
    ['its saved result records an uncertain read', a => { a.files['result.json'].result.receipts = [receipt('read PR', { uncertain: true })]; a.save(); }],
    ['its saved result records an unverified read', a => { a.files['result.json'].result.receipts = [receipt('read PR', { verified: false })]; a.save(); }],
    ['its saved result has no receipt list', a => { delete a.files['result.json'].result.receipts; a.save(); }],
    ['another worker on the job did not finish', a => { a.store.state.workLog!.push({ ...a.work, id: 'second', sessionId: 'second-thread', status: 'failed' }); }],
])('the handoff is held when %s', async (_name, change) => {
    const a = fixture();
    change(a);
    expect(a.store.state.workLog!.filter(work => work.requestId === a.job.id).every(work => completedPreparation(a.store, a.job, work))).toBe(false);
    await a.delivery.observe();
    expect(a.job.status).toBe('blocked');
    expect(a.execute).not.toHaveBeenCalled();
});

test.each<[string, (a: ReturnType<typeof fixture>) => void]>([
    ['acceptance refused before it recorded the step', a => { a.job.steps = []; }],
    ['the saved result records verified reads', a => { a.files['result.json'].result.receipts = [receipt('read PR'), receipt('Inspect checks'), receipt('query dependents')]; a.save(); }],
])('the handoff still retires when %s', async (_name, change) => {
    const a = fixture();
    change(a);
    await a.delivery.observe();
    expect(a.job.status).toBe('cancelled');
});

test('acceptance refused before recording the step, and the saved result records a write: the handoff is held', async () => {
    const a = fixture();
    a.job.steps = [];
    a.files['result.json'].result.receipts = [receipt('retarget dependent PR')]; a.save();
    await a.delivery.observe();
    expect(a.job.status).toBe('blocked');
});

test('a completed read-only review beside a completed preparation does not hold the handoff', async () => {
    const a = fixture();
    const review = { id: 'reader', requestId: a.job.id, claimId: 'review-claim', role: 'lead', stage: 'github-lead-pr', status: 'blocked', executionStatus: 'completed', endedAt: '2026-11-22T20:15:00Z' } as unknown as WorkTime;
    a.store.state.workLog!.push(review);
    const directory = resolve(a.store.dataRoot, 'sessions', review.id); mkdirSync(directory, { recursive: true });
    writeFileSync(resolve(directory, 'assignment.json'), JSON.stringify({ id: review.id, claimId: review.claimId, work: { projectId: a.store.project.id, kind: 'delivery', id: a.job.id }, stage: review.stage, role: 'lead', profile: 'reader' }));
    writeFileSync(resolve(directory, 'provider.json'), JSON.stringify({ project: a.store.project.id, repository: a.store.project.repository, role: 'lead', readOnly: true }));
    writeFileSync(resolve(directory, 'capabilities.json'), JSON.stringify({ name: 'reader', readOnly: true }));
    await a.delivery.observe();
    expect(a.job.status).toBe('cancelled');
});

test('a preparation read-back still at work on the job holds the handoff', async () => {
    const a = fixture();
    a.store.state.workLog!.push({ ...a.work, id: 'readback', sessionId: 'readback-thread', stage: 'preparation-readback', status: 'running', endedAt: '' });
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
    // The worker itself still counts as finished: it is the named condition that holds the handoff.
    expect(completedPreparation(a.store, a.job, a.work)).toBe(true);
    await a.delivery.observe();
    expect(a.job.status).toBe('blocked');
});
