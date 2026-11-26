import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { currentGitHubOperation } from '../../../server/github/call-scope';
import { readOpenPRs } from '../../../server/github/pr-observation-graphql';
import { HEAD_QUERY, REVIEWS_QUERY, ROOT_QUERY, RUNS_QUERY, SUITE_PAGE, SUITES_QUERY } from '../../../server/github/pr-observation-query';
import { QuotaHeld } from '../../../server/github/quota-hold';
import { generatedPR, graphqlPulls, included, pr22, status, type Answer, type GraphqlPR } from './support/pull-fixtures';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));
function store() {
    const root = mkdtempSync(join(tmpdir(), 'office-pr-inventory-'));
    const value = new Store(':memory:', { ...projectById('brain'), githubProject: undefined }, root);
    cleanup.push(() => { value.close(); rmSync(root, { recursive: true, force: true }); });
    return value;
}
const QUERY_KIND = new Map([[ROOT_QUERY, 'root'], [REVIEWS_QUERY, 'reviews'], [HEAD_QUERY, 'head'], [SUITES_QUERY, 'suites'], [RUNS_QUERY, 'runs']]);
/** The reader over a simulated `gh api graphql --input - --include`; each call records the real query sent, its variables and operation marker. */
function reader(prs: GraphqlPR[], answer?: Answer) {
    const pulls = graphqlPulls(() => prs, { answer }), sent: { kind: string; variables: any; mark?: string }[] = [], argv: string[][] = [];
    const execute = async (program: string, args: string[], options: any) => {
        expect(program).toBe('gh'); expect(options.readOnly).toBe(true);
        const { query, variables } = JSON.parse(options.input);
        sent.push({ kind: QUERY_KIND.get(query) ?? 'unknown', variables, mark: currentGitHubOperation() });
        argv.push(args);
        return included(pulls.respond(options.input));
    };
    let checks = 0, holdAt = Infinity;
    const check = () => { if (++checks >= holdAt) throw new QuotaHeld({ until: '2026-11-26T14:00:00.000Z' }); };
    return { pulls, sent, argv, read: () => readOpenPRs(store(), execute as any, check), checks: () => checks, holdOn: (n: number) => { holdAt = n; } };
}
const kinds = (r: ReturnType<typeof reader>) => r.sent.map(call => call.kind);
const ids = (observed: { checkRuns: any[] }) => observed.checkRuns.map(run => run.databaseId);

test('a large affordable inventory completes across root, review, suite and run pages, newest first, one request per page', async () => {
    const prs = Array.from({ length: 25 }, (_, i) => generatedPR(100 - i));
    prs[3] = generatedPR(97, { reviews: 75 });
    // Eleven suites, the first with 120 LATEST runs: two run continuations, then one suite continuation.
    prs[12] = generatedPR(88, { suites: [120, ...Array(10).fill(1)] });
    const r = reader(prs), observed = await r.read();
    expect(observed.map(pr => pr.node.number)).toEqual(prs.map(pr => pr.node.number));
    expect(observed[3].reviews.map(review => review.id)).toEqual(prs[3].reviews.map(review => review.id));
    expect(ids(observed[12]).sort()).toEqual(prs[12].suites.flatMap(s => s.runs.map(run => run.databaseId)).sort());
    expect(observed.every(pr => pr.commit === pr.node.headRefOid)).toBe(true);
    expect(kinds(r)).toEqual(['root', 'reviews', 'reviews', 'root', 'runs', 'runs', 'suites', 'root']);
    expect(r.sent.map(call => call.mark)).toEqual(['pr-root', 'pr-child', 'pr-child', 'pr-root', 'pr-child', 'pr-child', 'pr-child', 'pr-root']);
    expect(r.argv.every(args => args.join(' ') === 'api graphql --input - --include')).toBe(true);
    // The captured parents travel with each child: the PR by number, the suite by its own ID, the head by its OID.
    expect(r.sent.filter(call => call.kind === 'reviews').map(call => call.variables)).toEqual([
        { owner: 'JFusco', name: 'brain', number: 97, after: 'review|97|10' }, { owner: 'JFusco', name: 'brain', number: 97, after: 'review|97|60' }]);
    expect(r.sent.filter(call => call.kind === 'runs').map(call => call.variables)).toEqual([{ id: 'CS_88_0', runAfter: 'run|CS_88_0|50' }, { id: 'CS_88_0', runAfter: 'run|CS_88_0|100' }]);
    expect(r.sent.filter(call => call.kind === 'suites').map(call => call.variables)).toEqual([{ owner: 'JFusco', name: 'brain', oid: prs[12].node.headRefOid, suiteAfter: `suite|${prs[12].node.headRefOid}|10` }]);
    expect(r.sent.filter(call => call.kind === 'root').map(call => call.variables)).toEqual([{ owner: 'JFusco', name: 'brain' }, { owner: 'JFusco', name: 'brain', after: 'pr|root|10' }, { owner: 'JFusco', name: 'brain', after: 'pr|root|20' }]);
    expect(r.checks()).toBe(8);
});

