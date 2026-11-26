import { mkdirSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { claudeCost } from '../../../server/telemetry/run-cost';
import type { ReservationRow } from '../../../server/overseer/budget-ledger';
import { budgetRequest } from '../../../server/overseer/budget-policy';
import { runBudgeted, type BudgetedInvocation, type BudgetedOutcome } from '../../../server/overseer/budgeted-run';
import type { RunnerPaths } from '../../../server/overseer/config';
import { incidentId, runnerRoot } from './runner-world';

beforeEach(() => { vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] }); });
afterEach(() => { vi.useRealTimers(); });

const now = () => new Date('2026-11-25T17:00:00.000Z');
const triage = budgetRequest(incidentId(1), 'triage', 1);
const usd = (amount: number) => claudeCost({ type: 'result', subtype: 'success', is_error: false, session_id: 's', total_cost_usd: amount, modelUsage: { 'claude-opus-5-5': { costUSD: amount, costBasis: 'list' } } });
const row = (paths: RunnerPaths): ReservationRow => {
    const db = new DatabaseSync(paths.budgetDb, { readOnly: true });
    try { return db.prepare('SELECT * FROM reservations').get() as unknown as ReservationRow; } finally { db.close(); }
};
const PENDING = Symbol('pending');
/** The outcome if the wrapper has returned by now, or PENDING: a wrapper that never returns fails here instead of hanging. */
const settledBy = async (outcome: Promise<BudgetedOutcome>) => Promise.race([outcome, Promise.resolve().then(() => new Promise(done => setImmediate(() => done(PENDING))))]);

test('a refused admission never calls the invocation', async () => {
    const paths = runnerRoot();
    mkdirSync(paths.control, { recursive: true });
    writeFileSync(paths.budgetConfig, JSON.stringify({ version: 1, dailyCeilingMicroUsd: 1 }));
    const invoke = vi.fn();
    expect(await runBudgeted(paths, triage, invoke, { now })).toEqual({ status: 'refused', code: 'ceiling' });
    expect(invoke).not.toHaveBeenCalled();
});

test('a completed invocation settles its receipt against the session it bound', async () => {
    const paths = runnerRoot();
    const outcome = await runBudgeted(paths, triage, async run => { run.bindSession('session-1'); return { evidenceId: 'session-1', cost: usd(1) }; }, { now });
    expect(outcome).toMatchObject({ status: 'completed', settled: { ok: true, settlement: { result: 'settled' } } });
    expect(row(paths)).toMatchObject({ status: 'settled', final: 1, charged: 1_000_000, evidence_id: 'session-1' });
});

test('an invocation that throws keeps its full reservation at once', async () => {
    const paths = runnerRoot();
    const outcome = await runBudgeted(paths, triage, async () => { throw new Error('the CLI crashed'); }, { now });
    expect(outcome).toMatchObject({ status: 'failed', error: { message: 'the CLI crashed' }, settled: { ok: true } });
    expect(row(paths)).toMatchObject({ status: 'retained', final: 0, charged: 3_000_000 });
});

test('a silent invocation that ignores its signal returns to the caller at the inactivity deadline, and its hold stays', async () => {
    const paths = runnerRoot();
    let handed: BudgetedInvocation | undefined;
    const outcome = runBudgeted(paths, triage, run => { handed = run; return new Promise(() => {}); }, { now });
    await vi.advanceTimersByTimeAsync(5 * 60_000 - 1);
    expect(await settledBy(outcome)).toBe(PENDING);
    await vi.advanceTimersByTimeAsync(1);
    const result = await settledBy(outcome);
    expect(result).toMatchObject({ status: 'timed-out', reason: 'inactivity', retained: { ok: true } });
    expect(handed!.signal.aborted).toBe(true);
    expect(row(paths)).toMatchObject({ status: 'retained', final: 0, charged: 3_000_000 });
});

test('regular output keeps an invocation going until its total deadline, which does not move', async () => {
    const paths = runnerRoot();
    const outcome = runBudgeted(paths, triage, run => {
        const beat = setInterval(() => run.activity(), 60_000);
        run.signal.addEventListener('abort', () => clearInterval(beat));
        return new Promise(() => {});
    }, { now });
    await vi.advanceTimersByTimeAsync(15 * 60_000 - 1);
    expect(await settledBy(outcome)).toBe(PENDING);
    await vi.advanceTimersByTimeAsync(1);
    expect(await settledBy(outcome)).toMatchObject({ status: 'timed-out', reason: 'total' });
});

test('a receipt that arrives after the timeout settles the original reservation, after the caller moved on', async () => {
    const paths = runnerRoot();
    let finish: ((value: { evidenceId: string; cost: ReturnType<typeof usd> }) => void) | undefined;
    const outcome = runBudgeted(paths, triage, run => { run.bindSession('session-1'); return new Promise(done => { finish = done; }); }, { now });
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    const result = await settledBy(outcome);
    expect(result).toMatchObject({ status: 'timed-out', reason: 'inactivity' });
    expect(row(paths)).toMatchObject({ status: 'retained', charged: 3_000_000 });
    finish!({ evidenceId: 'session-1', cost: usd(4) });
    expect(await (result as Extract<BudgetedOutcome, { status: 'timed-out' }>).late).toMatchObject({ ok: true, settlement: { result: 'overrun' } });
    expect(row(paths)).toMatchObject({ status: 'overrun', final: 1, charged: 4_000_000 });
});

test('a rejection that arrives after the timeout keeps the hold as it was', async () => {
    const paths = runnerRoot();
    let fail: ((error: Error) => void) | undefined;
    const outcome = runBudgeted(paths, triage, () => new Promise((_, reject) => { fail = reject; }), { now });
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    const result = await settledBy(outcome) as Extract<BudgetedOutcome, { status: 'timed-out' }>;
    fail!(new Error('killed'));
    expect(await result.late).toMatchObject({ ok: true, settlement: { result: 'retained' } });
    expect(row(paths)).toMatchObject({ status: 'retained', final: 0, charged: 3_000_000 });
});
