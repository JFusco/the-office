import { isDeepStrictEqual } from 'node:util';
import { currentAssignment } from '../../workers/assignment-context';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob, WorkClaim } from '../../../src/shared';

/** Metadata publication belongs to the original scheduled job or its explicitly bound recovery. */
export function metadataClaim(delivery: GitHubDelivery, job: TicketJob, expected?: WorkClaim): WorkClaim {
    const { store } = delivery, claim = currentAssignment()?.claim, r = job.prMetadataRepair;
    if (!claim || !r || claim.status !== 'running' || claim.work.projectId !== store.project.id ||
        !store.activeClaims().some(saved => isDeepStrictEqual(saved, claim)) || expected && !isDeepStrictEqual(expected, claim))
        throw new Error('Original active metadata scheduler claim is required');
    if (claim.work.kind === 'delivery' && claim.work.id === job.id && claim.stage === job.stage &&
        ['draft', 'prepare-pr'].includes(job.stage) && job.status === 'working') return claim;
    const request = store.state.coordination?.requests?.find(q => q.id === claim.work.id);
    const original = r.original;
    if (r.origin === 'original-recovery' && original && claim.work.kind === 'reconciliation' && claim.work.id === original.requestId &&
        claim.stage === 'reconcile-pr-metadata' && request?.action === claim.stage && request.status === 'working' && request.key === job.key && request.head === job.head &&
        isDeepStrictEqual(request.prMetadataRecovery, { jobId: job.id, head: job.head, workerId: original.workerId, parkAt: original.parkAt,
            parkSha256: original.parkSha256, proposal: original.proposal, authorization: original.authorization })) return claim;
    throw new Error('Metadata claim is not the exact original job or authorized recovery request');
}
