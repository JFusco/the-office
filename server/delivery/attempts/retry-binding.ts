import { currentAssignment } from '../../workers/assignment-context';
import { retryWork } from '../../../src/work/retry-label';
import type { DeliveryRetryBinding, ReadRetry, TicketJob } from '../../../src/shared';

/** A fresh delivery retry budget for the job's present stage and head. */
export const freshRetry = (job: Pick<TicketJob, 'stage' | 'head'>): ReadRetry => ({ attempts: 0, nextAt: '', history: [], exhausted: false, stage: job.stage, head: job.head });

/** The record counts for this stage and head: scoped to them, or saved before scoping (`legacy-retry.ts` binds those on load). */
export function inScope(retry: ReadRetry | undefined, job: Pick<TicketJob, 'stage' | 'head'>): retry is ReadRetry {
    return !!retry && (retry.stage === undefined || retry.stage === job.stage && retry.head === job.head);
}

/** The job's budget for its present stage and head; a record from another stage or head is replaced by a fresh one. */
export function scopedRetry(job: TicketJob): ReadRetry {
    if (!inScope(job.retry, job)) job.retry = freshRetry(job);
    const retry = job.retry!;
    retry.stage ??= job.stage;
    retry.head ??= job.head;
    return retry;
}

/** What a planned retry is bound to, as the job stands at its stop. */
export function bindRetry(job: TicketJob, mode: DeliveryRetryBinding['mode'], reason: string, updates?: DeliveryRetryBinding['updates']): DeliveryRetryBinding {
    return { job: job.id, stop: job.stop?.at ?? '', stage: job.stage, head: job.head, pr: job.pr, branch: job.branch, worktree: job.worktree, mode, reason, ...(updates ? { updates } : {}) };
}

/** Why the job no longer matches the stop and work its retry was planned for, or null when it still does. */
export function bindingChanged(job: TicketJob, binding: DeliveryRetryBinding): string | null {
    if (binding.job !== job.id) return 'The planned retry belongs to another job';
    if (binding.stage !== job.stage) return `The job moved from ${binding.stage} to ${job.stage} after its retry was planned`;
    if (binding.head !== job.head) return 'The job head changed after its retry was planned';
    if (binding.pr && binding.pr !== job.pr || binding.branch !== job.branch || binding.worktree !== job.worktree) return 'The candidate or pull request changed after its retry was planned';
    return null;
}

/** The bound retry the current scheduler claim entered, if any: what `step` runs under is an automatic retry. */
export function activeRetry(job: Pick<TicketJob, 'retry'>): DeliveryRetryBinding | undefined {
    const binding = job.retry?.binding, claim = currentAssignment()?.claim;
    return binding?.claim && claim && binding.claim === claim.id ? binding : undefined;
}

/** A retry the planner queued for the job's current stop, not yet entered under a claim. */
export function queuedRetry(job: TicketJob): DeliveryRetryBinding | undefined {
    const binding = job.retry?.binding;
    return job.status === 'queued' && binding?.queuedAt && !binding.claim && binding.stop === (job.stop?.at ?? '') ? binding : undefined;
}

/** The job's detail while its retry is queued: the applicable count, or that a quota wait counts none. */
export function queuedDetail(retry: ReadRetry, mode: DeliveryRetryBinding['mode'], quota: boolean): string {
    const work = retryWork(mode), note = mode === 'board' ? ' Nothing is resent; publication is only read back.' : mode === 'draft' ? ' Existing pushes and the PR are adopted; nothing is resent.' : '';
    return quota ? `GitHub quota wait ended; automatic ${work} queued with no attempt counted.${note} Original failure retained in retry history.`
        : `Automatic ${mode === 'read' ? 'read-only retry' : work} ${retry.attempts}/${retry.limit ?? 3} queued.${note} Original failure retained in retry history.`;
}

/**
 * Takes a planned retry back and shows its stop to a person: the timer is cleared, the diagnostic is kept and the
 * reason recorded. A queued retry returns to its stop. Work that has since moved on is left as it is.
 */
export function withdrawRetry(job: TicketJob, reason: string, now: Date): boolean {
    const retry = job.retry, binding = retry?.binding;
    if (!retry || !binding) return false;
    const queued = !!queuedRetry(job) || job.status === 'working' && !!binding.claim && binding.claim === currentAssignment()?.claim.id;
    if (!retry.nextAt && !queued) return false;
    retry.nextAt = '';
    retry.withdrawn = { at: now.toISOString(), reason, stop: binding.stop };
    if (queued) {
        job.status = 'blocked';
        job.detail = `${binding.detail || job.detail}\nAutomatic retry withdrawn: ${reason}.`;
    }
    return true;
}
