import { CurrentChecksWait, checksPending, selectCurrentChecks } from './github-check-selection';
import { refreshEligible, refreshSettled } from '../repairs/refresh-conflicted';
import { currentAssignment } from '../../workers/assignment-context';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { StopKind, TicketJob } from '../../../src/shared';

export interface ReviewWait { kind: StopKind; detail: string }

/**
 * Whether Sam's readiness review should wait on a fact GitHub already reports: a draft PR, a
 * conflict the harness refreshes itself, or current-head checks that are still running. Pure
 * rule; a conflict the refresh cannot take returns null so the review still assesses it.
 */
export function reviewWait(pr: { draft?: boolean; mergeable?: boolean | null }, refreshable: boolean, checksRunning: boolean): ReviewWait | null {
    if (pr.draft) return { kind: 'pr-not-ready', detail: 'PR is a draft. The readiness review runs once it is marked ready; no model run was spent.' };
    if (pr.mergeable === false && refreshable) return { kind: 'pr-not-ready', detail: 'PR conflicts with its target. The harness refreshes the reviewed branch before the readiness review; no model run was spent.' };
    if (checksRunning) return { kind: 'provider-checks', detail: 'Current-head checks are still running. The readiness review runs once they finish; no model run was spent.' };
    return null;
}

/** A check GitHub is executing or about to; one waiting on a person (approval, request) is the review's to report. */
const executing = (check: any) => ['queued', 'in_progress'].includes(check.status) && check.conclusion == null;

/**
 * Reads the facts for `reviewWait`. A conflict waits only when the refresh could take it now
 * (eligible and nothing else in flight). A moved head or an unreadable check set never delays
 * the review; a newer workflow execution that is still queued does.
 */
export async function readReviewWait(delivery: GitHubDelivery, job: TicketJob, pr: any, read?: { checks: any; statuses: any }): Promise<ReviewWait | null> {
    const { store } = delivery;
    const refreshable = pr.mergeable === false && refreshEligible(store, job, pr, true) && refreshSettled(store, job, currentAssignment()?.claim.id);
    let running = false;
    if (!pr.draft && !refreshable && pr.head?.sha === job.head) {
        try {
            const checks = read?.checks ?? await delivery.api(`commits/${job.head}/check-runs?per_page=100`), statuses = read?.statuses ?? await delivery.api(`commits/${job.head}/status`);
            const selection = await selectCurrentChecks(delivery, job, checks, pr, statuses);
            running = checksPending(selection, statuses, job.head!) && [...selection.effective, ...selection.workflows].some(executing);
        }
        catch (error) { running = error instanceof CurrentChecksWait; }
    }
    return reviewWait(pr, refreshable, running);
}

/** Records the wait on the job. The stop keeps the time the wait began, not the latest poll. */
export function applyReviewWait(job: TicketJob, wait: ReviewWait, now: Date) {
    job.status = 'watching';
    job.detail = wait.detail;
    if (job.stop?.kind !== wait.kind) job.stop = { kind: wait.kind, at: now.toISOString() };
}
