import { expect, test } from 'vitest';
import { capabilityBlockedReviews, latestReviews } from '../../../server/conversations/capability-blocked';

const NO_VISIBILITY = 'Office must restore complete session visibility; inventory unavailable';
const review = (id: string, key: string, over: Record<string, unknown> = {}) => ({ id, key, status: 'blocked', detail: NO_VISIBILITY, queuedAt: 'q', endedAt: 'e', url: '', ...over });
const state = (reviews: unknown[], jobs: unknown[] = []) => ({ coordination: { listener: { reviews }, jobs } }) as any;

test('the latest review of each ticket, as saved', () => {
    const s = state([review('r1', 'GH-1'), review('r2', 'GH-2'), review('r3', 'GH-1')]);
    expect(latestReviews(s).map(r => r.id)).toEqual(['r3', 'r2']);
});

test('reviews blocked because session ownership cannot be read, except one with a retry planned, a linked pull request or a repair in progress', () => {
    const s = state([review('r1', 'GH-1'), review('r2', 'GH-2', { retry: { nextAt: 'later' } }), review('r3', 'GH-3'), review('r4', 'GH-4', { detail: 'Scope is unclear' }), review('r5', 'GH-5', { status: 'interrupted' }), review('r6', 'GH-6')],
        [{ key: 'GH-3', pr: 7, status: 'watching' }]);
    expect(capabilityBlockedReviews(s, latestReviews(s), id => id === 'r6').map(r => r.id)).toEqual(['r1']);
});
