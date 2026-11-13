import { expect, test } from 'vitest';
import { blockedCauses } from '../../../server/office/blocked-causes';

const item = (state: string, cause?: string) => ({ work: { projectId: 'p', kind: 'conversation', id: Math.random().toString() }, stage: 's', rank: 1, enqueuedAt: '', eligibility: { state, reason: '', owner: 'Morgan', nextCheckAt: null, ...(cause ? { cause } : {}) } }) as never;

test('counts only blocked work, by cause; an explicit blocker without a cause needs a decision', () => {
    expect(blockedCauses([item('blocked', 'failed'), item('blocked', 'failed'), item('blocked'), item('blocked', 'dependency'), item('waiting'), item('running')]))
        .toEqual({ 'needs-decision': 1, interrupted: 0, unconfirmed: 0, dependency: 1, paused: 0, failed: 2 });
});
