import type { z } from 'zod';
import type { BrainStatusSchema } from './brain-status';
import type { Store } from '../../store/store';
import type { DailyCheckpoint, MaintenanceRun } from '../../../src/shared';

/** A verified existing native date closes a refused checkpoint; it never retries maintenance. */
export function completeNativeCheckpoint(store: Store, checkpoint: DailyCheckpoint, original: MaintenanceRun,
    gate: z.infer<typeof BrainStatusSchema>, now = store.clock.now()): boolean {
    const completed = gate.completed;
    const readback = original.steps.filter(step => step.stage === 'maintenance-readback').at(-1)?.result;
    if (store.project.id !== 'brain' || store.state.paused ||
        !['blocked', 'interrupted'].includes(checkpoint.status) || checkpoint.runId !== original.id ||
        original.checkpointId !== checkpoint.id || original.status !== 'reconciled' ||
        original.blockerFollowup || checkpoint.repairResume || checkpoint.continuationId ||
        gate.active || !completed || completed.phase !== 'completed' || completed.slotDate !== checkpoint.date ||
        gate.slotDate !== checkpoint.date || !completed.authorId || !completed.completedAt ||
        !/^[a-f0-9]{64}$/.test(completed.reportSha256 || '') ||
        readback?.outcome !== 'passed' || !readback.receipts.length ||
        readback.receipts.some(receipt => !receipt.verified || receipt.uncertain) ||
        store.state.workLog?.some(work => work.requestId === original.id && ['running', 'stopping'].includes(work.status))) return false;
    const wrapper = store.state.maintenance?.runs.find(run => run.status === 'completed' &&
        (run.nativeRunId === completed.id || store.state.coordination?.continuations?.some(continuation =>
            continuation.runId === run.id && continuation.status === 'completed' &&
            continuation.nativeRunId === completed.id && continuation.nativeAuthorId === completed.authorId)));
    if (!wrapper) return false;
    const at = now.toISOString(), prior = { status: checkpoint.status, detail: checkpoint.detail, endedAt: checkpoint.endedAt };
    const detail = `Native run ${completed.id} already completed ${checkpoint.date}. Original maintenance effects were reconciled; no nightly claim or retry was dispatched.`;
    store.transaction(() => {
        original.steps.push({ role: 'pm', stage: 'checkpoint-native-readback', at, result: {
            outcome: 'passed', summary: detail, ledger: readback.ledger, blocker: '', candidates: [],
            receipts: [{ id: `checkpoint:${checkpoint.id}:${completed.id}`, action: 'native-checkpoint-readback',
                target: completed.id, verified: true, uncertain: false,
                detail: JSON.stringify({ checkpointId: checkpoint.id, originalRunId: original.id,
                    completedWrapperId: wrapper.id, native: completed, verifiedAt: at, prior }) }],
        } });
        checkpoint.status = 'completed';
        checkpoint.endedAt = at;
        checkpoint.detail = detail;
        store.emit('checkpoint-native-reconciled', detail, 'pm');
    });
    return true;
}
