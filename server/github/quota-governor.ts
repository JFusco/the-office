import type { OfficeProject } from '../../src/shared';
import type { RateLimitSamples, ResourceReading } from './rate-limit-samples';

const MINUTE = 60_000;
/** The share of the core limit kept for protected work: at or below it, background observation waits for the reset. */
export const CORE_RESERVE = 0.1;
/** The quota probe runs at most this often, across every project. */
export const PROBE_INTERVAL_MS = 30_000;
const LONGEST_BACKOFF_MS = 16 * MINUTE;

/** Background GitHub observation waits until `until` (ISO). */
export interface QuotaHold { until: string }
/** What a caller asks before a background GitHub read. */
export interface QuotaGate { hold(): QuotaHold | undefined }
/** GitHub's stated rate-limit refusal of one call (`quota-refusal.ts`), with what its own headers said. */
export interface QuotaRefusal { secondary: boolean; retryAfterMs?: number; reading?: ResourceReading }

export const noQuotaHold: QuotaGate = { hold: () => undefined };
/** The hold over a project's background GitHub observation: GitHub projects only, and only where there is a governor. */
export const backgroundHold = (project: Pick<OfficeProject, 'provider'>, gate?: QuotaGate): QuotaHold | undefined =>
    project.provider === 'github' ? gate?.hold() : undefined;
/** The status line a deferral shows. A deferral is never an error. */
export const quotaLow = (hold: QuotaHold) => `GitHub quota low. Observation resumes at ${hold.until}.`;

/**
 * One account budget for every project of an Office instance. Background observation is held while the latest
 * core reading is at or below the reserve, until that reading's reset; and after a stated refusal, until its
 * Retry-After, its zero-remaining reset or a backoff of at least a minute that doubles on each repeat, until a quiet
 * spell as long as that backoff follows the hold. Only a core reading counts for core, so no other resource's response
 * lifts it. Refusals while a hold stands join it. A primary
 * refusal that the latest core reading does not explain starts the shared probe (`RateLimitSamples.sample`, one in
 * flight, at most every 30 seconds); a failed probe changes nothing, and the probe's own refusal never probes again.
 * With no reading and no refusal nothing is held. Protected work never asks. Memory only: a restart holds nothing.
 */
export class QuotaGovernor implements QuotaGate {
    private refusedUntil = 0;
    private repeats = 0;
    private backoffMs = 0;
    constructor(private samples: Pick<RateLimitSamples, 'latest' | 'sample'>, private now = () => Date.now()) { }
    hold(): QuotaHold | undefined {
        const now = this.now(), until = Math.max(this.refusedUntil, this.coreLowUntil(now));
        return until > now ? { until: new Date(until).toISOString() } : undefined;
    }
    private coreLowUntil(now: number): number {
        const core = this.samples.latest('core'), reset = (core?.reset ?? 0) * 1000;
        return core && reset > now && core.remaining <= core.limit * CORE_RESERVE ? reset : 0;
    }
    /** `probe` is false for the probe's own call. */
    refused(refusal: QuotaRefusal, probe = true): void {
        const now = this.now();
        if (!this.hold()) this.repeats++;
        const reset = refusal.reading?.remaining === 0 ? refusal.reading.reset * 1000 : 0;
        this.backoffMs = Math.min(MINUTE * 2 ** (Math.max(this.repeats, 1) - 1), LONGEST_BACKOFF_MS);
        const until = refusal.retryAfterMs !== undefined ? now + refusal.retryAfterMs
            : reset > now ? reset
            : now + this.backoffMs;
        this.refusedUntil = Math.max(this.refusedUntil, until);
        if (probe && !refusal.secondary && !this.coreLowUntil(now)) void this.samples.sample(undefined, PROBE_INTERVAL_MS);
    }
    /** A call answered after a quiet spell as long as the last backoff, with no hold: the next refusal starts again from a minute. */
    answered(): void { if (!this.hold() && this.now() - this.refusedUntil >= this.backoffMs) this.repeats = 0; }
}
