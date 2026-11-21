import { expect, test } from 'vitest';
import { settleStoppedReviews } from '../../../../server/delivery/intake/settle-stopped-reviews';
import type { AssignedIssue, AssignmentReview } from '../../../../src/shared';

const review = (key: string, status: AssignmentReview['status'], extra: Partial<AssignmentReview> = {}): AssignmentReview =>
    ({ id: `${key}-${status}`, key, summary: '', url: '', queuedAt: '2026-10-28T13:00:00Z', startedAt: '', endedAt: '', status, detail: 'Ownership could not be cleared.', owner: '', ...extra });
const issue = (key: string, status = 'Ready for Production'): AssignedIssue => ({ key, summary: '', url: '', assignee: 'office', status, statusId: '', updated: '', type: 'Bug', subtask: false });
const other = issue('CEC-99');
const inputs = (assigned: AssignedIssue[], extra: Partial<Parameters<typeof settleStoppedReviews>[1]> = {}) =>
    ({ assigned, hasDelivery: () => false, held: () => false, now: new Date('2026-11-18T04:00:00Z'), ...extra });

test('a stopped review whose ticket is no longer assigned or open is closed as history, whoever asked for the work', () => {
    const reviews = [review('CEC-1', 'owned'), review('CEC-2', 'blocked', { workRequested: 'manual' }), review('CEC-3', 'held')];
    expect(settleStoppedReviews(reviews, inputs([other]))).toEqual(['CEC-1', 'CEC-2', 'CEC-3']);
    expect(reviews.map(item => item.status)).toEqual(['cancelled', 'cancelled', 'cancelled']);
    expect(reviews[0]).toMatchObject({ endedAt: '2026-11-18T04:00:00.000Z', detail: 'No longer assigned to the Office or no longer open; this review is kept as history.\nEarlier intake: Ownership could not be cleared.' });
});

test('a review of a ticket that is still assigned keeps its status, whatever status the ticket is in', () => {
    const reviews = [review('CEC-1', 'blocked'), review('CEC-2', 'owned'), review('CEC-3', 'held')], before = structuredClone(reviews);
    expect(settleStoppedReviews(reviews, inputs([issue('CEC-1'), issue('CEC-2', 'To Do'), issue('CEC-3')]))).toEqual([]);
    expect(reviews).toEqual(before);
});

test('an empty read settles nothing', () => {
    const reviews = [review('CEC-1', 'owned'), review('CEC-2', 'blocked')], before = structuredClone(reviews);
    expect(settleStoppedReviews(reviews, inputs([]))).toEqual([]);
    expect(reviews).toEqual(before);
});

test('reviews in flight, tickets the Office is delivering and configured holds are left alone', () => {
    const untouched = [review('CEC-1', 'queued'), review('CEC-2', 'working'), review('CEC-3', 'ready'), review('CEC-4', 'cancelled'), review('CEC-5', 'interrupted')];
    const before = structuredClone(untouched);
    expect(settleStoppedReviews(untouched, inputs([other]))).toEqual([]);
    expect(untouched).toEqual(before);
    const delivering = [review('CEC-6', 'owned')], hold = [review('CEC-7', 'blocked')];
    expect(settleStoppedReviews(delivering, inputs([other], { hasDelivery: key => key === 'CEC-6' }))).toEqual([]);
    expect(settleStoppedReviews(hold, inputs([other], { held: key => key === 'CEC-7' }))).toEqual([]);
    expect([delivering[0].status, hold[0].status]).toEqual(['owned', 'blocked']);
});

test('only the latest review of a ticket is closed; its earlier reviews stay as they were', () => {
    const reviews = [review('CEC-1', 'blocked', { id: 'first' }), review('CEC-1', 'owned', { id: 'latest' })];
    expect(settleStoppedReviews(reviews, inputs([other]))).toEqual(['CEC-1']);
    expect(reviews.map(item => item.status)).toEqual(['blocked', 'cancelled']);
});

test('an empty read settles only the reviews whose own ticket was confirmed gone', () => {
    const reviews = [review('CEC-1', 'owned'), review('CEC-2', 'blocked'), review('CEC-3', 'held'), review('CEC-4', 'owned')];
    expect(settleStoppedReviews(reviews, inputs([], { confirmedGone: new Set(['CEC-1', 'CEC-3', 'CEC-9']) }))).toEqual(['CEC-1', 'CEC-3']);
    expect(reviews.map(item => item.status)).toEqual(['cancelled', 'blocked', 'cancelled', 'owned']);
});

test('an empty read with nothing confirmed, or an empty confirmation, still settles nothing', () => {
    const reviews = [review('CEC-1', 'owned')], before = structuredClone(reviews);
    expect(settleStoppedReviews(reviews, inputs([], { confirmedGone: new Set() }))).toEqual([]);
    expect(reviews).toEqual(before);
});

test('a confirmation does not override a delivery, a hold or a review in flight, and is not consulted when the read is not empty', () => {
    const reviews = [review('CEC-1', 'owned'), review('CEC-2', 'owned'), review('CEC-3', 'working' as any)];
    const gone = new Set(['CEC-1', 'CEC-2', 'CEC-3']);
    expect(settleStoppedReviews(reviews, inputs([], { confirmedGone: gone, hasDelivery: key => key === 'CEC-1', held: key => key === 'CEC-2' }))).toEqual([]);
    // With tickets in the read, the read decides: CEC-5 is still assigned although the set names it.
    const mixed = [review('CEC-5', 'owned'), review('CEC-6', 'owned')];
    expect(settleStoppedReviews(mixed, inputs([issue('CEC-5')], { confirmedGone: new Set(['CEC-5']) }))).toEqual(['CEC-6']);
});
