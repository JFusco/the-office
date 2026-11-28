import { expect, test } from 'vitest';
import { correctionIdentity, dispatchedCorrection, MAX_RELEASE_MARKER_RETURNS, pendingReturn, releaseMarkerReturns } from '../../../../server/delivery/publication/release-marker-returns';
import { savedReturn } from '../support/marker-records';

test('returns are listed oldest first, ties by work ID; absent counts as zero', () => {
    expect(releaseMarkerReturns({})).toEqual([]);
    const job = { releaseMarkerReturns: { z: savedReturn({ workId: 'z', at: '2026-11-21T00:00:00Z' }), b: savedReturn({ workId: 'b', at: '2026-11-20T00:00:00Z' }), a: savedReturn({ workId: 'a', at: '2026-11-20T00:00:00Z' }) } };
    expect(releaseMarkerReturns(job).map(item => item.workId)).toEqual(['a', 'b', 'z']);
    expect(MAX_RELEASE_MARKER_RETURNS).toBe(2);
});

test('there is at most one pending correction; two is a state to reconcile, never a choice', () => {
    expect(pendingReturn({})).toBeUndefined();
    expect(pendingReturn({ releaseMarkerReturns: { a: savedReturn({ workId: 'a', status: 'superseded' }), b: savedReturn({ workId: 'b' }) } })?.workId).toBe('b');
    expect(pendingReturn({ releaseMarkerReturns: { a: savedReturn({ workId: 'a', status: 'resolved' }) } })).toBeUndefined();
    expect(() => pendingReturn({ releaseMarkerReturns: { a: savedReturn({ workId: 'a' }), b: savedReturn({ workId: 'b' }) } })).toThrow('More than one pending release-marker correction');
});

test('a correction counts as dispatched only once its dispatch time is saved', () => {
    const bound = { releaseMarkerReturns: { a: savedReturn({ workId: 'a', correction: { claimId: 'c', at: 'x' } }) } };
    expect(dispatchedCorrection(bound)).toBeUndefined();
    bound.releaseMarkerReturns.a.correction!.dispatchedAt = 'y';
    expect(dispatchedCorrection(bound)?.workId).toBe('a');
    expect(dispatchedCorrection({})).toBeUndefined();
});

test('the correction identity names only what is known: claim, work and mapped head', () => {
    expect(correctionIdentity(savedReturn())).toEqual({ refusedWorkId: 'writer-1', refusedHead: 'c'.repeat(40) });
    const mapping = { path: '/m.json', sha256: 's', refusedHead: 'c'.repeat(40), newHead: 'f'.repeat(40) };
    expect(correctionIdentity(savedReturn({ correction: { claimId: 'claim-2', at: 'x', workId: 'fix-1', mapping } }))).toEqual({ refusedWorkId: 'writer-1', refusedHead: 'c'.repeat(40), claimId: 'claim-2', workId: 'fix-1', mappedHead: 'f'.repeat(40) });
});
