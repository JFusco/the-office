import { hasUncertainEffects } from '../pipeline/github-delivery';
import { assertMayMutate } from '../harness/guards';
import { removeCandidate } from '../candidate/remove-candidate';
import { recordCandidateCleanup } from '../candidate/cleanup-status';
import { workKey, type AssignedIssue, type TicketJob } from '../../../src/shared';
import type { command } from '../../workers/process';
import type { Store } from '../../store/store';

const STOPPED = ['blocked', 'interrupted'];

/**
 * A stopped job whose card a person moved to Backlog is retired with a clean slate: its
 * Office-created worktree and branches are removed first, so a later move to the pickup lane starts fresh.
 */
export async function retireBacklogged(store: Store, execute: typeof command, jobs: TicketJob[], assigned: AssignedIssue[]): Promise<string[]> {
    const retired: string[] = [];
    const backlog = (job: TicketJob) => assigned.find(issue => issue.key === job.key)?.pickupStatus?.trim().toLowerCase() === 'backlog';
    // A pending retirement cleanup belongs to the Backlog decision; it is withdrawn when the card or job moves on.
    for (const job of jobs.filter(job => job.candidateCleanup?.status === 'pending' && job.status !== 'completed' && (!STOPPED.includes(job.status) || !backlog(job))))
        delete job.candidateCleanup;
    for (const job of jobs.filter(job => STOPPED.includes(job.status))) {
        if (!backlog(job) || needsReconciliation(store, job))
            continue;
        const head = job.head;
        // Cleanup awaits Git and GitHub; a job requeued meanwhile is no longer this decision's to retire.
        const guard = () => { assertMayMutate(store, jobs, job, head); if (!STOPPED.includes(job.status)) throw new Error(`${job.key} is ${job.status} again; retirement withdrawn`); };
        const removal = await removeCandidate(store, execute, job, guard).catch(error => error instanceof Error ? error : new Error(String(error)));
        if (!STOPPED.includes(job.status))
            continue; // Requeued while cleanup ran; nothing to record against this decision.
        recordCandidateCleanup(store, job, removal);
        if (removal instanceof Error)
            continue; // The job stays visible, with the pending cleanup in the outbox.
        const prior = job.detail;
        job.status = 'cancelled';
        job.detail = `Card moved to Backlog; retired at ${job.stage} with no PR. ${job.candidateCleanup!.detail} Moving it to the pickup lane starts fresh. Earlier: ${prior}`;
        store.emit('delivery-retired', `${job.key}: ${job.detail}`, 'pm', job.key);
        retired.push(job.key);
    }
    return retired;
}
// A published PR, a live worker, a pending operator request or any unconfirmed
// effect (stage receipts, harness effects, board moves, source-configuration attempts)
// still needs its own reconciliation, so the job is kept.
function needsReconciliation(store: Store, job: TicketJob): boolean {
    const source = job.implementationContinuation?.sourceConfig;
    return !!(job.pr || job.prUrl || source?.attemptOpen || source?.reservation)
        || !!store.state.workLog?.some(w => w.requestId === job.id && ['running', 'stopping'].includes(w.status))
        || !!store.state.coordination?.requests?.some(r => r.key === job.key && ['queued', 'working'].includes(r.status))
        || !!job.boardUpdates?.some(update => update.status !== 'verified')
        // Its own earlier remote-branch delete is settled by the cleanup's read-back, not here.
        || !!store.db.prepare("SELECT 1 FROM effects WHERE work_key=? AND status IN ('dispatching','uncertain') AND id NOT LIKE ?").get(workKey({ projectId: store.project.id, kind: 'delivery', id: job.id }), `harness:${job.id}:remove-remote:%`)
        || job.steps.some(step => hasUncertainEffects(step.stage, step.result));
}
