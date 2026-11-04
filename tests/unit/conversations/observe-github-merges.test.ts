import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, HEAD, BASE, REPOSITORY } from '../delivery/support/fake-github';
import { noticeState } from '../../../server/conversations/notifications';
import { observeGitHubMergeNotices } from '../../../server/conversations/observe-github-merges';

afterEach(cleanupFakes);
function fixture() {
    const f = fakeGitHub();
    const notices = noticeState(f.store);
    notices.policy = { enabled: true, recipients: 'assignee', workspace: 'Verndale', mappings: '', enabledAt: '2026-11-01T00:00:00Z' };
    const pr = { number: 313, html_url: `https://github.com/${REPOSITORY}/pull/313`, state: 'closed', body: 'Closes #5',
        merged_at: '2026-11-03T22:25:40Z', merge_commit_sha: BASE, head: { sha: HEAD, ref: 'codex/5' }, base: { ref: 'main', repo: { full_name: REPOSITORY } } };
    f.state.prs.push(pr);
    f.delivery.jobs.push({ id: 'native-mirror', key: 'GH-5', pr: 313, prUrl: pr.html_url, requestedAt: '2026-11-03T22:11:00Z', status: 'cancelled', stage: 'prepare-pr', head: '', worktree: '', branch: '', detail: 'Retired empty mirror', steps: [] });
    return { f, notices, pr };
}
test('a merged native publication queues its assignee notice after the duplicate delivery is retired, once', async () => {
    const { f, notices } = fixture();
    await observeGitHubMergeNotices(f.delivery);
    expect(notices.entries).toMatchObject([{ key: 'GH-5', identity: 'JFusco', status: 'queued', mergeCommit: BASE }]);
    const calls = f.state.calls.length;
    await observeGitHubMergeNotices(f.delivery);
    expect(notices.entries).toHaveLength(1);
    expect(f.state.calls).toHaveLength(calls);
    expect(f.store.state.slackDeliveries || []).toEqual([]);
});
test.each(['open', 'unlinked', 'unassigned', 'disabled', 'paused', 'historical', 'uncertain-notice'])(
    '%s never creates or replays a notice', async scenario => {
        const { f, notices, pr } = fixture();
        if (scenario === 'open') { pr.state = 'open'; pr.merged_at = ''; }
        if (scenario === 'unlinked') pr.body = 'Unrelated change';
        if (scenario === 'unassigned') f.state.issue.assignees = [];
        if (scenario === 'disabled') notices.policy.enabled = false;
        if (scenario === 'paused') f.store.state.paused = true;
        if (scenario === 'historical') notices.policy.enabledAt = '2026-11-04T00:00:00Z';
        if (scenario === 'uncertain-notice') notices.entries.push({ prUrl: pr.html_url, status: 'uncertain' } as any);
        const before = structuredClone(notices.entries);
        await observeGitHubMergeNotices(f.delivery);
        expect(notices.entries).toEqual(before);
    });
