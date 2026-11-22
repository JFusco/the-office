import type { DailyCheckpoint, MaintenanceRun } from '../../src/shared';

type Outcome = { status: Extract<DailyCheckpoint['status'], 'completed' | 'blocked' | 'interrupted'>; detail: string };

/**
 * What a working checkpoint becomes once the maintenance run it started has ended: the run's own status, with
 * the run's error or its final stage as the detail. Undefined while the run has not ended. The checkpoint only
 * records where its run finished; it adds no judgement of its own.
 */
export function checkpointOutcome(run: Pick<MaintenanceRun, 'id' | 'status' | 'stage' | 'error'> | undefined): Outcome | undefined {
    if (!run || !['completed', 'blocked', 'interrupted'].includes(run.status)) return;
    return { status: run.status as Outcome['status'], detail: run.error || `Maintenance ${run.id}: ${run.stage}` };
}
