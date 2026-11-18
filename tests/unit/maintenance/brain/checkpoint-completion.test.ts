import { afterEach, expect, test, vi } from 'vitest';
import { Store } from '../../../../server/store/store';
import { projectById } from '../../../../server/office/projects';
import { coordination } from '../../../../server/scheduling/coordination';
import { brainCheckpointCompletion } from '../../../../server/maintenance/brain/checkpoint-completion';
import { reconcileCompletedCheckpoints } from '../../../../server/maintenance/completed-checkpoints';
import { projectOutbox } from '../../../../server/conversations/outbox';
import { workKey } from '../../../../src/shared';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
function fixture() {
    const store = new Store(':memory:', projectById('brain')); stores.push(store);
    store.state.coordination = { ...coordination(), enabled: true };
    const native = { id: '82f25902-1434-4b29-af9a-51d048042ae7', authorId: '01a1a36d-8487-7b70-8921-28c0d1261940', publicationRunId: '3eb465ed-8941-43be-bd91-c633c9239829', slotDate: '2026-11-03', phase: 'completed', completedAt: '2026-11-03T22:30:00Z', outcome: 'published', reportSha256: 'a'.repeat(64), prs: [{ number: 313, headSha: 'b'.repeat(40), mergeCommit: 'c'.repeat(40) }] };
    const checkpoint: any = { id: 'checkpoint', runId: 'run', date: native.slotDate, status: 'blocked', detail: 'Output limit failure' };
    const run: any = { id: 'run', checkpointId: 'checkpoint', status: 'reconciled', stage: 'brain-maintenance', steps: [{ stage: 'maintenance-readback', at: '2026-11-03T23:31:00Z', result: { outcome: 'passed', receipts: [], coverage: { originalWorkId: 'worker', nativeSha256: 'd'.repeat(64), completeNativeExecution: true, asyncCommandsComplete: true, delegatedTasksComplete: true, allAttemptedEffectsKnown: true, freshProviderDispositions: true, calls: [{ verified: true, uncertain: false }], receipts: [{ verified: true, uncertain: false }] } } }] };
    const worker: any = { id: 'worker', requestId: 'run', sessionId: native.authorId, stage: 'brain-maintenance', status: 'failed', startedAt: '2026-11-03T22:00:00Z', endedAt: '2026-11-03T23:17:00Z' };
    store.state.workLog = [worker]; store.state.coordination.checkpoints = [checkpoint];
    store.state.maintenance = { runs: [run], lastDaily: '', lastWeekly: '', ledger: '' };
    const state: any = { completed: { [native.slotDate]: native }, attempts: { [native.slotDate]: 1 } };
    const read = vi.fn((_path: string) => JSON.stringify(state));
    // Git as it stands once the pull request is merged and cleaned up; `git.left` puts something back at its head.
    const git = { left: '', merged: true, calls: [] as string[][] };
    const execute: any = async (_program: string, args: string[]) => {
        git.calls.push(args);
        if (args[0] === 'ls-remote') return `${'e'.repeat(40)}\trefs/heads/main\n${git.left === 'remote' ? `${native.prs[0].headSha}\trefs/heads/codex/313\n` : ''}`;
        if (args[0] === 'worktree') return git.left === 'worktree' ? `worktree /wt\nHEAD ${native.prs[0].headSha}\n` : '';
        if (args[0] === 'for-each-ref') return git.left === 'local' ? 'refs/heads/codex/313\n' : '';
        if (!git.merged) throw new Error('git exited 1');
        return '';
    };
    return { store, native, checkpoint, run, worker, state, read, git, execute };
}
test('a prior-date native completion, accepted readback and git-verified clean-up clear the notice after a failed wrapper', async () => {
    const a = fixture(), before = structuredClone(a.run.steps);
    a.store.state.outbox = projectOutbox(a.store.state);
    expect(a.store.state.outbox.filter(item => item.status === 'open')).toHaveLength(1);
    await reconcileCompletedCheckpoints(a.store, a.read, a.execute);
    expect(a.checkpoint.status).toBe('completed'); expect(a.run.status).toBe('reconciled');
    expect(a.store.state.outbox.filter(item => item.status === 'open')).toEqual([]);
    expect(a.run.steps.slice(0, -1)).toEqual(before);
    expect(JSON.parse(a.run.steps.at(-1).result.receipts[0].detail).native.native.id).toBe(a.native.id);
    await reconcileCompletedCheckpoints(a.store, a.read, a.execute);
    expect(a.read).toHaveBeenCalledTimes(1); expect(a.run.steps).toHaveLength(2);
    expect(JSON.parse(a.run.steps.at(-1).result.receipts[0].detail).native.cleanupVerifiedFromGit).toBe(true);
});
test.each(['dispatching', 'uncertain'])('a %s Office effect blocks even complete native evidence', async status => {
    const a = fixture(), before = structuredClone(a.store.state);
    a.store.db.prepare('INSERT INTO effects(id,work_key,status,body) VALUES(?,?,?,?)').run('effect', workKey({ projectId: a.store.project.id, kind: 'maintenance', id: a.run.id }), status, '{}');
    await reconcileCompletedCheckpoints(a.store, a.read, a.execute);
    expect(a.store.state).toEqual(before);
    expect(a.checkpoint.status).toBe('blocked');
    expect(a.read).not.toHaveBeenCalled(); expect(a.git.calls).toEqual([]);
});
test.each(['wrong-date', 'wrong-author', 'wrong-work', 'active-native', 'incomplete-coverage', 'uncertain-call', 'remote-branch-left', 'local-branch-left', 'worktree-left', 'not-merged', 'no-pull-request', 'readback-before-completion', 'unreconciled', 'missing-report', 'unreadable'])('does not clear %s evidence', async scenario => {
    const a = fixture();
    if (scenario === 'wrong-date') a.native.slotDate = '2026-11-02';
    if (scenario === 'wrong-author') a.worker.sessionId = 'other';
    if (scenario === 'wrong-work') a.run.steps[0].result.coverage.originalWorkId = 'other';
    if (scenario === 'active-native') a.state.active = a.native;
    if (scenario === 'incomplete-coverage') a.run.steps[0].result.coverage.allAttemptedEffectsKnown = false;
    if (scenario === 'uncertain-call') a.run.steps[0].result.coverage.calls[0].uncertain = true;
    if (scenario === 'remote-branch-left') a.git.left = 'remote';
    if (scenario === 'local-branch-left') a.git.left = 'local';
    if (scenario === 'worktree-left') a.git.left = 'worktree';
    if (scenario === 'not-merged') a.git.merged = false;
    if (scenario === 'no-pull-request') a.native.prs = [];
    if (scenario === 'readback-before-completion') a.run.steps[0].at = '2026-11-03T22:00:00Z';
    if (scenario === 'unreconciled') a.run.status = 'blocked';
    if (scenario === 'missing-report') a.native.reportSha256 = '';
    if (scenario === 'unreadable') a.read.mockImplementation(() => { throw new Error('unavailable'); });
    const before = structuredClone(a.store.state);
    expect(await brainCheckpointCompletion(a.store, a.checkpoint, a.run, a.read, a.execute)).toBeUndefined();
    await reconcileCompletedCheckpoints(a.store, a.read, a.execute);
    expect(a.store.state).toEqual(before);
});

