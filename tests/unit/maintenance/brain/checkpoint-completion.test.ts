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
    const followup: any = { runId: native.id, publicationRunId: native.publicationRunId, completedAt: '2026-11-03T22:33:00Z', captures: [{ status: 'completed' }], cleanup: [{ pr: 313, headSha: native.prs[0].headSha, worktreeStatus: 'completed', localBranchStatus: 'completed', remoteBranchStatus: 'completed' }], board: [{ pr: 313, status: 'completed' }] };
    const read = vi.fn((path: string) => JSON.stringify(path.endsWith('/nightly.json') ? state : followup));
    return { store, native, checkpoint, run, worker, state, followup, read };
}
test('a prior-date native completion and accepted readback clear the notice after a failed wrapper', () => {
    const a = fixture(), before = structuredClone(a.run.steps);
    a.store.state.outbox = projectOutbox(a.store.state);
    expect(a.store.state.outbox.filter(item => item.status === 'open')).toHaveLength(1);
    reconcileCompletedCheckpoints(a.store, a.read);
    expect(a.checkpoint.status).toBe('completed'); expect(a.run.status).toBe('reconciled');
    expect(a.store.state.outbox.filter(item => item.status === 'open')).toEqual([]);
    expect(a.run.steps.slice(0, -1)).toEqual(before);
    expect(JSON.parse(a.run.steps.at(-1).result.receipts[0].detail).native.native.id).toBe(a.native.id);
    reconcileCompletedCheckpoints(a.store, a.read);
    expect(a.read).toHaveBeenCalledTimes(2); expect(a.run.steps).toHaveLength(2);
});
test.each(['dispatching', 'uncertain'])('a %s Office effect blocks even complete native evidence', status => {
    const a = fixture(), before = structuredClone(a.store.state);
    a.store.db.prepare('INSERT INTO effects(id,work_key,status,body) VALUES(?,?,?,?)').run('effect', workKey({ projectId: a.store.project.id, kind: 'maintenance', id: a.run.id }), status, '{}');
    reconcileCompletedCheckpoints(a.store, a.read);
    expect(a.store.state).toEqual(before);
    expect(a.checkpoint.status).toBe('blocked');
    expect(a.read).not.toHaveBeenCalled();
});
test.each(['wrong-date', 'wrong-author', 'wrong-work', 'wrong-publication', 'active-native', 'incomplete-coverage', 'uncertain-call', 'pending-capture', 'pending-cleanup', 'missing-board', 'followup-after-readback', 'unreconciled', 'missing-report', 'unreadable'])('does not clear %s evidence', scenario => {
    const a = fixture();
    if (scenario === 'wrong-date') a.native.slotDate = '2026-11-02';
    if (scenario === 'wrong-author') a.worker.sessionId = 'other';
    if (scenario === 'wrong-work') a.run.steps[0].result.coverage.originalWorkId = 'other';
    if (scenario === 'wrong-publication') a.followup.publicationRunId = a.native.id;
    if (scenario === 'active-native') a.state.active = a.native;
    if (scenario === 'incomplete-coverage') a.run.steps[0].result.coverage.allAttemptedEffectsKnown = false;
    if (scenario === 'uncertain-call') a.run.steps[0].result.coverage.calls[0].uncertain = true;
    if (scenario === 'pending-capture') a.followup.captures[0].status = 'pending';
    if (scenario === 'pending-cleanup') a.followup.cleanup[0].remoteBranchStatus = 'pending';
    if (scenario === 'missing-board') a.followup.board = [];
    if (scenario === 'followup-after-readback') a.followup.completedAt = '2026-11-04T00:00:00Z';
    if (scenario === 'unreconciled') a.run.status = 'blocked';
    if (scenario === 'missing-report') a.native.reportSha256 = '';
    if (scenario === 'unreadable') a.read.mockImplementation(() => { throw new Error('unavailable'); });
    const before = structuredClone(a.store.state);
    expect(brainCheckpointCompletion(a.store, a.checkpoint, a.run, a.read)).toBeUndefined();
    reconcileCompletedCheckpoints(a.store, a.read);
    expect(a.store.state).toEqual(before);
});
