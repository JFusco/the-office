import { expect, test } from 'vitest';
import type { ObservedPR } from '../../../server/github/pr-observation-graphql';
import { graphqlPR, restLogin } from '../../../server/github/pr-observation-shape';
import { restPR } from '../../../server/github/pr-rest-shape';
import { FROZEN_GOLDEN, frozenRerun } from './support/frozen-prs';
import { H22, pr20, pr21, pr22, pr30, type GraphqlPR } from './support/pull-fixtures';

const observed = (pr: GraphqlPR, change: (pr: ObservedPR) => void = () => { }): ObservedPR => {
    const value = structuredClone({ node: pr.node, reviews: pr.reviews, contexts: pr.rollup ?? [], commit: pr.node.headRefOid });
    change(value);
    return value;
};

test('GraphQL-built rows equal the REST-built rows and the frozen pre-change rows, field for field and in order', () => {
    const graphql = [pr22, pr21, pr20].map(p => graphqlPR(observed(p.graphql)));
    expect(graphql).toStrictEqual([pr22, pr21, pr20].map(({ rest: r }) => restPR(r.detail, r.reviews, r.checks, r.statuses)));
    expect(graphql).toStrictEqual(FROZEN_GOLDEN);
    for (const refresh of [1, 2, 3] as const) expect([graphqlPR(observed(pr30(refresh).graphql))]).toStrictEqual(frozenRerun(refresh));
});

test('a rerun replaces the failed run, a same-name run from another suite stays, and only the newest same-name status is kept', () => {
    const tests = graphqlPR(observed(pr30(2).graphql)).checks.filter(check => check.name === 'test');
    expect(tests.map(check => [check.url, check.conclusion])).toEqual([
        ['https://github.com/JFusco/brain/actions/runs/301/job/1', 'success'], ['https://github.com/JFusco/brain/actions/runs/300/job/2', 'success'], ['https://ci.example.test/s/2', 'success']]);
});

test('a merge reads as closed with its time, an already suffixed bot login keeps one suffix, and EXPECTED is dropped', () => {
    const row = graphqlPR(observed(pr22.graphql, pr => {
        Object.assign(pr.node, { state: 'MERGED', mergedAt: '2026-11-26T11:00:00Z', author: { __typename: 'Bot', login: 'renovate[bot]' } });
        pr.contexts.push({ __typename: 'StatusContext', id: 'SC_X', context: 'required/ci', state: 'EXPECTED', targetUrl: null, createdAt: '2026-11-26T11:00:00Z' });
    }));
    expect(row).toMatchObject({ state: 'closed', mergedAt: '2026-11-26T11:00:00Z', author: 'renovate[bot]' });
    expect(row.checks.map(check => check.name)).toEqual(['build', 'deploy/preview']);
    expect(graphqlPR(observed(pr22.graphql, pr => { pr.node.state = 'CLOSED'; })).state).toBe('closed');
    expect([restLogin({ __typename: 'Mannequin', login: 'old' }, 'x'), restLogin({ __typename: 'Organization', login: 'org' }, 'x')]).toEqual(['old', 'org']);
});

test('statuses with the same time keep the rollup order; distinct contexts are newest first after every check run', () => {
    const status = (id: string, context: string, createdAt: string) => ({ __typename: 'StatusContext', id, context, state: 'SUCCESS', targetUrl: `https://ci.example.test/${id}`, createdAt });
    const row = graphqlPR(observed(pr22.graphql, pr => { pr.contexts = [status('a', 'one', '2026-11-26T10:00:00Z'), status('b', 'two', '2026-11-26T10:00:00Z'), status('c', 'three', '2026-11-26T10:02:00Z'), pr.contexts[0]]; }));
    expect(row.checks.map(check => check.name)).toEqual(['build', 'three', 'one', 'two']);
});

test.each([
    ['an unknown PR state', (pr: ObservedPR) => { pr.node.state = 'open'; }],
    ['an unknown mergeability', (pr: ObservedPR) => { pr.node.mergeable = 'mergeable'; }],
    ['a REST-cased check status', (pr: ObservedPR) => { pr.contexts[0].status = 'completed'; }],
    ['a REST-cased check conclusion', (pr: ObservedPR) => { pr.contexts[0].conclusion = 'success'; }],
    ['an unknown status state', (pr: ObservedPR) => { pr.contexts[1].state = 'success'; }],
    ['a REST-cased review state', (pr: ObservedPR) => { pr.reviews[0].state = 'approved'; }],
    ['a missing PR author', (pr: ObservedPR) => { pr.node.author = null; }],
    ['a missing reviewer', (pr: ObservedPR) => { pr.reviews[1].author = null; }],
    ['a review commit that is unavailable', (pr: ObservedPR) => { pr.reviews[0].commit = null; }],
    ['an unknown context kind', (pr: ObservedPR) => { pr.contexts[0].__typename = 'CheckSuite'; }],
    ['a malformed status time', (pr: ObservedPR) => { pr.contexts[1].createdAt = 'yesterday'; }],
    ['a malformed draft flag', (pr: ObservedPR) => { pr.node.isDraft = 'false'; }],
    ['an unverified commit', (pr: ObservedPR) => { pr.commit = 'HEAD'; }],
])('%s fails the read instead of reaching consumers', (_name, change) => {
    expect(() => graphqlPR(observed(pr22.graphql, change))).toThrow(/GitHub PR inventory/);
});

test('every check row carries the verified commit, and query-only IDs and times are not kept', () => {
    const row = graphqlPR(observed(pr22.graphql));
    expect(row.checks.every(check => check.sha === H22)).toBe(true);
    expect(JSON.stringify(row)).not.toMatch(/PR_22|PRR_|CR_|SC_|createdAt|2026-11-26T09:10/);
});

test('a check or review value GitHub adds later passes through in REST casing, as REST would send it', () => {
    const row = graphqlPR(observed(pr22.graphql, pr => { pr.contexts[0].status = 'FUTURE_STATUS'; pr.contexts[0].conclusion = 'NEW_OUTCOME'; pr.reviews[0].state = 'NEW_REVIEW'; }));
    expect(row.checks[0]).toMatchObject({ status: 'future_status', conclusion: 'new_outcome' });
    expect(row.reviews[0].state).toBe('NEW_REVIEW');
});
