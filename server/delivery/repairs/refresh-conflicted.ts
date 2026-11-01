import { HOLDS } from '../../office/config';
import { harnessDelivers } from '../harness/scope';
import { teamReviewedHead } from '../readiness/team-review';
import { findingsBlock } from '../findings/advisory';
import { conflictOnlyAssessment } from './conflict-repair';
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

/** No other owner, worker, unconfirmed board move or effect may be in flight for this job. */
function settled(store: Store, job: TicketJob): boolean {
    const intent = store.getEffect(job.mergeIntentId || `merge:${job.id}:${job.head}`);
    return !store.activeClaims().some(claim => claim.work.kind === 'delivery' && claim.work.id === job.id)
        && !store.state.workLog?.some(work => work.requestId === job.id && ['running', 'stopping'].includes(work.status))
        && !job.boardUpdates?.some(update => update.status !== 'verified')
        && !job.steps.some(step => hasUncertainEffects(step.stage, step.result))
        && !(intent && (intent.dispatchedAt || !['prepared', 'rejected'].includes(intent.status)));
}

/**
 * Whether a refresh may replace conflict repair for this job, apart from in-flight work settling.
 * At merge the head was reviewed. During Sam's readiness review, his latest result must be the
 * conflict itself, on a team-reviewed head or an accepted refresh head.
 */
export function refreshEligible(store: Store, job: TicketJob, p: any): boolean {
    if (!harnessDelivers(store, job) || !(job.stage === 'merge' ? ['blocked', 'interrupted', 'watching'].includes(job.status) : job.stage === 'lead-pr' && job.status === 'watching'))
        return false;
    // A retained source-repair cycle keeps its own reconciliation contract.
    if (store.state.paused || store.state.draining || HOLDS[job.key] || job.mergeAttempt || job.mergeApprovalRequired || job.repairCycle || !job.worktree || !job.branch || !job.pr)
        return false;
    if (!store.state.coordination?.merges?.enabled && job.mergeAuthorization?.head !== job.head)
        return false;
    if (p.state !== 'open' || p.draft || p.merged_at || p.mergeable !== false || p.head?.sha !== job.head || p.head?.ref !== job.branch || p.base?.ref !== store.project.target)
        return false;
    if (job.steps.filter(step => step.stage === 'update-base').length >= MAX_BASE_UPDATES)
        return false;
    if (job.stage === 'merge')
        return reviewedHead(store, job);
    const lead = job.steps.filter(step => step.stage === 'lead-pr').at(-1)?.result;
    return lead?.commit === job.head && conflictOnlyAssessment(lead) && (!!teamReviewedHead(store, job) || refreshedHead(job));
}

/**
 * A hands-off, reviewed PR that became conflicting after another merge (at the guarded merge or during
 * Sam's readiness review) goes back to Alex in its own worktree: he forward-merges current main and
 * runs required checks, the harness updates the same PR, and Sam reviews the merged head before the
 * guarded merge. Returns true when the job was requeued.
 */
export function refreshConflicted(store: Store, job: TicketJob, p: any): boolean {
    if (!refreshEligible(store, job, p) || !settled(store, job))
        return false;
    job.repairReason = 'conflicts';
    job.stage = 'update-base';
    job.status = 'queued';
    job.detail = `PR #${job.pr} conflicts with ${store.project.target} after another merge. Alex merges current ${store.project.target} into the same branch and runs required checks; the harness updates the same PR and Sam reviews the merged head before the guarded merge.`;
    store.emit('pr-conflict-refresh-queued', `${job.key}: ${job.detail}`, 'developer', job.key);
    return true;
}
