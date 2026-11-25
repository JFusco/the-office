import { expect, test } from 'vitest';
import { CallLedger } from '../../../server/github/call-ledger';
import { noCalls } from '../../../server/github/call-outcome';
import { withGitHubSource, type Runner } from '../../../server/github/call-scope';
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
