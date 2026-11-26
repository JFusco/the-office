import { expect, test } from 'vitest';
import type { ObservedPR } from '../../../server/github/pr-observation-graphql';
import { graphqlPR, restLogin } from '../../../server/github/pr-observation-shape';
import { restPR } from '../../../server/github/pr-rest-shape';
import { FROZEN_GOLDEN, frozenRerun } from './support/frozen-prs';
import { BRAIN_HEAD, BRAIN_REST, BRAIN_ROLLUP, CPY_LINKS, TIE_GRAPHQL, TIE_HEAD, TIE_REST, TS_HEAD, TS_REST_LATEST, TS_ROLLUP, TS_RUNS, TS_SUITES } from './support/gate-fixtures';
import { H22, pr20, pr21, pr22, pr30, run, type GraphqlPR, type GraphqlRun } from './support/pull-fixtures';

/** What the reader hands the adapter: the PR, its reviews, the verified head and the LATEST runs and statuses GitHub sent. */
const observed = (pr: GraphqlPR, change: (pr: ObservedPR) => void = () => { }): ObservedPR => {
    const value = structuredClone({ node: pr.node, reviews: pr.reviews, commit: pr.node.headRefOid,
        checkRuns: pr.suites.flatMap(suite => suite.runs.filter(r => r.latest !== false).map(({ latest: _latest, ...r }) => r)), statuses: pr.statuses ?? [] });
    change(value);
    return value;
};
/** A bare PR on `head` whose only evidence is the given runs and statuses. */
const bare = (head: string, checkRuns: Partial<GraphqlRun>[], statuses: any[] = []): ObservedPR => ({ ...observed(pr21.graphql), commit: head, node: { ...pr21.graphql.node, headRefOid: head }, checkRuns, statuses });
const rest = (head: string, checkRuns: any[], statuses: any[] = []) => restPR({ ...pr21.rest.detail, head: { sha: head } }, [], [{ total_count: checkRuns.length, check_runs: checkRuns }], statuses).checks;
const upper = (value: string) => value ? value.toUpperCase() : null;

test('GraphQL-built rows equal the REST-built rows and the frozen pre-change rows, field for field and in order', () => {
    const graphql = [pr22, pr21, pr20].map(p => graphqlPR(observed(p.graphql)));
    expect(graphql).toStrictEqual([pr22, pr21, pr20].map(({ rest: r }) => restPR(r.detail, r.reviews, r.checks, r.statuses)));
    expect(graphql).toStrictEqual(FROZEN_GOLDEN);
    for (const refresh of [1, 2, 3] as const) {
        const { rest: r } = pr30(refresh);
        expect([graphqlPR(observed(pr30(refresh).graphql))]).toStrictEqual(frozenRerun(refresh));
        expect([restPR(r.detail, r.reviews, r.checks, r.statuses)]).toStrictEqual(frozenRerun(refresh));
    }
});

test('a rerun replaces the failed run, a same-name run from another suite stays, and only the latest same-name status is kept', () => {
    const tests = graphqlPR(observed(pr30(2).graphql)).checks.filter(check => check.name === 'test');
    expect(tests.map(check => [check.url, check.conclusion])).toEqual([
        ['https://github.com/JFusco/brain/actions/runs/300/job/3003', 'success'], ['https://github.com/JFusco/brain/actions/runs/301/job/3002', 'success'], ['https://ci.example.test/s/2', 'success']]);
});

test('TypeScript 65670: suites with LATEST runs give REST’s 35 runs in REST’s order, the run the rollup missed included', () => {
    const latest = new Set(TS_REST_LATEST), byId = new Map(TS_RUNS.map(row => [row[0], row]));
    const link = (id: number) => `https://github.com/microsoft/TypeScript/runs/${id}`;
    // GraphQL order: suite by suite as GitHub listed them, runs ascending within each, superseded runs filtered out by LATEST.
    const arrival = TS_SUITES.flatMap(([suite]) => TS_RUNS.filter(row => row[4] === suite && latest.has(row[0])))
        .map(([id, name, status, conclusion]) => run(id, name, status.toUpperCase(), upper(conclusion), link(id)));
    expect(arrival).toHaveLength(35);
    expect(arrival.map(r => r.databaseId)).not.toEqual(TS_REST_LATEST);
    const rows = graphqlPR(bare(TS_HEAD, arrival)).checks;
    expect(rows.map(row => Number(row.url.split('/').at(-1)))).toEqual(TS_REST_LATEST);
    expect(rows.map(row => Number(row.url.split('/').at(-1)))).not.toEqual(TS_ROLLUP);
    expect(rows.find(row => row.url === link(139483293583))).toMatchObject({ name: 'copilot-pull-request-reviewer', status: 'completed', conclusion: 'success', sha: TS_HEAD });
    // The REST oracle from REST's own order and values, never through the adapter.
    expect(rows).toStrictEqual(rest(TS_HEAD, TS_REST_LATEST.map(id => { const [, name, status, conclusion] = byId.get(id)!; return { name, status, conclusion: conclusion || null, html_url: link(id), head_sha: TS_HEAD }; })));
});