test('the worker\'s own follow-up notes are never read: only the native gate file is', async () => {
    const a = fixture();
    await reconcileCompletedCheckpoints(a.store, a.read, a.execute);
    expect(a.read.mock.calls.map(([path]) => path.split('/').at(-1))).toEqual(['nightly.json']);
    expect(a.git.calls.map(args => args[0])).toEqual(['ls-remote', 'worktree', 'for-each-ref', 'merge-base']);
});

test('a checkpoint whose clean-up is not yet done is read again only after five minutes, then closes', async () => {
    const a = fixture(), at = Date.parse('2026-11-04T00:00:00Z'), reads = () => a.git.calls.filter(args => args[0] === 'ls-remote').length;
    a.git.left = 'remote';
    await reconcileCompletedCheckpoints(a.store, a.read, a.execute, at);
    await reconcileCompletedCheckpoints(a.store, a.read, a.execute, at + 4 * 60 * 1000);
    expect(reads()).toBe(1);
    a.git.left = '';
    await reconcileCompletedCheckpoints(a.store, a.read, a.execute, at + 5 * 60 * 1000);
    expect(reads()).toBe(2); expect(a.checkpoint.status).toBe('completed');
});

test('work that starts on the checkpoint while git is being read leaves it open', async () => {
    const a = fixture(), git = a.execute;
    const execute: any = async (program: string, args: string[]) => {
        if (args[0] === 'merge-base') a.store.state.coordination!.requests = [{ id: 'reader', key: a.checkpoint.id, action: 'retry-checkpoint', status: 'working' } as any];
        return git(program, args);
    };
    await reconcileCompletedCheckpoints(a.store, a.read, execute);
    expect(a.checkpoint.status).toBe('blocked'); expect(a.run.steps).toHaveLength(1);
});
