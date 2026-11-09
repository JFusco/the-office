import { deliveryHumanInputs, deliveryInputSha256 } from '../../github/github-context';
import { HOLDS } from '../../office/config';
import { currentAssignment } from '../../workers/assignment-context';
import { hasUncertainEffects } from '../pipeline/github-delivery';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';

/** A preflight may invalidate acceptance after an asynchronous provider read. */
export class FreshMergeReview extends Error {}

/** Changed inputs queue a fresh read-only assessment; no acceptance or write is reused. */
export async function refreshMergeReview(delivery: GitHubDelivery, job: TicketJob, pr: any, scheduled = false) {
    const { store } = delivery, context = job.reviewContext;
    const eligible = () => {
        const assignment = scheduled ? currentAssignment() : undefined;
        const intent = store.getEffect(job.mergeIntentId || `merge:${job.id}:${job.head}`);
        return context && job.reviewContext === context && job.stage === 'merge' &&
            (scheduled ? ['working', 'queued'] : ['blocked', 'interrupted', 'watching']).includes(job.status) &&
            !job.mergeAttempt && !job.mergeCommit && !job.mergeApprovalRequired && !HOLDS[job.key] && !store.state.paused && !store.state.draining &&
            delivery.jobs.find(j => j.id === job.id) === job &&
            !store.activeClaims().some(c => c.work.kind === 'delivery' && c.work.id === job.id && c.id !== assignment?.claim.id) &&
            !store.state.workLog?.some(w => w.requestId === job.id && ['running', 'stopping'].includes(w.status) && w.claimId !== assignment?.claim.id) &&
            !job.steps.some(s => hasUncertainEffects(s.stage, s.result)) &&
            (!intent || !intent.dispatchedAt && ['prepared', 'rejected'].includes(intent.status));
    };
    if (!eligible() || pr.state !== 'open' || pr.draft || pr.head?.sha !== job.head || pr.base?.ref !== store.project.target) return false;
    const issue = await delivery.api(`issues/${Number(job.key.slice(3))}`);
    if (!eligible()) return false;
    if (context!.head === pr.head.sha && context!.target === pr.base.ref && context!.baseSha === pr.base.sha && context!.prUpdatedAt === pr.updated_at && context!.issueUpdatedAt === issue.updated_at &&
        (job.reviewInputSha256 ? job.reviewInputSha256 === deliveryInputSha256(store, job.key) : !deliveryHumanInputs(store, job.key).length)) return false;
    job.stage = 'lead-pr'; job.status = 'queued';
    delete job.reviewContext;
    // Only an absent or proven undispatched intent passed eligible(); retain its durable effect row.
    delete job.mergeIntentId;
    job.detail = 'Base, issue or authenticated review inputs changed before any merge write; fresh current-head Lead review queued. Prior assessments retained.';
    store.emit('merge-review-refreshed', job.detail, 'lead', job.key);
    return true;
}
