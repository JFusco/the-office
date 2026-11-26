import { expect, test } from 'vitest';
import { commitOf, ConnectionPages, embeddedHead, prIdentity, repositoryOf, reviewsOf, statusContexts, suiteOf, suiteOnHead, withinSuiteCoverage } from '../../../server/github/pr-observation-pages';

const HEAD = 'a'.repeat(40), REPO = 'JFusco/brain';
const page = (ids: string[], total: number, next?: string, extra: object = {}) => ({ totalCount: total, ...extra, pageInfo: { hasNextPage: !!next, endCursor: next ?? null }, nodes: ids.map(id => ({ id })) });

test('a connection completes when its pages advance with fresh cursors and cover its count', () => {
    const pages = new ConnectionPages('fixture');
    expect(pages.add(page(['a', 'b'], 3, 'c1'))).toBe('c1');
    expect(pages.add(page(['c'], 3))).toBeUndefined();
    expect(pages.complete().map(node => node.id)).toEqual(['a', 'b', 'c']);
});

test.each([
    ['a repeated cursor', (p: ConnectionPages) => { p.add(page(['a'], 3, 'c1')); p.add(page(['b'], 3, 'c1')); }],
    ['an empty cursor', (p: ConnectionPages) => { p.add({ ...page(['a'], 2), pageInfo: { hasNextPage: true, endCursor: '' } }); }],
    ['a page without nodes that claims more', (p: ConnectionPages) => { p.add(page([], 2, 'c1')); }],
    ['missing page info', (p: ConnectionPages) => { p.add({ totalCount: 1, nodes: [] }); }],
    ['a count that changes between pages', (p: ConnectionPages) => { p.add(page(['a'], 2, 'c1')); p.add(page(['b'], 3)); }],
    ['a repeated node', (p: ConnectionPages) => { p.add(page(['a'], 2, 'c1')); p.add(page(['a'], 2)); }],
    ['a node without an ID', (p: ConnectionPages) => { p.add({ ...page([], 1), nodes: [{}] }); }],
    ['coverage short of its count', (p: ConnectionPages) => { p.add(page(['a'], 2)); p.complete(); }],
])('%s fails the read', (_name, act) => {
    expect(() => act(new ConnectionPages('fixture'))).toThrow(/GitHub PR inventory/);
});

test('identity: the configured repository, a PR in it at a 40-hex head, continuations for that PR, head and commit', () => {
    expect(() => repositoryOf({ repository: { nameWithOwner: 'JFusco/other' } }, REPO)).toThrow(/another repository/);
    expect(prIdentity({ number: 7, headRefOid: HEAD, baseRepository: { nameWithOwner: REPO } }, REPO)).toEqual({ number: 7, head: HEAD });
    expect(() => prIdentity({ number: 7, headRefOid: 'main', baseRepository: { nameWithOwner: REPO } }, REPO)).toThrow();
    expect(() => prIdentity({ number: 7, headRefOid: HEAD, baseRepository: { nameWithOwner: 'fork/brain' } }, REPO)).toThrow();
    const reviews = { totalCount: 0 };
    expect(reviewsOf({ repository: { nameWithOwner: REPO, pullRequest: { number: 7, headRefOid: HEAD, reviews } } }, REPO, 7, HEAD)).toBe(reviews);
    expect(() => reviewsOf({ repository: { nameWithOwner: REPO, pullRequest: { number: 7, headRefOid: 'b'.repeat(40), reviews } } }, REPO, 7, HEAD)).toThrow(/another PR or head/);
    expect(() => reviewsOf({ repository: { nameWithOwner: REPO, pullRequest: { number: 8, headRefOid: HEAD, reviews } } }, REPO, 7, HEAD)).toThrow(/another PR or head/);
    const commit = { __typename: 'Commit', oid: HEAD, status: null };
    expect(commitOf({ repository: { nameWithOwner: REPO, object: commit } }, REPO, HEAD)).toBe(commit);
    for (const object of [null, { __typename: 'Tree', oid: HEAD }, { __typename: 'Commit', oid: 'b'.repeat(40) }])
        expect(() => commitOf({ repository: { nameWithOwner: REPO, object } }, REPO, HEAD)).toThrow(/missing or inaccessible/);
});

