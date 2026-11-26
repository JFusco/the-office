import { withGitHubSource, type Runner } from './call-scope';
import type { WriteCredential } from './identity/child-credentials';
import { credentialOptions, withWriteCredential } from './identity/write-credential-scope';

const HOUR = 60 * 60_000;
export type Resource = 'core' | 'graphql';
type Reading = { limit: number; used: number; remaining: number; reset: number };
export type ResourceReading = Reading & { resource: Resource };
/** Where a reading came from: a `rate_limit` sample, an `--include` header block, or a GraphQL body's `rateLimit`. */
export type Sample = ResourceReading & { at: number; from: 'rate_limit' | 'headers' | 'body'; principal?: string };
const OPERATOR = 'operator';
const of = (sample: Sample) => sample.principal ?? OPERATOR;

function reading(value: any): Reading | undefined {
    const { limit, used, remaining, reset } = value ?? {};
    if (![limit, used, remaining, reset].every(n => Number.isInteger(n) && n >= 0) || Number.isNaN(new Date(reset * 1000).getTime())) return;
    return { limit, used, remaining, reset };
}
/** A reading of one resource from untrusted values: non-negative integers with a reset in epoch seconds, or nothing. */
export function resourceReading(resource: Resource, value: unknown): ResourceReading | undefined {
    const valid = reading(value);
    return valid && { ...valid, resource };
}
const iso = (ms: number) => new Date(ms).toISOString();
const view = ({ limit, used, remaining, reset, at, from }: Sample) => ({ limit, used, remaining, reset: iso(reset * 1000), observedAt: iso(at), from });

/** Only quota values for core and GraphQL are extracted from the included header block. */
export function readRateLimitHeaders(text: string): ResourceReading | undefined {
    if (!text.startsWith('HTTP/')) return;
    const fields = new Map(text.split(/\r?\n\r?\n/, 1)[0].split(/\r?\n/).slice(1).map(line => [line.slice(0, line.indexOf(':')).trim().toLowerCase(), line.slice(line.indexOf(':') + 1).trim()]));
    const resource = fields.get('x-ratelimit-resource');
    if (resource !== 'core' && resource !== 'graphql') return;
    const value = reading(Object.fromEntries(['limit', 'used', 'remaining', 'reset'].map(name => [name, Number(fields.get(`x-ratelimit-${name}`) || NaN)])));
    if (value) return { ...value, resource };
}

/**
 * The account's core and GraphQL rate limits, read without spending quota (GitHub does not count `rate_limit`
 * against the REST limit). One sample at a time serves every project, at most once per interval; headers a
 * response already carried count for the resource they name. Memory only; a failed sample keeps the last one.
 */
