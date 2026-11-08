import type { Store } from '../../store/store';
import { workKey, type TicketJob } from '../../../src/shared';

/** A finished local CI repair can be retained when Joe settles its published PR elsewhere. */
export function settledExternalRepair(store: Store, job: TicketJob): boolean {
    if (store.state.paused || !job.existingPR || !job.pr || !job.head ||
        !['blocked', 'interrupted'].includes(job.status) || job.stage !== 'update-base' || job.repairReason !== 'ci' ||
        job.mergeAttempt || job.mergeIntentId || job.mergeCommit ||
        job.boardUpdates?.some(update => update.status !== 'verified') ||
        job.candidateRecovery || job.candidateBase || job.candidateCleanup ||
        job.implementationContinuation || job.implementationRecovery || job.discoveryRecovery ||
        job.sourceAmendment || job.repairCycle ||
        !job.ciRepairs?.length || job.ciRepairs.some(repair => repair.phase !== 'done') ||
        job.steps.some(step => step.result.receipts.some(receipt => !receipt.verified || receipt.uncertain)) ||
        store.activeClaims().some(claim => claim.work.id === job.id || claim.work.id === `ticket:${job.key}`) ||
        store.state.coordination?.requests?.some(request => request.key === job.key && ['queued', 'working'].includes(request.status))) return false;
    const workers = (store.state.workLog || []).filter(work => work.requestId === job.id);
    return workers.some(work => work.stage === 'github-update-base') &&
        workers.every(work => ['completed', 'blocked'].includes(work.status) && work.executionStatus === 'completed' && !!work.endedAt) &&
        !store.db.prepare("SELECT id FROM effects WHERE work_key=? AND status!='verified' LIMIT 1").get(
            workKey({ projectId: store.project.id, kind: 'delivery', id: job.id }));
}
