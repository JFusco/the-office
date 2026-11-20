import { afterEach, expect, test } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { REPAIR_WAIT_MS, repairWaitFor, sameStop, standingStop } from '../../../../server/incidents/repair/repair-wait';
import { effectiveCause } from '../../../../server/incidents/repair/repair-wait-cause';
import type { Store } from '../../../../server/store/store';
import { job, later, world } from './repair-wait-fixture';

const stores: Store[] = [], dbs: DatabaseSync[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); dbs.splice(0).forEach(db => db.close()); });
function marked() { const w = world(stores, dbs); w.start(); w.pass(2); return w; }

test('a wait is in effect for the stop it was admitted for, and for nothing else', () => {
    const w = marked();
    expect(repairWaitFor(w.store.state, w.work('1'), 'review', later(3))).toMatchObject({ incident: w.id, repair: 'cli-start-1', subject: 'cms-field-vocabulary/delivery/1', stands: { stage: 'review', episode: 't1', stop: { kind: 'unclassified', at: 't1' }, head: 'abc1234' } });
    expect(repairWaitFor(w.store.state, w.work('2'), 'review', later(3))).not.toBeNull();
    // Work with no marker, and a store that has never held one.
    expect(repairWaitFor(w.store.state, w.work('3'), 'review', later(3))).toBeNull();
    expect(repairWaitFor({ ...w.store.state, coordination: { ...w.store.state.coordination!, repairWaits: undefined } }, w.work('1'), 'review', later(3))).toBeNull();
    expect(repairWaitFor({ ...w.store.state, coordination: undefined }, w.work('1'), 'review', later(3))).toBeNull();
    // The same kind and ID in another project is other work, whoever asks.
    expect(repairWaitFor(w.store.state, { ...w.work('1'), projectId: 'brain' }, 'review', later(3))).toBeNull();
});

test('a later stop of the same record, another stage, head or saved stop ends the wait without a write', () => {
    for (const change of [{ stop: { kind: 'unclassified', at: 't2' } }, { head: 'def5678' }, { stop: { kind: 'transient', at: 't1' } }, { status: 'queued' }, { status: 'completed' }]) {
        const w = marked(), saved = w.saved();
        Object.assign(w.jobs()[0], change);
        expect(repairWaitFor(w.store.state, w.work('1'), 'review', later(3))).toBeNull();
        expect(repairWaitFor(w.store.state, w.work('2'), 'review', later(3))).not.toBeNull();
        expect(w.saved()).toBe(saved);
    }
    const w = marked();
    expect(repairWaitFor(w.store.state, w.work('1'), 'validate', later(3))).toBeNull();
    // The record's own stage decides, whatever stage the caller names: a job moved on with its stop unchanged is not covered.
    w.jobs()[0].stage = 'validate';
    expect(repairWaitFor(w.store.state, w.work('1'), 'review', later(3))).toBeNull();
    expect(repairWaitFor(w.store.state, w.work('1'), 'validate', later(3))).toBeNull();
    w.jobs().splice(0, 1);
    expect(repairWaitFor(w.store.state, w.work('1'), 'review', later(3))).toBeNull();
});

test('a wait runs out 48 hours after the last progress, whether or not that has been recorded yet', () => {
    const w = marked(), wait = w.waits()['delivery/1'];
    const at = (ms: number) => new Date(Date.parse(wait.progressAt) + ms);
    expect(repairWaitFor(w.store.state, w.work('1'), 'review', at(REPAIR_WAIT_MS - 1))).not.toBeNull();
    expect(repairWaitFor(w.store.state, w.work('1'), 'review', at(REPAIR_WAIT_MS))).toBeNull();
    w.store.state.coordination!.repairWaits!['delivery/1'] = { ...wait, expiredAt: later(5).toISOString() };
    expect(repairWaitFor(w.store.state, w.work('1'), 'review', later(6))).toBeNull();
});

test('the standing stop is read from the record: nothing for work that runs or has no record, and stops compare field by field', () => {
    const w = world(stores, dbs);
    expect(standingStop(w.store.state, w.work('1'), 'review')).toEqual({ stage: 'review', episode: 't1', stop: { kind: 'unclassified', at: 't1' }, head: 'abc1234' });
    expect(standingStop(w.store.state, w.work('1'), 'validate')).toBeNull();
    w.store.state.coordination!.jobs = [job('1', { status: 'working' })];
    expect(standingStop(w.store.state, w.work('1'), 'review')).toBeNull();
    expect(standingStop(w.store.state, w.work('9'), 'review')).toBeNull();
    expect(standingStop(w.store.state, { projectId: 'cms-field-vocabulary', kind: 'recovery' as never, id: 'implementation:1' }, '')).toBeNull();
    const base = { stage: 'review', episode: 't1', stop: { kind: 'unclassified' as const, at: 't1' }, head: 'abc' };
    expect(sameStop(base, { ...base, stop: { at: 't1', kind: 'unclassified' } })).toBe(true);
    for (const other of [{ ...base, stage: 'x' }, { ...base, episode: 't2' }, { ...base, head: 'd' }, { ...base, stop: null }, { ...base, stop: { kind: 'unclassified' as const, at: 't2' } }]) expect(sameStop(base, other)).toBe(false);
});

test('awaiting repair stands in only for an unclassified, failed or interrupted stop, or none recorded', () => {
    for (const cause of ['unclassified', 'failed', 'interrupted', undefined] as const) {
        expect(effectiveCause(cause, true)).toBe('awaiting-repair');
        expect(effectiveCause(cause, false)).toBe(cause ?? 'unclassified');
    }
    for (const cause of ['needs-decision', 'dependency', 'paused', 'unconfirmed'] as const) expect(effectiveCause(cause, true)).toBe(cause);
});