export class RateLimitSamples {
    private samples: Sample[] = [];
    private pending = new Map<string, Promise<void>>();
    private lastAt = new Map<string, number>();
    private failures = new Map<string, { at: number; reason: 'failed' | 'unreadable' }>();
    /**
     * `credential` gives a principal other than the operator its own credential, so its probe reads that principal's
     * own windows; a principal without one is never probed.
     */
    constructor(private run: Runner, private now = () => Date.now(), private intervalMs = 60_000, private credential?: (principal: string) => Promise<WriteCredential | undefined>) { }
    /**
     * `intervalMs` shortens the spacing for the quota governor's probe; every sample of a principal still shares the one
     * in flight. A principal's probe runs with that principal's own credential (the operator's: unchanged).
     */
    sample(begin?: () => () => void, intervalMs = this.intervalMs, principal = OPERATOR): Promise<void> {
        const inFlight = this.pending.get(principal);
        if (inFlight) return inFlight;
        const at = this.now();
        if (at - (this.lastAt.get(principal) ?? -Infinity) < intervalMs) return Promise.resolve();
        this.lastAt.set(principal, at);
        const end = begin?.();
        const probe = async () => {
            if (principal === OPERATOR) return this.run('gh', ['api', 'rate_limit'], { timeout: 30_000, readOnly: true });
            const credential = await this.credential?.(principal);
            if (!credential) throw new Error('No credential for this principal');
            // The runner here is the metered runner itself, not `command`: the child credential is applied explicitly.
            return withWriteCredential(credential, () => this.run('gh', ['api', 'rate_limit'], credentialOptions('gh', { timeout: 30_000, readOnly: true }, credential)));
        };
        const pending = withGitHubSource('quota', probe).then(raw => {
            let resources: any;
            try { resources = JSON.parse(raw)?.resources; } catch { /* unreadable below */ }
            const read = (['core', 'graphql'] as const).flatMap(resource => { const value = reading(resources?.[resource]); return value ? [{ ...value, resource, at: this.now(), from: 'rate_limit' as const, ...(principal === OPERATOR ? {} : { principal }) }] : []; });
            if (!read.length) this.failures.set(principal, { at: this.now(), reason: 'unreadable' });
            for (const sample of read) this.keep(sample);
        }, () => { this.failures.set(principal, { at: this.now(), reason: 'failed' }); }).finally(() => {
            this.pending.delete(principal);
            end?.();
        });
        this.pending.set(principal, pending);
        return pending;
    }
    /** Keep only the quota values from an included response, or from a GraphQL body's `rateLimit` (`from: 'body'`), for the principal that made the call. */
    headers(input: string | ResourceReading | undefined, from: 'headers' | 'body' = 'headers', principal = OPERATOR) {
        const value = typeof input === 'string' ? readRateLimitHeaders(input) : input;
        if (value) this.keep({ ...value, at: this.now(), from, ...(principal === OPERATOR ? {} : { principal }) });
    }
    /** Readings are kept by resource and reset: a reading updates only the window it reports, and others stay live. */
    private keep(sample: Sample) {
        this.samples = this.samples.filter(kept => kept.at > sample.at - HOUR);
        // Cumulative usage in the same window cannot go back when a delayed read arrives.
        if (this.samples.some(kept => of(kept) === of(sample) && kept.resource === sample.resource && kept.reset === sample.reset && kept.used > sample.used)) return;
        this.samples.push(sample);
    }
    /** The newest reading of one resource in the last hour: its latest reset window and, within it, the most used. */
    latest(resource: Resource, principal = OPERATOR): Sample | undefined {
        const now = this.now();
        let best: Sample | undefined;
        for (const sample of this.samples)
            if (of(sample) === principal && sample.resource === resource && sample.at > now - HOUR && (!best || sample.reset > best.reset || sample.reset === best.reset && sample.used >= best.used)) best = sample;
        return best;
    }
    /**
     * The most-used reading of each live reset window of one resource, in reset order: read in the last hour, with its
     * reset still ahead. GitHub can answer GraphQL from more than one window at once, and `rate_limit` shows only one.
     */
    liveWindows(resource: Resource, principal = OPERATOR): Sample[] {
        const now = this.now(), windows = new Map<number, Sample>();
        for (const sample of this.samples) {
            if (of(sample) !== principal || sample.resource !== resource || sample.at <= now - HOUR || sample.reset * 1000 <= now) continue;
            const kept = windows.get(sample.reset);
            if (!kept || sample.used >= kept.used) windows.set(sample.reset, sample);
        }
        return [...windows.values()].sort((a, b) => a.reset - b.reset);
    }
    /**
     * The operator's latest reading of each resource and what it used within each reset window seen in the last hour,
     * as before; any other principal's own windows under `principals`.
     */
    report() {
        const principals = [...new Set(this.samples.map(of))].filter(principal => principal !== OPERATOR).sort();
        return { ...this.principalReport(OPERATOR), principals: Object.fromEntries(principals.map(principal => [principal, this.principalReport(principal)])) };
    }
    private principalReport(principal: string) {
        const now = this.now(), samples = this.samples.filter(sample => of(sample) === principal && sample.at > now - HOUR), failure = this.failures.get(principal);
        const latest = new Map<Resource, Sample>();
        const windows = new Map<string, Sample[]>();
        for (const sample of samples) {
            const key = `${sample.resource}:${sample.reset}`, group = windows.get(key) ?? [];
            group.push(sample);
            windows.set(key, group);
            if (sample.reset >= (latest.get(sample.resource)?.reset ?? 0)) latest.set(sample.resource, sample);
        }
        const core = latest.get('core'), graphql = latest.get('graphql');
        return {
            core: core ? view(core) : null, graphql: graphql ? view(graphql) : null,
            windows: [...windows.values()].map(group => {
                const first = group[0], last = group.at(-1)!;
                return { resource: first.resource, reset: iso(first.reset * 1000), limit: last.limit, firstObservedAt: iso(first.at), lastObservedAt: iso(last.at), firstUsed: first.used, lastUsed: last.used, consumed: last.used - first.used, samples: group.length };
            }),
            lastFailure: failure ? { at: iso(failure.at), reason: failure.reason } : null,
        };
    }
}
