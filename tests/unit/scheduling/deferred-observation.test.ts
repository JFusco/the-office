import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { Engine } from '../../../server/scheduling/engine';
import { projectById } from '../../../server/office/projects';
import { GitHubCalls } from '../../../server/github/github-calls';
import { generatedPR, graphqlPulls, included, isInventoryQuery, rate } from '../github/support/pull-fixtures';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));
const UNTIL = '2026-11-26T13:30:00.000Z';

/** A GitHub project's engine with a governor that holds while `held` is true; every provider call is recorded. */
function engine(held: { value: boolean }) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-deferred-'));
    const store = new Store(':memory:', projectById('cms-field-vocabulary'), root);
    cleanup.push(() => { store.close(); rmSync(root, { recursive: true, force: true }); });
    const calls: string[] = [];
    const execute = async (program: string, args: string[]) => { calls.push(`${program} ${args.join(' ')}`); throw new Error('gh exited 1: API rate limit exceeded (HTTP 403)'); };
    const quota = { hold: () => held.value ? { until: UNTIL } : undefined };
    return { store, calls, engine: new Engine(store, undefined, undefined, undefined, undefined, execute as any, quota) };
}

test('a held monitor reads and writes nothing, and says so, so a cold store stays cold', async () => {
    const x = engine({ value: true });
    expect(await x.engine.github.poll()).toEqual({ until: UNTIL });
    expect(await x.engine.observe()).toEqual({ until: UNTIL });
    expect(x.calls).toEqual([]);
    expect(x.store.state.github).toBeUndefined();
});

test('the last observation, its error and its time stand through a deferral, and the pipelines read waits with it', async () => {
    const held = { value: false }, x = engine(held);
    await x.engine.observe();
    const refused = { ...x.store.state.github! };
    expect(refused).toMatchObject({ status: 'blocked', error: expect.stringContaining('rate limit') });
    held.value = true; x.calls.length = 0;
    await x.engine.observe();
    expect(x.calls).toEqual([]);
    expect(x.store.state.github).toMatchObject({ status: refused.status, error: refused.error, observedAt: refused.observedAt });
    // After a clean observation the pipelines read would follow it; under the hold it does not.
    x.store.state.github = { status: 'idle', error: '', observedAt: '2026-11-26T12:59:00.000Z', issues: [], prs: [], runs: [] };
    x.store.state.pipelines = { observedAt: '2026-11-26T12:59:00.000Z', error: '', items: [] };
    await x.engine.observe();
    expect(x.calls).toEqual([]);
    expect(x.store.state.pipelines).toEqual({ observedAt: '2026-11-26T12:59:00.000Z', error: '', items: [] });
});

test('a mailbox check under a hold keeps the last check and any error, even before anything was observed', async () => {
    const x = engine({ value: true });
    Object.assign(x.store.state.intake, { status: 'blocked', lastChecked: '2026-11-26T12:00:00.000Z', error: 'Error: gh exited 1: API rate limit exceeded (HTTP 403)' });
    const intake = { ...x.store.state.intake };
    await x.engine.checkMail();
    expect(x.store.state.intake).toEqual(intake);
    expect(x.calls).toEqual([]);
});

test('a requested mailbox check under a hold mirrors the standing GitHub observation and its error again', async () => {
    const x = engine({ value: true }), error = 'Error: gh exited 1: API rate limit exceeded (HTTP 403)';
    x.store.state.github = { status: 'blocked', error, observedAt: '2026-11-26T12:57:00.000Z', issues: [], prs: [], runs: [] };
    Object.assign(x.store.state.intake, { status: 'blocked', lastChecked: '2026-11-26T12:57:00.000Z', error });
    // Asking for a check sets the old error aside until the check completes.
    x.engine.requestMail();
    expect(x.store.state.intake).toMatchObject({ status: 'idle', error: '' });
    expect(await x.engine.drainMail()).toBe(true);
    expect(x.calls).toEqual([]);
    expect(x.store.state.intake).toMatchObject({ status: 'blocked', lastChecked: '2026-11-26T12:57:00.000Z', error });
    expect(x.store.state.github).toMatchObject({ status: 'blocked', error, observedAt: '2026-11-26T12:57:00.000Z' });
});

