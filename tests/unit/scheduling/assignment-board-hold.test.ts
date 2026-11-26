import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { GitHubDelivery } from '../../../server/delivery/pipeline/github-delivery';
import { currentGitHubSource } from '../../../server/github/call-scope';
import { GitHubCalls } from '../../../server/github/github-calls';
import { Coordinator, coordination } from '../../../server/scheduling/coordination';
import { Engine } from '../../../server/scheduling/engine';
import { CommandFailure } from '../../../server/workers/process';
import type { AssignedIssue, GitHubBoard } from '../../../src/shared';

const cleanup: (() => void)[] = [];
afterEach(() => { vi.restoreAllMocks(); cleanup.splice(0).forEach(fn => fn()); });
const T0 = Date.parse('2026-11-26T13:00:00.000Z'), RESET = T0 / 1000 + 1800, UNTIL = new Date(RESET * 1000).toISOString();
const page = (number: number, next: boolean) => JSON.stringify({ data: { user: { projectV2: { title: 'Brain', url: 'https://github.com/users/JFusco/projects/8', shortDescription: '', readme: '',
    fields: { nodes: [{ name: 'Status', options: [{ name: 'Ready' }] }], pageInfo: { hasNextPage: false } },
    items: { nodes: [{ id: `item-${number}`, content: { number, title: `Issue ${number}`, url: `https://github.com/JFusco/brain/issues/${number}`, state: 'OPEN', repository: { nameWithOwner: 'JFusco/brain' } }, fieldValues: { nodes: [{ name: 'Ready', field: { name: 'Status' } }], pageInfo: { hasNextPage: false } } }],
        pageInfo: { hasNextPage: next, endCursor: next ? 'page-2' : null } } } } } });
const PRIOR_BOARD: GitHubBoard = { title: 'Brain', url: 'https://github.com/users/JFusco/projects/8', description: '', readme: '', observedAt: '2026-11-26T12:58:00.000Z', error: '', lanes: ['Ready'], items: [] };
const prior: AssignedIssue = { key: 'GH-3', summary: 'Earlier', url: 'https://github.com/JFusco/brain/issues/3', assignee: 'JFusco', status: 'open', statusId: '', updated: '', type: 'GitHub issue', subtask: false, pickupStatus: 'Ready' };

/**
 * Brain with the Office's real accounting over a simulated `gh`: when the selected board page answers,
 * another call's GraphQL balance of 500 of 5,000 arrives.
 */
async function office(reservePage = 1, refuseBoard = false) {
    const root = mkdtempSync(join(tmpdir(), 'office-board-hold-'));
    const store = new Store(':memory:', projectById('brain'), root);
    cleanup.push(() => { store.close(); rmSync(root, { recursive: true, force: true }); });
    store.state.coordination = coordination();
    let now = T0, holdAfterPage: number | undefined = reservePage;
    const calls: { source: string; line: string }[] = [];
    const github = new GitHubCalls(async (_program, args, options = {}) => {
        options.onSpawn?.(4242);
        calls.push({ source: currentGitHubSource(), line: args.join(' ') });
        if (args[1] === 'rate_limit') return JSON.stringify({ resources: { core: { limit: 5000, used: 400, remaining: 4600, reset: RESET }, graphql: { limit: 5000, used: 1000, remaining: 4000, reset: RESET } } });
        if (args[1].includes('assignee=JFusco')) return JSON.stringify([[{ number: 1, title: 'Issue 1', html_url: 'https://github.com/JFusco/brain/issues/1', state: 'open', updated_at: '', assignees: [{ login: 'JFusco' }] }]]);
        if (args[1] === 'graphql' && args.some(arg => arg.startsWith('query=query($owner'))) {
            const number = args.includes('after=page-2') ? 2 : 1;
            // GitHub's refusal only in the printed body; gh's own error says only that the query failed.
            if (refuseBoard) { options.onOutput?.('stdout', JSON.stringify({ errors: [{ message: 'API rate limit exceeded for user ID 1.' }] })); throw new CommandFailure('gh exited 1: query failed', 'other', true); }
            if (number === holdAfterPage) github.quota.headers({ resource: 'graphql', limit: 5000, used: 4500, remaining: 500, reset: RESET }, 'body');
            return page(number, number === 1);
        }
        if (args[1].includes('/pulls?state=open')) return '[[]]';
        throw new Error(`unexpected gh ${args.join(' ')}`);
    }, '', () => now);
    await github.quota.sample();
    const engine = new Engine(store, undefined, undefined, undefined, undefined, github.run as any, github.governor);
    const c = new Coordinator(store, engine, github.run as any);
    c.activate(new Date(T0 - 3_600_000));
    Object.assign(c.state.listener, { assigned: [prior], lastCheckedAt: '2026-11-26T12:58:00.000Z', error: 'Error: an earlier listener failure' });
    store.state.github = { status: 'idle', error: '', observedAt: '2026-11-26T12:58:00.000Z', issues: [], prs: [], runs: [], board: PRIOR_BOARD };
    calls.length = 0;
    const boardPages = () => calls.filter(call => call.line.startsWith('api graphql -f query=query($owner')).map(call => call.line.includes('after=page-2') ? 2 : 1);
    return { store, c, github, calls, boardPages, restore: () => { holdAfterPage = undefined; }, at: (ms: number) => { now = ms; } };
}

