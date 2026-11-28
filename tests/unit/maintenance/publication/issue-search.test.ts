import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeMaintenanceGitHub } from './support/fake-maintenance-github';
import { allIssues, issueDecision, knownIdentities, knownIssues, matchIssues } from '../../../../server/maintenance/publication/issue-search';
import { issueMarker } from '../../../../server/maintenance/publication/issue-content';
afterEach(cleanupFakes);

const input = (named = 0) => ({ key: 'cms-k', title: '[Bug] Restore x', named, grounded: (issue: any) => String(issue.body).includes('contentstack-docs') });
async function decide(f: ReturnType<typeof fakeMaintenanceGitHub>, named = 0) {
    const issues = await allIssues(f.store, f.execute as any);
    return issueDecision(f.store, issues, matchIssues(issues, 'cms-k', '[Bug] Restore x'), input(named));
}

test('a complete listing with no match permits one create; the marker on a later page is still found and adopted', async () => {
    const f = fakeMaintenanceGitHub({ pageSize: 2 });
    expect(await decide(f)).toEqual({ create: true });
    f.addIssue({ title: 'a', body: 'a' }); f.addIssue({ title: 'b', body: 'b' });
    const marked = f.addIssue({ title: 'Other title', body: `x\n${issueMarker('cms-k')}` });
    expect(await decide(f)).toMatchObject({ adopt: { number: marked.number } });
});

test('a title alone, a closed match, two marked issues or a named issue without the identity stop', async () => {
    const title = fakeMaintenanceGitHub(); title.addIssue({ title: '[Bug] Restore x', body: 'unrelated' });
    expect(await decide(title)).toMatchObject({ stop: expect.stringMatching(/titled exactly/) });
    const closed = fakeMaintenanceGitHub(); closed.addIssue({ title: 't', body: issueMarker('cms-k'), extra: { state: 'closed' } });
    expect(await decide(closed)).toMatchObject({ stop: expect.stringMatching(/closed/) });
    const two = fakeMaintenanceGitHub(); two.addIssue({ title: 't', body: issueMarker('cms-k') }); two.addIssue({ title: 'u', body: issueMarker('cms-k') });
    expect(await decide(two)).toMatchObject({ stop: expect.stringMatching(/2 issues carry the marker/) });
    const named = fakeMaintenanceGitHub(), other = named.addIssue({ title: 'Some issue', body: 'about sitecore' });
    expect(await decide(named, other.number)).toMatchObject({ stop: expect.stringMatching(/does not establish the same/) });
    const grounded = fakeMaintenanceGitHub(), same = grounded.addIssue({ title: 'Some issue', body: 'contentstack-docs field x' });
    expect(await decide(grounded, same.number)).toMatchObject({ adopt: { number: same.number } });
});

test('an unsettled earlier create for the key stops a new create even when the search finds nothing', async () => {
    const f = fakeMaintenanceGitHub();
    f.store.putEffect({ id: 'maintenance:old:cms-k:issue-create', work: { projectId: f.store.project.id, kind: 'maintenance', id: 'old' }, attemptId: 'old', operation: 'github-issue-create',
        target: 'x', authorization: 'office-harness', payload: { key: 'cms-k' }, expectedState: {}, status: 'uncertain', createdAt: '', dispatchedAt: '2026-11-28T00:00:00Z', verifiedAt: '', receipt: null, error: '', elapsedMs: null });
    expect(await decide(f)).toMatchObject({ stop: expect.stringMatching(/unsettled/) });
});

test('a verified maintenance create for the key counts as a known issue, by its receipt, even after its marker is gone', async () => {
    const f = fakeMaintenanceGitHub();
    const issue = f.addIssue({ title: 'Edited title', body: 'no marker any more' });
    const verified = (id: string, projectId: string, receipt: unknown) => ({ id, work: { projectId, kind: 'maintenance' as const, id: 'old' }, attemptId: 'old', operation: 'github-issue-create',
        target: 'x', authorization: 'office-harness', payload: { key: 'cms-k' }, expectedState: {}, status: 'verified' as const, createdAt: '', dispatchedAt: 'x', verifiedAt: 'x', receipt, error: '', elapsedMs: null });
    f.store.putEffect(verified('maintenance:old:cms-k:issue-create', f.store.project.id, { number: issue.number, url: issue.html_url, nodeId: issue.node_id }));
    expect(knownIdentities(f.store, 'cms-k')).toEqual([{ number: issue.number, url: issue.html_url, nodeId: issue.node_id }]);
    expect(knownIssues(f.store, 'cms-k')).toEqual([issue.number]);
    expect(knownIssues(f.store, 'other-key')).toEqual([]);
    expect(await decide(f)).toMatchObject({ adopt: { number: issue.number } });
});