test.each([
    { boundary: 'before the next page', prCount: 45, rootPages: 5 },
    { boundary: 'on the only page', prCount: 1, rootPages: 1 },
])('the GraphQL reserve reached $boundary defers the observation and pipelines until reset', async ({ prCount, rootPages }) => {
    const T0 = Date.parse('2026-11-26T13:00:00.000Z'), RESET_AT = '2026-11-26T13:30:00Z';
    let now = T0, low = true;
    // The first page's own balance is the reserve.
    const prs = Array.from({ length: prCount }, (_, i) => generatedPR(100 - i));
    const pulls = graphqlPulls(() => prs, { cost: () => low && pulls.calls.length === 1 ? rate(500, 1, RESET_AT) : rate(4000, 1, RESET_AT) });
    const root = mkdtempSync(resolve(tmpdir(), 'office-deferred-'));
    const store = new Store(':memory:', { ...projectById('brain'), githubProject: undefined }, root);
    cleanup.push(() => { store.close(); rmSync(root, { recursive: true, force: true }); });
    const calls: string[] = [];
    const github = new GitHubCalls(async (_program, args, options = {}) => {
        options.onSpawn?.(4242);
        calls.push(isInventoryQuery(options) ? 'inventory' : args[1]);
        const out = isInventoryQuery(options) ? included(pulls.respond(options.input!)) : args[1].includes('issues?') ? '[[]]' : args[1].includes('actions/runs') ? '{"workflow_runs":[]}'
            : args[1].includes('actions/workflows?') ? '{"workflows":[]}' : undefined;
        if (out === undefined) throw new Error(`unexpected gh ${args.join(' ')}`);
        options.onOutput?.('stdout', out);
        return out;
    }, '', () => now);
    const engine = new Engine(store, undefined, undefined, undefined, undefined, github.run as any, github.governor);
    const last = { status: 'blocked' as const, error: 'Error: an earlier read failed', observedAt: '2026-11-26T12:50:00.000Z', issues: [], prs: [], runs: [] };
    store.state.github = structuredClone(last);
    store.state.pipelines = { observedAt: '2026-11-26T12:50:00.000Z', error: '', items: [] };
    const hold = await github.bind(() => engine.observe());
    expect(hold).toEqual({ until: new Date(RESET_AT).toISOString() });
    expect(pulls.calls.map(call => call.kind)).toEqual(['root']);
    expect(store.state.github).toEqual(last);
    expect(calls.some(call => call?.includes('workflows'))).toBe(false);
    expect(store.state.pipelines?.observedAt).toBe('2026-11-26T12:50:00.000Z');
    expect(github.report().quota.graphql).toMatchObject({ remaining: 500, from: 'body' });
    // The next refresh before the reset is deferred at entry, reading nothing.
    calls.length = 0;
    expect(await github.bind(() => engine.observe())).toEqual(hold);
    expect(calls).toEqual([]);
    // After the reset it starts fresh and completes every page.
    low = false; now = Date.parse(RESET_AT);
    expect(await github.bind(() => engine.observe())).toBeUndefined();
    expect(pulls.calls.map(call => call.kind)).toEqual(Array(rootPages + 1).fill('root'));
    expect(store.state.github).toMatchObject({ status: 'idle', error: '' });
    expect(store.state.github!.prs.map(pr => pr.number)).toEqual(prs.map(pr => pr.node.number));
    expect(calls.some(call => call?.includes('workflows'))).toBe(true);
});

test('a reserve met before a first observation leaves the store without one', async () => {
    const x = engine({ value: false });
    let checks = 0;
    (x.engine.github as any).quota = { hold: (resources?: readonly string[]) => resources?.includes('graphql') && ++checks > 1 ? { until: UNTIL } : undefined };
    (x.engine.github as any).execute = async (_program: string, args: string[], options: any) => isInventoryQuery(options)
        ? included(graphqlPulls(() => Array.from({ length: 21 }, (_, i) => generatedPR(50 - i))).respond(options.input)) : args[1].includes('actions/runs') ? '{"workflow_runs":[]}' : '[[]]';
    expect(await x.engine.github.poll()).toEqual({ until: UNTIL });
    expect(x.store.state.github).toBeUndefined();
});
