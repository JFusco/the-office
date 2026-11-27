import type { OfficeProject } from '../../src/shared';
import type { RateLimitSamples, Resource, ResourceReading } from './rate-limit-samples';

const MINUTE = 60_000;
/** The share of a resource's limit kept for protected work: at or below it, background work needing it waits for the reset. */
export const CORE_RESERVE = 0.1;
/** What background work that reads GraphQL, or depends on a step that does, asks for. Core-only work asks for core. */
export const GRAPHQL_WORK: readonly Resource[] = ['core', 'graphql'];
/** The quota probe runs at most this often, across every project. */
export const PROBE_INTERVAL_MS = 30_000;
const LONGEST_BACKOFF_MS = 16 * MINUTE;

/** Background GitHub observation waits until `until` (ISO). */
export interface QuotaHold { until: string }
/** What a caller asks before a background GitHub read: the resources it needs (core by default) and the principal it reads as (the operator by default). */
export interface QuotaGate { hold(resources?: readonly Resource[], principal?: string): QuotaHold | undefined }
/** The deadline one observed refusal gave its principal, and the shared probe it started or joined. */
export interface RefusalDeadline { until: number; probe?: Promise<void> }
/** GitHub's stated rate-limit refusal of one call (`quota-refusal.ts`), with what its own headers said. */
export interface QuotaRefusal { secondary: boolean; retryAfterMs?: number; reading?: ResourceReading }

export const noQuotaHold: QuotaGate = { hold: () => undefined };
/** The hold over a project's background GitHub observation: GitHub projects only, and only where there is a governor. */
export const backgroundHold = (project: Pick<OfficeProject, 'provider'>, gate?: QuotaGate, resources?: readonly Resource[], principal?: string): QuotaHold | undefined =>
    project.provider === 'github' ? gate?.hold(resources, principal) : undefined;
/** The status line a deferral shows. A deferral is never an error. */
export const quotaLow = (hold: QuotaHold) => `GitHub quota low. Observation resumes at ${hold.until}.`;

/**
 * One account budget for every project of an Office instance. Background work is held while any live reset window of
 * a resource it asks for is at or below the reserve, until the latest such reset; and, whatever it asks for, after a
 * stated refusal, until its Retry-After, its zero-remaining reset or a backoff of at least a minute that doubles on
 * each repeat, until a quiet spell as long as that backoff follows the hold. Only a reading of a resource counts for
 * it, so no other resource's response lifts it. Refusals while a hold stands join it. A primary
 * refusal that the latest core reading does not explain starts the shared probe (`RateLimitSamples.sample`, one in
 * flight, at most every 30 seconds); a failed probe changes nothing, and the probe's own refusal never probes again.
 * With no reading and no refusal nothing is held. Protected work never asks. Memory only: a restart holds nothing.
 */
export class QuotaGovernor implements QuotaGate {
    /**
     * One refusal state per principal: the operator's own windows, and one per App installation shared by every
     * repository it is installed on. A refusal of one principal never holds another.
     */
    private states = new Map<string, { refusedUntil: number; repeats: number; backoffMs: number }>();
    constructor(private samples: Pick<RateLimitSamples, 'liveWindows' | 'sample'>, private now = () => Date.now()) { }
    private state(principal: string) {
        let state = this.states.get(principal);
        if (!state) this.states.set(principal, state = { refusedUntil: 0, repeats: 0, backoffMs: 0 });
        return state;
    }
    hold(resources: readonly Resource[] = ['core'], principal = 'operator'): QuotaHold | undefined {
        const now = this.now(), until = Math.max(this.state(principal).refusedUntil, ...resources.map(resource => this.lowUntil(resource, now, principal)));
        return until > now ? { until: new Date(until).toISOString() } : undefined;
    }
    /** The latest reset among the resource's live windows at or below the reserve: reset order alone says nothing of which is spent. */
    private lowUntil(resource: Resource, now: number, principal: string): number {
        return Math.max(0, ...this.samples.liveWindows(resource, principal).filter(window => window.reset * 1000 > now && window.remaining <= window.limit * CORE_RESERVE).map(window => window.reset * 1000));
    }
    /**
     * `probe` is false for the probe's own call. The probe reads the refused principal's own windows. Returns the
     * deadline this observation gave the principal (the longer of this refusal's and any standing one) and, when
     * the shared probe started or was already running, its settlement, so a caller can read a late window once.
     */
    refused(refusal: QuotaRefusal, probe = true, principal = 'operator'): RefusalDeadline {
        const now = this.now(), state = this.state(principal);
        if (!this.hold(['core'], principal)) state.repeats++;
        const reset = refusal.reading?.remaining === 0 ? refusal.reading.reset * 1000 : 0;
        state.backoffMs = Math.min(MINUTE * 2 ** (Math.max(state.repeats, 1) - 1), LONGEST_BACKOFF_MS);
        const until = refusal.retryAfterMs !== undefined ? now + refusal.retryAfterMs
            : reset > now ? reset
            : now + state.backoffMs;
        state.refusedUntil = Math.max(state.refusedUntil, until);
        const sampled = probe && !refusal.secondary && !this.lowUntil('core', now, principal) ? this.samples.sample(undefined, PROBE_INTERVAL_MS, principal) : undefined;
        return { until: state.refusedUntil, ...(sampled ? { probe: sampled } : {}) };
    }
    /** A call answered after a quiet spell as long as the last backoff, with no hold: the next refusal starts again from a minute. */
    answered(principal = 'operator'): void {
        const state = this.state(principal);
        if (!this.hold(['core'], principal) && this.now() - state.refusedUntil >= state.backoffMs) state.repeats = 0;
    }
}
