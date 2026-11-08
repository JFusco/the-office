import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { Store } from '../../../server/store/store';
import { coordination } from '../../../server/scheduling/coordination';
import { projectById } from '../../../server/office/projects';
import { timeLedger } from '../../../server/time/time-ledger';
import { captureCost, costLedger } from '../../../server/telemetry/cost-entries';
import { boardUsd, inCostWindow, ticketCosts } from '../../../server/telemetry/cost-totals';
import { publishCost } from '../../../server/telemetry/cost-ledger';
import { dueCostReadback, readBackCost } from '../../../server/telemetry/cost-readback';
import { reconcileCost } from '../../../server/telemetry/reconcile-cost';
import type { RunAccounting } from '../../../src/contracts/telemetry';
import type { WorkTime } from '../../../src/shared';

let millis = Date.parse('2026-11-07T12:00:00Z');
const clock = { now: () => new Date(millis), monotonic: () => millis };
const stores: Store[] = [], paths: string[] = [];
afterEach(() => { stores.splice(0).forEach(s => s.close()); paths.splice(0).forEach(p => rmSync(p, { recursive: true, force: true })); });

const accounting = (completeness: 'complete' | 'partial' | 'unpriced', micro: number | null): RunAccounting => ({
    usage: { uncachedInputTokens: 1, cacheReadInputTokens: 0, cacheWriteInputTokens: 0, outputTokens: 1, reasoningOutputTokens: 0, completeness: 'complete', reasons: [], source: 'codex-rollout', requests: 1, observedModels: [], observedEfforts: [], producerVersion: null },
    cost: { microUsd: completeness === 'complete' ? micro : null, partialMicroUsd: completeness === 'partial' ? micro : null, completeness, valuation: completeness === 'unpriced' ? null : 'price-table', providerBasis: 'list', reportedTotalUsd: null, priceRefs: [], components: [], reasons: [] },
    provenance: 'live', evidenceId: `e${micro}`, sourcePath: null, sourceSha256: null, acceptedAt: '',
});
const run = (id: string, startedAt: string, extra: Partial<WorkTime> = {}): WorkTime => ({ id, role: 'lead', task: 't', ticket: 'GH-7', stage: 'implement', requestId: '', sessionId: '', provider: 'codex', model: '', effort: '', status: 'completed', startedAt, lastHeartbeatAt: startedAt, endedAt: startedAt, elapsedMs: 1, queuedMs: 0, inputTokens: null, outputTokens: null, durationUncertain: false, reportedAt: '', ...extra });

function setup() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-cost-')); paths.push(root);
    const store = new Store(':memory:', projectById('brain'), root, clock); stores.push(store);
    store.state.coordination = coordination();
    Object.assign(timeLedger(store), { activatedAt: '2026-11-01T00:00:00Z', scopePolicy: 'model-work-v1', cost: { githubField: true, entries: [], baselines: {} } });
    return store;
}

/** A fake board: one item for GH-7 with a Number field "Est. Cost (USD)". */
function board(initial: number | null = null, opts: { failWrite?: boolean; dropRead?: boolean; field?: string } = {}) {
    const state = { value: initial, writes: [] as number[], reads: 0 };
    const execute: any = async (_bin: string, _args: string[], options: any) => {
        const { query, variables } = JSON.parse(options.input);
        const values = () => ({ nodes: state.value === null ? [] : [{ number: state.value, field: { id: 'COST' } }], pageInfo: { hasNextPage: false } });
        if (query.includes('user(login:')) return JSON.stringify({ data: { user: { projectV2: { id: 'P', fields: { nodes: [{ id: 'HOURS', name: 'Time Spent (Hours)', dataType: 'NUMBER' }, { id: 'COST', name: opts.field ?? 'Est. Cost (USD)', dataType: 'NUMBER' }], pageInfo: { hasNextPage: false } } } } } });
        if (query.includes('items(first:')) return JSON.stringify({ data: { node: { items: { nodes: [{ id: 'ITEM', content: { number: 7, repository: { nameWithOwner: 'JFusco/brain' } }, fieldValues: values() }], pageInfo: { hasNextPage: false, endCursor: null } } } } });
        if (query.trimStart().startsWith('mutation')) {
            state.writes.push(variables.usd);
            if (opts.failWrite) throw new Error('socket hang up after send');
            state.value = variables.usd;
            return JSON.stringify({ data: { updateProjectV2ItemFieldValue: { projectV2Item: { id: 'ITEM' } } } });
        }
        state.reads++;
        if (opts.dropRead) throw new Error('read failed');
        return JSON.stringify({ data: { node: { fieldValues: values() } } });
    };
    return { state, execute };
}

