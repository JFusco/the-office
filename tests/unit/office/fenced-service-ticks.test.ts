import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { startServiceTicks } from '../../../server/office/service-ticks';
import { coordination } from '../../../server/scheduling/coordination';
import { ITSpecialist } from '../../../server/it/it-specialist';

const stores: Store[] = [], roots: string[] = [];
let previousNoPoll: string | undefined;
beforeEach(() => { previousNoPoll = process.env.OFFICE_NO_POLL; delete process.env.OFFICE_NO_POLL; vi.useFakeTimers({ now: new Date('2026-11-19T20:00:00.000Z') }); });
afterEach(() => {
    vi.useRealTimers();
    if (previousNoPoll === undefined) delete process.env.OFFICE_NO_POLL; else process.env.OFFICE_NO_POLL = previousNoPoll;
    stores.splice(0).forEach(s => s.close()); roots.splice(0).forEach(r => rmSync(r, { recursive: true, force: true }));
});
/** The real IT specialist over an office with no projects: its health report is the observable work. */
function service(initiallyFenced: boolean) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-ticks-')); roots.push(root);
    const store = new Store(':memory:', projectById('cms-field-vocabulary'), root); stores.push(store);
    store.state.coordination ??= coordination();
    const state = { fenced: initiallyFenced, fenceReads: 0 };
    const offices = { entries: new Map([['cms-field-vocabulary', { store, engine: {} }]]), fenced: () => { state.fenceReads++; return state.fenced; }, pump: async () => {}, tick: async () => {} };
    const report = vi.fn(async () => ({ services: [], checkedAt: '', context: '' }));
    const itSpecialist = new ITSpecialist({ entries: new Map(), fenced: offices.fenced } as any, { report } as any);
    const stop = startServiceTicks({ offices, itSpecialist } as any);
    const refreshes = () => (store.state.coordination?.requests || []).filter(r => r.action === 'refresh');
    return { state, stop, refreshes, report, itSpecialist };
}

test('while fenced the refresh tick queues nothing, and the IT tick does no work and keeps its due marker', async () => {
    const { stop, refreshes, report, itSpecialist } = service(true);
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(refreshes()).toEqual([]);
    expect(report).not.toHaveBeenCalled();
    expect(itSpecialist.nextAt).toBe(0);
    stop();
});

test('a refresh deferred by the fence is queued once on the first tick after release, and IT work resumes', async () => {
    const { state, stop, refreshes, report } = service(true);
    await vi.advanceTimersByTimeAsync(3 * 60_000);
    state.fenced = false;
    await vi.advanceTimersByTimeAsync(5_000);
    expect(refreshes()).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(refreshes()).toHaveLength(1);
    expect(report).toHaveBeenCalled();
    stop();
});

test('an unfenced IT timer tick reads the fence once', async () => {
    const { state, stop } = service(false);
    await vi.advanceTimersByTimeAsync(4_000);
    state.fenceReads = 0;
    await vi.advanceTimersByTimeAsync(11_000);
    // 5 s, 10 s and 15 s refresh ticks read once each; the 15 s IT tick reads once, not twice.
    expect(state.fenceReads).toBe(4);
    stop();
});
