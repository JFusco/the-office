import { stopFailure } from '../../github/refusal-capture';
import { ghTooManyRequests } from '../../scheduling/temporary-read';
import { inScope, queuedRetry, scopedRetry } from './retry-binding';
import { QUOTA_FALLBACK_MS, quotaCap, quotaStop } from './transient-schedule';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

const iso = (ms: number) => new Date(ms).toISOString();

/**
 * Saves what the GitHub call that stopped a delivery stage said about quota, in the job's retry budget for this
 * stage and head: an actual refusal of a gh read (its deadline as the quota governor computed it when it observed
 * the call), or gh's bare 429 for a read (a one-minute wait). The episode starts at the first such stop and is
 * kept across queueing and reload; a distinct stop that is not one ends it. A refused write keeps its
 * write-uncertainty handling, and model capacity, a bare 403 and a proactive reserve hold are never refusals here.
 * A late window from the shared probe is applied once, and only while this same stop still stands.
 */
export function noteDeliveryStop(store: Store, job: TicketJob, error: unknown, now: Date): void {
    const failure = stopFailure(String(error)), write = job.stop?.kind === 'uncertain-effect';
    const refusal = !write && failure?.refusal?.readOnly ? failure.refusal : undefined;
    const bare = !write && !refusal && !!failure?.readOnly && ghTooManyRequests.test(failure.text);
    if (!refusal && !bare) {
        if (inScope(job.retry, job)) {
            if (job.retry.failure?.category === 'provider-limit') delete job.retry.failure;
            if (write || !quotaStop(String(error))) delete job.retry.quota;
        }
        return;
    }
    const retry = scopedRetry(job), deadline = Date.parse(refusal?.deadline ?? '') || now.getTime() + QUOTA_FALLBACK_MS;
    retry.failure = { category: 'provider-limit', retryAt: iso(deadline), detail: refusal?.text ?? failure!.text, dispatched: true };
    retry.quota ??= { since: job.stop?.at ?? now.toISOString(), ...(refusal ? { principal: refusal.principal, resource: refusal.resource } : {}) };
    const bound = { stop: job.stop?.at, stage: job.stage, head: job.head };
    void refusal?.late?.then(reset => applyLateWindow(store, job.id, bound, reset), () => undefined);
}

/** A successful readiness read ends the quota episode and keeps the counted retry history. */
export function endDeliveryQuota(job: TicketJob): void {
    if (!inScope(job.retry, job)) return;
    if (job.retry.failure?.category === 'provider-limit') delete job.retry.failure;
    delete job.retry.quota;
}

function applyLateWindow(store: Store, id: string, bound: { stop?: string; stage: string; head: string }, reset: string | undefined): void {
    try {
        const job = store.state.coordination?.jobs?.find(candidate => candidate.id === id);
        if (!reset || !job || job.stop?.at !== bound.stop || job.stage !== bound.stage || job.head !== bound.head || !inScope(job.retry, job)) return;
        const retry = job.retry, saved = retry.failure;
        const until = Date.parse(reset);
        if (saved?.category !== 'provider-limit' || !(until > Date.parse(saved.retryAt ?? ''))) return;
        saved.retryAt = reset;
        if (retry.quota) {
            const due = Math.min(until, quotaCap(retry.quota.since)), queued = queuedRetry(job);
            if (queued && due > store.clock.now().getTime()) {
                job.status = 'blocked';
                job.detail = queued.detail ?? job.detail;
                delete queued.queuedAt;
                retry.nextAt = iso(due);
            } else if (retry.nextAt) {
                retry.nextAt = iso(due);
            }
        }
        store.save();
    } catch { /* A closed store keeps the deadline it saved. */ }
}
