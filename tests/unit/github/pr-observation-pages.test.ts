import { expect, test } from 'vitest';
import { ConnectionPages, contextPages, embeddedRollup, prIdentity, reconcileContexts, repositoryOf, reviewsOf, rollupOf } from '../../../server/github/pr-observation-pages';

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
    expect(rollupOf({ repository: { nameWithOwner: REPO, object: { __typename: 'Commit', oid: HEAD, statusCheckRollup: null } } }, REPO, HEAD)).toBeNull();
    for (const object of [null, { __typename: 'Tree', oid: HEAD }, { __typename: 'Commit', oid: 'b'.repeat(40) }])
        expect(() => rollupOf({ repository: { nameWithOwner: REPO, object } }, REPO, HEAD)).toThrow(/missing or inaccessible/);
});

test('the embedded rollup is the head commit or none; any other commit, or more than one, fails', () => {
    expect(embeddedRollup({ number: 7, commits: { nodes: [{ commit: { oid: HEAD, statusCheckRollup: null } }] } }, HEAD)).toEqual({ rollup: null });
    expect(embeddedRollup({ number: 7, commits: { nodes: [] } }, HEAD)).toBeUndefined();
    expect(() => embeddedRollup({ number: 7, commits: { nodes: [{ commit: { oid: 'b'.repeat(40) } }] } }, HEAD)).toThrow(/not its head/);
    expect(() => embeddedRollup({ number: 7, commits: { nodes: [{}, {}] } }, HEAD)).toThrow(/malformed/);
    expect(() => embeddedRollup({ number: 7 }, HEAD)).toThrow(/malformed/);
});

test('check runs and statuses are counted apart against the distinct contexts read', () => {
    const contexts = (runs: number, statuses: number) => {
        const pages = contextPages(7);
        pages.add({ totalCount: 2, checkRunCount: runs, statusContextCount: statuses, pageInfo: { hasNextPage: false, endCursor: null }, nodes: [{ id: 'r', __typename: 'CheckRun' }, { id: 's', __typename: 'StatusContext' }] });
        return reconcileContexts(pages);
    };
    expect(contexts(1, 1)).toHaveLength(2);
    expect(() => contexts(2, 0)).toThrow(/check counts/);
    const changed = contextPages(7);
    changed.add({ totalCount: 2, checkRunCount: 1, statusContextCount: 1, pageInfo: { hasNextPage: true, endCursor: 'c' }, nodes: [{ id: 'r', __typename: 'CheckRun' }] });
    expect(() => changed.add({ totalCount: 2, checkRunCount: 2, statusContextCount: 1, pageInfo: { hasNextPage: false, endCursor: null }, nodes: [{ id: 's', __typename: 'StatusContext' }] })).toThrow(/count changed/);
});
