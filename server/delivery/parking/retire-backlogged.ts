import { hasUncertainEffects } from '../pipeline/github-delivery';
import type { Store } from '../../store/store';
import type { AssignedIssue, TicketJob } from '../../../src/shared';

/** A stopped job whose card a person moved to Backlog is retired; a later move to the pickup lane starts fresh. */
export function retireBacklogged(store: Store, jobs: TicketJob[], assigned: AssignedIssue[]): string[] {
    const retired: string[] = [];
    for (const job of jobs.filter(job => ['blocked', 'interrupted'].includes(job.status))) {
        const lane = assigned.find(issue => issue.key === job.key)?.pickupStatus;
        if (lane?.trim().toLowerCase() !== 'backlog' || needsReconciliation(store, job))
            continue;
        const prior = job.detail;
        job.status = 'cancelled';
        job.detail = `Card moved to Backlog; retired at ${job.stage} with no PR. Moving it to the pickup lane starts fresh. Earlier: ${prior}`;
        store.emit('delivery-retired', `${job.key}: ${job.detail}`, 'pm', job.key);
        retired.push(job.key);
    }
    return retired;
}
// A published PR, a live worker, a pending operator request or any unconfirmed
// effect (stage receipts, board moves, source-configuration attempts) still needs
// its own reconciliation, so the job is kept.
function needsReconciliation(store: Store, job: TicketJob): boolean {
    const source = job.implementationContinuation?.sourceConfig;
    return !!(job.pr || job.prUrl || source?.attemptOpen || source?.reservation)
        || !!store.state.workLog?.some(w => w.requestId === job.id && ['running', 'stopping'].includes(w.status))
        || !!store.state.coordination?.requests?.some(r => r.key === job.key && ['queued', 'working'].includes(r.status))
        || !!job.boardUpdates?.some(update => update.status !== 'verified')
        || job.steps.some(step => hasUncertainEffects(step.stage, step.result));
}
