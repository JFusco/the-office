import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Store } from './store';
import type { Continuation } from '../src/shared';
/** Explicit reviewed legacy mapping; no links are inferred from report prose. */
const legacy = { original: '128bbdd7-eed4-4500-84aa-e04d611c6100', checkpoint: '782c5e28-2f35-463a-8079-6b27956c505e', continuation: 'd1688e6b-d2b6-418b-a735-1eba39ac421c', issue: 'GH-273' };
export function reconcileContinuations(store: Store): void {
    const c = store.state.coordination;
    if (!c || store.project.id !== 'brain')
        return;
    c.continuations ??= [];
    for (const original of store.state.maintenance?.runs || []) {
        const repairIssue = original.blockerFollowup?.issue;
        if (original.status !== 'reconciled' || original.blockerFollowup?.status !== 'completed' || !repairIssue)
            continue;
        const repair = c.jobs?.find(job => job.key === `GH-${repairIssue}`);
        if (!repair)
            continue;
        const id = `repair:${original.id}:${repair.id}`;
        if (c.continuations.some(continuation => continuation.id === id))
            continue;
        const checkpoint = c.checkpoints.find(checkpoint => checkpoint.runId === original.id || original.id === legacy.original && checkpoint.id === legacy.checkpoint);
        if (!checkpoint)
            continue;
        const adopted = original.id === legacy.original && checkpoint.runId === legacy.continuation ? store.state.maintenance?.runs.find(run => run.id === legacy.continuation) : undefined;
        const continuation: Continuation = { id, original: { projectId: store.project.id, kind: 'maintenance', id: original.id }, checkpointId: checkpoint.id, repair: { projectId: store.project.id, kind: 'delivery', id: repair.id }, repairIssue, originalIssue: original.id === legacy.original ? legacy.issue : original.originalIssue || '', nativeRunId: '', nativeSlot: '', runId: adopted?.id || '', status: 'waiting', nextCheckAt: '', detail: 'Repair completion and native gate must be verified before continuation.' };
        if (adopted) {
            continuation.status = 'blocked';
            continuation.detail = 'Existing continuation adopted for read-only native identity reconciliation; never dispatch another writer.';
            const work = store.state.workLog?.filter(work => work.requestId === adopted.id && work.stage === 'brain-maintenance').at(-1);
            if (work?.status === 'completed') {
                try {
                    const saved = JSON.parse(readFileSync(resolve(store.dataRoot, 'sessions', work.id, 'result.json'), 'utf8'));
                    if (saved.session !== work.sessionId || !saved.result.runId || saved.result.outcome !== 'completed')
                        throw new Error('Native result identity is incomplete');
                    continuation.nativeRunId = saved.result.runId;
                    continuation.nativeAuthorId = work.sessionId;
                    continuation.status = 'waiting';
                }
                catch { /* Missing native evidence remains blocked. */ }
            }
        }
        c.continuations.push(continuation);
        checkpoint.continuationId = id;
        store.emit('continuation-linked', 'Original maintenance, source repair and existing continuation linked; prior failures retained.', 'pm', continuation.originalIssue);
    }
}
export function validateNativeContinuation(continuation: Continuation, gate: any): boolean {
    return !!continuation.runId && !!continuation.nativeRunId && !!continuation.nativeAuthorId && !gate.active && gate.completed?.id === continuation.nativeRunId && gate.completed?.phase === 'completed' && !!gate.completed.completedAt && gate.completed.authorId === continuation.nativeAuthorId;
}
