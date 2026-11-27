import type { DeliveryRetryBinding, ReadRetry } from '../shared';

/** The longest one GitHub quota episode at a stage and head is waited out before it is a person's. */
export const QUOTA_EPISODE_MS = 6 * 60 * 60 * 1000;

/** The next planned delivery retry: a counted attempt out of its limit, or an uncounted GitHub quota wait with its deadline and cap. */
export type RetryPlan = { kind: 'counted'; attempt: number; limit: number } | { kind: 'quota'; until: string; cap: string };

/** A record with no limit of its own predates delivery scoping and keeps the three attempts it was planned with. */
export function retryPlan(retry: ReadRetry | undefined): RetryPlan | undefined {
    if (!retry || retry.exhausted) return;
    if (retry.failure?.category === 'provider-limit' && retry.quota?.since)
        return { kind: 'quota', until: retry.nextAt || retry.failure.retryAt || '', cap: new Date(Date.parse(retry.quota.since) + QUOTA_EPISODE_MS).toISOString() };
    return { kind: 'counted', attempt: retry.attempts + 1, limit: retry.limit ?? 3 };
}

/** What the retry does: a draft publishes only through its existing writes, a board recovery only reads its cards back. */
export function retryWork(mode: DeliveryRetryBinding['mode'] | undefined): string {
    return mode === 'draft' ? 'publication retry' : mode === 'board' ? 'card read-back' : 'read retry';
}

/** One sentence for Team Updates, the job detail and IT: the applicable count, or the quota deadline and cap with no count. */
export function retryNext(retry: ReadRetry, at: (iso: string) => string): string {
    const plan = retryPlan(retry), work = retryWork(retry.binding?.mode);
    if (!plan) return '';
    if (plan.kind === 'quota') return `GitHub quota wait: ${work} at ${at(plan.until)}, no attempt counted; a person takes over at ${at(plan.cap)}. No approval needed.`;
    return `Safe ${work} at ${at(retry.nextAt)} (attempt ${plan.attempt}/${plan.limit}). No approval needed.`;
}

/** What IT reports for a retry the planner just queued: the counted attempt and its limit, or that the quota wait ended. */
export function retryQueued(retry: ReadRetry | undefined): string {
    const work = retryWork(retry?.binding?.mode);
    if (!retry) return `safe ${work} queued; completion awaits the team.`;
    if (retry.failure?.category === 'provider-limit' && retry.quota?.since)
        return `safe ${work} queued after the GitHub quota wait, with no attempt counted (a person takes over at ${new Date(Date.parse(retry.quota.since) + QUOTA_EPISODE_MS).toISOString()}); completion awaits the team.`;
    return `safe ${work} ${retry.attempts}/${retry.limit ?? 3} queued; completion awaits the team.`;
}