test('Brain 451: arrival in the rollup’s order still gives REST’s order, and each run links to its permalink, not a generic run URL', () => {
    const arrival = BRAIN_ROLLUP.map(([id, name]) => run(id, name, 'COMPLETED', 'SUCCESS', BRAIN_REST.find(row => row[0] === id)![2]));
    const rows = graphqlPR(bare(BRAIN_HEAD, arrival)).checks;
    expect(rows.map(row => [row.name, row.url])).toEqual(BRAIN_REST.map(([, name, url]) => [name, url]));
    for (const [, , generic] of BRAIN_ROLLUP) expect(rows.map(row => row.url)).not.toContain(generic);
});

test('cpython eb7066e: all 55 permalinks are REST’s html_url, the third-party ClusterFuzzLite run included', () => {
    const arrival = CPY_LINKS.map(([id, permalink]) => run(id, `job-${id}`, 'COMPLETED', 'SUCCESS', permalink));
    const rows = graphqlPR(bare('e'.repeat(40), arrival)).checks;
    expect(rows.map(row => row.url)).toEqual([...CPY_LINKS].sort((a, b) => b[0] - a[0]).map(([, , html]) => html));
    expect(rows.map(row => row.url)).toContain('https://github.com/python/cpython/runs/139763894887');
    // Its details link belongs to the third party and is never selected.
    expect(rest('e'.repeat(40), [{ name: 'fuzz', status: 'completed', conclusion: 'success', html_url: 'https://github.com/python/cpython/runs/139763894887', details_url: 'https://clusterfuzzlite.example.test/run/1', head_sha: 'e'.repeat(40) }]))
        .toStrictEqual(graphqlPR(bare('e'.repeat(40), [run(139763894887, 'fuzz', 'COMPLETED', 'SUCCESS', 'https://github.com/python/cpython/runs/139763894887')])).checks);
});

test('runs sort numerically at full width, not as text or 32-bit values', () => {
    const rows = graphqlPR(bare('e'.repeat(40), [9, 139483293583, 10, Number.MAX_SAFE_INTEGER, 2 ** 31 + 5].map(id => run(id, `r${id}`, 'COMPLETED', 'SUCCESS', `https://example.test/${id}`)))).checks;
    expect(rows.map(row => row.name)).toEqual([`r${Number.MAX_SAFE_INTEGER}`, 'r139483293583', `r${2 ** 31 + 5}`, 'r10', 'r9']);
});

test.each([
    ['missing', undefined], ['coerced from text', '139483293583'], ['zero', 0], ['negative', -1], ['fractional', 1.5], ['unsafe', 2 ** 53], ['not a number', NaN],
])('a run ID that is %s fails the read', (_name, id) => {
    expect(() => graphqlPR(bare('e'.repeat(40), [{ ...run(1, 'x', 'COMPLETED', 'SUCCESS', 'https://example.test/1'), databaseId: id as any }]))).toThrow(/check run ID/);
});

test('the same run ID in two suites fails the read', () => {
    expect(() => graphqlPR(bare('e'.repeat(40), [run(139483293583, 'a', 'COMPLETED', 'SUCCESS', 'https://example.test/a'), { ...run(139483293583, 'b', 'COMPLETED', 'SUCCESS', 'https://example.test/b'), id: 'CR_other' }]))).toThrow(/repeated/);
});

test.each([
    ['as GitHub listed them', TIE_GRAPHQL],
    ['reversed', [...TIE_GRAPHQL].reverse()],
])('cpython eb7066e statuses %s: newest first, and within the tied second by code-unit order, every row and link kept', (_name, statuses) => {
    const rows = graphqlPR(bare(TIE_HEAD, [], statuses)).checks;
    expect(rows.map(row => [row.name, row.url])).toEqual([
        ['docs/readthedocs.org:cpython-previews', 'https://cpython-previews--145149.org.readthedocs.build/en/145149/'], ['bedevere/news', ''],
        ['CLA Signing', ''], ['bedevere/issue-number', 'https://github.com/python/cpython/issues/160760']]);
    // REST holds the same latest rows but lists the tied pair the other way round, which REST leaves unspecified.
    const restRows = rest(TIE_HEAD, [], TIE_REST);
    expect(restRows.map(row => row.name)).toEqual(['docs/readthedocs.org:cpython-previews', 'bedevere/news', 'bedevere/issue-number', 'CLA Signing']);
    expect([...rows].sort((a, b) => a.name.localeCompare(b.name))).toStrictEqual([...restRows].sort((a, b) => a.name.localeCompare(b.name)));
    // Apart from the tie, the sequence of times is REST's: newest first, the same distinct timestamps in the same order.
    const at = (name: string) => TIE_GRAPHQL.find(s => s.context === name)!.createdAt, restAt = (name: string) => TIE_REST.find(s => s.context === name)!.created_at;
    expect(rows.map(row => at(row.name))).toEqual(restRows.map(row => restAt(row.name)));
    expect(new Set(rows.map(row => at(row.name))).size).toBe(3);
});

