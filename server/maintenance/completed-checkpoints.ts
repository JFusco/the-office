import { brainCheckpointCompletion } from './brain/checkpoint-completion';
import type { Store } from '../store/store';

/** All projects reconcile stale checkpoints from their exact linked work, retaining the prior failure. */
export function reconcileCompletedCheckpoints(store: Store, read?: (path: string) => string) {
    if (store.state.paused || store.state.draining || !store.state.coordination?.enabled) return;
    for (const checkpoint of store.state.coordination.checkpoints) {
        if (!['blocked', 'interrupted'].includes(checkpoint.status) || checkpoint.repairResume || checkpoint.continuationId) continue;
        const runs = store.state.maintenance?.runs.filter(run => run.id === checkpoint.runId) || [], run = runs[0];
        const recoveries = store.state.coordination.requests?.filter(request => request.key === checkpoint.id &&
            ['retry-checkpoint', 'reconcile-native-checkpoint'].includes(request.action)) || [];
        const workIds = [checkpoint.runId, checkpoint.id, ...recoveries.map(request => request.id)];
        if (runs.length !== 1 || run.checkpointId !== checkpoint.id || run.blockerFollowup ||
            recoveries.some(request => request.status === 'working') ||
            store.state.workLog?.some(work => workIds.includes(work.requestId || '') && ['running', 'stopping'].includes(work.status)) ||
            store.activeClaims().some(claim => workIds.includes(claim.work.id))) continue;
        const finished = run.status === 'completed' && ['complete', 'brain-completed'].includes(run.stage) &&
            !!run.endedAt && run.steps.at(-1)?.result.outcome === 'passed' &&
            run.steps.every(step => step.result.receipts.every(receipt => receipt.verified && !receipt.uncertain));
        const native = finished ? undefined : brainCheckpointCompletion(store, checkpoint, run, read);
        if (!finished && !native) continue;
        const at = store.clock.now().toISOString(), prior = structuredClone(checkpoint);
        const detail = `Maintenance for ${checkpoint.date} verified complete. The stale checkpoint was reconciled automatically; original failure retained.`;
        store.transaction(() => {
            run.steps.push({ role: 'pm', stage: 'checkpoint-completion-readback', at, result: {
                outcome: 'passed', summary: detail, ledger: '', blocker: '', candidates: [],
                receipts: [{ id: `checkpoint:${checkpoint.id}:${run.id}`, action: 'checkpoint-completion-readback',
                    target: native?.native.id || run.id, verified: true, uncertain: false,
                    detail: JSON.stringify({ originalRunId: run.id, prior, native, completionStage: run.stage, verifiedAt: at }) }],
            } });
            checkpoint.status = 'completed'; checkpoint.endedAt = at; checkpoint.detail = detail;
            store.emit('checkpoint-completion-reconciled', detail, 'pm');
        });
    }
}
