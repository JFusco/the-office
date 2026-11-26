import { expect, test } from 'vitest';
import { CallLedger } from '../../../server/github/call-ledger';
import { noCalls } from '../../../server/github/call-outcome';
import { withGitHubOperation, withGitHubSource, type GitHubOperation, type Runner } from '../../../server/github/call-scope';
import { meteredRunner } from '../../../server/github/metered-runner';
import { RateLimitSamples } from '../../../server/github/rate-limit-samples';
import { CommandFailure } from '../../../server/workers/process';

/** A simulated child: it reports its pid and output through the caller's hooks, as the real leaf does. */
function fixture(answer: (program: string, args: string[]) => string | Error = () => '{}') {
    const launches: { program: string; args: string[] }[] = [], ledger = new CallLedger();
    const raw: Runner = async (program, args, options = {}) => {
        launches.push({ program, args });
        const result = answer(program, args);
        if (result instanceof CommandFailure && !result.dispatched) throw result;
        options.onSpawn?.(4242);
        if (typeof result === 'string') { options.onOutput?.('stdout', result); return result; }
        throw result;
    };
    return { launches, ledger, run: meteredRunner(raw, ledger) };
}
const hooks = () => { const seen = { spawns: [] as number[], output: [] as string[] }; return { seen, options: { onSpawn: (pid: number) => seen.spawns.push(pid), onOutput: (_: string, chunk: string) => seen.output.push(chunk) } }; };

test('a gh call reaches the raw executor once, with each caller hook once, and is counted once under its source', async () => {
    const f = fixture(() => '[[1],[2]]'), h = hooks();
    expect(await withGitHubSource('monitor', () => f.run('gh', ['api', 'repos/a/b/pulls', '--paginate', '--slurp'], h.options))).toBe('[[1],[2]]');
    expect(f.launches).toHaveLength(1);
    expect(h.seen).toEqual({ spawns: [4242], output: ['[[1],[2]]'] });
    expect(f.ledger.report().sources).toMatchObject([{ source: 'monitor', invocations: 1, pages: 2, families: [{ family: 'pulls', invocations: 1, pages: 2 }] }]);
});

test('another program passes straight through, uncounted', async () => {
    const f = fixture(() => 'ok'), h = hooks();
    expect(await f.run('git', ['status'], h.options)).toBe('ok');
    expect(f.launches).toEqual([{ program: 'git', args: ['status'] }]);
    expect(h.seen.spawns).toEqual([4242]);
    expect(f.ledger.report().totals.invocations).toBe(0);
});

test('a spawned failure is counted and rethrown unchanged; a refusal before dispatch spawned nothing and is not counted', async () => {
    const refusal = new CommandFailure('gh exited 1: API rate limit exceeded (HTTP 403)', 'other', true);
    const f = fixture(() => refusal);
    await expect(f.run('gh', ['api', 'repos/a/b/pulls/1'])).rejects.toBe(refusal);
    const cancelled = new CommandFailure('Worker cancelled before dispatch', 'cancelled', false), g = fixture(() => cancelled);
    await expect(g.run('gh', ['api', 'repos/a/b/pulls/1'])).rejects.toBe(cancelled);
    expect(f.ledger.report().totals).toMatchObject({ invocations: 1, refusals: 1, attempts: 1 });
    expect(g.ledger.report().totals.invocations).toBe(0);
});

test('a caller hook that throws still stops the call, as it did before metering', async () => {
    const f = fixture();
    await expect(f.run('gh', ['api', 'user'], { onSpawn: () => { throw new Error('hook refused'); } })).rejects.toThrow('hook refused');
});

test('accounting never changes what the caller receives', async () => {
    const ledger = new CallLedger();
    ledger.record = () => { throw new Error('ledger unavailable'); };
    const run = meteredRunner(async () => 'body', ledger);
    expect(await run('gh', ['api', 'user'])).toBe('body');
});

test('rate-limit headers on an --include response are kept for the resource they name', async () => {
    const ledger = new CallLedger(), quota = new RateLimitSamples(async () => { throw new Error('not sampled'); });
    const response = 'HTTP/2.0 200 OK\r\nX-Ratelimit-Resource: core\r\nX-Ratelimit-Limit: 5000\r\nX-Ratelimit-Used: 40\r\nX-Ratelimit-Remaining: 4960\r\nX-Ratelimit-Reset: 1795000000\r\n\r\n{}';
    await meteredRunner(async () => response, ledger, quota)('gh', ['api', '-i', 'repos/a/b/pulls/1']);
    expect(quota.report().core).toMatchObject({ limit: 5000, used: 40, remaining: 4960, from: 'headers' });
});

