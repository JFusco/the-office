import type { DailyCheckpoint, MaintenanceRun, OfficeSnapshot } from '../../src/shared';
import { maintenanceSuperseded } from './superseded';

export function maintenanceNeedsFollowup(state: OfficeSnapshot, run: MaintenanceRun): boolean {
    return ['blocked', 'interrupted'].includes(run.status) &&
        (!run.readbackRetry || !!run.readbackRetry.exhausted) && !maintenanceSuperseded(state, run);
}

/** A checkpoint and its failed run share one actionable alert; neither history is removed. */
export function checkpointHasMaintenanceAlert(state: OfficeSnapshot, checkpoint: DailyCheckpoint): boolean {
    return !checkpoint.repairResume?.needsFollowup &&
        !!state.maintenance?.runs.some(run => run.id === checkpoint.runId && maintenanceNeedsFollowup(state, run));
}
