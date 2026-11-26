import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, HEAD, BASE, REPOSITORY } from '../delivery/support/fake-github';
import { noticeState } from '../../../server/conversations/notifications';
import { observeGitHubMergeNotices } from '../../../server/conversations/observe-github-merges';
import { sharedPullInventory } from '../../../server/delivery/intake/shared-pr-inventory';

afterEach(cleanupFakes);
function fixture() {
    const f = fakeGitHub();
    const notices = noticeState(f.store);
    notices.policy = { enabled: true, recipients: 'assignee', workspace: 'Verndale', mappings: '', enabledAt: '2026-11-01T00:00:00Z' };
    const pr = { number: 313, html_url: `https://github.com/${REPOSITORY}/pull/313`, state: 'closed', body: 'Closes #5', merged: true,
        merged_at: '2026-11-03T22:25:40Z' as string | null | undefined, merge_commit_sha: BASE, head: { sha: HEAD, ref: 'codex/5' }, base: { ref: 'main', repo: { full_name: REPOSITORY } } };
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
        if (scenario === 'open') Object.assign(pr, { state: 'open', merged: false, merged_at: null });
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

test('a merge channel alone is enough: external merges still post when direct messages are off', async () => {
    const { f, notices } = fixture();
    notices.policy = { ...notices.policy, enabled: false, enabledAt: '', channel: { enabled: true, channelId: 'C0DELIVER', channelName: 'delivery', workspaceId: 'T123', mentionIds: ['U111'], enabledAt: '2026-11-01T00:00:00Z', version: 'v1' } };
    await observeGitHubMergeNotices(f.delivery);
    expect(notices.entries).toMatchObject([{ key: 'GH-5', channel: true, resolved: { targetId: 'C0DELIVER' } }]);
});

/** The fixture with a controllable clock, the PR's own reads counted, and a fresh poll inventory per pass. */
function settled() {
    const x = fixture();
    let now = Date.parse('2026-11-25T12:00:00Z');
    x.f.store.clock = { now: () => new Date(now), monotonic: () => now };
    const pass = () => observeGitHubMergeNotices(x.f.delivery, sharedPullInventory(x.f.delivery));
    const prReads = () => x.f.state.calls.filter(call => call.endsWith('/pulls/313')).length;
    return { ...x, job: x.f.delivery.jobs[0], pass, prReads, advance: (ms: number) => { now += ms; } };
}
const channel = { enabled: true, channelId: 'C0DELIVER', channelName: 'delivery', workspaceId: 'T123', mentionIds: ['U111'], enabledAt: '2026-11-01T00:00:00Z', version: 'v1' };

test('an open PR in the complete inventory is never read, and is read once merged', async () => {
    const x = settled();
    Object.assign(x.pr, { state: 'open', merged: false, merged_at: null });
    await x.pass(); await x.pass();
    expect(x.prReads()).toBe(0);
    expect(x.f.state.calls.some(call => call.startsWith('gh pr view') || call.endsWith('/issues/5'))).toBe(false);
    Object.assign(x.pr, { state: 'closed', merged: true, merged_at: '2026-11-03T22:25:40Z' });
    await x.pass();
    expect(x.notices.entries).toMatchObject([{ key: 'GH-5', identity: 'JFusco', status: 'queued' }]);
});
test('without a complete inventory every candidate takes its live read', async () => {
    const x = settled();
    Object.assign(x.pr, { state: 'open', merged: false, merged_at: null });
    x.f.state.fail = (_program, args) => args[1]?.includes('/pulls?state=open') ? 'HTTP 502' : false;
    await x.pass();
    expect(x.prReads()).toBe(1);
});
test.each(['merge SHA', 'merge time'])('a conflicting local %s triggers fresh verification of a marked merge', async conflict => {
    const x = settled(), { store } = x.f;
    x.notices.policy.enabledAt = '2026-11-03T22:00:00Z';
    x.pr.merged_at = '2026-11-03T21:50:00Z';
    await x.pass();
    const first = x.job.noMergeNotice;
    expect(first).toBeDefined();
    x.advance(1000);
    if (conflict === 'merge SHA') {
        x.job.mergeCommit = x.pr.merge_commit_sha = HEAD;
    } else {
        x.pr.merged_at = '2026-11-03T21:55:00Z';
        store.state.github = { status: 'idle', observedAt: store.clock.now().toISOString(), error: '', issues: [], runs: [],
            prs: [{ number: x.pr.number, url: x.pr.html_url, state: 'closed', mergedAt: x.pr.merged_at, title: '', author: '',
                head: HEAD, base: 'main', draft: false, mergeable: null, reviews: [], checks: [] }] };
    }
    await x.pass();
    await x.pass();
    expect(x.prReads()).toBe(2);
    expect(x.job.noMergeNotice).toMatchObject({ mergeCommit: x.pr.merge_commit_sha, mergedAt: x.pr.merged_at });
    expect(x.notices.entries).toEqual([]);
});
test('a merge older than every enabled destination is read once, then never again while its marker holds', async () => {
    const x = settled();
    x.notices.policy.enabledAt = '2026-11-03T22:00:00Z';
    x.pr.merged_at = '2026-11-03T21:50:00Z';
    await x.pass();
    const reads = x.f.state.calls.length;
    expect(x.notices.entries).toEqual([]);
    expect(x.job.noMergeNotice).toMatchObject({ repository: REPOSITORY, issue: 5, pr: 313, mergeCommit: BASE, mergedAt: '2026-11-03T21:50:00Z' });
    x.advance(24 * 60 * 60 * 1000);
    await x.pass(); await x.pass();
    expect(x.f.state.calls).toHaveLength(reads);
    expect(x.prReads()).toBe(1);
});
test('a changed notice setting reads a marked merge again, and a destination that now covers it is told', async () => {
    const x = settled();
    x.notices.policy.enabledAt = '2026-11-03T22:00:00Z';
    x.pr.merged_at = '2026-11-03T21:50:00Z';
    await x.pass();
    const first = x.job.noMergeNotice!;
    x.notices.policy.recipients = 'both';
    await x.pass();
    expect(x.prReads()).toBe(2);
    expect(x.job.noMergeNotice!.policy).not.toBe(first.policy);
    x.notices.policy.channel = { ...channel };
    await x.pass();
    expect(x.prReads()).toBe(3);
    expect(x.job.noMergeNotice).toBeUndefined();
    expect(x.notices.entries).toMatchObject([{ key: 'GH-5', channel: true }]);
});
test('a provider failure creates no marker and no wait', async () => {
    const x = settled();
    x.notices.policy.enabledAt = '2026-11-03T22:00:00Z';
    x.pr.merged_at = '2026-11-03T21:50:00Z';
    x.f.state.fail = (_program, args) => args[1]?.endsWith('/issues/5') ? 'HTTP 502' : false;
    await x.pass();
    expect(x.job.noMergeNotice).toBeUndefined();
    x.f.state.fail = () => false;
    await x.pass();
    expect(x.prReads()).toBe(2);
    expect(x.job.noMergeNotice).toBeDefined();
});
test.each([
    { name: 'missing merge time', fields: { merged_at: undefined } },
    { name: 'unparseable merge time', fields: { merged_at: 'not a time' } },
    { name: 'malformed merge SHA', fields: { merge_commit_sha: 'bad-sha' } },
    { name: 'contradictory merge status', fields: { merged: false } },
])('$name permits a fresh verification on the next pass', async ({ fields }) => {
    const x = settled();
    const verified = { ...x.pr };
    Object.assign(x.pr, fields);
    await x.pass();
    expect(x.notices.entries).toEqual([]);
    expect(x.job.noMergeNotice).toBeUndefined();
    Object.assign(x.pr, verified);
    await x.pass();
    expect(x.prReads()).toBe(2);
    expect(x.notices.entries).toMatchObject([{ identity: 'JFusco', status: 'queued', mergeCommit: BASE }]);
});
test.each([true, false])('two issues on one closed PR observe the correct wait (merged: %s)', async merged => {
    const x = settled(), issueUrl = `https://github.com/${REPOSITORY}/issues/6`;
    x.f.delivery.jobs.push({ ...x.job, id: 'second-mirror', key: 'GH-6', requestedAt: '2026-11-03T22:12:00Z' });
    if (!merged) Object.assign(x.pr, { merged: false, merged_at: null });
    const issueReads: number[] = [];
    x.f.delivery.execute = async (program, args, options) => {
        if (program === 'gh' && args[0] === 'pr' && args[1] === 'view')
            return JSON.stringify({ closingIssuesReferences: [{ url: x.f.issueUrl }, { url: issueUrl }] });
        if (program === 'gh' && args[1]?.endsWith('/issues/6')) {
            issueReads.push(6);
            return JSON.stringify({ number: 6, html_url: issueUrl, assignees: [] });
        }
        if (program === 'gh' && args[1]?.endsWith('/issues/5')) issueReads.push(5);
        return x.f.execute(program, args, options);
    };
    await x.pass();
    expect(x.prReads()).toBe(merged ? 2 : 1);
    expect(issueReads).toEqual(merged ? [6, 5] : []);
    expect(x.notices.entries).toEqual(merged ? [expect.objectContaining({ key: 'GH-5', identity: 'JFusco', status: 'queued' })] : []);
});
test('a merge with nobody to tell waits thirty minutes: a new assignee is told then, a changed recipient setting at once', async () => {
    const x = settled();
    x.f.state.issue.assignees = [];
    x.f.state.issue.user = { login: 'octo' };
    await x.pass();
    expect(x.notices.entries).toEqual([]);
    expect(x.job.noMergeNotice).toBeUndefined();
    x.f.state.issue.assignees = [{ login: 'JFusco' }];
    await x.pass();
    expect(x.prReads()).toBe(1);
    x.advance(30 * 60 * 1000);
    await x.pass();
    expect(x.prReads()).toBe(2);
    expect(x.notices.entries).toMatchObject([{ identity: 'JFusco', status: 'queued' }]);

    const y = settled();
    y.f.state.issue.assignees = [];
    y.f.state.issue.user = { login: 'octo' };
    await y.pass();
    y.notices.policy.recipients = 'reporter';
    await y.pass();
    expect(y.prReads()).toBe(2);
    expect(y.notices.entries).toMatchObject([{ identity: 'octo', status: 'queued' }]);
});
test('a closed unmerged PR is read at most every thirty minutes, and at once after it reopens', async () => {
    const x = settled();
    Object.assign(x.pr, { merged: false, merged_at: null });
    await x.pass();
    x.advance(29 * 60 * 1000);
    await x.pass();
    expect(x.prReads()).toBe(1);
    x.advance(60 * 1000);
    await x.pass();
    expect(x.prReads()).toBe(2);
    x.pr.state = 'open';
    await x.pass();
    Object.assign(x.pr, { state: 'closed', merged: true, merged_at: '2026-11-03T22:25:40Z' });
    await x.pass();
    expect(x.prReads()).toBe(3);
    expect(x.notices.entries).toMatchObject([{ key: 'GH-5', identity: 'JFusco', status: 'queued' }]);
});
