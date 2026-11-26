import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { Engine } from '../../../server/scheduling/engine';
import { projectById } from '../../../server/office/projects';
import { GitHubCalls } from '../../../server/github/github-calls';
import { generatedPR, graphqlPulls, included, isInventoryQuery, rate, type GraphqlPR } from '../github/support/pull-fixtures';
import { CommandFailure } from '../../../server/workers/process';
import type { CommandOptions } from '../../../server/workers/spawn-command';

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

const B0 = Date.parse('2026-11-26T13:00:00.000Z'), WINDOW = Date.parse('2026-11-26T14:00:00Z') / 1000;
const REFUSAL = 'API rate limit exceeded for user ID 1.';
/** One Projects page of the Brain board, as `gh api graphql` prints it: page 1 continues to page 2. */
const boardPage = (number: number, title: string) => JSON.stringify({ data: { user: { projectV2: { title: 'Brain', url: 'https://github.com/users/JFusco/projects/8', shortDescription: '', readme: '',
    fields: { nodes: [{ name: 'Status', options: [{ name: 'Ready' }] }], pageInfo: { hasNextPage: false } },
    items: { nodes: [{ id: `item-${number}`, content: { number, title, url: `https://github.com/JFusco/brain/issues/${number}`, state: 'OPEN', repository: { nameWithOwner: 'JFusco/brain' } }, fieldValues: { nodes: [{ name: 'Ready', field: { name: 'Status' } }], pageInfo: { hasNextPage: false } } }],
        pageInfo: { hasNextPage: number === 1, endCursor: number === 1 ? 'page-2' : null } } } } } });
const workflowRun = (id: number) => ({ id, workflow_id: 1, name: 'CI', status: 'completed', conclusion: 'success', head_sha: 'f'.repeat(40), head_branch: 'main', event: 'push', run_attempt: 1, html_url: `https://github.com/JFusco/brain/actions/runs/${id}`, created_at: '2026-11-26T12:00:00Z', updated_at: '2026-11-26T12:05:00Z', run_started_at: '2026-11-26T12:00:00Z' });

/**
 * Brain with its board, an isolated store and the Office's real accounting over an injected `gh`. A healthy baseline
 * reaches the workflow inventory first; then every provider answer changes, so a measured read that published would
 * show different rows. `board` answers each measured board page.
 */
async function boardOffice() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-board-refusal-'));
    const store = new Store(':memory:', projectById('brain'), root);
    cleanup.push(() => { store.close(); rmSync(root, { recursive: true, force: true }); });
    let measured = false, board: (page: number, options: CommandOptions) => string = page => boardPage(page, 'Measured card');
    const pr = (title: string): GraphqlPR => { const p = generatedPR(12, { suites: [1] }); return { ...p, node: { ...p.node, title } }; };
    const pulls = graphqlPulls(() => [pr(measured ? 'Measured PR' : 'Baseline PR')]);
    const calls: string[] = [];
    const github = new GitHubCalls(async (_program, args, options = {}) => {
        options.onSpawn?.(4242);
        const page = args.includes('after=page-2') ? 2 : 1, boardRead = args[1] === 'graphql' && args.some(arg => arg.startsWith('query=query($owner'));
        calls.push(isInventoryQuery(options) ? 'inventory' : boardRead ? `board page ${page}` : args[1]);
        const out = isInventoryQuery(options) ? included(pulls.respond(options.input!))
            : boardRead ? (measured ? board(page, options) : boardPage(page, 'Baseline card'))
            : args[1] === 'rate_limit' ? JSON.stringify({ resources: { core: { limit: 5000, used: 100, remaining: 4900, reset: WINDOW }, graphql: { limit: 5000, used: 100, remaining: 4900, reset: WINDOW } } })
            : args[1].includes('/issues?') ? JSON.stringify([[{ number: 1, title: measured ? 'Measured issue' : 'Baseline issue', state: 'open', html_url: 'https://github.com/JFusco/brain/issues/1', updated_at: '2026-11-26T12:00:00Z' }]])
            : args[1].includes('/actions/runs?') ? JSON.stringify({ workflow_runs: measured ? [workflowRun(2), workflowRun(1)] : [workflowRun(1)] })
            : args[1].includes('/actions/workflows?') ? JSON.stringify({ workflows: [{ id: 1, name: 'CI', state: 'active', html_url: 'https://github.com/JFusco/brain/actions' }] })
            : /\/actions\/workflows\/\d+\/runs/.test(args[1]) ? '{"workflow_runs":[]}' : undefined;
        if (out === undefined) throw new Error(`unexpected gh ${args.join(' ')}`);
        options.onOutput?.('stdout', out);
        return out;
    }, '', () => B0);
    const engine = new Engine(store, undefined, undefined, undefined, undefined, github.run as any, github.governor);
    const poll = vi.spyOn(engine.github, 'poll'), refused = vi.spyOn(github.governor, 'refused');
    // A healthy observation that reaches the workflow inventory, so its absence later means the read was skipped.
    expect(await github.bind(() => engine.observe())).toBeUndefined();
    expect(store.state.github).toMatchObject({ status: 'idle', error: '', issues: [{ title: 'Baseline issue' }], prs: [{ title: 'Baseline PR' }], board: { items: [{ number: 1 }, { number: 2 }] } });
    expect(calls).toContain('repos/JFusco/brain/actions/workflows?per_page=100');
    store.state.github!.observedAt = '2026-11-26T12:50:00.000Z';
    const saved = structuredClone(store.state.github!);
    calls.length = 0; measured = true;
    return { store, engine, github, calls, poll, refused, saved, answerBoard: (next: typeof board) => { board = next; }, observe: () => github.bind(() => engine.observe()), lastPoll: () => poll.mock.results.at(-1)!.value };
}
const workflows = (calls: string[]) => calls.filter(call => call.includes('/actions/workflows'));

