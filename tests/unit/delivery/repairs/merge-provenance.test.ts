import { test, expect } from 'vitest';
import { ciFixture, newHead } from '../../../fixtures/ci-repair';
import { recordOfficeMerge } from '../../../fixtures/office-merge';
import { officeMergeProvenance } from '../../../../server/delivery/repairs/merge-provenance';
function setup() {
    const f = ciFixture(); f.job.mergeCommit = newHead;
    Object.assign(f.pr, { merged_at: '2026-11-09T08:00:00Z', merge_commit_sha: newHead, merged_by: { login: 'JFusco' } });
    const id = recordOfficeMerge(f); return { ...f, id };
}
test('matching durable Office merge provenance is verified by canonical PR readback', async () => {
    const f = setup(); expect(await officeMergeProvenance(f.delivery, f.job)).toBe(true);
});
test.each(['attempt', 'payload', 'work', 'receipt', 'target', 'merger'])('mismatched %s never authorizes a new operational retry', async kind => {
    const f = setup(), effect = f.store.getEffect(f.id)!;
    // The saved writer of a legacy merge is the historical operator; a bot or anyone else did not send this one.
    if (kind === 'merger') Object.assign(f.pr, { merged_by: { login: 'the-office-app[bot]' } });
    if (kind === 'attempt') delete f.job.mergeAttempt;
    if (kind === 'payload') (effect.payload as any).sha = newHead;
    if (kind === 'work') effect.work.id = 'another-job';
    if (kind === 'receipt') (effect.receipt as any).sha = 'd'.repeat(40);
    if (kind === 'target') effect.target = 'https://github.com/foreign/repo/pull/323';
    f.store.putEffect(effect); expect(await officeMergeProvenance(f.delivery, f.job)).toBe(false);
});
test.each([true, false])('an uncertain Office merge is reconciled only by matching readback (landed=%s)', async landed => {
    const f = setup(), effect = f.store.getEffect(f.id)!; effect.status = 'uncertain'; effect.receipt = null; f.store.putEffect(effect);
    if (!landed) f.pr.merged_at = null;
    expect(await officeMergeProvenance(f.delivery, f.job)).toBe(landed);
    expect(f.store.getEffect(f.id)!.status).toBe(landed ? 'verified' : 'uncertain');
    expect(f.calls.some(c => c.args.includes('PUT') || c.args.includes('POST'))).toBe(false);
});

test('provider readback cannot substitute a job/head changed during the await', async () => {
    const f = setup();
    f.delivery.verifyPR = async () => { f.job.head = f.pr.head.sha = 'd'.repeat(40); return f.pr; };
    expect(await officeMergeProvenance(f.delivery, f.job)).toBe(false);
});
