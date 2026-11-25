import { withGitHubSource, type Runner } from './call-scope';

const HOUR = 60 * 60_000;
type Resource = 'core' | 'graphql';
type Reading = { limit: number; used: number; remaining: number; reset: number };
type Sample = Reading & { resource: Resource; at: number; from: 'rate_limit' | 'headers' };

function reading(value: any): Reading | undefined {
    const { limit, used, remaining, reset } = value ?? {};
    return [limit, used, remaining, reset].every(n => Number.isInteger(n) && n >= 0) ? { limit, used, remaining, reset } : undefined;
}
const iso = (ms: number) => new Date(ms).toISOString();
const view = ({ limit, used, remaining, reset, at, from }: Sample) => ({ limit, used, remaining, reset: iso(reset * 1000), observedAt: iso(at), from });

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
    sample(): Promise<void> {
        if (this.pending) return this.pending;
        const at = this.now();
        if (at - this.lastAt < this.intervalMs) return Promise.resolve();
        this.lastAt = at;
        this.pending = withGitHubSource('quota', () => this.run('gh', ['api', 'rate_limit'], { timeout: 30_000, readOnly: true })).then(raw => {
            let resources: any;
            try { resources = JSON.parse(raw)?.resources; } catch { /* unreadable below */ }
            const read = (['core', 'graphql'] as const).flatMap(resource => { const value = reading(resources?.[resource]); return value ? [{ ...value, resource, at: this.now(), from: 'rate_limit' as const }] : []; });
            if (!read.length) this.failure = { at: this.now(), reason: 'unreadable' };
            for (const sample of read) this.keep(sample);
        }, () => { this.failure = { at: this.now(), reason: 'failed' }; }).finally(() => { this.pending = undefined; });
        return this.pending;
    }
    /** `X-RateLimit-*` headers from a response gh printed with `--include`; only core and GraphQL are kept. */
    headers(text: string) {
        if (!text.startsWith('HTTP/')) return;
        const fields = new Map(text.split(/\r?\n\r?\n/, 1)[0].split(/\r?\n/).slice(1).map(line => [line.slice(0, line.indexOf(':')).trim().toLowerCase(), line.slice(line.indexOf(':') + 1).trim()]));
        const resource = fields.get('x-ratelimit-resource'), value = reading(Object.fromEntries(['limit', 'used', 'remaining', 'reset'].map(name => [name, Number(fields.get(`x-ratelimit-${name}`))])));
        if ((resource === 'core' || resource === 'graphql') && value) this.keep({ ...value, resource, at: this.now(), from: 'headers' });
    }
    private keep(sample: Sample) {
        this.samples = this.samples.filter(kept => kept.at > sample.at - HOUR);
        this.samples.push(sample);
    }
    /** The latest reading of each resource, and what was used within each reset window seen in the last hour. */
    report() {
        const now = this.now(), samples = this.samples.filter(sample => sample.at > now - HOUR), latest = (resource: Resource) => samples.filter(s => s.resource === resource).at(-1);
        const windows = new Map<string, Sample[]>();
        for (const sample of samples) windows.set(`${sample.resource}:${sample.reset}`, [...windows.get(`${sample.resource}:${sample.reset}`) ?? [], sample]);
        const core = latest('core'), graphql = latest('graphql');
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
