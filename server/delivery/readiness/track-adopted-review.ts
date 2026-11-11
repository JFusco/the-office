import { assertDeliveryMayMutate } from '../harness/guards';
import { harnessDelivers } from '../harness/scope';
import { hasUncertainEffects } from '../pipeline/github-delivery';
import { workKey } from '../../../src/shared';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

/** Track a verified bot update before its new assessment; never rebind an owned candidate. */
export function trackAdoptedReview(store: Store, jobs: TicketJob[], job: TicketJob, pr: any) {
    if (!harnessDelivers(store, job) || !job.existingPR || job.worktree || pr.head?.sha === job.head) return;
    assertDeliveryMayMutate(store, jobs, job, job.head);
    const merge = store.getEffect(job.mergeIntentId || `merge:${job.id}:${job.head}`);
    const unsettled = store.db.prepare("SELECT id FROM effects WHERE work_key=? AND status IN ('dispatching','uncertain') LIMIT 1")
        .get(workKey({ projectId: store.project.id, kind: 'delivery', id: job.id }));
    if (store.state.draining || job.stage !== 'lead-pr' || job.status !== 'working' || job.repairCycle ||
        job.mergeAttempt || job.mergeCommit || job.mergeIntentId || job.mergeApprovalRequired || unsettled ||
        merge?.dispatchedAt || job.steps.some(s => hasUncertainEffects(s.stage, s.result)) ||
        pr.number !== job.pr || pr.state !== 'open' || pr.merged_at || pr.draft || !/^[a-f0-9]{40}$/.test(pr.head?.sha || '') ||
        pr.head.repo?.full_name !== store.project.repository || pr.base?.ref !== store.project.target ||
        !pr.head.ref || pr.head.ref === store.project.target || job.branch && job.branch !== pr.head.ref)
        throw new Error('Advanced adopted PR requires an unowned, settled same-repository review identity');
    const previous = job.head;
    job.head = pr.head.sha; job.branch = pr.head.ref;
    delete job.reviewContext;
    store.emit('adopted-review-head-tracked', `${job.key}: verified adopted head changed from ${previous} to ${job.head}; fresh Lead assessment follows. Prior results retained.`, 'lead', job.key);
}
