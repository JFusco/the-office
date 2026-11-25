import { afterEach, expect, test, vi } from 'vitest';
import { projectById } from '../../../server/office/projects';
import { requeueAssignmentReview } from '../../../server/scheduling/assignment-transition';
import { coordination } from '../../../server/scheduling/coordination';
import { recheck } from '../../../server/scheduling/operator-commands';
import { Store } from '../../../server/store/store';
import type { AssignmentReview, ReadRetry, TicketJob } from '../../../src/shared';

const stores: Store[] = [];
afterEach(() => { vi.useRealTimers(); stores.splice(0).forEach(store => store.close()); });
/** The store's own clock, fixed: what the transition stamps. */
const CLOCK = '2026-11-24T09:00:00.000Z';
function project(reviews: AssignmentReview[] = [], jobs: Partial<TicketJob>[] = []) {
    const store = new Store(':memory:', projectById('cms-field-vocabulary'), undefined, { now: () => new Date(CLOCK), monotonic: () => 0 }); stores.push(store);
    store.state.coordination = { ...coordination(), jobs: jobs as TicketJob[] };
    store.state.coordination.listener.reviews = reviews;
    return store;
}
const review = (over: Partial<AssignmentReview> = {}): AssignmentReview =>
    ({ id: 'review-1', key: 'GH-1', summary: 'Synthetic', url: '', queuedAt: '2026-11-20T10:00:00.000Z', startedAt: '2026-11-20T10:01:00.000Z', endedAt: '2026-11-20T10:16:00.000Z', status: 'blocked', detail: 'Error: the ownership read timed out', owner: '', ...over });
const retry = (attempts: number, exhausted: boolean): ReadRetry => ({ failure: { category: 'timeout', dispatched: true, detail: 'The read timed out' } as ReadRetry['failure'], attempts, nextAt: '', exhausted,
    history: [{ at: '2026-11-20T09:00:00.000Z', detail: 'Error: first read timed out' }, { at: '2026-11-20T09:30:00.000Z', detail: 'Error: second read timed out' }] });
const DETAIL = 'GH-1 queued for PM ownership read-back; recovery counts and retry history kept.';

test.each([
    { name: 'a scheduled read retry with budget left', over: { retry: { ...retry(2, false), nextAt: '2026-11-24T09:05:00.000Z' } } },
    { name: 'three read retries spent, not yet marked exhausted', over: { retry: retry(3, false) } },
    { name: 'three read retries spent and marked exhausted', over: { retry: retry(3, true) } },
    { name: 'IT ownership recoveries at their cap alone', over: { itRecoveryAttempts: 3 } },
    { name: 'both budgets spent', over: { itRecoveryAttempts: 3, retry: retry(3, true) } },
    { name: 'no retry record and no IT count at all', over: {} },
])('a stopped review with $name is requeued with only its status and queue time changed', ({ over }) => {
    for (const status of ['blocked', 'interrupted'] as const) {
        const held = review({ status, ...over }), before = structuredClone(held), store = project([held]), events = store.state.events.length;
        expect(requeueAssignmentReview(store, held)).toBe(DETAIL);
        expect(held).toEqual({ ...before, status: 'queued', queuedAt: CLOCK });
        // The counters and the whole retry record, its history, its next time and its failure, are exactly as they were; a field that was absent stays absent.
        expect(held.retry).toEqual(before.retry);
        expect(held.itRecoveryAttempts).toEqual(before.itRecoveryAttempts);
        expect('retry' in held).toBe('retry' in before);
        expect('itRecoveryAttempts' in held).toBe('itRecoveryAttempts' in before);
        // The caller says who acted: the transition emits nothing.
        expect(store.state.events).toHaveLength(events);
    }
});

test('a review already queued or working is refused, and nothing changes', () => {
    for (const status of ['queued', 'working'] as const) {
        const held = review({ status, retry: retry(1, false) }), before = structuredClone(held), store = project([held]);
        expect(() => requeueAssignmentReview(store, held)).toThrow(`The assignment review of GH-1 is already ${status}`);
        expect(held).toEqual(before);
    }
});

test('a review whose ticket a delivery job holds is refused whatever that job\'s status, a completed one included; a cancelled job or another ticket\'s does not count', () => {
    for (const status of ['queued', 'working', 'blocked', 'watching', 'completed'] as const) {
        const held = review(), before = structuredClone(held), store = project([held], [{ id: 'job-1', key: 'GH-1', status }]);
        expect(() => requeueAssignmentReview(store, held), status).toThrow(`Delivery already holds GH-1 (${status}); its review is not run again`);
        expect(held, status).toEqual(before);
    }
    const held = review(), store = project([held], [{ id: 'job-1', key: 'GH-1', status: 'cancelled' }, { id: 'job-2', key: 'GH-2', status: 'working' }]);
    expect(requeueAssignmentReview(store, held)).toBe(DETAIL);
    expect(held).toMatchObject({ status: 'queued', queuedAt: CLOCK });
});

test('only the review given is requeued, not the latest of its ticket', () => {
    const older = review(), newer = review({ id: 'review-2' }), store = project([older, newer]);
    requeueAssignmentReview(store, older);
    expect([older.status, newer.status]).toEqual(['queued', 'blocked']);
});

test('the operator\'s recheck is unchanged: the latest review of the key, a silent return while it runs, the IT count reset, the wall clock and its own PM event', () => {
    const WALL = '2026-11-24T15:30:00.000Z';
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(WALL));
    const call = (store: Store, key: string) => recheck.call({ store, state: store.state.coordination } as never, key);
    const older = review({ itRecoveryAttempts: 2 }), newer = review({ id: 'review-2', itRecoveryAttempts: 3, retry: retry(3, true) }), store = project([older, newer]);
    const olderBefore = structuredClone(older), spent = structuredClone(newer.retry);
    call(store, 'GH-1');
    expect(older).toEqual(olderBefore);
    // The latest review is requeued with its IT count reset, at the wall clock and not the store's, its spent read retries ignored and kept.
    expect(newer).toMatchObject({ status: 'queued', queuedAt: WALL, itRecoveryAttempts: 0, retry: spent });
    expect(store.state.events.filter(event => event.ticket === 'GH-1').map(event => [event.kind, event.message, event.role])).toEqual([['assignment-recheck', 'GH-1 queued for deliberate PM ownership read-back.', 'pm']]);
    // While the latest review is queued or working it returns without a word.
    for (const status of ['queued', 'working'] as const) {
        newer.status = status;
        const before = structuredClone(newer), events = store.state.events.length;
        expect(call(store, 'GH-1')).toBeUndefined();
        expect(newer).toEqual(before);
        expect(store.state.events).toHaveLength(events);
    }
    expect(() => call(store, 'GH-9')).toThrow('No assignment review exists for this ticket');
});
