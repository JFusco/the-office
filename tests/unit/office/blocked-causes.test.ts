import { expect, test } from 'vitest';
import { blockedCauses } from '../../../server/office/blocked-causes';

const item = (state: string, cause?: string) => ({ work: { projectId: 'p', kind: 'conversation', id: Math.random().toString() }, stage: 's', rank: 1, enqueuedAt: '', eligibility: { state, reason: '', owner: 'Morgan', nextCheckAt: null, ...(cause ? { cause } : {}) } }) as never;

test('counts only blocked work, by cause; blocked work without a recorded cause is unclassified, not a decision', () => {
    expect(blockedCauses([item('blocked', 'failed'), item('blocked', 'failed'), item('blocked'), item('blocked', 'dependency'), item('waiting'), item('running')]))
        .toEqual({ 'needs-decision': 0, 'awaiting-repair': 0, interrupted: 0, unconfirmed: 0, dependency: 1, paused: 0, failed: 2, unclassified: 1 });
});

test('work a repair covers is counted once as awaiting repair, only in place of a failed, interrupted or unclassified stop', () => {
    const items = [item('blocked', 'failed'), item('blocked', 'interrupted'), item('blocked'), item('blocked', 'unclassified'), item('blocked', 'needs-decision'), item('blocked', 'dependency'), item('blocked', 'paused'), item('blocked', 'unconfirmed'), item('waiting'), item('runnable')];
    expect(blockedCauses(items, () => true)).toEqual({ 'needs-decision': 1, 'awaiting-repair': 4, interrupted: 0, unconfirmed: 1, dependency: 1, paused: 1, failed: 0, unclassified: 0 });
    // Only the items the predicate names; the rest are counted as themselves.
    expect(blockedCauses(items, covered => covered === items[0])).toEqual({ 'needs-decision': 1, 'awaiting-repair': 1, interrupted: 1, unconfirmed: 1, dependency: 1, paused: 1, failed: 0, unclassified: 2 });
    const total = (counts: Record<string, number>) => Object.values(counts).reduce((sum, n) => sum + n, 0);
    expect(total(blockedCauses(items, () => true))).toBe(8);
});