test.each([false, true])('meters a chunked 304 and preserves the caller outcome (nonzero exit: %s)', async nonzero => {
    const ledger = new CallLedger(), quota = new RateLimitSamples(async () => '');
    const chunks = ['HTTP/2.0 30', '4 Not Modified\r\nX-RateLimit-Res', 'ource: core\r\nX-RateLimit-Limit: 5000\r\nX-RateLimit-Used: 40\r\n',
        'X-RateLimit-Remaining: 4960\r\nX-RateLimit-Reset: 1795000000\r\nX-Fixture: private-header\r\n\r', '\n'];
    const diagnostic = 'No provider diagnostic was returned.';
    const error = new CommandFailure(`gh exited 1: ${diagnostic}`, 'other', true);
    const body = chunks.join(''), h = hooks();
    const raw: Runner = async (_program, _args, options = {}) => {
        options.onSpawn?.(4242);
        for (const chunk of chunks) options.onOutput?.('stdout', chunk);
        if (nonzero) {
            options.onOutput?.('stderr', diagnostic);
            throw error;
        }
        return body;
    };
    const result = meteredRunner(raw, ledger, quota)('gh', ['api', '--include', 'repos/a/b/pulls/1', '-H', 'If-None-Match: "fixture"'], h.options);
    if (nonzero) await expect(result).rejects.toBe(error);
    else await expect(result).resolves.toBe(body);
    expect(h.seen).toEqual({ spawns: [4242], output: nonzero ? [...chunks, diagnostic] : chunks });
    expect(ledger.report().totals).toEqual({ ...noCalls(), invocations: 1, attempts: 1, responses: 1, revalidations: 1 });
    expect(quota.report().core).toMatchObject({ limit: 5000, used: 40, remaining: 4960, from: 'headers' });
    expect(JSON.stringify(quota.report())).not.toContain('private-header');
});

const RESET_AT = '2026-11-26T14:00:00Z', RESET_EPOCH = Date.parse(RESET_AT) / 1000;
const graphqlHeaders = (status = '200 OK', extra = '') => `HTTP/2.0 ${status}\r\nX-RateLimit-Resource: graphql\r\nX-RateLimit-Limit: 5000\r\nX-RateLimit-Used: 9\r\nX-RateLimit-Remaining: 4991\r\nX-RateLimit-Reset: 1795000000\r\n${extra}\r\n`;
const costed = (cost: number, remaining: number, extra: object = {}) => JSON.stringify({ data: { rateLimit: { cost, limit: 5000, used: 5000 - remaining, remaining, resetAt: RESET_AT } }, ...extra });
const INVENTORY = ['api', 'graphql', '--input', '-', '--include'];
/** A metered runner over children that print `stdout` and exit 0, or print it and fail with `error`; the governor records what it is told. */
function graphqlFixture() {
    const ledger = new CallLedger(), quota = new RateLimitSamples(async () => { throw new Error('not sampled'); }), told: { refused: any[]; answered: number } = { refused: [], answered: 0 };
    const governor = { refused: (refusal: any) => { told.refused.push(refusal); }, answered: () => { told.answered++; } };
    let next: { stdout: string; error?: Error } = { stdout: '{}' };
    const raw: Runner = async (_program, _args, options = {}) => {
        if (next.error instanceof CommandFailure && !next.error.dispatched) throw next.error;
        options.onSpawn?.(4242);
        options.onOutput?.('stdout', next.stdout);
        if (next.error) throw next.error;
        return next.stdout;
    };
    const run = meteredRunner(raw, ledger, quota, governor);
    const call = (answer: typeof next, operation?: GitHubOperation, args = INVENTORY) => {
        next = answer;
        const work = () => run('gh', args);
        return withGitHubSource('monitor', () => operation ? withGitHubOperation(operation, work) : work(), { project: 'brain' }).catch((error: Error) => error);
    };
    const family = (name: string) => ledger.report().projects.find(p => p.project === 'brain')?.sources[0].families.find(f => f.family === name);
    return { ledger, quota, told, call, family };
}

test('PR inventory pages count their reported points and child continuations; an uncosted query counts as unknown', async () => {
    const f = graphqlFixture();
    await f.call({ stdout: graphqlHeaders() + costed(1, 4990) }, 'pr-root');
    await f.call({ stdout: graphqlHeaders() + costed(2, 4988) }, 'pr-root');
    await f.call({ stdout: graphqlHeaders() + costed(1, 4987) }, 'pr-child');
    // The board query selects no rateLimit and has its own family.
    await f.call({ stdout: '{"data":{"user":{}}}' }, undefined, ['api', 'graphql', '-f', 'query=query{viewer{login}}']);
    expect(f.family('monitor-pr-graphql')).toMatchObject({ invocations: 3, pages: 3, points: 4, unknownCost: 0, prChildInvocations: 1, prChildPages: 1 });
    expect(f.family('graphql')).toMatchObject({ invocations: 1, pages: 1, points: 0, unknownCost: 1 });
    // The body's balance is kept before the included headers, with its ISO reset as epoch seconds.
    expect(f.quota.latest('graphql')).toMatchObject({ remaining: 4987, reset: RESET_EPOCH, from: 'body' });
    expect(f.told).toEqual({ refused: [], answered: 4 });
});