test('a hold raised before a later request discards what was read and dispatches nothing more', async () => {
    const r = reader(Array.from({ length: 25 }, (_, i) => generatedPR(100 - i)));
    r.holdOn(2);
    await expect(r.read()).rejects.toBeInstanceOf(QuotaHeld);
    expect(kinds(r)).toEqual(['root']);
});

test('an empty commit list or another commit leads to one head read by the captured OID; only the verified head reaches the row', async () => {
    const decoy = { status: { contexts: [status('SC_X', 'decoy', 'FAILURE', null, '2026-11-26T10:00:00Z')] },
        checkSuites: { totalCount: 1, pageInfo: { hasNextPage: false, endCursor: null }, nodes: [{ id: 'CS_X', commit: { oid: 'f'.repeat(40) }, checkRuns: { totalCount: 0, pageInfo: { hasNextPage: false, endCursor: null }, nodes: [] } }] } };
    const fork = { ...generatedPR(9, { suites: [3] }), commit: 'f'.repeat(40), decoy, statuses: [status('SC_9', 'ci/real', 'SUCCESS', null, '2026-11-26T10:00:00Z')] };
    const deleted = { ...generatedPR(8, { suites: [1] }), commit: null };
    const r = reader([fork, deleted]), [nine, eight] = await r.read();
    expect(r.sent.map(({ kind, variables }) => [kind, variables])).toEqual([['root', { owner: 'JFusco', name: 'brain' }],
        ['head', { owner: 'JFusco', name: 'brain', oid: fork.node.headRefOid }], ['head', { owner: 'JFusco', name: 'brain', oid: deleted.node.headRefOid }]]);
    expect(r.sent.slice(1).every(call => call.mark === 'pr-child')).toBe(true);
    expect(nine).toMatchObject({ commit: fork.node.headRefOid, statuses: [{ id: 'SC_9' }] });
    expect(ids(nine)).toEqual(fork.suites[0].runs.map(run => run.databaseId));
    expect(eight.checkRuns).toHaveLength(1);
});

test.each([
    ['a missing commit', (body: any) => (body.data.repository.object = null, body)],
    ['an object that is not a commit', (body: any) => (body.data.repository.object.__typename = 'Tree', body)],
    ['a commit with another OID', (body: any) => (body.data.repository.object.oid = 'e'.repeat(40), body)],
    ['an answer for another repository', (body: any) => (body.data.repository.nameWithOwner = 'JFusco/other', body)],
])('a head lookup with %s fails the read', async (_name, change) => {
    await expect(reader([{ ...generatedPR(9), commit: null }], (kind, body) => kind === 'head' ? change(body) : body).read()).rejects.toThrow(/GitHub PR inventory/);
});

test.each([
    ['a null commit node', (node: any) => { node.commits.nodes = [null]; }],
    ['two commits', (node: any) => { node.commits.nodes = [node.commits.nodes[0], node.commits.nodes[0]]; }],
    ['a malformed OID', (node: any) => { node.commits.nodes[0].commit.oid = 'HEAD'; }],
    ['no commit list', (node: any) => { delete node.commits; }],
])('an embedded commit page with %s fails the read', async (_name, change) => {
    await expect(reader([generatedPR(9)], (kind, body) => kind === 'root' ? (change(body.data.repository.pullRequests.nodes[0]), body) : body).read()).rejects.toThrow(/malformed/);
});

test('a head with exactly 1,000 suites is read in full; one with 1,001 fails before any further check page', async () => {
    const thousand = reader([generatedPR(7, { suites: Array(1000).fill(0) })]);
    expect((await thousand.read())[0].checkRuns).toEqual([]);
    // The root page carries the first SUITE_PAGE suites; each continuation reads SUITE_PAGE more.
    expect(kinds(thousand).filter(kind => kind === 'suites')).toHaveLength(Math.ceil((1000 - SUITE_PAGE) / SUITE_PAGE));
    const over = reader([generatedPR(7, { suites: Array(1001).fill(0) })]);
    await expect(over.read()).rejects.toThrow(/has 1001 check suites, more than the 1000 REST covers/);
    expect(kinds(over)).toEqual(['root']);
});

test('more than 1,000 LATEST runs across two suites are read through their run pages', async () => {
    const r = reader([generatedPR(7, { suites: [520, 520] })]), [pr] = await r.read();
    expect(pr.checkRuns).toHaveLength(1040);
    expect(kinds(r)).toEqual(['root', ...Array(20).fill('runs')]);
});

