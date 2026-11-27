import { bindRetry, queuedDetail, scopedRetry, withdrawRetry } from './retry-binding';
import { QUOTA_FALLBACK_MS, quotaCap } from './transient-schedule';
import type { DeliveryRetryDecision } from './delivery-retry';
import type { TicketJob } from '../../../src/shared';

const iso = (ms: number) => new Date(ms).toISOString();

/**
 * Applies one delivery retry decision to its job: schedules the next wait, queues the job when the wait is
 * over, withdraws a planned retry the decision no longer supports, or records exhaustion. The same synchronous
 * decision runs when planning and when the timer fires. A counted attempt is spent once, when the job becomes
 * queued; a GitHub quota wait spends none and ends at six hours. Returns what changed, for the scheduler event.
 */
export function planDeliveryRetry(job: TicketJob, decision: DeliveryRetryDecision, now: Date): string | undefined {
    const retry = job.retry;
    if (decision.state !== 'pending') {
        // A bound record is inspected whatever stage the job is at now; work that moved on keeps its stage.
        if (retry?.binding && withdrawRetry(job, decision.reason, now)) {
            if (decision.state === 'exhausted') retry.exhausted = true;
            return `planned retry withdrawn: ${decision.reason}`;
        }
        if (decision.state === 'exhausted' && retry && !retry.exhausted) {
            retry.exhausted = true;
            retry.nextAt = '';
            return `retries exhausted (${decision.reason}); team follow-up required`;
        }
        return;
    }
    const r = scopedRetry(job), policy = decision.policy!;
    if (job.status === 'queued') return;
    // A timer planned for an earlier stop is not this stop's: the new stop is scheduled on its own.
    if (r.nextAt && r.binding && r.binding.stop !== (job.stop?.at ?? '')) r.nextAt = '';
    // A timer saved before bindings existed is bound to the stop it was loaded with.
    if (r.nextAt && !r.binding) r.binding = bindRetry(job, decision.mode!, decision.reason, decision.updates);
    if (!r.nextAt) {
        r.history.push({ at: now.toISOString(), detail: job.detail });
        r.latest = { at: now.toISOString(), detail: decision.diagnostic! };
        r.binding = bindRetry(job, decision.mode!, decision.reason, decision.updates);
        delete r.withdrawn;
        if (policy.kind === 'quota') {
            const stopped = Date.parse(job.stop?.at ?? '');
            r.quota ??= { since: Number.isFinite(stopped) ? job.stop!.at : now.toISOString() };
            // A refusal saved at the stop carries its own deadline; one known only from its text waits the fallback.
            const due = Date.parse(r.failure?.retryAt ?? '') || (Number.isFinite(stopped) ? stopped : now.getTime()) + QUOTA_FALLBACK_MS;
            r.failure ??= { category: 'provider-limit', retryAt: iso(due), detail: decision.diagnostic!, dispatched: true };
            r.nextAt = iso(Math.min(due, quotaCap(r.quota.since)));
            return `GitHub quota wait until ${r.nextAt}; no attempt counted`;
        }
        // A distinct stop that is not a quota refusal ends the quota episode.
        if (r.failure?.category === 'provider-limit') { delete r.failure; delete r.quota; }
        r.limit = policy.limit;
        r.nextAt = iso(now.getTime() + policy.delays[r.attempts]);
        return `${decision.mode === 'read' ? 'read-only review' : decision.mode === 'board' ? 'card read-back' : 'publication'} retry ${r.attempts + 1}/${r.limit} scheduled for ${r.nextAt}`;
    }
    if (now.getTime() < Date.parse(r.nextAt)) return;
    const quota = policy.kind === 'quota';
    if (quota && now.getTime() >= quotaCap(r.quota!.since)) {
        r.exhausted = true;
        r.nextAt = '';
        return 'GitHub quota did not reset within six hours; team follow-up required';
    }
    if (!quota) r.attempts++;
    r.nextAt = '';
    r.binding!.detail = job.detail;
    r.binding!.queuedAt = now.toISOString();
    delete r.binding!.claim;
    job.status = 'queued';
    job.detail = queuedDetail(r, decision.mode!, quota);
    return quota ? 'retry queued after the GitHub quota wait; no attempt counted' : `retry ${r.attempts}/${r.limit} queued`;
}