test('without a body balance the included GraphQL headers are kept; a failed continuation still counts its reported cost', async () => {
    const f = graphqlFixture();
    await f.call({ stdout: graphqlHeaders() + '{"data":{}}' }, 'pr-root');
    expect(f.quota.latest('graphql')).toMatchObject({ remaining: 4991, reset: 1795000000, from: 'headers' });
    // gh prints the errors body and exits 1: its cost is read from what it printed.
    const error = await f.call({ stdout: graphqlHeaders() + costed(1, 4980, { errors: [{ type: 'NOT_FOUND', message: 'Could not resolve to a PullRequest' }] }), error: new CommandFailure('gh exited 1: gh: Could not resolve to a PullRequest', 'other', true) }, 'pr-child');
    expect(error).toBeInstanceOf(CommandFailure);
    // A child that fails without a response: one invocation, no observed attempt, its cost and traffic unknown.
    await f.call({ stdout: '', error: new CommandFailure('gh exited 1: connection reset', 'other', true) }, 'pr-child');
    expect(f.family('monitor-pr-graphql')).toMatchObject({ invocations: 3, attempts: 2, pages: 1, failures: 2, unknown: 1, points: 1, unknownCost: 2, prChildInvocations: 2, prChildPages: 0 });
    expect(f.quota.latest('graphql')).toMatchObject({ remaining: 4980, from: 'body' });
    expect(f.told.refused).toEqual([]);
});

test('a refusal stated in an HTTP 200 envelope or by a thrown gh error reaches the governor once, with Retry-After kept', async () => {
    const f = graphqlFixture(), limited = { errors: [{ type: 'RATE_LIMITED', message: 'API rate limit exceeded for user ID 1.' }] };
    await f.call({ stdout: graphqlHeaders() + JSON.stringify({ data: null, ...limited }) }, 'pr-root');
    expect(f.told).toMatchObject({ refused: [{ secondary: false }], answered: 0 });
    // gh's own refusal text and the body it printed say the same thing: told once.
    await f.call({ stdout: graphqlHeaders('403 Forbidden') + JSON.stringify({ data: null, ...limited }), error: new CommandFailure('gh exited 1: gh: API rate limit exceeded for user ID 1.', 'other', true) }, 'pr-child');
    await f.call({ stdout: graphqlHeaders('403 Forbidden', 'Retry-After: 90\r\n') + '{"message":"You have exceeded a secondary rate limit."}', error: new CommandFailure('gh exited 1: gh: You have exceeded a secondary rate limit. (HTTP 403)', 'other', true) }, 'pr-root');
    expect(f.told.refused.map(refusal => [refusal.secondary, refusal.retryAfterMs])).toEqual([[false, undefined], [false, undefined], [true, 90_000]]);
    expect(f.family('monitor-pr-graphql')).toMatchObject({ invocations: 3, pages: 0, refusals: 3, failures: 0, unknownCost: 3 });
});

test('a permission error is a read failure, never a refusal; a call cancelled before dispatch counts nothing', async () => {
    const f = graphqlFixture();
    await f.call({ stdout: graphqlHeaders() + JSON.stringify({ data: null, errors: [{ type: 'FORBIDDEN', message: 'Resource not accessible by integration' }] }), error: new CommandFailure('gh exited 1: gh: Resource not accessible by integration', 'other', true) }, 'pr-root');
    expect(await f.call({ stdout: '', error: new CommandFailure('Worker cancelled before dispatch', 'cancelled', false) }, 'pr-child')).toMatchObject({ category: 'cancelled' });
    expect(f.family('monitor-pr-graphql')).toMatchObject({ invocations: 1, failures: 1, refusals: 0, prChildInvocations: 0 });
    expect(f.told.refused).toEqual([]);
});

test.each([
    { kind: 'refusal', stdout: '{"errors":[{"message":"API rate limit exceeded for user ID 1."}]}', refusals: 1, failures: 0, points: 0, unknownCost: 1 },
    { kind: 'failure', stdout: costed(2, 4980, { errors: [{ message: 'Could not resolve to a Repository' }] }), refusals: 0, failures: 1, points: 2, unknownCost: 0 },
])('a GraphQL $kind reported only in stdout counts one attempt and zero pages', async ({ stdout, refusals, failures, points, unknownCost }) => {
    const f = graphqlFixture();
    const error = new CommandFailure('gh exited 1: query failed', 'other', true);
    expect(await f.call({ stdout, error }, undefined, ['api', 'graphql', '-f', 'query=query{viewer{login}}'])).toBe(error);
    expect(f.family('graphql')).toMatchObject({ invocations: 1, attempts: 1, pages: 0, unknown: 0, refusals, failures, points, unknownCost });
    expect(f.told.refused).toHaveLength(refusals);
});
