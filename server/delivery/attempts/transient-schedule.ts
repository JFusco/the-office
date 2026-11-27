import { ATTEMPT_DELAYS_MS } from './attempt-backoff';
import { ghServerError, ghTooManyRequests } from '../../scheduling/temporary-read';
import { QUOTA_EPISODE_MS } from '../../../src/work/retry-label';
import type { ReadRetry } from '../../../src/shared';

const MINUTE = 60_000;
/** Counted waits after the three short attempts for a GitHub server error that keeps failing: 15, 30 and 60 minutes. */
export const SERVER_ERROR_TAIL_MS: readonly number[] = [15 * MINUTE, 30 * MINUTE, 60 * MINUTE];
/** The wait for an attributable GitHub refusal that states no window and has no longer refusal behind it. */
export const QUOTA_FALLBACK_MS = MINUTE;
export { QUOTA_EPISODE_MS };

/** How a delivery stop is retried: counted waits for an ordinary transient read, an uncounted wait for a GitHub quota refusal. */
export type DeliveryPolicy = { kind: 'counted'; delays: readonly number[]; limit: number } | { kind: 'quota' };

/** A GitHub quota refusal of a gh read: one saved at the stop with its deadline, or gh's bare 429 or stated rate limit. */
export function quotaStop(diagnostic: string, retry?: Pick<ReadRetry, 'failure'>): boolean {
    return retry?.failure?.category === 'provider-limit' && !!retry.failure.retryAt || ghTooManyRequests.test(diagnostic) ||
        /\bgh\b/.test(diagnostic) && /API rate limit exceeded|exceeded a secondary rate limit/i.test(diagnostic);
}

/**
 * The delivery job loop's policy for one stop. The writer restarts, intake reviews, offline activation and maintenance
 * keep their own: this is chosen only by `reconcileReadRetries` for delivery jobs. A GitHub server error that keeps
 * failing continues past the three short attempts into the counted tail; anything else stops after the three.
 */
export function deliveryPolicy(diagnostic: string, retry?: Pick<ReadRetry, 'failure'>): DeliveryPolicy {
    if (quotaStop(diagnostic, retry)) return { kind: 'quota' };
    const delays = ghServerError(diagnostic) ? [...ATTEMPT_DELAYS_MS, ...SERVER_ERROR_TAIL_MS] : ATTEMPT_DELAYS_MS;
    return { kind: 'counted', delays, limit: delays.length };
}

/** The end of the six-hour quota episode that began at `since`. */
export const quotaCap = (since: string) => Date.parse(since) + QUOTA_EPISODE_MS;
