import { afterEach, expect, test, vi } from 'vitest';
import type { DailyCTOReport } from '../../../src/shared';
import { reviewWeekday } from '../../../server/leadership/daily-review-schedule';
import { type SeenReports, waitingReport } from '../../../server/leadership/waiting-report';
import { ControlStore } from '../../../server/store/control-store';

const controls: ControlStore[] = [];
afterEach(() => { controls.splice(0).forEach(control => control.close()); vi.restoreAllMocks(); });
function control() { const made = new ControlStore(':memory:', { now: () => new Date('2026-11-02T22:00:00Z'), monotonic: () => 0 }); controls.push(made); return made; }
/** The rule as it was: every report read and parsed, the oldest waiting one of the newest 100. */
const previous = (store: ControlStore) => store.list(100).reverse().find(report => ['queued', 'recovery-queued', 'assessed'].includes(report.status) && (report.status !== 'queued' || reviewWeekday(report.date)));
const day = (n: number) => new Date(Date.UTC(2026, 9, 1 + n)).toISOString().slice(0, 10);
const enqueue = (store: ControlStore, date: string) => store.enqueue(date, `${date}T22:00:00Z`, { projects: [] });
const set = (store: ControlStore, id: string, status: DailyCTOReport['status']) => { const now = store.get(id)!; return store.update(id, now.revision, next => { next.status = status; }); };
/** How many report bodies `work` read one at a time. */
function bodiesRead(store: ControlStore, work: () => unknown) { const get = vi.spyOn(store, 'get'), list = vi.spyOn(store, 'list'); work(); const read = get.mock.calls.length; expect(list).not.toHaveBeenCalled(); get.mockRestore(); list.mockRestore(); return read; }

test('with nothing waiting no report body is read once each has been seen', () => {
    const store = control(), seen: SeenReports = new Map();
    for (let n = 0; n < 5; n++) set(store, enqueue(store, day(n)).id, 'completed');
    expect(bodiesRead(store, () => expect(waitingReport(store, seen)).toBeUndefined())).toBe(5);
    expect(bodiesRead(store, () => expect(waitingReport(store, seen)).toBeUndefined())).toBe(0);
});

test('the oldest waiting report is returned whole, and a queued one counts only on a review weekday', () => {
    const store = control(), seen: SeenReports = new Map();
    const saturday = enqueue(store, '2026-10-31'), monday = enqueue(store, '2026-11-02'), tuesday = enqueue(store, '2026-11-03');
    expect(reviewWeekday(saturday.date)).toBe(false);
    expect(waitingReport(store, seen)).toEqual(store.get(monday.id));
    // Queued for recovery or assessed, a weekend report waits like any other, and it is the older one.
    set(store, saturday.id, 'recovery-queued');
    expect(waitingReport(store, seen)).toEqual(store.get(saturday.id));
    set(store, saturday.id, 'completed'); set(store, monday.id, 'working');
    expect(waitingReport(store, seen)).toEqual(store.get(tuesday.id));
    expect(waitingReport(store, seen)).toEqual(previous(store));
});

test('a remembered status is not used once the report has changed', () => {
    const store = control(), seen: SeenReports = new Map();
    const report = enqueue(store, '2026-11-02');
    expect(waitingReport(store, seen)?.id).toBe(report.id);
    set(store, report.id, 'working');
    expect(waitingReport(store, seen)).toBeUndefined();
    set(store, report.id, 'assessed');
    expect(waitingReport(store, seen)).toEqual(store.get(report.id));
    set(store, report.id, 'completed');
    expect(waitingReport(store, seen)).toBeUndefined();
    // Finished, then queued for recovery: it waits again on the next call.
    set(store, report.id, 'recovery-queued');
    expect(waitingReport(store, seen)).toEqual(store.get(report.id));
    // Only the changed report's body is read to learn that, and once more to return it.
    const other = enqueue(store, '2026-11-03'); set(store, other.id, 'completed'); set(store, report.id, 'completed');
    waitingReport(store, seen);
    set(store, report.id, 'recovery-queued');
    expect(bodiesRead(store, () => waitingReport(store, seen))).toBe(2);
});

test('only the newest hundred reports are considered, and what is remembered does not outgrow them', () => {
    const store = control(), seen: SeenReports = new Map();
    const oldest = enqueue(store, day(0));
    set(store, oldest.id, 'assessed');
    for (let n = 1; n < 100; n++) set(store, enqueue(store, day(n)).id, 'completed');
    expect(waitingReport(store, seen)?.id).toBe(oldest.id);
    set(store, enqueue(store, day(100)).id, 'completed');
    expect(waitingReport(store, seen)).toBeUndefined();
    expect(previous(store)).toBeUndefined();
    expect(seen.size).toBe(100);
    expect(seen.has(oldest.id)).toBe(false);
});

test('over random histories the report found is the one the previous rule finds', () => {
    const statuses: DailyCTOReport['status'][] = ['queued', 'recovery-queued', 'working', 'assessed', 'completed', 'conflicted', 'blocked', 'interrupted', 'coalesced'];
    for (let seed = 1; seed <= 40; seed++) {
        let state = seed;
        const next = () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 2 ** 32; };
        const store = control(), seen: SeenReports = new Map(), ids: string[] = [];
        for (let round = 0; round < 60; round++) {
            if (!ids.length || next() < 0.3) ids.push(enqueue(store, day(seed * 200 + ids.length)).id);
            else set(store, ids[Math.floor(next() * ids.length)], statuses[Math.floor(next() * statuses.length)]);
            if (next() < 0.7) expect(waitingReport(store, seen), `seed ${seed}, round ${round}`).toEqual(previous(store));
        }
        expect(waitingReport(store, seen)).toEqual(previous(store));
    }
});
