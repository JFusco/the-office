import { test, expect } from 'vitest';
import { ciFixture, oldHead, base } from '../../../fixtures/ci-repair';
import { refreshMergeReview } from '../../../../server/delivery/readiness/refresh-merge-review';

function setup() {
    const f = ciFixture(); f.job.stage = 'merge'; f.job.status = 'blocked';
    f.job.reviewContext = { head: oldHead, baseSha: base, target: 'main', prUpdatedAt: f.pr.updated_at, issueUpdatedAt: f.issue.updated_at, step: 0 };
    f.pr.base.sha = 'd'.repeat(40);
    return f;
}
test('an advancing base requeues fresh review and preserves original history without a merge', async () => {
    const f = setup(), history = structuredClone(f.job.steps);
    expect(await refreshMergeReview(f.delivery, f.job, f.pr)).toBe(true);
    expect(f.job).toMatchObject({ stage: 'lead-pr', status: 'queued', head: oldHead });
    expect(f.job.reviewContext).toBeUndefined(); expect(f.job.steps).toEqual(history); expect(f.calls.some(c => c.args.includes('PUT') || c.args.includes('POST'))).toBe(false);
    expect(await refreshMergeReview(f.delivery, f.job, f.pr)).toBe(false);
});
test.each(['attempted', 'paused', 'uncertain', 'foreign-target', 'changed-head'])('fresh review does not bypass %s', async kind => {
    const f = setup();
    if (kind === 'attempted') f.job.mergeAttempt = { head: oldHead, at: 'prior' };
    if (kind === 'paused') f.store.state.paused = true;
    if (kind === 'uncertain') f.job.steps[0].result.receipts.push({ id: 'old', action: 'write', target: '', detail: '', verified: false, uncertain: true });
    if (kind === 'foreign-target') f.pr.base.ref = 'other';
    if (kind === 'changed-head') f.pr.head.sha = 'e'.repeat(40);
    expect(await refreshMergeReview(f.delivery, f.job, f.pr)).toBe(false); expect(f.job.stage).toBe('merge');
});

test('issue-only change queues a fresh review with the original history intact', async () => {
    const f = setup(); f.pr.base.sha = base; f.issue.updated_at = '2026-11-09T12:00:00Z';
    const before = structuredClone(f.job.steps);
    expect(await refreshMergeReview(f.delivery, f.job, f.pr)).toBe(true);
    expect(f.job.stage).toBe('lead-pr'); expect(f.job.steps).toEqual(before);
});
