import { expect, test, vi } from 'vitest';
import { GitHubCalls } from '../../../server/github/github-calls';
import { command } from '../../../server/workers/process';

const T0 = Date.parse('2026-11-24T12:00:00.000Z');
const rateLimit = JSON.stringify({ resources: { core: { limit: 5000, used: 12, remaining: 4988, reset: 1795000000 }, graphql: { limit: 5000, used: 3, remaining: 4997, reset: 1795000000 } } });

test('the runner it binds receives command(gh) calls, and its own quota sample is counted under quota', async () => {
    const raw = vi.fn(async (_program: string, args: string[]) => args[1] === 'rate_limit' ? rateLimit : '{}');
    const calls = new GitHubCalls(raw, 'instance-1', () => T0);
    await calls.bind(() => command('gh', ['api', 'repos/JFusco/brain/pulls/1']));
    await calls.quota.sample();
    expect(raw).toHaveBeenCalledTimes(2);
    const report = calls.report();
    expect(report).toMatchObject({ serviceInstanceId: 'instance-1', collectingSince: new Date(T0).toISOString(), window: { complete: false }, totals: { invocations: 2 }, quota: { core: { used: 12 }, graphql: { used: 3 } } });
    expect(report.sources.map(s => [s.source, s.families.map(f => f.family)])).toEqual([['other', ['pull']], ['quota', ['rate-limit']]]);
});

test('reporting reads memory only', () => {
    const raw = vi.fn(async () => '{}'), calls = new GitHubCalls(raw);
    calls.report(); calls.report();
    expect(raw).not.toHaveBeenCalled();
});
