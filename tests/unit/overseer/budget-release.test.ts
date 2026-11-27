import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { claudeCost } from '../../../server/telemetry/run-cost';
import { admit, bindEvidence, readStanding, reconcile, release, settle, type ReservationRow } from '../../../server/overseer/budget-ledger';
import { budgetRequest } from '../../../server/overseer/budget-policy';
import { AttributedFailure, NotDispatched, runBudgeted, type BudgetedOutcome } from '../../../server/overseer/budgeted-run';
import type { RunnerPaths } from '../../../server/overseer/config';
import { incidentId, runnerRoot } from './runner-world';

/** A caller-chosen reservation ID, and the release that lets a proven non-dispatch spend nothing. */

beforeEach(() => { vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] }); });
afterEach(() => { vi.useRealTimers(); });

const now = () => new Date('2026-11-27T17:00:00.000Z');
const triage = budgetRequest(incidentId(1), 'triage', 1);
const ID = '3f2a9c4e-1b7d-4e8a-9c0f-5d6e7a8b9c01', OTHER = '7e1d0c2b-3a4f-4b5c-8d6e-9f0a1b2c3d4e';
const usd = (amount: number) => claudeCost({ type: 'result', subtype: 'success', is_error: false, session_id: 's', total_cost_usd: amount, modelUsage: { 'claude-opus-5-5': { costUSD: amount, costBasis: 'list' } } });
const rows = (paths: RunnerPaths): ReservationRow[] => {
    const db = new DatabaseSync(paths.budgetDb, { readOnly: true });
    try { return db.prepare('SELECT * FROM reservations ORDER BY rowid').all() as unknown as ReservationRow[]; } finally { db.close(); }
};

