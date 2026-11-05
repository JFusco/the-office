import { expect, test } from 'vitest';
import { reviseLineage } from '../../../server/features/revise-lineage';
test('new lineage preserves source, review and published ticket history while invalidating pending approval', () => {
    const f = { revision: 3, confirmedBrief: 'brief', phase: 'approval', manifest: {}, review: { run: 'old' }, reviewHistory: [], baseline: { sha: 'old' }, publication: [{ id: 'stable', createIntent: 'uncertain', startedApprovalId: 'approved' }] } as any;
    reviseLineage(f);
    expect(f.revision).toBe(4); expect(f.phase).toBe('discovery'); expect(f.baseline).toBeUndefined(); expect(f.review).toBeUndefined();
    expect(f.baselineHistory[0].sha).toBe('old'); expect(f.reviewHistory[0].run).toBe('old');
    expect(f.publication[0]).toMatchObject({ createIntent: 'uncertain', startedApprovalId: 'approved' });
});
