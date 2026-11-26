import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { GitHubMonitor } from '../../../server/github/github';
import { githubPRDescription } from '../../../server/github/pr-evidence';
import { projectPRFacts } from '../../../server/leadership/goal-reporting';
import { workEvidence } from '../../../server/leadership/goal-reviews';
import { recordNoMergeNotice, settledWithoutNotice } from '../../../server/conversations/no-merge-notice';
import { projectRows } from '../../../src/work/ProjectWork';
import type { NoticePolicy, OfficeSnapshot, TicketJob } from '../../../src/shared';
import { FROZEN_GOLDEN, frozenRerun } from './support/frozen-prs';
import { TS_HEAD, TS_REST_LATEST, TS_RUNS, TS_SUITES } from './support/gate-fixtures';
import { generatedPR, graphqlPulls, included, isInventoryQuery, pr20, pr21, pr22, pr30, REPOSITORY, run, type Answer, type GraphqlPR, type RestPR } from './support/pull-fixtures';
import { Engine } from '../../../server/scheduling/engine';
import { CommandFailure } from '../../../server/workers/process';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));
const MERGED = '2026-11-26T11:00:00Z';
const FOUR_FAMILIES = /pulls\/\d+$|pulls\/\d+\/reviews|\/check-runs|\/statuses|pulls\?state=open/;

/** An isolated Brain store without a board; its clock is in the past so a marker it writes predates every observation. */
function store() {
    const root = mkdtempSync(join(tmpdir(), 'office-pr-evidence-'));
    const value = new Store(':memory:', { ...projectById('brain'), githubProject: undefined }, root, { now: () => new Date('2026-01-01T00:00:00Z'), monotonic: () => 0 });
    cleanup.push(() => { value.close(); rmSync(root, { recursive: true, force: true }); });
    return value;
}
/**
 * The monitor over a simulated `gh`: the GraphQL inventory lists `open`; REST answers the issue and Actions lists and,
 * for a PR the inventory no longer lists, its detail, reviews, check runs and statuses from `rest`.
 */
function provider(s: Store, open: () => GraphqlPR[], rest: () => Record<number, RestPR> = () => ({}), answer?: Answer) {
    const pulls = graphqlPulls(open, { answer }), restCalls: string[] = [];
    const execute = async (program: string, args: string[], options: any) => {
        expect(program).toBe('gh'); expect(options?.readOnly).toBe(true);
        if (isInventoryQuery(options)) return included(pulls.respond(options.input));
        const path = args[1].replace(`repos/${REPOSITORY}/`, '');
        restCalls.push(path);
        if (path.startsWith('issues?')) return '[[]]';
        if (path.startsWith('actions/runs')) return JSON.stringify({ workflow_runs: [] });
        const sha = path.match(/commits\/([0-9a-f]{40})/)?.[1], number = Number(path.match(/pulls\/(\d+)/)?.[1]);
        const pr = Object.values(rest()).find(p => p.detail.number === number || p.detail.head.sha === sha);
        if (!pr) throw new Error(`unexpected gh ${args.join(' ')}`);
        if (path.includes('/reviews')) return JSON.stringify([pr.reviews]);
        if (path.includes('/check-runs')) return JSON.stringify(pr.checks);
        if (path.includes('/statuses')) return JSON.stringify([pr.statuses]);
        return JSON.stringify(pr.detail);
    };
    return { monitor: new GitHubMonitor(s, execute as any), pulls, restCalls };
}
const snapshot = (s: Store) => ({ project: s.project, github: s.state.github, tickets: s.state.tickets, coordination: s.state.coordination } as unknown as OfficeSnapshot);

test('normal GitHub polling carries open PR narratives, reviews and exact checks into Avery facts without claiming acceptance', async () => {
    const s = store(), head = 'a'.repeat(40);
    const pr: GraphqlPR = { node: { id: 'PR_12', number: 12, title: 'Pending goal implementation', body: 'Fixes #11. Comparison implemented; hosted acceptance still pending. Bearer private-token', url: 'https://github.com/JFusco/brain/pull/12', state: 'OPEN', isDraft: true,
        mergeable: 'MERGEABLE', headRefOid: head, baseRefName: 'main', mergedAt: null, author: { __typename: 'User', login: 'owner' }, baseRepository: { nameWithOwner: REPOSITORY } },
        reviews: [{ id: 'PRR_1', state: 'APPROVED', author: { __typename: 'User', login: 'reviewer' }, commit: { oid: head } }],
        suites: [{ id: 'CS_12', runs: [run(1201, 'Tests', 'COMPLETED', 'SUCCESS', 'https://example.test/check')] }], statuses: [] };
    const p = provider(s, () => [pr]);
    await p.monitor.poll();
    expect(s.state.github?.error).toBe('');
    const facts = projectPRFacts(s);
    expect(facts.prs[0]).toMatchObject({ id: 12, state: 'open', draft: true, head, description: expect.stringContaining('hosted acceptance still pending'), linkedIssues: [11], reviews: [{ author: 'reviewer', state: 'APPROVED', commit: head }], checks: [expect.objectContaining({ sha: head })] });
    expect(JSON.stringify(facts)).not.toContain('private-token');
    expect(workEvidence(s, { projectId: 'brain', kind: 'pr', id: '12', version: s.state.github!.observedAt, head })).toEqual({ started: true, accepted: false });
});

