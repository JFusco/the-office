import type { DailyCheckpoint, MaintenanceRun, OfficeSnapshot } from '../../src/shared';
import { maintenanceSuperseded } from './superseded';
import { repeatedVendorReviewBlock } from './repeated-vendor-block';

export function maintenanceNeedsFollowup(state: OfficeSnapshot, run: MaintenanceRun): boolean {
    return ['blocked', 'interrupted'].includes(run.status) &&
        (!run.readbackRetry || !!run.readbackRetry.exhausted) && !maintenanceSuperseded(state, run);
}

/** One vendor evidence failure belongs to Morgan's maintenance view; a repeated one reaches Joe. Questions surface separately. */
export function maintenanceNeedsHumanFollowup(state: OfficeSnapshot, run: MaintenanceRun): boolean {
    return maintenanceNeedsFollowup(state, run) && (run.stage !== 'vendor-review' || repeatedVendorReviewBlock(state, run));
}

/** A checkpoint and its failed run share one follow-up owner; neither history is removed. */
export function checkpointHasMaintenanceAlert(state: OfficeSnapshot, checkpoint: DailyCheckpoint): boolean {
    return !checkpoint.repairResume?.needsFollowup &&
        !!state.maintenance?.runs.some(run => run.id === checkpoint.runId && maintenanceNeedsFollowup(state, run));
}
