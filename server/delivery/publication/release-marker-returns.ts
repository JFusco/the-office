import type { ReleaseMarkerCorrection, ReleaseMarkerReturn } from '../../../src/contracts/release-marker';
import type { TicketJob } from '../../../src/shared';

/** A delivery is returned to its developer at most twice; a third proven refusal blocks with the commit and paths. */
export const MAX_RELEASE_MARKER_RETURNS = 2;

/** Every return the job has spent, oldest first. Absent counts as zero. */
export function releaseMarkerReturns(job: Pick<TicketJob, 'releaseMarkerReturns'>): ReleaseMarkerReturn[] {
    return Object.values(job.releaseMarkerReturns ?? {}).sort((a, b) => a.at.localeCompare(b.at) || a.workId.localeCompare(b.workId));
}

/** The one current correction to dispatch, if any. */
export function pendingReturn(job: Pick<TicketJob, 'releaseMarkerReturns'>): ReleaseMarkerReturn | undefined {
    const pending = releaseMarkerReturns(job).filter(item => item.status === 'pending');
    if (pending.length > 1) throw new Error('More than one pending release-marker correction is saved; reconcile before dispatch');
    return pending[0];
}

/** A pending correction whose developer was dispatched and has not settled. */
export function dispatchedCorrection(job: Pick<TicketJob, 'releaseMarkerReturns'>): ReleaseMarkerReturn | undefined {
    const pending = pendingReturn(job);
    return pending?.correction?.dispatchedAt ? pending : undefined;
}

/** The correction identities a stop for this return reports. */
export function correctionIdentity(pending: ReleaseMarkerReturn): ReleaseMarkerCorrection {
    const mapping = pending.correction?.mapping;
    return { refusedWorkId: pending.workId, refusedHead: pending.refusedHead, ...(pending.correction?.claimId ? { claimId: pending.correction.claimId } : {}),
        ...(pending.correction?.workId ? { workId: pending.correction.workId } : {}), ...(mapping ? { mappedHead: mapping.newHead } : {}) };
}
