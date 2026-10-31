import type { DailyCheckpoint, MaintenanceRun, OfficeSnapshot } from '../../src/shared';

/**
 * A failed daily checkpoint or maintenance run stops needing a human read-back once a later one
 * completes: the newer run re-observed the same sources. Its failure history stays on the record.
 */
export function checkpointSuperseded(state: Pick<OfficeSnapshot, 'coordination'>, checkpoint: DailyCheckpoint): boolean {
    return !!state.coordination?.checkpoints.some(other => other.date > checkpoint.date && other.status === 'completed');
}

/** Stages of a completed run that re-observed current sources: the CMS follow-up or a completed Brain nightly. A gate skip re-checked nothing. */
const REOBSERVED = new Set(['complete', 'brain-completed']);

export function maintenanceSuperseded(state: Pick<OfficeSnapshot, 'maintenance'>, run: MaintenanceRun): boolean {
    return !!state.maintenance?.runs.some(other => other.requestedAt > run.requestedAt && other.status === 'completed' && REOBSERVED.has(other.stage));
}