test.each([
    { boundary: 'between board pages', reservePage: 1, pagesRead: [1] },
    { boundary: 'on the final board page', reservePage: 2, pagesRead: [1, 2] },
])('a background poll that reaches the GraphQL reserve $boundary waits, keeps the last evidence and runs its protected tick once', async ({ reservePage, pagesRead }) => {
    const x = await office(reservePage), listener = structuredClone(x.c.state.listener);
    const observed = vi.spyOn(GitHubDelivery.prototype, 'observe').mockResolvedValue(undefined);
    expect(x.github.governor.hold(['core', 'graphql'])).toBeUndefined();
    expect(await x.c.poll(new Date(T0))).toEqual({ until: UNTIL });
    expect(x.calls.filter(call => call.line.includes('assignee=JFusco'))).toHaveLength(1);
    expect(x.boardPages()).toEqual(pagesRead);
    expect(x.c.state.listener).toEqual({ ...listener, deferredUntil: UNTIL, nextCheckAt: expect.any(String) });
    expect(x.store.state.github!.board).toEqual(PRIOR_BOARD);
    // Nothing consumed the new read: no intake, discovery or merge notice ran, and the protected tick ran once.
    expect(x.calls.filter(call => ['bot-adoption', 'alerts', 'discovery', 'merge-notices'].includes(call.source))).toEqual([]);
    expect(observed).toHaveBeenCalledTimes(1);
    expect(x.store.state.tickets.some(ticket => ticket.key === 'GH-1')).toBe(false);
});

test('a dispatch-time assignment read under the same reserve completes both board pages', async () => {
    const x = await office();
    x.github.quota.headers({ resource: 'graphql', limit: 5000, used: 4500, remaining: 500, reset: RESET }, 'body');
    expect(x.github.governor.hold(['core', 'graphql'])).toEqual({ until: UNTIL });
    const assigned = await x.c.readAssignments();
    expect(x.boardPages()).toEqual([1, 2]);
    expect(assigned.map(issue => [issue.key, issue.pickupStatus])).toEqual([['GH-1', 'Ready']]);
    expect(x.store.state.github!.board?.items.map(item => item.number)).toEqual([1, 2]);
});

test('past the GraphQL reset the background poll reads both pages and publishes the completed read', async () => {
    const x = await office();
    vi.spyOn(GitHubDelivery.prototype, 'observe').mockResolvedValue(undefined);
    await x.c.poll(new Date(T0));
    x.restore(); x.at(RESET * 1000);
    expect(await x.c.poll(new Date(RESET * 1000))).toBeUndefined();
    expect(x.boardPages()).toEqual([1, 1, 2]);
    expect(x.c.state.listener.deferredUntil).toBeUndefined();
    expect(x.store.state.github!.board?.items.map(item => item.number)).toEqual([1, 2]);
});

test('a board page GitHub refuses gives the assignment listener the wait, the provider message once and the last board', async () => {
    const x = await office(0, true), refused = vi.spyOn(x.github.governor, 'refused');
    expect(await x.c.poll(new Date(T0))).toBeUndefined();
    const error = x.c.state.listener.error;
    expect(error).toContain('GitHub Project read failed: ');
    expect(error).toContain('gh exited 1: query failed');
    expect(error.split('API rate limit exceeded for user ID 1.').length - 1).toBe(1);
    expect(error).toContain("Wait for GitHub's rate limit to clear before retrying the board read.");
    expect(error).not.toMatch(/gh auth refresh|Retry the read-only project refresh/);
    expect(x.store.state.github!.board).toEqual(PRIOR_BOARD);
    expect(refused).toHaveBeenCalledTimes(1);
});