test('the GraphQL inventory gives the frozen REST rows in order, with no recurring per-PR REST read, and the UI selects the newest linked PR', async () => {
    const s = store(), p = provider(s, () => [pr22.graphql, pr21.graphql, pr20.graphql]);
    s.state.tickets.push({ key: 'GH-11', summary: 'Linked issue', type: 'GitHub issue', status: 'open', statusId: '', assignee: '', subtask: false, boardMember: true, url: '', updated: '', stage: 'mailbox', activity: 'waiting', blocker: '', runId: '', attempt: 0, commit: '', branch: '', worktree: '', previewUrl: '', prId: 0, results: {}, findings: [], evidence: [], pilot: false, observedAt: '' });
    await p.monitor.poll();
    expect(s.state.github).toMatchObject({ status: 'idle', error: '' });
    expect(s.state.github!.prs).toStrictEqual(FROZEN_GOLDEN);
    expect(p.restCalls.filter(path => FOUR_FAMILIES.test(path))).toEqual([]);
    expect(p.pulls.calls.map(call => call.kind)).toEqual(['root']);
    // Avery's facts see the same rows the REST projection gave, the stacked PR's link included.
    expect((projectPRFacts(s).prs as any[]).map(({ id, linkedIssues, state, mergedAt, checks, reviews, descriptionTruncated }) => ({ id, linkedIssues, state, mergedAt, checks, reviews, descriptionTruncated })))
        .toStrictEqual(FROZEN_GOLDEN.map(pr => ({ id: pr.number, linkedIssues: pr.linkedIssues, state: pr.state, mergedAt: pr.mergedAt, checks: pr.checks, reviews: pr.reviews, descriptionTruncated: pr.descriptionTruncated })));
    expect(githubPRDescription(pr20.graphql.node.body).description).not.toContain('Closes #11');
    expect(projectRows(snapshot(s)).find(row => row.key === 'GH-11')?.pr).toBe(22);
});

test('TypeScript 65670 through the ordinary poll: 73 historical runs in nine suites give REST’s 35 latest, in REST’s order', async () => {
    const latest = new Set(TS_REST_LATEST), link = (id: number) => `https://github.com/microsoft/TypeScript/runs/${id}`;
    const pr: GraphqlPR = { ...generatedPR(65670), node: { ...generatedPR(65670).node, headRefOid: TS_HEAD },
        suites: TS_SUITES.map(([suite]) => ({ id: `CS_${suite}`, runs: TS_RUNS.filter(row => row[4] === suite).map(([id, name, status, conclusion]) =>
            run(id, name, status.toUpperCase(), conclusion ? conclusion.toUpperCase() : null, link(id), latest.has(id) ? {} : { latest: false })) })) };
    expect(pr.suites.flatMap(suite => suite.runs)).toHaveLength(73);
    const s = store(), p = provider(s, () => [pr]);
    await p.monitor.poll();
    expect(s.state.github?.error).toBe('');
    expect(s.state.github!.prs[0].checks.map(check => Number(check.url.split('/').at(-1)))).toEqual(TS_REST_LATEST);
});

test('with two PRs linked to one issue the UI opens the newer one', async () => {
    const s = store(), p = provider(s, () => [pr22.graphql, pr21.graphql]);
    s.state.tickets.push({ key: 'GH-11', summary: 'Linked issue', status: 'open' } as any);
    await p.monitor.poll();
    expect(s.state.github!.prs.map(pr => pr.number)).toEqual([22, 21]);
    expect(projectRows(snapshot(s)).find(row => row.key === 'GH-11')?.pr).toBe(22);
});

