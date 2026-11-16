import type { OfficeSnapshot, TicketJob } from '../../../src/shared';

/** Job fields written only by one-time recovery paths that no longer exist. */
const REMOVED_FIELDS = ['packedPublicationRepair', 'sourceAmendment'] as const;

/** Historical records may still carry a removed field, including the #156 nested `stoppedBaseUpdate.greenMerge`. */
const legacy = (job: TicketJob) => {
    const saved = job as unknown as Record<string, unknown> & { stoppedBaseUpdate?: { greenMerge?: unknown } };
    return REMOVED_FIELDS.some(field => saved[field] !== undefined) || saved.stoppedBaseUpdate?.greenMerge !== undefined;
};

/**
 * At service start, an unfinished job still carrying a removed one-time recovery record has
 * no code left to continue it. Cancel it so it is visible at once; finished jobs keep their
 * saved record untouched. A job with unsettled effects is not cancelled, since its writes still
 * need read-back and cancelling would hide them; it is stopped as blocked so ordinary delivery
 * cannot continue it.
 */
export function retireLegacyRecovery(state: OfficeSnapshot, now: Date, hasUnsettledEffects: (jobId: string) => boolean): number {
    let retired = 0;
    for (const job of state.coordination?.jobs || []) {
        if (['completed', 'cancelled'].includes(job.status) || !legacy(job)) continue;
        if (hasUnsettledEffects(job.id)) {
            if (!['blocked', 'interrupted'].includes(job.status))
                Object.assign(job, { status: 'blocked', updatedAt: now.toISOString(),
                    detail: `${job.key} was on a one-time recovery path that the Office no longer has. Its earlier writes need read-back before it can be cancelled and restarted as a fresh delivery.` });
            continue;
        }
        Object.assign(job, { status: 'cancelled', updatedAt: now.toISOString(),
            detail: `${job.key} was on a one-time recovery path that the Office no longer has. This work is cancelled; restart it as a fresh delivery.` });
        retired++;
    }
    return retired;
}