test('the board window is hours\' window by run start, start-inclusive and end-exclusive, without proration', () => {
    const ledger = { activatedAt: '2026-11-01T00:00:00Z', disabledPeriods: [{ start: '2026-11-03T00:00:00Z', end: '2026-11-04T00:00:00Z' }], disabledSince: '2026-11-06T00:00:00Z' } as any;
    expect(['2026-10-31T23:59:59Z', '2026-11-01T00:00:00Z', '2026-11-03T00:00:00Z', '2026-11-04T00:00:00Z', '2026-11-06T00:00:00Z'].map(at => inCostWindow(ledger, at))).toEqual([false, true, false, true, false]);
});

test('subtotals count failed runs, partial amounts and unpriced runs honestly; overhead and pre-activation runs stay off the board', () => {
    const store = setup();
    const log = [
        run('a', '2026-11-02T10:00:00Z', { accounting: accounting('complete', 1_250_000) }),
        run('b', '2026-11-02T11:00:00Z', { status: 'failed', accounting: accounting('complete', 250_000) }),
        run('c', '2026-11-02T12:00:00Z', { accounting: accounting('partial', 100_000) }),
        run('d', '2026-11-02T13:00:00Z'), // uncaptured history
        run('e', '2026-10-30T10:00:00Z', { accounting: accounting('complete', 9_000_000) }), // before activation
        run('f', '2026-11-02T10:00:00Z', { ticket: 'CMS maintenance (weekly)', accounting: accounting('complete', 5) }),
        run('g', '2026-11-02T10:00:00Z', { provider: 'harness' }),
        run('h', '2026-11-02T14:00:00Z', { status: 'running' }),
    ];
    expect(ticketCosts(log, timeLedger(store)).get('GH-7')).toMatchObject({ microUsd: 1_600_000, pricedRuns: 2, partialRuns: 1, unpricedRuns: 1, inProgressRuns: 1 });
    expect([...ticketCosts(log, timeLedger(store)).keys()]).toEqual(['GH-7']);
});

test('publication goes through Effects with read-back, preserves the board baseline, and settles idempotently', async () => {
    const store = setup(), b = board(3);
    store.state.workLog = [run('a', '2026-11-02T10:00:00Z', { accounting: accounting('complete', 1_234_567) })];
    captureCost(store);
    await publishCost(store, b.execute);
    const entry = costLedger(store)!.entries[0];
    expect(b.state.writes).toEqual([4.23]);
    expect(entry).toMatchObject({ status: 'posted', intendedUsd: 4.23, revision: 1 });
    expect(costLedger(store)!.baselines['GH-7']).toMatchObject({ baseline: 3, lastWritten: 4.23, itemId: 'ITEM', fieldId: 'COST' });
    expect(store.getEffect(entry.effectId!)).toMatchObject({ status: 'verified', operation: 'github-cost-field', target: 'GH-7' });
    // A new priced run makes a new revision; the frozen baseline is reused, not the current value.
    store.state.workLog.push(run('b', '2026-11-03T10:00:00Z', { accounting: accounting('complete', 1_000_000) }));
    captureCost(store);
    await publishCost(store, b.execute);
    expect(b.state.writes).toEqual([4.23, 5.23]);
    expect(costLedger(store)!.entries[0]).toMatchObject({ status: 'posted', revision: 2 });
});