test('admission takes a caller-chosen ID once, refuses a malformed or taken one, and generates one otherwise', () => {
    const paths = runnerRoot();
    expect(admit(paths, triage, { now, reservationId: ID })).toMatchObject({ admitted: true, reservation: { id: ID } });
    expect(admit(paths, budgetRequest(incidentId(2), 'triage', 1), { now, reservationId: ID })).toEqual({ admitted: false, code: 'reservation-id-taken' });
    for (const bad of ['3F2A9C4E-1B7D-4E8A-9C0F-5D6E7A8B9C01', 'not-a-uuid', '', 7 as never]) {
        expect(admit(paths, budgetRequest(incidentId(3), 'triage', 1), { now, reservationId: bad }), String(bad)).toEqual({ admitted: false, code: 'invalid-reservation-id' });
    }
    const generated = admit(paths, budgetRequest(incidentId(4), 'triage', 1), { now });
    expect(generated.admitted && generated.reservation.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(rows(paths).map(row => row.id)).toEqual([ID, generated.admitted ? generated.reservation.id : '']);
});

test('only an untouched reservation is released; a bound, settled or unknown one keeps its hold', () => {
    const paths = runnerRoot();
    expect(release(paths, ID, { now })).toEqual({ released: false, code: 'unknown-reservation' });
    admit(paths, triage, { now, reservationId: ID });
    expect(release(paths, ID, { now })).toEqual({ released: true });
    expect(rows(paths)).toEqual([]);
    // The same incident, stage and round can be admitted again after a release.
    expect(admit(paths, triage, { now, reservationId: OTHER })).toMatchObject({ admitted: true });
    bindEvidence(paths, OTHER, 'session-1', { now });
    expect(release(paths, OTHER, { now })).toEqual({ released: false, code: 'not-releasable' });
    const second = budgetRequest(incidentId(2), 'triage', 1);
    admit(paths, second, { now, reservationId: ID });
    settle(paths, ID, { evidenceId: null, cost: null }, { now });
    expect(release(paths, ID, { now })).toEqual({ released: false, code: 'not-releasable' });
    expect(rows(paths).map(row => row.status)).toEqual(['outstanding', 'retained']);
});

test('a proven non-dispatch releases its reservation, spends nothing, and leaves the round free', async () => {
    const paths = runnerRoot();
    const outcome = await runBudgeted(paths, triage, async () => { throw new NotDispatched('the sandbox refused before launch'); }, { now, reservationId: ID });
    expect(outcome).toMatchObject({ status: 'not-dispatched', reservation: { id: ID }, error: { message: 'the sandbox refused before launch' } });
    expect(rows(paths)).toEqual([]);
    const again = await runBudgeted(paths, triage, async run => { run.bindSession('s'); return { evidenceId: 's', cost: usd(1) }; }, { now, reservationId: OTHER });
    expect(again).toMatchObject({ status: 'completed', reservation: { id: OTHER } });
});

test('a non-dispatch claim after a session was bound keeps the hold and reports a ledger error', async () => {
    const paths = runnerRoot();
    const outcome = await runBudgeted(paths, triage, async run => { run.bindSession('s'); throw new NotDispatched('claimed late'); }, { now, reservationId: ID });
    expect(outcome).toMatchObject({ status: 'ledger-error', code: 'ledger-failed', message: expect.stringContaining('A session was bound, so the call may have been dispatched') });
    expect(rows(paths)).toMatchObject([{ id: ID, status: 'outstanding', evidence_id: 's' }]);
});

test('late proof of non-dispatch releases the original timeout-only hold and restores the round', async () => {
    const paths = runnerRoot(), available = readStanding(paths, now());
    let refuse!: (error: Error) => void;
    const pending = runBudgeted(paths, triage, () => new Promise((_, reject) => { refuse = reject; }), { now, reservationId: ID });
    await vi.advanceTimersByTimeAsync(triage.inactivityTimeoutMs + 1);
    const result = await pending as Extract<BudgetedOutcome, { status: 'timed-out' }>;
    expect(result.status).toBe('timed-out');
    expect(rows(paths)).toMatchObject([{ id: ID, status: 'retained', charged: 3_000_000 }]);
    expect(release(paths, ID, { now })).toEqual({ released: false, code: 'not-releasable' });
    refuse(new NotDispatched('confirmed pre-spawn refusal'));
    expect(await result.late).toEqual({ ok: true, released: true });
    expect(rows(paths)).toEqual([]);
    expect(readStanding(paths, now())).toEqual(available);
    expect(admit(paths, triage, { now, reservationId: OTHER })).toMatchObject({ admitted: true });
});

test('a trusted failure after launch settles its attributable cost and stays failed; an ordinary one carries none', async () => {
    const paths = runnerRoot();
    const attributed = await runBudgeted(paths, triage, async run => {
        run.bindSession('s1');
        throw new AttributedFailure('the command was rejected', { evidenceId: 's1', cost: usd(4) });
    }, { now, reservationId: ID });
    expect(attributed).toMatchObject({ status: 'failed', error: { message: 'the command was rejected' }, settled: { ok: true, settlement: { result: 'overrun' } } });
    expect(rows(paths)[0]).toMatchObject({ status: 'overrun', charged: 4_000_000, final: 1 });
    // An unreconciled overrun refuses further admissions, so the ordinary case has its own ledger.
    const plain = runnerRoot();
    const ordinary = await runBudgeted(plain, budgetRequest(incidentId(2), 'triage', 1), async run => {
        run.bindSession('s2');
        throw Object.assign(new Error('plain'), { result: { evidenceId: 's2', cost: usd(9) } });
    }, { now, reservationId: OTHER });
    expect(ordinary).toMatchObject({ status: 'failed', settled: { ok: true, settlement: { result: 'retained' } } });
    expect(rows(plain)[0]).toMatchObject({ status: 'retained', charged: 3_000_000 });
});

test('a late attributed failure charges the original reservation once', async () => {
    const paths = runnerRoot();
    let fail!: (error: Error) => void;
    const pending = runBudgeted(paths, triage, run => { run.bindSession('s1'); return new Promise((_, reject) => { fail = reject; }); }, { now, reservationId: ID });
    await vi.advanceTimersByTimeAsync(triage.inactivityTimeoutMs + 1);
    const result = await pending as Extract<BudgetedOutcome, { status: 'timed-out' }>;
    fail(new AttributedFailure('rejected after the deadline', { evidenceId: 's1', cost: usd(2) }));
    expect(await result.late).toMatchObject({ ok: true, settlement: { result: 'settled' } });
    // The receipt is final; the charge never falls below the hold already posted at the deadline.
    expect(rows(paths)).toMatchObject([{ id: ID, status: 'settled', final: 1, receipt_total: 2_000_000, charged: 3_000_000 }]);
});

test('late non-dispatch proof cannot remove session evidence or a manually finalized timeout', async () => {
    for (const guard of ['session', 'finalized'] as const) {
        const paths = runnerRoot();
        let refuse!: (error: Error) => void;
        const pending = runBudgeted(paths, triage, run => {
            if (guard === 'session') run.bindSession('s');
            return new Promise((_, reject) => { refuse = reject; });
        }, { now, reservationId: ID });
        await vi.advanceTimersByTimeAsync(triage.inactivityTimeoutMs + 1);
        const timeout = await pending;
        if (timeout.status !== 'timed-out') throw new Error('expected timeout');
        if (guard === 'finalized')
            expect(reconcile(paths, ID, { expectedMicroUsd: 3_000_000, reason: 'fixture reconciliation', finalize: true }, { now })).toMatchObject({ reconciled: true });
        const before = rows(paths);
        refuse(new NotDispatched('confirmed pre-spawn refusal'));
        expect(await timeout.late).toMatchObject({ ok: false });
        expect(rows(paths)).toEqual(before);
    }
});
