import { afterEach, expect, test, vi } from 'vitest';
import { draftReadHeadMatches } from '../../../../server/delivery/publication/draft-read-head';

const gate = vi.hoisted(() => vi.fn(() => true));
vi.mock('../../../../server/delivery/recovery/packed165-evidence', () => ({ packed165Admitted: gate }));
afterEach(() => { gate.mockReset().mockReturnValue(true); });
function fixture() {
    const admission = { claimedAt: '2026-11-11T22:38:00Z' };
    const store = { db: { prepare: () => ({ get: () => ({ body: JSON.stringify(admission) }) }) } } as any;
    const job = { head: 'c'.repeat(40), packedPublicationRepair: { claimId: 'admission', original: { head: 'b'.repeat(40) } } } as any;
    const claim = { endedAt: '2026-11-11T18:23:00Z' } as any;
    return { store, job, claim, admission, proof: { head: 'b'.repeat(40), pr: 0, read: 'viewer' } };
}
test('ordinary current-head certainty is unchanged; the approved original pre-PR read stays historical after repair', () => {
    const f = fixture();
    expect(draftReadHeadMatches(f.store, f.job, f.claim, { head: f.job.head })).toBe(true);
    expect(gate).not.toHaveBeenCalled();
    expect(draftReadHeadMatches(f.store, f.job, f.claim, f.proof)).toBe(true);
});
test.each(['not-admitted', 'no-capsule', 'other-head', 'old-pr', 'other-read', 'after-admission', 'invalid-time'])('%s cannot borrow original-head certainty', scenario => {
    const f = fixture();
    if (scenario === 'not-admitted') gate.mockReturnValue(false);
    if (scenario === 'no-capsule') delete f.job.packedPublicationRepair;
    if (scenario === 'other-head') f.proof.head = 'd'.repeat(40);
    if (scenario === 'old-pr') f.proof.pr = 167;
    if (scenario === 'other-read') f.proof.read = 'issue-links';
    if (scenario === 'after-admission') f.claim.endedAt = '2026-11-11T22:39:00Z';
    if (scenario === 'invalid-time') f.admission.claimedAt = 'unknown';
    expect(draftReadHeadMatches(f.store, f.job, f.claim, f.proof)).toBe(false);
});
