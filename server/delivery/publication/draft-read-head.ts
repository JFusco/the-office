import { packed165Admitted } from '../recovery/packed165-evidence';
import type { Store } from '../../store/store';
import type { TicketJob, WorkClaim } from '../../../src/shared';

/** A saved read of the administratively superseded head stays historical; it is never current source acceptance. */
export function draftReadHeadMatches(store: Store, job: TicketJob, claim: WorkClaim,
    proof: { head?: unknown; pr?: unknown; read?: unknown }): boolean {
    if (proof.head === job.head) return true;
    const repair = job.packedPublicationRepair;
    if (!repair || !packed165Admitted(store, job) || proof.head !== repair.original.head || proof.pr !== 0 || proof.read !== 'viewer') return false;
    const row = store.db.prepare('SELECT body FROM work_claims WHERE id=?').get(repair.claimId) as { body: string } | undefined;
    const admission = row && JSON.parse(row.body);
    return Number.isFinite(Date.parse(claim.endedAt)) && Number.isFinite(Date.parse(admission?.claimedAt)) &&
        Date.parse(claim.endedAt) <= Date.parse(admission.claimedAt);
}
