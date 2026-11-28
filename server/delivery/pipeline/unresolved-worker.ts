import type { TicketJob, WorkTime } from '../../../src/shared';

/**
 * The approach guard's worker input, job-wide: a failed, interrupted or blocked worker of this job that no later
 * completed worker of the same stage superseded. Ordinary acceptance and correction acceptance both use it.
 */
export function unresolvedWorkerFailure(workLog: readonly WorkTime[] | undefined, job: Pick<TicketJob, 'id'>): boolean {
    const work = (workLog || []).filter(item => item.requestId === job.id);
    return work.some(item => ['failed', 'interrupted', 'blocked'].includes(item.status) &&
        !work.some(later => later.stage === item.stage && later.startedAt > item.startedAt && later.status === 'completed'));
}
