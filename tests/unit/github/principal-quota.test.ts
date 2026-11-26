import { expect, test } from 'vitest';
import type { Runner } from '../../../server/github/call-scope';
import { GitHubCalls } from '../../../server/github/github-calls';
import { appPrincipals } from '../../../server/github/identity/app-readiness';
import { appCredential } from '../../../server/github/identity/child-credentials';
import { currentPrincipal, withWriteCredential } from '../../../server/github/identity/write-credential-scope';
import { backgroundHold } from '../../../server/github/quota-governor';
import { command } from '../../../server/workers/process';

const T0 = Date.parse('2026-11-26T13:00:00.000Z'), RESET = T0 / 1000 + 1800;
const TOKEN = `ghs_${'Synthetic3'.repeat(4)}`;
const PRIMARY = 'gh exited 1: API rate limit exceeded for installation ID 186014638. (HTTP 403)';
const limits = (remaining: number) => JSON.stringify({ resources: { core: { limit: 5000, used: 5000 - remaining, remaining, reset: RESET }, graphql: { limit: 5000, used: 1, remaining: 4999, reset: RESET } } });
const APP = 'app:186014638';
const github = { provider: 'github' as const };

/** The real accounting over a simulated `gh` that answers as whichever credential the child carries. */
function office(refuse: (principal: string, args: string[]) => boolean = () => false) {
    const probes: { principal: string; token: boolean }[] = [];
    const raw: Runner = async (_program, args, options = {}) => {
        options.onSpawn?.(4242);
        const principal = currentPrincipal();
        if (args[1] === 'rate_limit') { probes.push({ principal, token: options.env?.GH_TOKEN === TOKEN }); return limits(principal === 'operator' ? 4000 : 4500); }
        if (refuse(principal, args)) throw new Error(PRIMARY);
        return '{}';
    };
    const app = appPrincipals(() => ({ appId: 1, installationId: 186014638, botLogin: 'office[bot]', keySource: { kind: 'keychain', service: 's', account: 'a' },
        repositories: { 'the-office': { repository: 'JFusco/the-office', repositoryId: 1 }, brain: { repository: 'JFusco/brain', repositoryId: 2 } }, writes: {} }),
        () => ({ counters: { exchanges: 1, failures: 0, cached: 2 }, token: async () => ({ token: TOKEN }) }) as never);
    const calls = new GitHubCalls(raw, 'instance', () => T0, app);
    const as = (principal: 'operator' | 'app', work: () => Promise<unknown>) => calls.bind(() => principal === 'app' ? withWriteCredential(appCredential(186014638, TOKEN), work) : work());
    return { calls, probes, as };
}

test('a refusal of the App in one repository holds that installation for every repository and never the operator', async () => {
    const o = office(principal => principal === APP);
    await o.as('app', () => command('gh', ['api', 'repos/JFusco/the-office/issues/1/comments', '--method', 'POST']).catch(() => undefined));
    expect(o.calls.governor.hold(['core'], APP)).toBeDefined();
    // Another repository on the same installation shares the installation's budget.
    expect(backgroundHold(github, o.calls.governor, ['core'], APP)).toBeDefined();
    // The operator's windows are independent.
    expect(o.calls.governor.hold(['core'])).toBeUndefined();
    expect(backgroundHold(github, o.calls.governor)).toBeUndefined();
});

test('the probe after an App refusal reads with the App\'s own credential, and its windows stay apart from the operator\'s', async () => {
    const o = office(principal => principal === APP);
    await o.as('app', () => command('gh', ['api', 'repos/JFusco/brain/pulls/1']).catch(() => undefined));
    await new Promise(resolve => setTimeout(resolve, 0));
    await o.calls.quota.sample(undefined, 0, APP);
    expect(o.probes.length).toBeGreaterThan(0);
    expect(o.probes.every(probe => probe.principal === APP && probe.token)).toBe(true);
    await o.calls.quota.sample();
    expect(o.probes.at(-1)).toEqual({ principal: 'operator', token: false });
    const report = o.calls.quota.report();
    expect(report.core).toMatchObject({ remaining: 4000 });
    expect(report.principals[APP].core).toMatchObject({ remaining: 4500 });
});

test('the health report keeps its totals and operator quota fields, adding principals and App readiness apart from the operator login', async () => {
    const o = office();
    await o.as('operator', () => command('gh', ['api', 'repos/JFusco/brain/pulls/1']));
    await o.as('app', () => command('gh', ['api', 'repos/JFusco/brain/issues/2', '--method', 'PATCH']));
    await o.calls.quota.sample();
    const report = o.calls.report();
    expect(Object.keys(report)).toEqual(['serviceInstanceId', 'collectingSince', 'window', 'totals', 'sources', 'projects', 'principals', 'quota', 'app']);
    expect(report.totals.invocations).toBe(3);
    expect(report.principals.map(row => [row.principal, row.invocations])).toEqual([['operator', 2], [APP, 1]]);
    expect(Object.keys(report.quota)).toEqual(['core', 'graphql', 'windows', 'lastFailure', 'principals']);
    expect(report.app).toEqual({ configured: true, appId: 1, installationId: 186014638, botLogin: 'office[bot]', repositories: 2, authentication: { exchanges: 1, failures: 0, cached: 2 } });
});

test('with no App configured the readiness says so and no App principal exists', () => {
    const calls = new GitHubCalls(async () => '{}', 'i', () => T0, appPrincipals(() => undefined, () => undefined));
    expect(calls.report().app).toEqual({ configured: false, repositories: 0, authentication: { exchanges: 0, failures: 0, cached: 0 } });
    expect(calls.report().principals).toEqual([]);
});
