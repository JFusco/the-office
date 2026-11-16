import type { OfficeSnapshot } from '../../../src/shared';

/** Job fields written only by one-time recovery paths that no longer exist. */
const REMOVED_FIELDS = ['packedPublicationRepair', 'sourceAmendment'] as const;

/**
 * At service start, an unfinished job still carrying a removed one-time recovery record has
 * no code left to continue it. Cancel it so it is visible at once; finished jobs keep their
 * saved record untouched. A job with unsettled effects is left as it is: its writes still
 * need read-back, and cancelling would hide them.
 */
export function retireLegacyRecovery(state: OfficeSnapshot, now: Date, hasUnsettledEffects: (jobId: string) => boolean): number {
    const retired = (state.coordination?.jobs || []).filter(job => !['completed', 'cancelled'].includes(job.status) &&
        REMOVED_FIELDS.some(field => (job as unknown as Record<string, unknown>)[field] !== undefined) && !hasUnsettledEffects(job.id));
    for (const job of retired)
        Object.assign(job, { status: 'cancelled', updatedAt: now.toISOString(),
            detail: `${job.key} was on a one-time recovery path that the Office no longer has. This work is cancelled; restart it as a fresh delivery.` });
    return retired.length;
}