test.each([null, 3])('an all-unpriced ticket leaves the board value %s alone until a priced run is available', async initial => {
    const store = setup(), b = board(initial);
    store.state.workLog = [run('d', '2026-11-02T13:00:00Z')];
    captureCost(store);
    await publishCost(store, b.execute);
    expect(costLedger(store)!.entries).toEqual([]);
    expect(costLedger(store)!.baselines).toEqual({});
    expect(b.state.writes).toEqual([]);
    expect(b.state.value).toBe(initial);
    store.state.workLog.push(run('priced', '2026-11-02T14:00:00Z', { accounting: accounting('complete', 1_250_000) }));
    captureCost(store); await publishCost(store, b.execute);
    expect(b.state.writes).toEqual([(initial ?? 0) + 1.25]);
    expect(costLedger(store)!.entries[0]).toMatchObject({ status: 'posted', microUsd: 1_250_000, pricedRuns: 1, unpricedRuns: 1, detail: expect.stringContaining('1 unpriced run') });
});

test.each(['complete', 'partial'] as const)('a supported %s zero amount still publishes', async completeness => {
    const store = setup(), b = board(null);
    store.state.workLog = [run('zero', '2026-11-02T13:00:00Z', { accounting: accounting(completeness, 0) })];
    captureCost(store); await publishCost(store, b.execute);
    expect(costLedger(store)!.entries[0]).toMatchObject({ status: 'posted', microUsd: 0 });
    expect(b.state.writes).toEqual([0]);
});

test('an outside edit, a missing field, or turning publishing off blocks without writing', async () => {
    const store = setup(), b = board(3);
    store.state.workLog = [run('a', '2026-11-02T10:00:00Z', { accounting: accounting('complete', 1_000_000) })];
    captureCost(store); await publishCost(store, b.execute);
    b.state.value = 9; // someone edited the board
    store.state.workLog.push(run('b', '2026-11-03T10:00:00Z', { accounting: accounting('complete', 1_000_000) }));
    captureCost(store); await publishCost(store, b.execute);
    expect(costLedger(store)!.entries[0]).toMatchObject({ status: 'blocked', needsDecision: 'outside-edit' });
    expect(b.state.writes).toEqual([4]);
    // Plain reconciliation cannot clear it; accepting the edit keeps the human delta as a baseline adjustment.
    await reconcileCost(store, 'GH-7', '', b.execute); captureCost(store);
    expect(costLedger(store)!.entries[0].status).toBe('blocked');
    await reconcileCost(store, 'GH-7', 'accept-board', b.execute);
    expect(costLedger(store)!.baselines['GH-7']).toMatchObject({ baseline: 8, lastWritten: 9 }); // 3 + (9 − 4)
    captureCost(store); await publishCost(store, b.execute);
    expect(b.state.writes).toEqual([4, 10]); // 8 + $2.00 subtotal, Office spend not counted twice
    const other = setup(), missing = board(null, { field: 'Cost' });
    other.state.workLog = [run('a', '2026-11-02T10:00:00Z', { accounting: accounting('complete', 1) })];
    captureCost(other); await publishCost(other, missing.execute);
    const blocked = costLedger(other)!.entries[0];
    expect(blocked).toMatchObject({ status: 'blocked', detail: expect.stringContaining('Exactly one Number field named Est. Cost (USD)'), retryAt: expect.any(String) });
    // Never dispatched, so it retries on its own after the backoff.
    captureCost(other); expect(blocked.status).toBe('blocked');
    millis += 5 * 60_000; captureCost(other); expect(blocked.status).toBe('pending');
    timeLedger(other).cost!.githubField = false;
    await publishCost(other, board(null).execute);
    expect(blocked.status).toBe('pending');
});