test('on an unchanged head a rerun replaces the failed run on the next refresh, and a base move refreshes mergeability', async () => {
    let refresh: 1 | 2 | 3 = 1;
    const s = store(), p = provider(s, () => [pr30(refresh).graphql]);
    for (refresh of [1, 2, 3] as const) {
        await p.monitor.poll();
        expect(s.state.github!.prs).toStrictEqual(frozenRerun(refresh));
    }
    // Each refresh read the root page and one suite continuation for the head.
    expect(p.pulls.calls.map(call => call.kind)).toEqual(['root', 'suites', 'root', 'suites', 'root', 'suites']);
    expect(p.restCalls.filter(path => FOUR_FAMILIES.test(path))).toEqual([]);
});

test('a merge and a close leave the inventory once, through one terminal REST read each, as the REST oracle and the notice marker expect', async () => {
    let open = [pr22.graphql, pr21.graphql];
    const merged = { ...pr22.rest, detail: { ...pr22.rest.detail, state: 'closed', merged_at: MERGED } }, closed = { ...pr21.rest, detail: { ...pr21.rest.detail, state: 'closed' } };
    const rest: Record<number, RestPR> = {};
    const s = store(), p = provider(s, () => open, () => rest);
    await p.monitor.poll();
    // #22 merges: the inventory lists only #21.
    open = [pr21.graphql]; rest[22] = merged; p.restCalls.length = 0;
    await p.monitor.poll();
    expect(s.state.github!.prs).toStrictEqual([FROZEN_GOLDEN[1], { ...FROZEN_GOLDEN[0], state: 'closed', mergedAt: MERGED }]);
    expect(p.restCalls.filter(path => FOUR_FAMILIES.test(path))).toEqual(['pulls/22', 'pulls/22/reviews?per_page=100', `commits/${pr22.rest.detail.head.sha}/check-runs?per_page=100`, `commits/${pr22.rest.detail.head.sha}/statuses?per_page=100`]);
    // #21 closes unmerged; the merged row needs no read on the poll after its transition.
    open = []; rest[21] = closed; p.restCalls.length = 0;
    await p.monitor.poll();
    expect(s.state.github!.prs).toStrictEqual([{ ...FROZEN_GOLDEN[1], state: 'closed' }]);
    expect(p.restCalls.filter(path => FOUR_FAMILIES.test(path)).every(path => !path.includes('22'))).toBe(true);
    p.restCalls.length = 0;
    await p.monitor.poll();
    expect([s.state.github!.prs, p.restCalls.filter(path => FOUR_FAMILIES.test(path))]).toEqual([[], []]);
});

test('the terminal merged row is the one the notice marker reads, on the poll that observed the merge', async () => {
    let open = [pr22.graphql];
    const rest: Record<number, RestPR> = {};
    const s = store(), p = provider(s, () => open, () => rest);
    await p.monitor.poll();
    const policy: NoticePolicy = { enabled: true, recipients: 'assignee', workspace: 'Verndale', mappings: '', enabledAt: '2026-11-27T00:00:00Z' };
    const job = { id: 'job', key: 'GH-11', pr: 22, prUrl: pr22.rest.detail.html_url, status: 'completed', stage: 'closeout' } as TicketJob;
    expect(recordNoMergeNotice(s, job, { number: 22, merge_commit_sha: 'e'.repeat(40), merged_at: MERGED }, policy)).toBe(true);
    open = []; rest[22] = { ...pr22.rest, detail: { ...pr22.rest.detail, state: 'closed', merged_at: MERGED } };
    await p.monitor.poll();
    expect(s.state.github!.prs[0]).toMatchObject({ number: 22, state: 'closed', url: `https://github.com/${REPOSITORY}/pull/22`, mergedAt: MERGED });
    expect(settledWithoutNotice(s, job, policy)).toBe(true);
    // A different observed merge time would discard the marker.
    s.state.github!.prs[0].mergedAt = '2026-11-26T12:00:00Z';
    expect(settledWithoutNotice(s, job, policy)).toBe(false);
});

test('a PR its detail shows reopened keeps its last row until the next inventory lists it', async () => {
    let open = [pr22.graphql];
    const s = store(), p = provider(s, () => open, () => ({ 22: pr22.rest }));
    await p.monitor.poll();
    open = [];
    await p.monitor.poll();
    expect(s.state.github!.prs).toStrictEqual([FROZEN_GOLDEN[0]]);
    expect(p.restCalls.filter(path => FOUR_FAMILIES.test(path))).toEqual(['pulls/22']);
});

