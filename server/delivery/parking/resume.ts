import { HOLDS } from '../../office/config';
import { dependencyEligibility, type DependencyStores } from '../pipeline/dependencies';
import { hasUncertainEffects } from '../pipeline/github-delivery';
import type { Store } from '../../store/store';
import type { AssignedIssue, TicketJob } from '../../../src/shared';

/** A parked card moved back to the pickup lane resumes the same job at its retained stage. */
export function resumeParked(store: Store, jobs: TicketJob[], assigned: AssignedIssue[], pickup: { enabled: boolean; status: string }, stores: DependencyStores, now: Date): string[] {
    const resumed: string[] = [], pickupStatus = pickup.status;
    if (!pickup.enabled) return resumed;
    for (const job of jobs.filter(job => job.parked?.published && job.status === 'blocked')) {
        const lane = assigned.find(issue => issue.key === job.key)?.pickupStatus;
        if (lane !== pickupStatus || HOLDS[job.key] || job.steps.some(step => hasUncertainEffects(step.stage, step.result)) || dependencyEligibility(job.prerequisites || [], stores, now))
            continue;
        const stage = job.parked!.stage;
        delete job.parked;
        job.status = 'queued';
        job.detail = `Card returned to ${pickupStatus}; resuming ${stage} on the same candidate.`;
        store.emit('delivery-resumed', `${job.key}: ${job.detail}`, 'pm', job.key);
        resumed.push(job.key);
    }
    return resumed;
}
