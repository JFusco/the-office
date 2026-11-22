import { brainCheckpointCompletion } from './brain/checkpoint-completion';
import { workKey } from '../../src/shared';
import type { Store } from '../store/store';
import type { command } from '../workers/process';
import type { DailyCheckpoint, MaintenanceRun } from '../../src/shared';

/** A blocked checkpoint with exactly one run, nothing of its own in flight and no unsettled Office write. */
function settledRun(store: Store, checkpoint: DailyCheckpoint): MaintenanceRun | undefined {
    if (!['blocked', 'interrupted'].includes(checkpoint.status) || checkpoint.repairResume || checkpoint.continuationId) return;
    const runs = store.state.maintenance?.runs.filter(run => run.id === checkpoint.runId) || [], run = runs[0];
    const recoveries = store.state.coordination!.requests?.filter(request => request.key === checkpoint.id &&
        ['retry-checkpoint', 'reconcile-native-checkpoint'].includes(request.action)) || [];
    const workIds = [checkpoint.runId, checkpoint.id, ...recoveries.map(request => request.id)];
    if (runs.length !== 1 || run.checkpointId !== checkpoint.id || run.blockerFollowup ||
        recoveries.some(request => request.status === 'working') ||
        store.state.workLog?.some(work => workIds.includes(work.requestId || '') && ['running', 'stopping'].includes(work.status)) ||
        store.activeClaims().some(claim => workIds.includes(claim.work.id)) ||
        store.db.prepare("SELECT 1 FROM effects WHERE work_key=? AND status IN ('dispatching','uncertain')").get(
            workKey({ projectId: store.project.id, kind: 'maintenance', id: run.id }))) return;
    return run;
}

/**
 * The receipt rule the run was accepted under. A Brain run completes with a write the worker reported as refused
 * before it took effect (not verified, not uncertain): its outcome is known, nothing happened
 * (`brain/brain-result-stop.ts`). Every other project's run completes only with every receipt verified. A write of
 * unknown outcome never counts.
 */
function outcomeKnown(run: MaintenanceRun, receipt: { verified: boolean; uncertain: boolean }): boolean {
    return !receipt.uncertain && (receipt.verified || run.stage === 'brain-completed');
}

/** The native check reads the repository and its remote, so one checkpoint is checked at most this often. A pacing aid only: nothing is decided from it. */
const NATIVE_CHECK_INTERVAL_MS = 5 * 60 * 1000;
const nativeChecks = new WeakMap<Store, Map<string, number>>();

/** All projects reconcile stale checkpoints from their exact linked work, retaining the prior failure. */
export async function reconcileCompletedCheckpoints(store: Store, read?: (path: string) => string, execute?: typeof command, now = store.clock.now().getTime()) {
    if (store.state.paused || store.state.draining || !store.state.coordination?.enabled) return;
    for (const checkpoint of store.state.coordination.checkpoints) {
        const run = settledRun(store, checkpoint);
        if (!run) continue;
        const finished = run.status === 'completed' && ['complete', 'brain-completed'].includes(run.stage) &&
            !!run.endedAt && run.steps.at(-1)?.result.outcome === 'passed' &&
            run.steps.every(step => step.result.receipts.every(receipt => outcomeKnown(run, receipt)));
        const checked = nativeChecks.get(store) ?? nativeChecks.set(store, new Map()).get(store)!;
        if (!finished && now - (checked.get(checkpoint.id) ?? -Infinity) < NATIVE_CHECK_INTERVAL_MS) continue;
        if (!finished) checked.set(checkpoint.id, now);
        const native = finished ? undefined : await brainCheckpointCompletion(store, checkpoint, run, read, execute);
        // The repository was read in between; the checkpoint must still be the settled one that was checked.
        if (!finished && (!native || settledRun(store, checkpoint) !== run || store.state.paused || store.state.draining)) continue;
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