test.each([
    ['a missing PR author', (prs: GraphqlPR[]) => { prs[0].node.author = null; }],
    ['a missing reviewer', (prs: GraphqlPR[]) => { prs[0].reviews[0].author = null; }],
    ['a review without its commit', (prs: GraphqlPR[]) => { prs[0].reviews[0].commit = null; }],
])('%s fails the observation and the last rows and their time stand', async (_name, change) => {
    const prs = [structuredClone(pr22.graphql)];
    const s = store(), p = provider(s, () => prs);
    await p.monitor.poll();
    const { observedAt } = s.state.github!;
    change(prs);
    await p.monitor.poll();
    expect(s.state.github).toMatchObject({ status: 'blocked', error: expect.stringContaining('GitHub PR inventory'), observedAt });
    expect(s.state.github!.prs).toStrictEqual([FROZEN_GOLDEN[0]]);
});

/** Twenty-one PRs: three root pages, the last PR needing a review, a run and a suite continuation. */
const inventory = () => [...Array.from({ length: 20 }, (_, i) => generatedPR(60 - i)), generatedPR(30, { reviews: 12, suites: [60, ...Array(10).fill(1)] })];
test.each([
    ['a broken cursor', (kind: string, body: any, variables: any) => kind === 'root' && variables.after ? (body.data.repository.pullRequests.pageInfo = { hasNextPage: true, endCursor: variables.after }, body) : body],
    ['a changed count', (kind: string, body: any, variables: any) => kind === 'root' && variables.after ? (body.data.repository.pullRequests.totalCount++, body) : body],
    ['another repository', (kind: string, body: any) => kind === 'suites' ? (body.data.repository.nameWithOwner = 'JFusco/other', body) : body],
    ['a moved head', (kind: string, body: any) => kind === 'reviews' ? (body.data.repository.pullRequest.headRefOid = 'f'.repeat(40), body) : body],
    ['a suite on another commit', (kind: string, body: any) => kind === 'suites' ? (body.data.repository.object.checkSuites.nodes[0].commit.oid = 'f'.repeat(40), body) : body],
    ['partial data with errors', (kind: string, body: any) => kind === 'runs' ? { ...body, errors: [{ message: 'Something went wrong while executing your query.' }] } : body],
])('%s on a later page fails the observation and keeps the last rows and observedAt', async (_name, answer) => {
    const s = store();
    await provider(s, () => [pr22.graphql]).monitor.poll();
    const before = structuredClone(s.state.github!);
    await provider(s, inventory, undefined, answer).monitor.poll();
    expect(s.state.github).toMatchObject({ status: 'blocked', observedAt: before.observedAt, prs: before.prs });
    expect(s.state.github!.error).toMatch(/GitHub PR inventory|Something went wrong/);
});

test.each(['root', 'runs'] as const)('a %s request timing out after successful pages blocks the observation, keeps the last rows and publishes no pipelines', async kind => {
    const s = store();
    await provider(s, () => [pr22.graphql]).monitor.poll();
    const before = structuredClone(s.state.github!);
    s.state.pipelines = { observedAt: '2026-11-26T12:50:00.000Z', error: '', items: [] };
    const pulls = graphqlPulls(inventory), calls: string[] = [];
    let pages = 0;
    const execute = async (_program: string, args: string[], options: any) => {
        if (isInventoryQuery(options)) {
            const body = pulls.respond(options.input);
            // The second root page, or the first run continuation, never answers in time.
            if (pulls.calls.at(-1)!.kind === kind && (kind === 'runs' || ++pages === 2)) throw new CommandFailure('gh read timed out; saved observations retained; safe to retry the read', 'transient-read', true);
            return included(body);
        }
        calls.push(args[1]);
        return args[1].includes('actions/runs') ? JSON.stringify({ workflow_runs: [] }) : args[1].includes('actions/workflows') ? '{"workflows":[]}' : '[[]]';
    };
    const engine = new Engine(s, undefined, undefined, undefined, undefined, execute as any);
    expect(await engine.observe()).toBeUndefined();
    expect(pulls.calls.filter(call => call.kind === 'root').length).toBeGreaterThanOrEqual(kind === 'root' ? 2 : 3);
    expect(s.state.github).toMatchObject({ status: 'blocked', error: expect.stringContaining('timed out'), observedAt: before.observedAt, prs: before.prs });
    expect(calls.some(path => path.includes('actions/workflows'))).toBe(false);
    expect(s.state.pipelines?.observedAt).toBe('2026-11-26T12:50:00.000Z');
});
test('GitHub PR narratives are bounded without splitting Unicode or losing the truncation marker', () => {
    const result = githubPRDescription('😀'.repeat(9000));
    expect(Buffer.byteLength(result.description!)).toBeLessThanOrEqual(8192);
    expect(result.descriptionTruncated).toBe(true); expect(result.description).not.toContain('�');
});
