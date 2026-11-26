import { expect, test } from 'vitest';
import { CHILD_PAGE, CONTEXT_PAGE, CONTEXTS_QUERY, NODE_LIMIT, PR_PAGE, REVIEW_PAGE, REVIEWS_QUERY, ROOT_QUERY, rootNodes } from '../../../server/github/pr-observation-query';

test('the root page reads open PRs newest first at the probed sizes, within the node limit', () => {
    expect([PR_PAGE, REVIEW_PAGE, CONTEXT_PAGE, CHILD_PAGE]).toEqual([20, 10, 20, 50]);
    expect(ROOT_QUERY).toContain(`pullRequests(states:[OPEN],first:${PR_PAGE},after:$after,orderBy:{field:CREATED_AT,direction:DESC})`);
    expect(ROOT_QUERY).toContain(`reviews(first:${REVIEW_PAGE})`);
    expect(ROOT_QUERY).toContain(`commits(last:1){nodes{commit{oid statusCheckRollup{contexts(first:${CONTEXT_PAGE})`);
    expect(rootNodes).toBe(640);
    expect(rootNodes).toBeLessThanOrEqual(NODE_LIMIT);
});

test('every query states its cost and balance; continuations are bound to one PR or one commit OID', () => {
    for (const query of [ROOT_QUERY, REVIEWS_QUERY, CONTEXTS_QUERY]) expect(query).toContain('rateLimit{cost limit used remaining resetAt}');
    expect(REVIEWS_QUERY).toContain(`pullRequest(number:$number){number headRefOid reviews(first:${CHILD_PAGE},after:$after)`);
    expect(CONTEXTS_QUERY).toContain('object(oid:$oid){__typename ... on Commit{oid statusCheckRollup{contexts(first:50,after:$after)');
    expect(CONTEXTS_QUERY).not.toMatch(/ref|pullRequest/);
});

test('the projection reads links from the body, so native closing references and integrator links are not selected', () => {
    for (const query of [ROOT_QUERY, REVIEWS_QUERY, CONTEXTS_QUERY]) expect(query).not.toMatch(/closingIssuesReferences|detailsUrl|permalink/);
    expect(ROOT_QUERY).toContain('... on CheckRun{id name status conclusion url}');
    expect(ROOT_QUERY).toContain('... on StatusContext{id context state targetUrl createdAt}');
});
