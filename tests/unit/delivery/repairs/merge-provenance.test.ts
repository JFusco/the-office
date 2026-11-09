import { test, expect } from 'vitest';
import { ciFixture, newHead } from '../../../fixtures/ci-repair';
import { recordOfficeMerge } from '../../../fixtures/office-merge';
import { officeMergeProvenance } from '../../../../server/delivery/repairs/merge-provenance';
function setup() {
    const f = ciFixture(); f.job.mergeCommit = newHead;
    Object.assign(f.pr, { merged_at: '2026-11-09T08:00:00Z', merge_commit_sha: newHead });
    const id = recordOfficeMerge(f); return { ...f, id };
}
test('matching durable Office merge provenance is verified by canonical PR readback', async () => {
    const f = setup(); expect(await officeMergeProvenance(f.delivery, f.job)).toBe(true);
});
test.each(['attempt', 'payload', 'work', 'receipt', 'target'])('mismatched %s never authorizes a new operational retry', async kind => {
    const f = setup(), effect = f.store.getEffect(f.id)!;
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
