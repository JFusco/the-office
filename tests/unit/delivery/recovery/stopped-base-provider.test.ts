import { expect, test, vi } from 'vitest';
import type { GitHubDelivery } from '../../../../server/delivery/pipeline/github-delivery';
import { readStoppedBaseProviderContext } from '../../../../server/delivery/recovery/stopped-base-provider';
import type { TicketJob } from '../../../../src/shared';

const repo = 'JFusco/cms-field-vocabulary', prUrl = `https://github.com/${repo}/pull/156`;
const head = '9'.repeat(40), base = 'b'.repeat(40), original = 'a'.repeat(40);
const user = { login: 'pin-courier[bot]', id: 351979519 };
const job = { key: 'GH-159', pr: 156, existingPR: true, head: original } as TicketJob;

function fixture() {
    const pr = { id: 105, number: 156, html_url: prUrl, state: 'open', draft: false, merged_at: null, commits: 1, user,
        head: { sha: head, ref: 'renovate/npm-maintenance', repo: { full_name: repo } },
        base: { sha: base, ref: 'main', repo: { full_name: repo } },
        title: 'Dependency maintenance', body: 'Closes #159', updated_at: '2026-11-10T22:00:00Z' };
    const issue = { number: 159, html_url: `https://github.com/${repo}/issues/159`, state: 'open', assignees: [{ login: 'JFusco' }],
        title: 'Ship dependency maintenance', body: 'Retain independent QA', updated_at: pr.updated_at, labels: ['maintenance'] };
    const card = { number: 159, id: 'original-card', status: 'In progress', repository: repo };
    const signature = { sha: head, author: user, committer: { login: 'web-flow' }, commit: { verification: { verified: true } } };
    const inline = { id: 12, node_id: 'comment-node', html_url: prUrl + '#discussion_r12', body: 'Check packed output',
        user: { login: 'JFusco', id: 1 }, commit_id: head, original_commit_id: head, path: 'package.json' };
    const thread = { id: 'thread', isResolved: false, isOutdated: false, comments: { nodes: [{ id: inline.node_id }], pageInfo: { hasNextPage: false } } };
    const connection = { nodes: [thread], pageInfo: { hasNextPage: false, endCursor: '' } };
    const get = vi.fn(async (path: string) => {
        if (path === 'issues/159') return issue;
        if (path.startsWith('pulls/156/commits?')) return [signature];
        if (path.startsWith('pulls/156/comments?')) return [inline];
        if (/^(issues\/159\/comments|issues\/156\/comments|pulls\/156\/reviews)\?/.test(path)) return [];
        throw new Error(`Unexpected fixture path ${path}`);
    });
    let observed = 0;
    const delivery = {
        store: { project: { id: 'cms-field-vocabulary', provider: 'github', repository: repo, repo: '/fixture', target: 'main' },
            clock: { now: () => new Date(1794348000000 + ++observed) } },
        engine: { github: { board: async () => ({ items: [card] }) } },
        api: get, verifyPR: vi.fn(async () => structuredClone(pr)),
        readinessPolicy: async () => ({ repository: repo, head, branch: 'main', observedAt: String(++observed), branchProtected: false, rulesets: [], protectionDetailRequired: false }),
        execute: vi.fn(async () => JSON.stringify({ data: { repository: { pullRequest: {
            number: 156, headRefOid: head, baseRefOid: base, reviewDecision: null, reviewThreads: connection,
        } } } })),
    };
    return { delivery, pr, issue, card, signature, inline, thread, connection, get,
        read: () => readStoppedBaseProviderContext(delivery as unknown as GitHubDelivery, job) };
}

test('binds the prospective signed head and complete discussion while preserving the original job head', async () => {
    const f = fixture();
    const first = await f.read();
    expect(first.pr.head).toBe(head);
    expect(first.issue.board.item.id).toBe('original-card');
    expect(first.threads.threads).toEqual([{ id: 'thread', resolved: false, outdated: false, commentIds: ['comment-node'] }]);
    expect(job.head).toBe(original);
    expect((await f.read()).version).toBe(first.version);
    f.inline.body = 'New scope detail';
    expect((await f.read()).version).not.toBe(first.version);
    f.inline.body = 'Check packed output'; f.thread.isResolved = true;
    expect((await f.read()).version).not.toBe(first.version);
});

test.each(['signature', 'coverage', 'head-drift', 'nested-pagination', 'thread-mismatch', 'cursor-repeat', 'foreign-app'] as const)
    ('refuses incomplete or mismatched provider evidence: %s', async reason => {
        const f = fixture();
        if (reason === 'signature') f.signature.commit.verification.verified = false;
        if (reason === 'coverage') f.pr.commits = 2;
        if (reason === 'head-drift') f.delivery.verifyPR.mockResolvedValueOnce(structuredClone(f.pr)).mockResolvedValueOnce({ ...f.pr, title: 'Changed title' });
        if (reason === 'nested-pagination') f.thread.comments.pageInfo.hasNextPage = true;
        if (reason === 'thread-mismatch') f.inline.node_id = 'foreign-inline';
        if (reason === 'cursor-repeat') { f.connection.nodes = []; f.connection.pageInfo = { hasNextPage: true, endCursor: 'same' }; }
        if (reason === 'foreign-app') f.pr.user = { ...user, id: 7 };
        await expect(f.read()).rejects.toThrow();
    });
