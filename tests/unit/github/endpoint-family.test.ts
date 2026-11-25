import { expect, test } from 'vitest';
import { githubCall } from '../../../server/github/endpoint-family';

const family = (...args: string[]) => githubCall(args).family;

test('REST calls are grouped by endpoint family, never by path, number, ref or query', () => {
    const repo = 'repos/JFusco/brain';
    expect([
        family('api', `${repo}/issues?state=open&per_page=100`, '--paginate', '--slurp'), family('api', `${repo}/issues/12`), family('api', `${repo}/issues/12/comments?per_page=100`),
        family('api', `${repo}/issues/comments/9`), family('api', `${repo}/pulls?state=open&per_page=100`), family('api', `${repo}/pulls/7`), family('api', `${repo}/pulls/7/reviews?per_page=100`),
        family('api', `${repo}/pulls/7/merge`, '--method', 'PUT'), family('api', `${repo}/commits/abc/check-runs?per_page=100`), family('api', `${repo}/commits/abc/statuses`), family('api', `${repo}/commits/abc/status`),
        family('api', `${repo}/actions/runs?per_page=100`), family('api', `${repo}/actions/runs/5`), family('api', `${repo}/actions/runs/5/rerun-failed-jobs`, '--method', 'POST'), family('api', `${repo}/actions/jobs/3/logs`),
        family('api', `${repo}/actions/workflows?per_page=100`), family('api', `${repo}/actions/workflows/4/runs?per_page=5`), family('api', `${repo}/dependabot/alerts?state=open`), family('api', repo),
    ]).toEqual(['issues', 'issue', 'issue-comments', 'issue-comments', 'pulls', 'pull', 'pull-reviews', 'pull-merge', 'check-runs', 'statuses', 'statuses',
        'actions-runs', 'actions-run', 'actions-rerun', 'actions-jobs', 'workflows', 'workflow-runs', 'dependabot-alerts', 'repository']);
});

test('the endpoint is the first positional argument, after any flag and its value', () => {
    expect(family('api', '-X', 'DELETE', 'repos/JFusco/brain/git/refs/heads/codex/5-x')).toBe('git-refs');
    expect(family('api', '-H', 'Accept: application/vnd.github+json', '/repos/JFusco/brain/pulls/1')).toBe('pull');
});

test('direct GraphQL, rate limits and users have their own families; anything else is a fixed fallback', () => {
    expect(githubCall(['api', 'graphql', '--input', '-'])).toEqual({ family: 'graphql', api: true, paginate: false, slurp: false, include: false });
    expect([family('api', 'rate_limit'), family('api', 'users/someone'), family('api', 'orgs/x/teams'), family('api', 'repos/JFusco/brain/unheard-of/1')]).toEqual(['rate-limit', 'users', 'api-other', 'repository-other']);
});

test('high-level commands are opaque, and the pagination and include flags are read', () => {
    expect([family('pr', 'view', '7'), family('issue', 'close', '3'), family('auth', 'status'), family('run', 'list'), family('repo', 'view')]).toEqual(['gh-pr', 'gh-issue', 'gh-auth', 'gh-run', 'gh-other']);
    expect(githubCall(['pr', 'list']).api).toBe(false);
    expect(githubCall(['api', 'repos/a/b/pulls', '--paginate', '--slurp', '-i'])).toMatchObject({ paginate: true, slurp: true, include: true });
});
