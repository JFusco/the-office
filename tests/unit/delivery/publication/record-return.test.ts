import { afterEach, expect, test } from 'vitest';
import { recordReturn } from '../../../../server/delivery/publication/record-return';
import { ReleaseMarkerRefusal } from '../../../../server/delivery/publication/release-marker-stop';
import { cleanupFakes, fakeGitHub, HEAD } from '../support/fake-github';
import { passingResult, savedReturn } from '../support/marker-records';

afterEach(cleanupFakes);

function returnable() {
    const f = fakeGitHub(), job = f.candidate({ stage: 'implement', status: 'working', head: HEAD, stop: { kind: 'unclassified', at: 'x' } } as any);
    const prior = { head: job.head, approach: structuredClone(job.approach), steps: job.steps.length };
    let guarded = 0;
    const guard = () => { guarded++; };
    return { f, job, prior, guard, guarded: () => guarded };
}
const { step: _step, ...base } = savedReturn();

test('a return keeps the prior head, approach and gates, saves the original result and queues implement, in one guarded write', () => {
    const r = returnable(), result = passingResult('c'.repeat(40));
    expect(recordReturn(r.f.store, r.job, base, result, r.guard)).toBe('returned');
    expect(r.guarded()).toBe(1);
    expect(r.job).toMatchObject({ stage: 'implement', status: 'queued', head: r.prior.head, approach: r.prior.approach });
    expect(r.job.stop).toBeUndefined();
    expect(r.job.steps.at(-1)).toEqual({ stage: 'release-marker-return', workerId: 'writer-1', result });
    expect(r.job.steps.at(-1)!.result).not.toBe(result);
    expect(r.job.releaseMarkerReturns!['writer-1']).toMatchObject({ status: 'pending', step: r.job.steps.length - 1, refusedHead: 'c'.repeat(40) });
    expect(r.job.detail).toMatch(/^Returned to the developer \(1 of 2\): .*eeeeeeeeeeee \(README\.md\)/);
});

test('a replay of the same work spends nothing; a second distinct return supersedes the first', () => {
    const r = returnable();
    recordReturn(r.f.store, r.job, base, passingResult('c'.repeat(40)), r.guard);
    const steps = r.job.steps.length;
    expect(recordReturn(r.f.store, r.job, base, passingResult('c'.repeat(40)), r.guard)).toBe('replayed');
    expect(r.job.steps).toHaveLength(steps);
    expect(recordReturn(r.f.store, r.job, { ...base, workId: 'fix-1', previousWorkId: 'writer-1', at: '2026-11-20T11:00:00.000Z' }, passingResult('c'.repeat(40)), r.guard)).toBe('returned');
    expect(Object.fromEntries(Object.values(r.job.releaseMarkerReturns!).map(item => [item.workId, item.status]))).toEqual({ 'writer-1': 'superseded', 'fix-1': 'pending' });
    expect(r.job.detail).toContain('(2 of 2)');
});

test('the third proven refusal blocks with the commit, paths and the current correction, writing nothing', () => {
    const r = returnable();
    recordReturn(r.f.store, r.job, base, passingResult('c'.repeat(40)), r.guard);
    recordReturn(r.f.store, r.job, { ...base, workId: 'fix-1', at: '2026-11-20T11:00:00.000Z', correction: undefined }, passingResult('c'.repeat(40)), r.guard);
    r.job.releaseMarkerReturns!['fix-1'].correction = { claimId: 'claim-9', at: 'x', workId: 'fix-2' };
    const before = JSON.stringify(r.job);
    let error: unknown;
    try { recordReturn(r.f.store, r.job, { ...base, workId: 'fix-2', refusedHead: 'a'.repeat(40), at: '2026-11-20T12:00:00.000Z' }, passingResult('a'.repeat(40)), r.guard); } catch (failure) { error = failure; }
    expect(error).toBeInstanceOf(ReleaseMarkerRefusal);
    expect((error as ReleaseMarkerRefusal).evidence).toMatchObject({ reason: 'marked-package-change', disposition: 'return-cap', commit: 'e'.repeat(40), paths: ['README.md'],
        correction: { refusedWorkId: 'fix-1', claimId: 'claim-9', workId: 'fix-2', refusedHead: 'a'.repeat(40) } });
    expect(JSON.stringify(r.job)).toBe(before);
});

test('a failing guard writes nothing at all', () => {
    const r = returnable(), before = JSON.stringify(r.job);
    expect(() => recordReturn(r.f.store, r.job, base, passingResult('c'.repeat(40)), () => { throw new Error('ownership changed'); })).toThrow('ownership changed');
    expect(JSON.stringify(r.job)).toBe(before);
});
