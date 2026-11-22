import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { InFlightOperations } from '../../../server/office/in-flight-operations';
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
    const state = { fenced: initiallyFenced, fenceReads: 0, incidentSyncs: 0, incidentError: '', compared: [] as string[], inFlight: [] as number[] };
    const operations = new InFlightOperations();
    const offices = { entries: new Map([['cms-field-vocabulary', { store, engine: {} }]]), fenced: () => { state.fenceReads++; return state.fenced; }, pump: async () => {}, tick: async () => {},
        observeIncidents: () => { state.incidentSyncs++; if (state.incidentError) throw new Error(state.incidentError); },
        incidents: { inState: (wanted: string) => { state.compared.push(wanted); state.inFlight.push(operations.count); return []; } }, resumes: { read: () => ({ enabled: false, revision: 0, reason: 'never enabled', at: null }) }, operations };
    const report = vi.fn(async () => ({ services: [], checkedAt: '', context: '' }));
    const itSpecialist = new ITSpecialist({ entries: new Map(), fenced: offices.fenced } as any, { report } as any);
    const stop = startServiceTicks({ offices, itSpecialist, loadedRevision: { hash: 'h'.repeat(64), manifest: [] } } as any);
    const refreshes = () => (store.state.coordination?.requests || []).filter(r => r.action === 'refresh');
    return { state, stop, refreshes, report, itSpecialist, operations };
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

test('the incident ledger is not synced while fenced, and is synced once a minute after release', async () => {
    const { state, stop } = service(true);
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(state.incidentSyncs).toBe(0);
    state.fenced = false;
    await vi.advanceTimersByTimeAsync(59_000);
    expect(state.incidentSyncs).toBe(0);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(state.incidentSyncs).toBe(1);
    await vi.advanceTimersByTimeAsync(2 * 60_000);
    expect(state.incidentSyncs).toBe(3);
    stop();
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(state.incidentSyncs).toBe(3);
});

test('an incident sync that throws is reported without its secrets and does not stop the next one', async () => {
    const { state, stop } = service(false);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
        state.incidentError = `ledger unreadable: Bearer abc.def via xoxb-1-2-${'c'.repeat(20)}`;
        await vi.advanceTimersByTimeAsync(60_000);
        expect(errors).toHaveBeenCalledWith(expect.stringMatching(/ledger unreadable: Bearer \[redacted\]/));
        expect(errors.mock.calls.flat().join(' ')).not.toContain('xoxb-');
        state.incidentError = '';
        await vi.advanceTimersByTimeAsync(60_000);
        expect(state.incidentSyncs).toBe(2);
    } finally { errors.mockRestore(); stop(); }
});

test('the running release is compared with shipped incidents after each incident sync, never while fenced or with polling off', async () => {
    const { state, stop, operations } = service(true);
    await vi.advanceTimersByTimeAsync(2 * 60_000);
    expect(state.compared).toEqual([]);
    state.fenced = false;
    await vi.advanceTimersByTimeAsync(60_000);
    // Dismissals are checked first, then repairs in progress are marked, then due resumes are queued for deployed incidents, the outcomes of earlier ones are judged and deployed and verified incidents are settled, then the release is compared: deployed incidents for a withdrawal, then shipped ones for an arrival.
    expect(state.compared).toEqual(['dismissed', 'fixing', 'shipped', 'deployed', 'deployed', 'deployed', 'deployed', 'verified', 'deployed', 'shipped']);
    // Health is busy for as long as the comparison runs, and not after.
    expect(state.inFlight).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 1, 1]);
    expect(operations.count).toBe(0);
    process.env.OFFICE_NO_POLL = '1';
    await vi.advanceTimersByTimeAsync(60_000);
    expect(state.incidentSyncs).toBe(2);
    expect(state.compared).toEqual(['dismissed', 'fixing', 'shipped', 'deployed', 'deployed', 'deployed', 'deployed', 'verified', 'deployed', 'shipped', 'dismissed', 'fixing', 'shipped', 'deployed', 'deployed', 'deployed', 'deployed', 'verified']);
    stop();
});
