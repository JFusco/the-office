import type { TicketJob } from '../../../src/shared';

/** An explicit Start authorizes the first implementation transition, never a later restart. */
export function initialManualStart(projectId: string, job: TicketJob): boolean {
    const admission = job.admission;
    return admission?.kind === 'manual' && admission.projectId === projectId &&
        admission.jobId === job.id && admission.key === job.key && !!admission.reference.trim() &&
        admission.at === job.requestedAt && Number.isFinite(Date.parse(admission.at)) &&
        job.stage === 'implement' && !job.pr && !job.existingPR && !job.head &&
        job.steps.length === 0 && !job.boardUpdates?.length;
}
