import type { DailyCheckpoint, MaintenanceRun, OfficeSnapshot } from '../../src/shared';
import { maintenanceSuperseded } from './superseded';

export function maintenanceNeedsFollowup(state: OfficeSnapshot, run: MaintenanceRun): boolean {
    return ['blocked', 'interrupted'].includes(run.status) &&
        (!run.readbackRetry || !!run.readbackRetry.exhausted) && !maintenanceSuperseded(state, run);
}

/** Vendor evidence failures belong to Morgan's maintenance view; questions surface separately. */
export function maintenanceNeedsHumanFollowup(state: OfficeSnapshot, run: MaintenanceRun): boolean {
    return maintenanceNeedsFollowup(state, run) && run.stage !== 'vendor-review';
}

/** A checkpoint and its failed run share one follow-up owner; neither history is removed. */
export function checkpointHasMaintenanceAlert(state: OfficeSnapshot, checkpoint: DailyCheckpoint): boolean {
    return !checkpoint.repairResume?.needsFollowup &&
        !!state.maintenance?.runs.some(run => run.id === checkpoint.runId && maintenanceNeedsFollowup(state, run));
}
