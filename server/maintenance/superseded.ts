import type { DailyCheckpoint, MaintenanceRun, OfficeSnapshot } from '../../src/shared';

/**
 * A failed daily checkpoint or maintenance run stops needing a human read-back once a later one
 * completes: the newer run re-observed the same sources. Its failure history stays on the record.
 */
export function checkpointSuperseded(state: Pick<OfficeSnapshot, 'coordination'> & Partial<Pick<OfficeSnapshot, 'project' | 'intake'>>, checkpoint: DailyCheckpoint): boolean {
    // Azure/Jira daily checkpoints only check the mailbox. A later accepted
    // manual intake re-observes it too. lastChecked advances only on success;
    // a new intake failure has its own alert and never rewrites this history.
    const requested = Date.parse(checkpoint.requestedAt), started = Date.parse(checkpoint.startedAt), ended = Date.parse(checkpoint.endedAt);
    const checked = Date.parse(state.intake?.lastChecked || '');
    if (state.project?.provider === 'azure' && checkpoint.status === 'blocked' && !checkpoint.runId &&
        !checkpoint.repairResume && !checkpoint.continuationId && [requested, started, ended, checked].every(Number.isFinite) &&
        requested <= started && started <= ended && checked > ended) return true;
    return !!state.coordination?.checkpoints.some(other => other.date > checkpoint.date && other.status === 'completed');
}

/** Stages of a completed run that re-observed current sources: the CMS follow-up or a completed Brain nightly. A gate skip re-checked nothing. */
const REOBSERVED = new Set(['complete', 'brain-completed']);

export function maintenanceSuperseded(state: Pick<OfficeSnapshot, 'maintenance'>, run: MaintenanceRun): boolean {
    return !!state.maintenance?.runs.some(other => other.requestedAt > run.requestedAt && other.status === 'completed' && REOBSERVED.has(other.stage));
}
