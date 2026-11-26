import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { currentGitHubOperation } from '../../../server/github/call-scope';
import { readOpenPRs } from '../../../server/github/pr-observation-graphql';
import { QuotaHeld } from '../../../server/github/quota-hold';
import { generatedPR, graphqlPulls, included, pr22, type Answer, type GraphqlPR } from './support/pull-fixtures';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));
function store() {
    const root = mkdtempSync(join(tmpdir(), 'office-pr-inventory-'));
    const value = new Store(':memory:', { ...projectById('brain'), githubProject: undefined }, root);
    cleanup.push(() => { value.close(); rmSync(root, { recursive: true, force: true }); });
    return value;
}
/** The reader over a simulated `gh api graphql --input - --include`; each call records its kind and operation marker. */
function reader(prs: GraphqlPR[], answer?: Answer) {
    const pulls = graphqlPulls(() => prs, { answer }), marks: (string | undefined)[] = [], argv: string[][] = [];
    const execute = async (program: string, args: string[], options: any) => {
        expect(program).toBe('gh'); expect(options.readOnly).toBe(true);
        argv.push(args); marks.push(currentGitHubOperation());
        return included(pulls.respond(options.input));
    };
    let checks = 0, holdAt = Infinity;
    const check = () => { if (++checks >= holdAt) throw new QuotaHeld({ until: '2026-11-26T14:00:00.000Z' }); };
    return { pulls, marks, argv, read: () => readOpenPRs(store(), execute as any, check), checks: () => checks, holdOn: (n: number) => { holdAt = n; } };
}

test('a large affordable inventory completes across root, review and context pages, newest first, one request per page', async () => {
    const prs = Array.from({ length: 45 }, (_, i) => generatedPR(100 - i));
    prs[3] = generatedPR(97, { reviews: 75 }); prs[30] = generatedPR(70, { contexts: 85 });
    const r = reader(prs), observed = await r.read();
    expect(observed.map(pr => pr.node.number)).toEqual(prs.map(pr => pr.node.number));
    expect(observed[3].reviews.map(review => review.id)).toEqual(prs[3].reviews.map(review => review.id));
    expect(observed[30].contexts.map(context => context.id)).toEqual(prs[30].rollup!.map(context => context.id));
    expect(observed.every(pr => pr.commit === pr.node.headRefOid)).toBe(true);
    // Three root pages; 75 reviews are 10 then 50 then 15; 85 contexts are 20 then 50 then 15.
    expect(r.pulls.calls.map(call => call.kind)).toEqual(['root', 'reviews', 'reviews', 'root', 'contexts', 'contexts', 'root']);
    expect(r.marks).toEqual(['pr-root', 'pr-child', 'pr-child', 'pr-root', 'pr-child', 'pr-child', 'pr-root']);
    expect(r.argv.every(args => args.join(' ') === 'api graphql --input - --include')).toBe(true);
    expect(r.pulls.calls.filter(call => call.kind === 'contexts').every(call => call.variables.oid === prs[30].node.headRefOid)).toBe(true);
    expect(r.pulls.calls.filter(call => call.kind === 'reviews').every(call => call.variables.number === 97)).toBe(true);
    expect(r.checks()).toBe(7);
});

test('a hold raised before a later request discards what was read and dispatches nothing more', async () => {
    const prs = Array.from({ length: 45 }, (_, i) => generatedPR(100 - i)), r = reader(prs);
    r.holdOn(2);
    await expect(r.read()).rejects.toBeInstanceOf(QuotaHeld);
    expect(r.pulls.calls.map(call => call.kind)).toEqual(['root']);
});

test('a head with no listed commit is read by OID; a null rollup is no checks; an inaccessible commit fails', async () => {
    const deleted = { ...generatedPR(9, { contexts: 3 }), commit: null }, none = { ...generatedPR(8), rollup: null };
    const r = reader([deleted, none]), observed = await r.read();
    expect(r.pulls.calls).toEqual([{ kind: 'root', variables: { owner: 'JFusco', name: 'brain' } }, { kind: 'contexts', variables: { owner: 'JFusco', name: 'brain', oid: deleted.node.headRefOid } }]);
    expect(observed.map(pr => pr.contexts.length)).toEqual([3, 0]);
    const lost = reader([deleted], (kind: string, body: any) => kind === 'contexts' ? { data: { ...body.data, repository: { ...body.data.repository, object: null } } } : body);
    await expect(lost.read()).rejects.toThrow(/missing or inaccessible/);
});

const continued = () => [generatedPR(40, { reviews: 12, contexts: 25 }), ...Array.from({ length: 20 }, (_, i) => generatedPR(39 - i))];
test.each([
    ['a repeated root cursor', (kind: string, body: any, variables: any) => kind === 'root' && variables.after ? (body.data.repository.pullRequests.pageInfo = { hasNextPage: true, endCursor: variables.after }, body) : body, /did not advance/],
    ['an open-PR count that changes between root pages', (kind: string, body: any, variables: any) => kind === 'root' && variables.after ? (body.data.repository.pullRequests.totalCount = 22, body) : body, /count changed/],
    ['a review page from a moved head', (kind: string, body: any) => kind === 'reviews' ? (body.data.repository.pullRequest.headRefOid = 'f'.repeat(40), body) : body, /another PR or head/],
    ['a review page for another PR', (kind: string, body: any) => kind === 'reviews' ? (body.data.repository.pullRequest.number = 41, body) : body, /another PR or head/],
    ['a context page for another commit', (kind: string, body: any) => kind === 'contexts' ? (body.data.repository.object.oid = 'f'.repeat(40), body) : body, /missing or inaccessible/],
    ['a context count that changes on a continuation', (kind: string, body: any) => kind === 'contexts' ? (body.data.repository.object.statusCheckRollup.contexts.checkRunCount = 24, body) : body, /count changed/],
    ['partial data with errors', (kind: string, body: any) => kind === 'reviews' ? { ...body, errors: [{ message: 'Something went wrong while executing your query.' }] } : body, /Something went wrong/],
    ['an answer for another repository', (kind: string, body: any) => kind === 'contexts' ? (body.data.repository.nameWithOwner = 'JFusco/other', body) : body, /another repository/],
    ['a page with a repeated node', (kind: string, body: any) => kind === 'reviews' ? (body.data.repository.pullRequest.reviews.nodes[0].id = 'PRR_40_0', body) : body, /repeated node/],
])('%s fails the whole read', async (_name, answer, message) => {
    await expect(reader(continued(), answer).read()).rejects.toThrow(message);
});

test('the paired fixture reads as one page with its embedded child pages', async () => {
    const r = reader([pr22.graphql]), [observed] = await r.read();
    expect(observed).toMatchObject({ commit: pr22.graphql.node.headRefOid, reviews: pr22.graphql.reviews, contexts: pr22.graphql.rollup });
    expect(r.pulls.calls).toHaveLength(1);
});
