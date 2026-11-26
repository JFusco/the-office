import { expect, test } from 'vitest';
import { currentGitHubSource, type Runner } from '../../../server/github/call-scope';
import { RateLimitSamples } from '../../../server/github/rate-limit-samples';

const T0 = Date.parse('2026-11-24T12:00:00.000Z'), RESET = 1795000000;
const resources = (core: number, graphql = 10) => JSON.stringify({ resources: { core: { limit: 5000, used: core, remaining: 5000 - core, reset: RESET }, graphql: { limit: 5000, used: graphql, remaining: 5000 - graphql, reset: RESET + 60 }, search: { limit: 30, used: 0, remaining: 30, reset: RESET } } });
function fixture(answers: (() => Promise<string>)[]) {
    let now = T0;
    const calls: { args: string[]; source: string }[] = [];
    const run: Runner = async (_program, args) => { calls.push({ args, source: currentGitHubSource() }); return answers.shift()!(); };
    return { calls, samples: new RateLimitSamples(run, () => now), at: (seconds: number) => { now = T0 + seconds * 1000; } };
}

test('one sample serves concurrent requests, at most once a minute, and is labelled quota', async () => {
    let release = (_: string) => {};
    const f = fixture([() => new Promise(resolve => { release = resolve; }), async () => resources(60)]);
    const first = f.samples.sample(), second = f.samples.sample();
    release(resources(40));
    await Promise.all([first, second]);
    f.at(30); await f.samples.sample();
    expect(f.calls).toEqual([{ args: ['api', 'rate_limit'], source: 'quota' }]);
    expect(f.samples.report().core).toEqual({ limit: 5000, used: 40, remaining: 4960, reset: new Date(RESET * 1000).toISOString(), observedAt: new Date(T0).toISOString(), from: 'rate_limit' });
    f.at(60); await f.samples.sample();
    expect(f.calls).toHaveLength(2);
    expect(f.samples.report()).toMatchObject({ core: { used: 60 }, graphql: { used: 10, reset: new Date((RESET + 60) * 1000).toISOString() } });
});

test('each reset window reports what was used between its first and last sample', async () => {
    const f = fixture([async () => resources(100), async () => resources(250)]);
    await f.samples.sample(); f.at(600); await f.samples.sample();
    expect(f.samples.report().windows.find(w => w.resource === 'core')).toEqual({ resource: 'core', reset: new Date(RESET * 1000).toISOString(), limit: 5000, firstObservedAt: new Date(T0).toISOString(), lastObservedAt: new Date(T0 + 600_000).toISOString(), firstUsed: 100, lastUsed: 250, consumed: 150, samples: 2 });
});

test('a delayed sample cannot lower usage in a reset window or supersede a newer reset window', async () => {
    let release!: (body: string) => void;
    const f = fixture([async () => resources(100), () => new Promise(resolve => { release = resolve; }), async () => resources(130)]);
    const header = (used: number, reset: number) =>
        `HTTP/2.0 200 OK\nX-RateLimit-Resource: core\nX-RateLimit-Limit: 5000\nX-RateLimit-Used: ${used}\nX-RateLimit-Remaining: ${5000 - used}\nX-RateLimit-Reset: ${reset}\n\n`;
    await f.samples.sample();
    f.at(60); const delayed = f.samples.sample();
    f.at(61); f.samples.headers(header(120, RESET));
    f.at(62); release(resources(90));
    await delayed;
    const report = f.samples.report(), latestAt = new Date(T0 + 61_000).toISOString();
    expect(report.core).toMatchObject({ used: 120, observedAt: latestAt, from: 'headers' });
    expect(report.windows.find(w => w.resource === 'core')).toMatchObject({
        firstUsed: 100, lastUsed: 120, consumed: 20,
        firstObservedAt: new Date(T0).toISOString(), lastObservedAt: latestAt, samples: 2,
    });

    f.at(119); f.samples.headers(header(5, RESET + 3600));
    f.at(120); await f.samples.sample();
    expect(f.samples.report().core).toMatchObject({ used: 5, reset: new Date((RESET + 3600) * 1000).toISOString() });
    expect(f.samples.report().windows.filter(w => w.resource === 'core').map(w => w.consumed)).toEqual([30, 0]);
});

test('a failed or unreadable sample keeps the last reading and records only why, never the text', async () => {
    const f = fixture([async () => resources(5), async () => { throw new Error('gh exited 1: token ghp_secret rejected'); }, async () => 'not json']);
    await f.samples.sample(); f.at(60); await f.samples.sample();
    expect(f.samples.report()).toMatchObject({ core: { used: 5 }, lastFailure: { at: new Date(T0 + 60_000).toISOString(), reason: 'failed' } });
    f.at(120); await f.samples.sample();
    expect(f.samples.report()).toMatchObject({ core: { used: 5 }, lastFailure: { reason: 'unreadable' } });
    expect(JSON.stringify(f.samples.report())).not.toContain('ghp_secret');
});

test('samples older than an hour are dropped; headers count only for core and GraphQL', async () => {
    const f = fixture([async () => resources(5)]);
    await f.samples.sample();
    f.at(3601);
    expect(f.samples.report()).toMatchObject({ core: null, graphql: null, windows: [] });
    f.samples.headers('HTTP/2.0 200 OK\nX-RateLimit-Resource: search\nX-RateLimit-Limit: 30\nX-RateLimit-Used: 1\nX-RateLimit-Remaining: 29\nX-RateLimit-Reset: 1\n\n{}');
    f.samples.headers('{"no":"headers"}');
    expect(f.samples.report().core).toBeNull();
});

test('the latest reading of a resource is its newest reset window, the most used within it, from the last hour', async () => {
    const f = fixture([async () => resources(100), async () => resources(90)]);
    const header = (resource: string, used: number, reset: number) => `HTTP/2.0 200 OK\nX-RateLimit-Resource: ${resource}\nX-RateLimit-Limit: 5000\nX-RateLimit-Used: ${used}\nX-RateLimit-Remaining: ${5000 - used}\nX-RateLimit-Reset: ${reset}\n\n`;
    expect(f.samples.latest('core')).toBeUndefined();
    await f.samples.sample();
    f.at(10); f.samples.headers(header('graphql', 4000, RESET + 7200));
    expect(f.samples.latest('core')).toMatchObject({ used: 100, reset: RESET, from: 'rate_limit' });
    // A delayed sample with less used in the same window is not kept, so it cannot become the latest.
    f.at(60); await f.samples.sample();
    expect(f.samples.latest('core')).toMatchObject({ used: 100 });
    f.at(3599); expect(f.samples.latest('core')).toMatchObject({ used: 100 });
    f.at(3600); expect(f.samples.latest('core')).toBeUndefined();
});

test('a shorter interval lets the governor probe sooner, still sharing the one sample in flight', async () => {
    let release = (_: string) => {};
    const f = fixture([async () => resources(10), () => new Promise(resolve => { release = resolve; })]);
    await f.samples.sample();
    f.at(20); await f.samples.sample(undefined, 30_000);
    expect(f.calls).toHaveLength(1);
    f.at(30); const probe = f.samples.sample(undefined, 30_000), routine = f.samples.sample();
    release(resources(20)); await Promise.all([probe, routine]);
    expect(f.calls).toHaveLength(2);
    expect(f.samples.latest('core')).toMatchObject({ used: 20 });
});