test('only LATEST runs are read: a superseded run on the same suite never reaches the inventory', async () => {
    const pr = generatedPR(7, { suites: [2] });
    pr.suites[0].runs.push({ ...pr.suites[0].runs[0], id: 'CR_old', databaseId: 6, latest: false });
    expect(ids((await reader([pr]).read())[0])).toEqual(pr.suites[0].runs.slice(0, 2).map(run => run.databaseId));
});

test('the provider refuses a cursor sent for another parent, so such a read fails', async () => {
    const two = generatedPR(7, { suites: [60, 60] });
    const crossed: Answer = (kind, body) => kind === 'root' ? (body.data.repository.pullRequests.nodes[0].commits.nodes[0].commit.checkSuites.nodes[1].checkRuns.pageInfo.endCursor = 'run|CS_7_0|50', body) : body;
    await expect(reader([two], crossed).read()).rejects.toThrow(/cursor run\|CS_7_0\|50 is not one of run CS_7_1/);
});

const continued = () => [generatedPR(40, { reviews: 12, suites: [60, ...Array(10).fill(1)] }), ...Array.from({ length: 10 }, (_, i) => generatedPR(39 - i))];
test.each([
    ['a repeated root cursor', (kind: string, body: any, variables: any) => kind === 'root' && variables.after ? (body.data.repository.pullRequests.pageInfo = { hasNextPage: true, endCursor: variables.after }, body) : body, /did not advance/],
    ['an open-PR count that changes between root pages', (kind: string, body: any, variables: any) => kind === 'root' && variables.after ? (body.data.repository.pullRequests.totalCount = 12, body) : body, /count changed/],
    ['a review page from a moved head', (kind: string, body: any) => kind === 'reviews' ? (body.data.repository.pullRequest.headRefOid = 'f'.repeat(40), body) : body, /another PR or head/],
    ['a review page for another PR', (kind: string, body: any) => kind === 'reviews' ? (body.data.repository.pullRequest.number = 41, body) : body, /another PR or head/],
    ['an embedded suite on another commit', (kind: string, body: any, variables: any) => kind === 'root' && !variables.after ? (body.data.repository.pullRequests.nodes[0].commits.nodes[0].commit.checkSuites.nodes[1].commit.oid = 'f'.repeat(40), body) : body, /on another commit/],
    ['a suite page for another commit', (kind: string, body: any) => kind === 'suites' ? (body.data.repository.object.oid = 'f'.repeat(40), body) : body, /missing or inaccessible/],
    ['a continued suite on another commit', (kind: string, body: any) => kind === 'suites' ? (body.data.repository.object.checkSuites.nodes[0].commit.oid = 'f'.repeat(40), body) : body, /on another commit/],
    ['a run page for another suite', (kind: string, body: any) => kind === 'runs' ? (body.data.node.id = 'CS_other', body) : body, /another suite, commit or repository/],
    ['a run page on another commit', (kind: string, body: any) => kind === 'runs' ? (body.data.node.commit.oid = 'f'.repeat(40), body) : body, /another suite, commit or repository/],
    ['a run page from another repository', (kind: string, body: any) => kind === 'runs' ? (body.data.node.repository.nameWithOwner = 'JFusco/other', body) : body, /another suite, commit or repository/],
    ['a run count that changes on a continuation', (kind: string, body: any) => kind === 'runs' ? (body.data.node.checkRuns.totalCount = 59, body) : body, /count changed/],
    ['a suite count that changes on a continuation', (kind: string, body: any) => kind === 'suites' ? (body.data.repository.object.checkSuites.totalCount = 12, body) : body, /count changed/],
    ['partial data with errors', (kind: string, body: any) => kind === 'runs' ? { ...body, errors: [{ message: 'Something went wrong while executing your query.' }] } : body, /Something went wrong/],
    ['an answer for another repository', (kind: string, body: any) => kind === 'suites' ? (body.data.repository.nameWithOwner = 'JFusco/other', body) : body, /another repository/],
    ['a run page with a repeated node', (kind: string, body: any) => kind === 'runs' ? (body.data.node.checkRuns.nodes[0].id = 'CR_40000001', body) : body, /repeated node/],
    ['a review page with a repeated node', (kind: string, body: any) => kind === 'reviews' ? (body.data.repository.pullRequest.reviews.nodes[0].id = 'PRR_40_0', body) : body, /repeated node/],
])('%s fails the whole read', async (_name, answer, message) => {
    await expect(reader(continued(), answer).read()).rejects.toThrow(message);
});

test('the paired fixture reads as one page with its embedded child pages', async () => {
    const r = reader([pr22.graphql]), [observed] = await r.read();
    expect(observed).toMatchObject({ commit: pr22.graphql.node.headRefOid, reviews: pr22.graphql.reviews, statuses: pr22.graphql.statuses });
    expect(ids(observed)).toEqual([2201]);
    expect(kinds(r)).toEqual(['root']);
});