test('many statuses keep reverse chronology; no status, EXPECTED and a null link are handled as REST shows them', () => {
    const many = Array.from({ length: 300 }, (_, i) => ({ id: `SC_${i}`, context: `ctx-${i}`, state: i % 2 ? 'SUCCESS' : 'PENDING', targetUrl: i % 3 ? `https://ci.example.test/${i}` : null, createdAt: new Date(Date.UTC(2026, 10, 26, 10, 0, i)).toISOString() }));
    const rows = graphqlPR(bare('e'.repeat(40), [], many)).checks;
    expect(rows.map(row => row.name)).toEqual(many.map(s => s.context).reverse());
    expect(rows.find(row => row.name === 'ctx-0')).toEqual({ name: 'ctx-0', status: 'pending', conclusion: 'pending', url: '', sha: 'e'.repeat(40) });
    expect(graphqlPR(observed(pr20.graphql)).checks).toEqual([]);
    const expected = graphqlPR(observed(pr22.graphql, pr => { pr.statuses.push({ id: 'SC_X', context: 'required/ci', state: 'EXPECTED', targetUrl: null, createdAt: '2026-11-26T11:00:00Z' }); }));
    expect(expected.checks.map(check => check.name)).toEqual(['build', 'deploy/preview']);
});

test('a merge reads as closed with its time, and an already suffixed bot login keeps one suffix', () => {
    const row = graphqlPR(observed(pr22.graphql, pr => { Object.assign(pr.node, { state: 'MERGED', mergedAt: '2026-11-26T11:00:00Z', author: { __typename: 'Bot', login: 'renovate[bot]' } }); }));
    expect(row).toMatchObject({ state: 'closed', mergedAt: '2026-11-26T11:00:00Z', author: 'renovate[bot]' });
    expect(graphqlPR(observed(pr22.graphql, pr => { pr.node.state = 'CLOSED'; })).state).toBe('closed');
    expect([restLogin({ __typename: 'Mannequin', login: 'old' }, 'x'), restLogin({ __typename: 'Organization', login: 'org' }, 'x')]).toEqual(['old', 'org']);
});

test.each([
    ['an unknown PR state', (pr: ObservedPR) => { pr.node.state = 'open'; }],
    ['an unknown mergeability', (pr: ObservedPR) => { pr.node.mergeable = 'mergeable'; }],
    ['a REST-cased check status', (pr: ObservedPR) => { pr.checkRuns[0].status = 'completed'; }],
    ['a REST-cased check conclusion', (pr: ObservedPR) => { pr.checkRuns[0].conclusion = 'success'; }],
    ['a run without its permalink', (pr: ObservedPR) => { delete pr.checkRuns[0].permalink; }],
    ['an unknown status state', (pr: ObservedPR) => { pr.statuses[0].state = 'success'; }],
    ['a malformed status time', (pr: ObservedPR) => { pr.statuses[0].createdAt = 'yesterday'; }],
    ['a malformed status link', (pr: ObservedPR) => { pr.statuses[0].targetUrl = 7; }],
    ['a REST-cased review state', (pr: ObservedPR) => { pr.reviews[0].state = 'approved'; }],
    ['a missing PR author', (pr: ObservedPR) => { pr.node.author = null; }],
    ['a missing reviewer', (pr: ObservedPR) => { pr.reviews[1].author = null; }],
    ['a review commit that is unavailable', (pr: ObservedPR) => { pr.reviews[0].commit = null; }],
    ['a malformed draft flag', (pr: ObservedPR) => { pr.node.isDraft = 'false'; }],
    ['an unverified commit', (pr: ObservedPR) => { pr.commit = 'HEAD'; }],
])('%s fails the read instead of reaching consumers', (_name, change) => {
    expect(() => graphqlPR(observed(pr22.graphql, change))).toThrow(/GitHub PR inventory/);
});

test('every check row carries the verified commit, and query-only IDs, cursors and times are not kept', () => {
    const row = graphqlPR(observed(pr22.graphql));
    expect(row.checks.every(check => check.sha === H22)).toBe(true);
    expect(JSON.stringify(row)).not.toMatch(/PR_22|PRR_|CR_|CS_|SC_|createdAt|databaseId|permalink|2026-11-26T09:10/);
});

test('a check or review value GitHub adds later passes through in REST casing, as REST would send it', () => {
    const row = graphqlPR(observed(pr22.graphql, pr => { pr.checkRuns[0].status = 'FUTURE_STATUS'; pr.checkRuns[0].conclusion = 'NEW_OUTCOME'; pr.reviews[0].state = 'NEW_REVIEW'; }));
    expect(row.checks[0]).toMatchObject({ status: 'future_status', conclusion: 'new_outcome' });
    expect(row.reviews[0].state).toBe('NEW_REVIEW');
});
