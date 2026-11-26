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
const T0 = Date.parse('2026-11-26T13:00:00.000Z');
beforeEach(() => { previousNoPoll = process.env.OFFICE_NO_POLL; delete process.env.OFFICE_NO_POLL; vi.useFakeTimers({ now: new Date(T0) }); });
afterEach(() => {
    vi.useRealTimers();
    if (previousNoPoll === undefined) delete process.env.OFFICE_NO_POLL; else process.env.OFFICE_NO_POLL = previousNoPoll;
    stores.splice(0).forEach(s => s.close()); roots.splice(0).forEach(r => rmSync(r, { recursive: true, force: true }));
});
/** The real service ticks over one GitHub and one Jira/Azure project, with a governor holding until `until`. */
function service(until: number) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-quota-ticks-')); roots.push(root);
    const open = (id: string) => { const store = new Store(':memory:', projectById(id), root); stores.push(store); store.state.coordination ??= coordination(); return store; };
    const github = open('cms-field-vocabulary'), azure = open('cec');
    const governor = { hold: () => Date.now() < until ? { until: new Date(until).toISOString() } : undefined };
    const offices = { entries: new Map([['cms-field-vocabulary', { store: github, engine: {} }], ['cec', { store: azure, engine: {} }]]), fenced: () => false, pump: async () => {}, tick: async () => {},
        observeIncidents: () => {}, incidents: { inState: () => [] }, resumes: { read: () => ({ enabled: false, revision: 0, reason: 'never enabled', at: null }) }, operations: new InFlightOperations(),
        githubCalls: { governor, quota: { sample: async () => {} } } };
    const itSpecialist = new ITSpecialist({ entries: new Map(), fenced: offices.fenced } as any, { report: async () => ({ services: [], checkedAt: '', context: '' }) } as any);
    const stop = startServiceTicks({ offices, itSpecialist, loadedRevision: { hash: 'h'.repeat(64), manifest: [] } } as any);
    const refreshes = (store: Store) => (store.state.coordination?.requests || []).filter(r => r.action === 'refresh');
    return { github, azure, stop, refreshes };
}

test('while the quota is held a GitHub refresh waits for the first tick after the deadline; other providers are not held', async () => {
    const x = service(T0 + 3 * 60_000);
    await vi.advanceTimersByTimeAsync(2 * 60_000);
    expect(x.refreshes(x.github)).toEqual([]);
    expect(x.refreshes(x.azure)).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(x.refreshes(x.github)).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(x.refreshes(x.github)).toHaveLength(1);
    x.stop();
});
