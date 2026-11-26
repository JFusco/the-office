import { expect, test } from 'vitest';
import { withGitHubSource, type Runner } from '../../../server/github/call-scope';
import { GitHubCalls } from '../../../server/github/github-calls';
import { backgroundHold, GRAPHQL_WORK } from '../../../server/github/quota-governor';

const T0 = Date.parse('2026-11-26T13:00:00.000Z'), RESET = T0 / 1000 + 1800;
const iso = (ms: number) => new Date(ms).toISOString();
const PRIMARY = 'gh exited 1: API rate limit exceeded for user ID 1. (HTTP 403)';
const SECONDARY = 'gh exited 1: You have exceeded a secondary rate limit. Please wait a few minutes before you try again. (HTTP 403)';
const limits = (remaining: number, reset = RESET) => JSON.stringify({ resources: { core: { limit: 5000, used: 5000 - remaining, remaining, reset }, graphql: { limit: 5000, used: 10, remaining: 4990, reset } } });
const headers = (resource: string, remaining: number, reset: number, status = '200 OK') =>
    `HTTP/2.0 ${status}\r\nX-RateLimit-Resource: ${resource}\r\nX-RateLimit-Limit: 5000\r\nX-RateLimit-Used: ${5000 - remaining}\r\nX-RateLimit-Remaining: ${remaining}\r\nX-RateLimit-Reset: ${reset}\r\n\r\n{}`;

/**
 * The Office's real GitHub accounting (metered runner, rate-limit samples, governor) over a simulated `gh`.
 * `answer` decides each call: a string is its stdout, an Error its failure after the process started.
 * Every `rate_limit` call is answered by the probe answer, which a test may hold open.
 */
function office(answer: (args: string[]) => string | Error = () => '{}') {
    let now = T0;
    const probes: string[][] = [];
    let probe: () => Promise<string> = async () => limits(4000);
    const raw: Runner = async (_program, args, options = {}) => {
        options.onSpawn?.(4242);
        if (args[1] === 'rate_limit') { probes.push(args); return probe(); }
        const result = answer(args);
        if (result instanceof Error) throw result;
        options.onOutput?.('stdout', result);
        return result;
    };
    const calls = new GitHubCalls(raw, 'instance', () => now);
    const read = (project = 'brain', args = ['api', 'repos/JFusco/brain/pulls']) =>
        calls.bind(() => withGitHubSource('monitor', () => calls.run('gh', args, {}), { project })).catch((error: Error) => error);
    return { calls, probes, read, governor: calls.governor, at: (seconds: number) => { now = T0 + seconds * 1000; }, answerProbe: (next: () => Promise<string>) => { probe = next; }, settle: () => calls.quota.sample() };
}

test('a cold start without any reading or refusal holds nothing', () => {
    expect(office().governor.hold()).toBeUndefined();
});

test('core at or below the 10% reserve holds until its reset, and observation resumes at that deadline', async () => {
    const f = office();
    f.answerProbe(async () => limits(501)); await f.calls.quota.sample();
    expect(f.governor.hold()).toBeUndefined();
    f.at(60); f.answerProbe(async () => limits(500)); await f.calls.quota.sample();
    expect(f.governor.hold()).toEqual({ until: iso(RESET * 1000) });
    f.at(1799); expect(f.governor.hold()).toEqual({ until: iso(RESET * 1000) });
    f.at(1800); expect(f.governor.hold()).toBeUndefined();
});

test('a non-core header leaves the core hold and its deadline intact', async () => {
    const f = office(args => args.includes('search/issues?q=x') ? headers('search', 30, RESET + 60) : headers('graphql', 4999, RESET + 3600));
    f.answerProbe(async () => limits(0)); await f.calls.quota.sample();
    const hold = { until: iso(RESET * 1000) };
    expect(f.governor.hold()).toEqual(hold);
    f.at(10); await f.read('brain', ['api', '-i', 'repos/JFusco/brain/issues']);
    f.at(20); await f.read('brain', ['api', '-i', 'search/issues?q=x']);
    expect(f.calls.quota.report().graphql).toMatchObject({ remaining: 4999, from: 'headers' });
    expect(f.governor.hold()).toEqual(hold);
});

