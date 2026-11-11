import { currentAssignment, withAssignment } from '../../server/workers/assignment-context';
import type { Store } from '../../server/store/store';
import type { TicketJob } from '../../src/shared';
/** Positive admission setup for historical fixtures which predate the contract. */
export function registerDeliveryFixture(store: Store, job: TicketJob): void {
    job.requestedAt ||= store.clock.now().toISOString();
    job.admission = { kind: 'manual', projectId: store.project.id, jobId: job.id, key: job.key,
        reference: `isolated-original:${job.id}`, at: job.requestedAt };
}

/** Exercise direct handler tests under the same persisted claim as the real scheduler. */
export async function claimedDelivery<T>(store: Store, job: TicketJob, execute: () => Promise<T>, activate = true): Promise<T> {
    // Explicit recovery fixtures already supply their own (possibly deliberately invalid)
    // assignment. Preserve it so the production guard can reject it.
    if (currentAssignment()) return execute();
    const claim = store.claimWork({ projectId: store.project.id, kind: 'delivery', id: job.id }, 'isolated delivery fixture', job.stage, 'delivery');
    if (!claim) throw new Error('Fixture already has a delivery claim');
    const previous = job.status;
    if (activate) job.status = 'working';
    try { return await withAssignment(claim, 'delivery', execute); }
    finally { if (activate && job.status === 'working') job.status = previous; store.finishClaim(claim.id, 'completed'); }
}
