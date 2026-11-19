import { holdReason } from '../../office/project-holds';
import { harnessDelivers } from '../harness/scope';
import { teamReviewedHead } from '../readiness/team-review';
import { findingsBlock } from '../findings/advisory';
import { hasUncertainEffects } from '../pipeline/github-delivery';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

/** Same bound as conflict repair: repeated base changes need Morgan. */
const MAX_BASE_UPDATES = 3;

/** The team's exact-head verdict, or Sam's accepted exact-head readiness review after an earlier refresh. */
function reviewedHead(store: Store, job: TicketJob): boolean {
    if (teamReviewedHead(store, job)) return true;
    const lead = job.steps.filter(step => step.stage === 'lead-pr').at(-1)?.result;
    return lead?.outcome === 'passed' && lead.commit === job.head && job.reviewContext?.head === job.head
        && !findingsBlock(store, lead.findings, finding => finding.status === 'open');
}

/** An accepted refresh at this head: Joe's recorded rule needs no repeated source review after a conflict repair. */
function refreshedHead(job: TicketJob): boolean {
    const refresh = job.steps.filter(step => step.stage === 'update-base').at(-1)?.result;
    return job.repairReason === 'conflicts' && refresh?.outcome === 'passed' && refresh.commit === job.head
        && refresh.evidence.some(evidence => evidence.kind === 'checks' && evidence.commit === job.head);
}

/** No other owner, worker, unconfirmed board move or effect may be in flight for this job; `ownClaimId` is the caller's own claim. */
export function refreshSettled(store: Store, job: TicketJob, ownClaimId?: string): boolean {
    const intent = store.getEffect(job.mergeIntentId || `merge:${job.id}:${job.head}`);
    return !store.activeClaims().some(claim => claim.work.kind === 'delivery' && claim.work.id === job.id && claim.id !== ownClaimId)
        && !store.state.workLog?.some(work => work.requestId === job.id && ['running', 'stopping'].includes(work.status) && (!ownClaimId || work.claimId !== ownClaimId))
        && !job.boardUpdates?.some(update => update.status !== 'verified')
        && !job.steps.some(step => hasUncertainEffects(step.stage, step.result))
        && !(intent && (intent.dispatchedAt || !['prepared', 'rejected'].includes(intent.status)));
}

/**
 * Whether a refresh may replace conflict repair for this job, apart from in-flight work settling.
 * At merge the head was reviewed. At Sam's readiness review the head must be team-reviewed or an
 * accepted refresh head; `claimed` also admits the job while its own review step holds the claim.
 */
export function refreshEligible(store: Store, job: TicketJob, p: any, claimed = false): boolean {
    if (!harnessDelivers(store, job) || !(job.stage === 'merge' ? ['blocked', 'interrupted', 'watching'].includes(job.status) : job.stage === 'lead-pr' && (job.status === 'watching' || claimed && job.status === 'working')))
        return false;
    // A source-repair cycle with findings still pending keeps its own reconciliation contract. A finished one is only
    // the record of an earlier repair: it is never removed, and must not send a later conflict down the older route.
    if (store.state.paused || store.state.draining || holdReason(store.project, job.key) || job.mergeAttempt || job.mergeApprovalRequired || job.repairCycle?.pendingFindingIds?.length || !job.worktree || !job.branch || !job.pr)
        return false;
    if (!store.state.coordination?.merges?.enabled && job.mergeAuthorization?.head !== job.head)
        return false;
    if (p.state !== 'open' || p.draft || p.merged_at || p.mergeable !== false || p.head?.sha !== job.head || p.head?.ref !== job.branch || p.base?.ref !== store.project.target)
        return false;
    if (job.steps.filter(step => step.stage === 'update-base').length >= MAX_BASE_UPDATES)
        return false;
    if (job.stage === 'merge')
        return reviewedHead(store, job);
    // GitHub's own conflict report on a reviewed head is enough; Sam's assessment is not required.
    return !!teamReviewedHead(store, job) || refreshedHead(job);
}

/**
 * A hands-off, reviewed PR that became conflicting after another merge (at the guarded merge or during
 * Sam's readiness review) goes back to Alex in its own worktree: he forward-merges current main and
 * runs required checks, the harness updates the same PR, and Sam reviews the merged head before the
 * guarded merge. Returns true when the job was requeued.
 */
export function refreshConflicted(store: Store, job: TicketJob, p: any): boolean {
    if (!refreshEligible(store, job, p) || !refreshSettled(store, job))
        return false;
    job.repairReason = 'conflicts';
    job.stage = 'update-base';
    job.status = 'queued';
    job.detail = `PR #${job.pr} conflicts with ${store.project.target} after another merge. Alex merges current ${store.project.target} into the same branch and runs required checks; the harness updates the same PR and Sam reviews the merged head before the guarded merge.`;
    store.emit('pr-conflict-refresh-queued', `${job.key}: ${job.detail}`, 'developer', job.key);
    return true;
}
