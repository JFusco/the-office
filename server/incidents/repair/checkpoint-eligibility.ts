import type { DailyCheckpoint, MaintenanceRun, OfficeSnapshot } from '../../../src/shared';

/** The checkpoint's original run, when the native read-back could act on it now; otherwise the first condition it would refuse on. */
export type CheckpointEligibility = { original: MaintenanceRun } | { fault: string };

/**
 * Whether Brain's native checkpoint read-back (`completeNativeCheckpoint`,
 * server/maintenance/brain/brain-checkpoint.ts) could act on this checkpoint as the project's own
 * store holds it, by the same comparisons that handler makes: the checkpoint is blocked or
 * interrupted; its run is linked back to it; that run is reconciled, with no blocker follow-up;
 * the checkpoint carries neither the refresh continuation's older `repairResume` field nor a
 * continuation; the run's latest maintenance read-back passed with at least one receipt, every
 * one verified and certain; and no work filed under the run is running or stopping.
 *
 * One more, of its own: no other checkpoint points to the same run. Only then is a later
 * `checkpoint-retry-queued` event, which names the run and no checkpoint, this checkpoint's (see
 * moved-by-hand.ts). The scheduler links a checkpoint only to a fresh, queued or working run,
 * never to a reconciled one, so none comes to share it after the admission.
 *
 * The native gate, its slot and date, the completion's identity and the completed wrapper run are
 * read by the handler itself when the request runs; nothing here stands in for them. Pure.
 */
export function checkpointEligibility(state: Pick<OfficeSnapshot, 'coordination' | 'maintenance' | 'workLog'>, checkpoint: DailyCheckpoint): CheckpointEligibility {
    const fault = (detail: string): CheckpointEligibility => ({ fault: detail });
    if (!['blocked', 'interrupted'].includes(checkpoint.status)) return fault(`The checkpoint is ${checkpoint.status}, not blocked or interrupted.`);
    const original = state.maintenance?.runs.find(run => run.id === checkpoint.runId);
    if (!original) return fault(`The project holds no run ${checkpoint.runId} for the checkpoint.`);
    if (original.checkpointId !== checkpoint.id) return fault(`The run ${original.id} is not linked back to this checkpoint.`);
    if (original.status !== 'reconciled') return fault(`The run ${original.id} is ${original.status}, not reconciled.`);
    if (original.blockerFollowup) return fault(`The run ${original.id} has a blocker follow-up.`);
    if (checkpoint.repairResume) return fault('The checkpoint carries a refresh continuation\'s repair resume.');
    if (checkpoint.continuationId) return fault(`The checkpoint has a continuation (${checkpoint.continuationId}).`);
    const readback = original.steps.filter(step => step.stage === 'maintenance-readback').at(-1)?.result;
    if (readback?.outcome !== 'passed' || !readback.receipts.length || readback.receipts.some(receipt => !receipt.verified || receipt.uncertain))
        return fault(`The latest maintenance read-back of ${original.id} did not pass with every receipt verified and certain.`);
    if (state.workLog?.some(work => work.requestId === original.id && ['running', 'stopping'].includes(work.status))) return fault(`Work under the run ${original.id} is still running or stopping.`);
    const other = state.coordination?.checkpoints.find(saved => saved.id !== checkpoint.id && saved.runId === original.id);
    if (other) return fault(`Another checkpoint (${other.id}) points to the run ${original.id}; a retry queued for that run could not be told apart.`);
    return { original };
}