test('the embedded commit is used only when it is the head; an empty list or another valid OID means a lookup by OID', () => {
    const embedded = { oid: HEAD, status: null, checkSuites: {} };
    expect(embeddedHead({ number: 7, commits: { nodes: [{ commit: embedded }] } }, HEAD)).toBe(embedded);
    expect(embeddedHead({ number: 7, commits: { nodes: [] } }, HEAD)).toBeUndefined();
    expect(embeddedHead({ number: 7, commits: { nodes: [{ commit: { oid: 'b'.repeat(40), status: { contexts: [{ id: 'decoy' }] } } }] } }, HEAD)).toBeUndefined();
    for (const node of [{ number: 7 }, { number: 7, commits: {} }, { number: 7, commits: { nodes: [{}, {}] } }, { number: 7, commits: { nodes: [null] } }, { number: 7, commits: { nodes: [{ commit: { oid: 'HEAD' } }] } }, { number: 7, commits: { nodes: [{ commit: null }] } }])
        expect(() => embeddedHead(node, HEAD), JSON.stringify(node)).toThrow(/malformed/);
});

test('suites and run pages belong to the captured head, suite and repository', () => {
    expect(suiteOnHead({ id: 'CS', commit: { oid: HEAD } }, HEAD)).toMatchObject({ id: 'CS' });
    expect(() => suiteOnHead({ id: 'CS', commit: { oid: 'b'.repeat(40) } }, HEAD)).toThrow(/another commit/);
    expect(() => suiteOnHead({ id: 'CS' }, HEAD)).toThrow(/another commit/);
    const suite = { __typename: 'CheckSuite', id: 'CS', commit: { oid: HEAD }, repository: { nameWithOwner: REPO }, checkRuns: {} };
    expect(suiteOf({ node: suite }, REPO, 'CS', HEAD)).toBe(suite);
    for (const node of [null, { ...suite, __typename: 'Commit' }, { ...suite, id: 'CS2' }, { ...suite, commit: { oid: 'b'.repeat(40) } }, { ...suite, repository: { nameWithOwner: 'JFusco/other' } }, { ...suite, repository: undefined }])
        expect(() => suiteOf({ node }, REPO, 'CS', HEAD), JSON.stringify(node)).toThrow(/another suite, commit or repository/);
});

test('a head with exactly 1,000 suites is read; one with 1,001 fails with its PR, head and count', () => {
    const suites = (total: number) => { const pages = new ConnectionPages('suites'); pages.add({ totalCount: total, pageInfo: { hasNextPage: true, endCursor: 'c' }, nodes: [{ id: 'CS' }] }); return pages; };
    expect(() => withinSuiteCoverage(suites(1000), 7, HEAD, 1000)).not.toThrow();
    expect(() => withinSuiteCoverage(suites(1001), 7, HEAD, 1000)).toThrow(`#7 head ${HEAD} has 1001 check suites, more than the 1000 REST covers`);
});

test('statuses: an explicit null is none; a missing or malformed list, a repeated ID or a repeated context fails', () => {
    const entry = (id: string, context: string) => ({ id, context, state: 'SUCCESS', targetUrl: null, createdAt: '2026-11-26T10:00:00Z' });
    expect(statusContexts({ status: null }, 7)).toEqual([]);
    expect(statusContexts({ status: { contexts: [] } }, 7)).toEqual([]);
    const many = Array.from({ length: 300 }, (_, i) => entry(`SC_${i}`, `ctx-${i}`));
    expect(statusContexts({ status: { contexts: many } }, 7)).toBe(many);
    for (const commit of [{}, { status: {} }, { status: { contexts: null } }, { status: { contexts: {} } }])
        expect(() => statusContexts(commit, 7), JSON.stringify(commit)).toThrow(/statuses are missing/);
    for (const contexts of [[entry('a', 'one'), entry('a', 'two')], [entry('a', 'one'), entry('b', 'one')], [entry('', 'one')], [{ ...entry('a', 'one'), context: '' }], [null]])
        expect(() => statusContexts({ status: { contexts } }, 7), JSON.stringify(contexts)).toThrow(/missing or repeated entry/);
});
