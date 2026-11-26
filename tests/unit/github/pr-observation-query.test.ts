import { expect, test } from 'vitest';
import { CHILD_PAGE, HEAD_QUERY, MAX_SUITES, NODE_LIMIT, PR_PAGE, REVIEW_PAGE, REVIEWS_QUERY, ROOT_QUERY, rootNodes, RUN_PAGE, RUNS_QUERY, SUITE_PAGE, SUITES_QUERY } from '../../../server/github/pr-observation-query';

const QUERIES = [ROOT_QUERY, REVIEWS_QUERY, HEAD_QUERY, SUITES_QUERY, RUNS_QUERY];
const LATEST_RUNS = /checkRuns\(first:\d+(?:,after:\$runAfter)?,filterBy:\{checkType:LATEST\}\)\{totalCount pageInfo\{hasNextPage endCursor\} nodes\{id databaseId name status conclusion permalink\}\}/g;

test('the root page reads open PRs newest first at the qualified sizes, within the node limit', () => {
    expect([PR_PAGE, REVIEW_PAGE, SUITE_PAGE, RUN_PAGE, CHILD_PAGE, MAX_SUITES]).toEqual([10, 10, 10, 50, 50, 1000]);
    expect(ROOT_QUERY).toContain(`pullRequests(states:[OPEN],first:${PR_PAGE},after:$after,orderBy:{field:CREATED_AT,direction:DESC})`);
    expect(ROOT_QUERY).toContain(`reviews(first:${REVIEW_PAGE})`);
    expect(ROOT_QUERY).toContain(`commits(last:1){nodes{commit{oid status{contexts{id context state targetUrl createdAt}} checkSuites(first:${SUITE_PAGE})`);
    // Each PR, its reviews, its one commit, and ten suites of fifty runs each.
    expect(rootNodes).toBe(10 * (1 + 10 + 1 + 10 * (1 + 50)));
    expect(rootNodes).toBe(5220);
    expect(rootNodes).toBeLessThanOrEqual(NODE_LIMIT);
});

test('every query states its cost and balance, and every paged connection its count, page info and nodes', () => {
    for (const query of QUERIES) {
        expect(query).toContain('rateLimit{cost limit used remaining resetAt}');
        const connections = [...query.matchAll(/(pullRequests|reviews|checkSuites|checkRuns)\([^)]*\)\{totalCount pageInfo\{hasNextPage endCursor\} nodes\{/g)].length;
        expect(connections, query.slice(0, 60)).toBe(query.match(/(pullRequests|reviews|checkSuites|checkRuns)\(/g)!.length);
    }
});

test('every run selection asks for LATEST runs with their own permalink; no query reads the rollup', () => {
    for (const query of [ROOT_QUERY, HEAD_QUERY, SUITES_QUERY, RUNS_QUERY]) expect(query.match(LATEST_RUNS)).toHaveLength(1);
    for (const query of QUERIES) {
        expect(query.match(/checkRuns\(/g)?.length ?? 0).toBe(query.match(LATEST_RUNS)?.length ?? 0);
        expect(query).not.toMatch(/statusCheckRollup|closingIssuesReferences|detailsUrl|\burl\}/);
    }
});

test('child requests are bound to their parent: a PR by number, a head by OID, a suite by node ID', () => {
    expect(REVIEWS_QUERY).toContain(`pullRequest(number:$number){number headRefOid reviews(first:${CHILD_PAGE},after:$after)`);
    expect(HEAD_QUERY).toContain(`object(oid:$oid){__typename ... on Commit{oid status{contexts{id context state targetUrl createdAt}} checkSuites(first:${SUITE_PAGE})`);
    expect(SUITES_QUERY).toContain(`object(oid:$oid){__typename ... on Commit{oid checkSuites(first:${SUITE_PAGE},after:$suiteAfter)`);
    for (const query of [ROOT_QUERY, HEAD_QUERY, SUITES_QUERY]) expect(query).toContain('nodes{id commit{oid} checkRuns(');
    expect(RUNS_QUERY).toContain(`node(id:$id){__typename ... on CheckSuite{id commit{oid} repository{nameWithOwner} checkRuns(first:${CHILD_PAGE},after:$runAfter,filterBy:{checkType:LATEST})`);
    expect([HEAD_QUERY, SUITES_QUERY].every(query => !/ref|pullRequest/.test(query))).toBe(true);
    // The run continuation names no repository variable: its suite is found by node ID and checked by its own repository.
    expect(RUNS_QUERY).toMatch(/^query\(\$id:ID!,\$runAfter:String\)/);
});
