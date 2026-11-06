import { expect, test } from 'vitest';
import { repeatedVendorReviewBlock } from '../../../server/maintenance/repeated-vendor-block';

const run = (id: string, requestedAt: string, status: string, stage = 'vendor-review') => ({ id, requestedAt, status, stage }) as any;
const state = (...runs: any[]) => ({ maintenance: { runs } }) as any;
test('the first vendor-review block stays with Morgan', () => {
    const only = run('a', '2026-11-05T20:00:00Z', 'blocked');
    expect(repeatedVendorReviewBlock(state(only), only)).toBe(false);
    const afterSuccess = run('b', '2026-11-06T20:00:00Z', 'blocked');
    expect(repeatedVendorReviewBlock(state(run('a', '2026-11-05T20:00:00Z', 'completed', 'complete'), afterSuccess), afterSuccess)).toBe(false);
});
test('a second consecutive vendor-review block reaches Joe, whatever the array order', () => {
    const second = run('b', '2026-11-06T20:00:00Z', 'blocked');
    expect(repeatedVendorReviewBlock(state(run('a', '2026-11-05T20:00:00Z', 'blocked'), second), second)).toBe(true);
    expect(repeatedVendorReviewBlock(state(second, run('a', '2026-11-05T20:00:00Z', 'interrupted')), second)).toBe(true);
});
test('a block in another stage, or a later run, does not make it repeated', () => {
    const second = run('b', '2026-11-06T20:00:00Z', 'blocked');
    expect(repeatedVendorReviewBlock(state(run('a', '2026-11-05T20:00:00Z', 'blocked', 'follow-up'), second), second)).toBe(false);
    expect(repeatedVendorReviewBlock(state(second, run('c', '2026-11-07T20:00:00Z', 'blocked')), second)).toBe(false);
    const followUp = run('b', '2026-11-06T20:00:00Z', 'blocked', 'follow-up');
    expect(repeatedVendorReviewBlock(state(run('a', '2026-11-05T20:00:00Z', 'blocked'), followUp), followUp)).toBe(false);
});
test('a streak surfaces only its latest run', () => {
    const a = run('a', '2026-11-04T20:00:00Z', 'blocked'), b = run('b', '2026-11-05T20:00:00Z', 'blocked'), c = run('c', '2026-11-06T20:00:00Z', 'blocked');
    const s = state(c, a, b);
    expect([a, b, c].map(r => repeatedVendorReviewBlock(s, r))).toEqual([false, false, true]);
    const working = state(a, b, run('d', '2026-11-07T20:00:00Z', 'working'));
    expect(repeatedVendorReviewBlock(working, b)).toBe(true);
});
