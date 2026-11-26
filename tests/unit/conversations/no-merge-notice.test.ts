import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, REPOSITORY } from '../delivery/support/fake-github';
import { noticePolicyFingerprint, predatesEveryDestination, recordNoMergeNotice, settledWithoutNotice } from '../../../server/conversations/no-merge-notice';
import type { NoticePolicy, TicketJob } from '../../../src/shared';
afterEach(cleanupFakes);

const channel = { enabled: true, channelId: 'C0DELIVER', channelName: 'delivery', workspaceId: 'T123', mentionIds: ['U111'], enabledAt: '2026-11-05T00:00:00Z', version: 'v1' };
const policy = (): NoticePolicy => ({ enabled: true, recipients: 'assignee', workspace: 'Verndale', mappings: '', enabledAt: '2026-11-04T00:00:00Z', channel: { ...channel } });
const merged = { number: 313, merge_commit_sha: BASE, merged_at: '2026-11-03T22:25:40Z' };
function job(): TicketJob {
    return { id: 'job', key: 'GH-5', pr: 313, prUrl: `https://github.com/${REPOSITORY}/pull/313`, requestedAt: '', status: 'completed', stage: 'closeout', head: '', worktree: '', branch: '', detail: '', steps: [] };
}

test('every setting a decision depends on changes the fingerprint; a mention list alone does not', () => {
    const base = noticePolicyFingerprint(policy());
    const changes: ((p: NoticePolicy) => void)[] = [p => { p.enabled = false; }, p => { p.enabledAt = '2026-11-06T00:00:00Z'; }, p => { p.recipients = 'both'; },
        p => { p.workspace = 'Other'; }, p => { p.mappings = 'octo=U222'; }, p => { p.channel!.enabled = false; }, p => { p.channel!.enabledAt = ''; },
        p => { p.channel!.channelId = 'C0OTHER'; }, p => { p.channel!.workspaceId = 'T999'; }, p => { p.channel!.version = 'v2'; }, p => { delete p.channel; }];
    for (const change of changes) { const p = policy(); change(p); expect(noticePolicyFingerprint(p)).not.toBe(base); }
    const p = policy(); p.channel!.mentionIds = ['U222'];
    expect(noticePolicyFingerprint(p)).toBe(base);
});
test('a merge predates every destination only against each enabled one with a valid start', () => {
    expect(predatesEveryDestination(policy(), merged.merged_at)).toBe(true);
    expect(predatesEveryDestination({ ...policy(), enabledAt: '2026-11-01T00:00:00Z' }, merged.merged_at)).toBe(false);
    expect(predatesEveryDestination({ ...policy(), enabled: false, enabledAt: '2026-11-01T00:00:00Z' }, merged.merged_at)).toBe(true);
    expect(predatesEveryDestination({ ...policy(), enabledAt: 'not a time' }, merged.merged_at)).toBe(false);
    expect(predatesEveryDestination({ ...policy(), enabledAt: '' }, merged.merged_at)).toBe(false);
    expect(predatesEveryDestination(policy(), '')).toBe(false);
    expect(predatesEveryDestination({ ...policy(), enabled: false, channel: { ...channel, enabled: false } }, merged.merged_at)).toBe(false);
});
test('the marker is recorded only for that reason, and holds while its binding does', () => {
    const f = fakeGitHub(), j = job();
    expect(recordNoMergeNotice(f.store, j, merged, { ...policy(), enabledAt: '2026-11-01T00:00:00Z' })).toBe(false);
    expect(recordNoMergeNotice(f.store, j, { ...merged, merge_commit_sha: 'not-a-sha' }, policy())).toBe(false);
    expect(recordNoMergeNotice(f.store, j, { ...merged, number: 314 }, policy())).toBe(false);
    expect(j.noMergeNotice).toBeUndefined();
    expect(recordNoMergeNotice(f.store, j, merged, policy())).toBe(true);
    expect(j.noMergeNotice).toMatchObject({ repository: REPOSITORY, issue: 5, pr: 313, mergeCommit: BASE, mergedAt: merged.merged_at, policy: noticePolicyFingerprint(policy()) });
    expect(settledWithoutNotice(f.store, j, policy())).toBe(true);
    expect(j.noMergeNotice).toBeDefined();
});
test.each(['repository', 'issue', 'pr', 'policy', 'merge', 'sha'] as const)('a changed %s discards the marker', binding => {
    const f = fakeGitHub(), j = job(), p = policy();
    recordNoMergeNotice(f.store, j, merged, p);
    if (binding === 'repository') j.noMergeNotice!.repository = 'JFusco/other';
    if (binding === 'issue') j.key = 'GH-6';
    if (binding === 'pr') j.pr = 314;
    if (binding === 'policy') p.recipients = 'both';
    if (binding === 'merge') j.noMergeNotice!.mergedAt = '2026-11-04T12:00:00Z';
    if (binding === 'sha') j.noMergeNotice!.mergeCommit = '';
    expect(settledWithoutNotice(f.store, j, p)).toBe(false);
    expect(j.noMergeNotice).toBeUndefined();
});
test('a job saved before the marker existed takes the ordinary read', () => {
    const f = fakeGitHub();
    expect(settledWithoutNotice(f.store, job(), policy())).toBe(false);
});