test('a write with an unknown outcome is never resent; read-back settles it, and a restart after verification finalizes once', async () => {
    const store = setup(), b = board(0, { failWrite: true });
    store.state.workLog = [run('a', '2026-11-02T10:00:00Z', { accounting: accounting('complete', 500_000) })];
    captureCost(store); await publishCost(store, b.execute);
    const entry = costLedger(store)!.entries[0];
    expect(entry.status).toBe('uncertain');
    await publishCost(store, b.execute);
    expect(b.state.writes).toEqual([0.5]); // no second mutation
    expect(dueCostReadback(store, new Date(millis))).toBeNull(); // cadence, not proof
    millis += 5 * 60_000;
    expect(dueCostReadback(store, new Date(millis))?.key).toBe('GH-7');
    await readBackCost(store, 'GH-7', b.execute); // board still shows the old value
    expect(entry.status).toBe('uncertain');
    b.state.value = 0.5; // the write had landed after all
    await readBackCost(store, 'GH-7', b.execute);
    expect(entry.status).toBe('posted');
    expect(store.getEffect(entry.effectId!)?.status).toBe('verified');
    expect(b.state.writes).toEqual([0.5]);
    // Simulate a crash after effect verification but before the ledger finalized.
    Object.assign(entry, { status: 'posting' });
    await readBackCost(store, 'GH-7', b.execute);
    expect(entry.status).toBe('posted');
});

test('Joe can abandon an attempt that never settles; a fresh revision is written and the abandoned value is recognised if it landed', async () => {
    const store = setup(), refused = board(1, { failWrite: true });
    store.state.workLog = [run('a', '2026-11-02T10:00:00Z', { accounting: accounting('complete', 500_000) })];
    captureCost(store); await publishCost(store, refused.execute);
    const entry = costLedger(store)!.entries[0];
    expect(entry.status).toBe('uncertain');
    store.state.workLog.push(run('b', '2026-11-03T10:00:00Z', { accounting: accounting('complete', 1_000_000) }));
    captureCost(store); expect(entry.revision).toBe(1); // frozen while unsettled
    await reconcileCost(store, 'GH-7', 'abandon', refused.execute);
    expect(entry).toMatchObject({ status: 'pending', revision: 2 });
    captureCost(store);
    const ok = board(1.5); // the abandoned $1.50 did land after all
    await publishCost(store, ok.execute);
    expect(ok.state.writes).toEqual([2.5]);
    expect(entry.status).toBe('posted');
});

test('a just-finished run awaiting its evidence is in progress, not an unpriced subtotal; cents round in integers', () => {
    millis = Date.parse('2026-11-07T12:00:00Z');
    const store = setup();
    store.state.telemetryCaptureStartedAt = '2026-11-01T00:00:00Z';
    store.state.workLog = [run('a', '2026-11-07T11:59:30Z', { endedAt: '2026-11-07T11:59:50Z' })];
    captureCost(store);
    expect(costLedger(store)!.entries).toEqual([]);
    millis += 2 * 60_000; captureCost(store);
    expect(costLedger(store)!.entries).toEqual([]);
    expect([boardUsd(0, 1_005_000), boardUsd(0, 1_015_000), boardUsd(0.1, 200_000)]).toEqual([1.01, 1.02, 0.3]);
});

test('cost uncertainty never touches hours publications or their resend allowance', async () => {
    const store = setup(), b = board(0, { failWrite: true });
    timeLedger(store).publications = [];
    store.state.workLog = [run('a', '2026-11-02T10:00:00Z', { accounting: accounting('complete', 500_000) })];
    captureCost(store); await publishCost(store, b.execute);
    expect(timeLedger(store).publications).toEqual([]);
    expect(timeLedger(store).entries.every(e => e.status !== 'uncertain')).toBe(true);
});
