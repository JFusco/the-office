import { expect, test } from 'vitest';
import { STALLED_AFTER_MS, stalledSince } from '../../../../server/incidents/repair/stalled-resume';

const ADMITTED = '2026-11-20T12:05:00.000Z', at = (ms: number) => new Date(Date.parse(ADMITTED) + ms);
const quiet = (over: Partial<Parameters<typeof stalledSince>[0]> = {}) => ({ admittedAt: ADMITTED, activity: [], waiting: false, ...over });

test('a resume is stalled once 24 hours have passed since its admission with nothing moving, and not a moment sooner', () => {
    expect(STALLED_AFTER_MS).toBe(24 * 60 * 60 * 1000);
    expect(stalledSince(quiet(), at(STALLED_AFTER_MS))).toBe(ADMITTED);
    expect(stalledSince(quiet(), at(STALLED_AFTER_MS + 1))).toBe(ADMITTED);
    expect(stalledSince(quiet(), at(STALLED_AFTER_MS - 1))).toBeNull();
    expect(stalledSince(quiet(), at(0))).toBeNull();
});

test('the clock runs from the latest activity after the admission; earlier and unreadable instants count for nothing', () => {
    const ran = at(60 * 60 * 1000).toISOString(), later = at(2 * 60 * 60 * 1000).toISOString();
    expect(stalledSince(quiet({ activity: [ran] }), at(STALLED_AFTER_MS))).toBeNull();
    expect(stalledSince(quiet({ activity: [ran] }), at(STALLED_AFTER_MS + 60 * 60 * 1000 - 1))).toBeNull();
    expect(stalledSince(quiet({ activity: [ran] }), at(STALLED_AFTER_MS + 60 * 60 * 1000))).toBe(ran);
    // The latest of several, in any order.
    for (const activity of [[ran, later], [later, ran], [null, later, undefined, ran]]) expect(stalledSince(quiet({ activity }), at(STALLED_AFTER_MS + 2 * 60 * 60 * 1000))).toBe(later);
    expect(stalledSince(quiet({ activity: [ran, later] }), at(STALLED_AFTER_MS + 2 * 60 * 60 * 1000 - 1))).toBeNull();
    // Before the admission, missing, empty or not a time: the admission still starts the clock.
    for (const activity of [['2026-11-20T11:00:00.000Z'], [null], [undefined], [''], ['t1'], []]) expect(stalledSince(quiet({ activity }), at(STALLED_AFTER_MS)), JSON.stringify(activity)).toBe(ADMITTED);
});

test('while a wait applies the clock does not run, however long nothing has moved', () => {
    expect(stalledSince(quiet({ waiting: true }), at(10 * STALLED_AFTER_MS))).toBeNull();
    expect(stalledSince(quiet({ waiting: false }), at(10 * STALLED_AFTER_MS))).toBe(ADMITTED);
});

test('an admission whose time cannot be read is never stalled', () => {
    expect(stalledSince(quiet({ admittedAt: 'not a time' }), at(10 * STALLED_AFTER_MS))).toBeNull();
});