test('concurrent refusals from two projects coalesce into one hold and share one probe', async () => {
    const f = office(() => new Error(PRIMARY));
    let release!: (body: string) => void;
    f.answerProbe(() => new Promise(resolve => { release = resolve; }));
    await Promise.all([f.read('brain'), f.read('cms-field-vocabulary')]);
    // Until the probe answers the hold is the first minute, not one minute more for each refusal.
    expect(f.governor.hold()).toEqual({ until: iso(T0 + 60_000) });
    expect(f.probes).toHaveLength(1);
    release(limits(0)); await f.settle();
    expect(f.governor.hold()).toEqual({ until: iso(RESET * 1000) });
    // The reading now explains a further refusal, so none probes again.
    f.at(40); await f.read('cms-field-vocabulary');
    expect(f.probes).toHaveLength(1);
    expect(f.calls.report().sources.find(s => s.source === 'quota')).toMatchObject({ invocations: 1, refusals: 0 });
});

test.each([
    { name: 'fails', probe: async () => { throw new Error('gh exited 1: connection reset'); } },
    { name: 'is itself refused', probe: async () => { throw new Error(PRIMARY); } },
])('a probe that $name during a hold keeps the known hold and probes no more than every 30 seconds', async ({ probe }) => {
    const f = office(() => new Error(PRIMARY));
    f.answerProbe(probe);
    await f.read(); await f.settle();
    expect(f.probes).toHaveLength(1);
    expect(f.governor.hold()).toEqual({ until: iso(T0 + 60_000) });
    // A refusal while the hold stands joins it: no repeat is counted, and no probe within 30 seconds.
    f.at(20); await f.read(); await f.settle();
    expect(f.probes).toHaveLength(1);
    expect(f.governor.hold()).toEqual({ until: iso(T0 + 80_000) });
    f.at(40); await f.read(); await f.settle();
    expect(f.probes).toHaveLength(2);
    expect(f.governor.hold()).toEqual({ until: iso(T0 + 100_000) });
});

test('a secondary refusal with positive core waits at least a minute without probing, longer on a repeat', async () => {
    let refuse = true;
    const f = office(args => refuse ? new Error(SECONDARY) : args.includes('-i') ? headers('core', 3990, RESET) : '{}');
    await f.calls.quota.sample();
    expect(f.calls.quota.report().core).toMatchObject({ remaining: 4000 });
    await f.read();
    expect(f.governor.hold()).toEqual({ until: iso(T0 + 60_000) });
    // Core has plenty left, and a core header saying so does not lift the secondary hold.
    refuse = false; f.at(30); await f.read('brain', ['api', '-i', 'repos/JFusco/brain/pulls/2']);
    expect(f.governor.hold()).toEqual({ until: iso(T0 + 60_000) });
    f.at(60); expect(f.governor.hold()).toBeUndefined();
    refuse = true; await f.read();
    expect(f.governor.hold()).toEqual({ until: iso(T0 + 60_000 + 120_000) });
    // The secondary refusal took the routine call shape, without headers: no Retry-After, so the backoff decides.
    // An answer just after the hold ends is no quiet spell: the next refusal waits longer still.
    refuse = false; f.at(181); await f.read();
    refuse = true; await f.read();
    expect(f.governor.hold()).toEqual({ until: iso(T0 + 181_000 + 240_000) });
    refuse = false; f.at(421 + 239); await f.read();
    refuse = true; await f.read();
    expect(f.governor.hold()).toEqual({ until: iso(T0 + 660_000 + 480_000) });
    // An answer after a quiet spell as long as the last backoff starts the next refusal from a minute again.
    refuse = false; f.at(1140 + 480); await f.read();
    refuse = true; await f.read();
    expect(f.governor.hold()).toEqual({ until: iso(T0 + 1620_000 + 60_000) });
    // The only rate_limit call is the routine sample at the start.
    expect(f.probes).toHaveLength(1);
});