test('a board page GitHub refuses records the refusal against the last observation, and the held poll after it keeps it', async () => {
    const x = await boardOffice();
    x.answerBoard((_page, options) => {
        options.onOutput?.('stdout', JSON.stringify({ errors: [{ message: REFUSAL }] }));
        throw new CommandFailure('gh exited 1: query failed', 'other', true);
    });
    expect(await x.observe()).toBeUndefined();
    expect(await x.lastPoll()).toBeUndefined();
    expect(x.store.state.github).toMatchObject({ status: 'blocked', error: expect.stringContaining(REFUSAL) });
    expect(x.store.state.github!.error).toContain('GitHub Project read failed');
    const kept = ({ prs, board, issues, runs, observedAt }: typeof x.saved) => ({ prs, board, issues, runs, observedAt });
    expect(kept(x.store.state.github!)).toEqual(kept(x.saved));
    expect(x.calls).toContain('board page 1');
    expect(x.calls).toContain('repos/JFusco/brain/actions/runs?per_page=100');
    expect(workflows(x.calls)).toEqual([]);
    expect(x.refused).toHaveBeenCalledTimes(1);
    // The refusal's probe answers healthy; the shared backoff still holds the next refresh, which reads nothing and keeps the diagnostic.
    await x.github.quota.sample();
    const diagnostic = structuredClone(x.store.state.github!);
    x.calls.length = 0;
    expect(await x.observe()).toEqual({ until: new Date(B0 + 60_000).toISOString() });
    expect(x.calls).toEqual([]);
    expect(x.store.state.github).toEqual(diagnostic);
    expect(x.refused).toHaveBeenCalledTimes(1);
});

test('reaching the GraphQL reserve while the final board page is read defers the refresh and restores the earlier observation', async () => {
    const x = await boardOffice();
    x.answerBoard(page => {
        if (page === 2) x.github.quota.headers({ resource: 'graphql', limit: 5000, used: 4500, remaining: 500, reset: WINDOW }, 'body');
        return boardPage(page, 'Measured card');
    });
    expect(await x.observe()).toEqual({ until: new Date(WINDOW * 1000).toISOString() });
    expect(await x.lastPoll()).toEqual({ until: new Date(WINDOW * 1000).toISOString() });
    expect(x.calls).toEqual(expect.arrayContaining(['board page 1', 'board page 2']));
    expect(x.store.state.github).toEqual(x.saved);
    expect(workflows(x.calls)).toEqual([]);
    expect(x.refused).not.toHaveBeenCalled();
});

test('a board permission failure met by an independent hold is a deferral, never promoted to the observation’s error', async () => {
    const x = await boardOffice();
    x.answerBoard((_page, options) => {
        options.onOutput?.('stdout', JSON.stringify({ errors: [{ type: 'FORBIDDEN', message: 'Resource not accessible by integration' }] }));
        throw new CommandFailure('gh exited 1: gh: Resource not accessible by integration', 'other', true);
    });
    const read = x.engine.github.board.bind(x.engine.github), seen: string[] = [];
    x.engine.github.board = async (...args) => {
        const result = await read(...args);
        seen.push(result?.error ?? '');
        // The hold arrives only after the board read failed for its own reason.
        x.github.quota.headers({ resource: 'graphql', limit: 5000, used: 4500, remaining: 500, reset: WINDOW }, 'body');
        return result;
    };
    expect(await x.observe()).toEqual({ until: new Date(WINDOW * 1000).toISOString() });
    expect(seen).toEqual([expect.stringContaining('Resource not accessible by integration')]);
    expect(x.calls).toContain('board page 1');
    expect(x.store.state.github).toEqual(x.saved);
    expect(x.refused).not.toHaveBeenCalled();
});
