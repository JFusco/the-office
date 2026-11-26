import { withGitHubSource, type Runner } from './call-scope';

const HOUR = 60 * 60_000;
export type Resource = 'core' | 'graphql';
type Reading = { limit: number; used: number; remaining: number; reset: number };
export type ResourceReading = Reading & { resource: Resource };
/** Where a reading came from: a `rate_limit` sample, an `--include` header block, or a GraphQL body's `rateLimit`. */
export type Sample = ResourceReading & { at: number; from: 'rate_limit' | 'headers' | 'body' };

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
    private pending?: Promise<void>;
    private lastAt = -Infinity;
    private failure?: { at: number; reason: 'failed' | 'unreadable' };
    constructor(private run: Runner, private now = () => Date.now(), private intervalMs = 60_000) { }
    /** `intervalMs` shortens the spacing for the quota governor's probe; every sample still shares the one in flight. */
    sample(begin?: () => () => void, intervalMs = this.intervalMs): Promise<void> {
        if (this.pending) return this.pending;
        const at = this.now();
        if (at - this.lastAt < intervalMs) return Promise.resolve();
        this.lastAt = at;
        const end = begin?.();
        this.pending = withGitHubSource('quota', async () => this.run('gh', ['api', 'rate_limit'], { timeout: 30_000, readOnly: true })).then(raw => {
            let resources: any;
            try { resources = JSON.parse(raw)?.resources; } catch { /* unreadable below */ }
            const read = (['core', 'graphql'] as const).flatMap(resource => { const value = reading(resources?.[resource]); return value ? [{ ...value, resource, at: this.now(), from: 'rate_limit' as const }] : []; });
            if (!read.length) this.failure = { at: this.now(), reason: 'unreadable' };
            for (const sample of read) this.keep(sample);
        }, () => { this.failure = { at: this.now(), reason: 'failed' }; }).finally(() => {
            this.pending = undefined;
            end?.();
        });
        return this.pending;
    }
    /** Keep only the quota values from an included response, or from a GraphQL body's `rateLimit` (`from: 'body'`). */
    headers(input: string | ResourceReading | undefined, from: 'headers' | 'body' = 'headers') {
        const value = typeof input === 'string' ? readRateLimitHeaders(input) : input;
        if (value) this.keep({ ...value, at: this.now(), from });
    }
    /** Readings are kept by resource and reset: a reading updates only the window it reports, and others stay live. */
    private keep(sample: Sample) {
        this.samples = this.samples.filter(kept => kept.at > sample.at - HOUR);
        // Cumulative usage in the same window cannot go back when a delayed read arrives.
        if (this.samples.some(kept => kept.resource === sample.resource && kept.reset === sample.reset && kept.used > sample.used)) return;
        this.samples.push(sample);
    }
    /** The newest reading of one resource in the last hour: its latest reset window and, within it, the most used. */
    latest(resource: Resource): Sample | undefined {
        const now = this.now();
        let best: Sample | undefined;
        for (const sample of this.samples)
            if (sample.resource === resource && sample.at > now - HOUR && (!best || sample.reset > best.reset || sample.reset === best.reset && sample.used >= best.used)) best = sample;
        return best;
    }
    /**
     * The most-used reading of each live reset window of one resource, in reset order: read in the last hour, with its
     * reset still ahead. GitHub can answer GraphQL from more than one window at once, and `rate_limit` shows only one.
     */
    liveWindows(resource: Resource): Sample[] {
        const now = this.now(), windows = new Map<number, Sample>();
        for (const sample of this.samples) {
            if (sample.resource !== resource || sample.at <= now - HOUR || sample.reset * 1000 <= now) continue;
            const kept = windows.get(sample.reset);
            if (!kept || sample.used >= kept.used) windows.set(sample.reset, sample);
        }
        return [...windows.values()].sort((a, b) => a.reset - b.reset);
    }
    /** The latest reading of each resource, and what was used within each reset window seen in the last hour. */
    report() {
        const now = this.now(), samples = this.samples.filter(sample => sample.at > now - HOUR);
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
            lastFailure: this.failure ? { at: iso(this.failure.at), reason: this.failure.reason } : null,
        };
    }
}