test('a refusal\'s Retry-After, or its own zero-remaining reset, sets the deadline without a probe', async () => {
    const rateLimitCalls: string[] = [];
    const refusing = (block: string, message: string): Runner => async (_program, args, options = {}) => {
        options.onSpawn?.(1);
        if (args[1] === 'rate_limit') { rateLimitCalls.push(block); return limits(4000); }
        options.onOutput?.('stdout', block);
        throw new Error(message);
    };
    const retry = new GitHubCalls(refusing('HTTP/2.0 403 Forbidden\r\nRetry-After: 90\r\n\r\n{"message":"secondary"}', SECONDARY), '', () => T0);
    await retry.bind(() => retry.run('gh', ['api', '-i', 'repos/JFusco/brain/pulls'], {})).catch(() => undefined);
    expect(retry.governor.hold()).toEqual({ until: iso(T0 + 90_000) });
    const zero = new GitHubCalls(refusing(headers('core', 0, RESET, '403 Forbidden'), PRIMARY), '', () => T0);
    await zero.bind(() => zero.run('gh', ['api', '-i', 'repos/JFusco/brain/pulls'], {})).catch(() => undefined);
    expect(zero.governor.hold()).toEqual({ until: iso(RESET * 1000) });
    expect(rateLimitCalls).toEqual([]);
});

test.each([
    'gh exited 1: Resource not accessible by integration (HTTP 403)',
    'gh exited 1: HTTP 403: Must have admin rights to Repository.',
    'gh exited 1: Bad credentials (HTTP 401). API rate limit exceeded advice follows.',
])('"%s" creates no quota hold and keeps its own error', async message => {
    const f = office(() => new Error(message));
    expect(await f.read()).toMatchObject({ message });
    expect(f.governor.hold()).toBeUndefined();
    expect(f.probes).toEqual([]);
});

const both = (core: number, graphql: number, graphqlReset = RESET + 600) => JSON.stringify({ resources: { core: { limit: 5000, used: 5000 - core, remaining: core, reset: RESET }, graphql: { limit: 5000, used: 5000 - graphql, remaining: graphql, reset: graphqlReset } } });

test('a GraphQL reading at or below the reserve holds only work that asks for GraphQL, until its own reset', async () => {
    const f = office();
    f.answerProbe(async () => both(4900, 501)); await f.calls.quota.sample();
    expect([f.governor.hold(), f.governor.hold(GRAPHQL_WORK)]).toEqual([undefined, undefined]);
    f.at(60); f.answerProbe(async () => both(4900, 500)); await f.calls.quota.sample();
    // Core-only work continues on its own budget; GraphQL-dependent work waits for the GraphQL reset.
    expect(f.governor.hold()).toBeUndefined();
    expect(f.governor.hold(['core'])).toBeUndefined();
    expect(f.governor.hold(GRAPHQL_WORK)).toEqual({ until: iso((RESET + 600) * 1000) });
    expect(backgroundHold({ provider: 'github' }, f.governor, GRAPHQL_WORK)).toEqual({ until: iso((RESET + 600) * 1000) });
    expect(backgroundHold({ provider: 'azure' }, f.governor, GRAPHQL_WORK)).toBeUndefined();
    // Both low: the later deadline for GraphQL-dependent work; a core-only caller waits for core's own reset.
    f.at(120); f.answerProbe(async () => both(400, 500)); await f.calls.quota.sample();
    expect(f.governor.hold(GRAPHQL_WORK)).toEqual({ until: iso((RESET + 600) * 1000) });
    expect(f.governor.hold()).toEqual({ until: iso(RESET * 1000) });
    f.at(1800); expect([f.governor.hold(), f.governor.hold(GRAPHQL_WORK)]).toEqual([undefined, { until: iso((RESET + 600) * 1000) }]);
});

test('a GraphQL body reading counts for GraphQL; a stated refusal holds every caller, core-only work included', async () => {
    const reading = (remaining: number) => JSON.stringify({ data: { rateLimit: { cost: 1, limit: 5000, used: 5000 - remaining, remaining, resetAt: iso((RESET + 900) * 1000) } } });
    let answer: string | Error = reading(499);
    const f = office(() => answer);
    await f.read('brain', ['api', 'graphql', '--input', '-']);
    expect(f.calls.quota.report().graphql).toMatchObject({ remaining: 499, from: 'body' });
    expect([f.governor.hold(), f.governor.hold(GRAPHQL_WORK)]).toEqual([undefined, { until: iso((RESET + 900) * 1000) }]);
    answer = new Error(PRIMARY); f.answerProbe(async () => both(4000, 4000));
    f.at(10); await f.read(); await f.settle();
    expect(f.governor.hold()).toEqual({ until: iso(T0 + 70_000) });
});
