import type { MaintenanceRun, RetrospectiveTrigger } from '../../src/shared';

/**
 * Stable trigger identities for CMS maintenance runs. A run id is a bare UUID, so `triggerJobId`
 * (text before the first colon) resolves it like a job id. A blocked run that is reconciled and
 * continues gains steps, so a later block is a new trigger.
 */
export const maintenanceBlockedId = (run: Pick<MaintenanceRun, 'id' | 'steps'>) => `${run.id}:blocked:${run.steps.length}`;
export const maintenanceCompletedId = (run: Pick<MaintenanceRun, 'id'>) => `${run.id}:completed`;
/** Display key; a run has no ticket. */
export const maintenanceKey = (run: Pick<MaintenanceRun, 'weekly'>) => run.weekly ? 'CMS maintenance (weekly)' : 'CMS maintenance';

const clip = (text: string, limit = 500) => text.length <= limit ? text : `${text.slice(0, limit)}…`;

/** Every trigger a run's current state already represents. Used only to baseline, so over-inclusion is harmless. */
export function visibleMaintenanceTriggerIds(runs: MaintenanceRun[]): string[] {
    return runs.flatMap(run => run.status === 'blocked' ? [maintenanceBlockedId(run)] : run.status === 'completed' ? [maintenanceCompletedId(run)] : []);
}

/** Runs a maintenance stage currently owns or is about to claim; Harper waits for them. */
export function busyMaintenanceIds(runs: MaintenanceRun[]): string[] {
    return runs.filter(run => run.status === 'queued' || run.status === 'working').map(run => run.id);
}

export interface MaintenanceCandidate { id: string; trigger: RetrospectiveTrigger; subject: 'maintenance'; subjectId: string; key: string; stage: string; head: string; steps: number; reason: string; at: string }

/** Blocked and completed runs not yet consumed or pending. Pure; the caller owns `known`. */
export function maintenanceCandidates(known: ReadonlySet<string>, runs: MaintenanceRun[]): MaintenanceCandidate[] {
    return runs.flatMap(run => {
        const signal = run.status === 'blocked' ? { id: maintenanceBlockedId(run), trigger: 'blocked' as const } : run.status === 'completed' ? { id: maintenanceCompletedId(run), trigger: 'completed' as const } : null;
        if (!signal || known.has(signal.id)) return [];
        const last = run.steps.at(-1);
        return [{ ...signal, subject: 'maintenance' as const, subjectId: run.id, key: maintenanceKey(run), stage: run.stage, head: last?.result.candidates.at(-1)?.head || '', steps: run.steps.length,
            reason: clip(last?.result.blocker || run.error || last?.result.summary || ''), at: run.endedAt || last?.at || run.requestedAt }];
    });
}
