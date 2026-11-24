import type { HarnessRequest } from '../../../src/contracts/work';
import type { OfficeSnapshot } from '../../../src/shared';

/**
 * Throws unless a native checkpoint read-back queued as a repair resume still finds its checkpoint
 * linked to the original run it was admitted for. The handler finds the run by the checkpoint's
 * current link, and the pump can link a queued checkpoint to a fresh run; a resume that ran
 * against that run would complete the checkpoint on evidence its binding never named. Asked
 * immediately before the handler is called, so the request ends blocked through the scheduler's
 * ordinary failure path and nothing is read or written. A request with no binding is the
 * ordinary key-only read-back and passes. Pure.
 */
export function requireBoundCheckpointRun(state: Pick<OfficeSnapshot, 'coordination'>, request: Pick<HarnessRequest, 'key' | 'repairResume'>): void {
    if (!request.repairResume) return;
    const run = request.repairResume.stood?.run;
    if (!run) throw new Error(`The repair resume of checkpoint ${request.key} records no original run; no native read-back was made`);
    const linked = state.coordination?.checkpoints.find(checkpoint => checkpoint.id === request.key)?.runId;
    if (linked !== run) throw new Error(`Checkpoint ${request.key} is no longer linked to the original run ${run} its repair resume was admitted for; no native read-back was made`);
}
