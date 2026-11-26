import { execFile, spawn } from 'node:child_process';
import { linkSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { promisify } from 'node:util';
import { expect, test, vi } from 'vitest';
import { parseCodexRollout } from '../../../server/telemetry/codex-rollout';
import { claudeCost, codexCost } from '../../../server/telemetry/run-cost';
import { admit, admitDeployment, bindEvidence, knownAmount, LedgerError, readStanding, reconcile, settle, type ReservationRow } from '../../../server/overseer/budget-ledger';
import { budgetRequest, type Stage } from '../../../server/overseer/budget-policy';
import { runBudgeted } from '../../../server/overseer/budgeted-run';
import type { RunnerPaths } from '../../../server/overseer/config';
import * as rootChecks from '../../../server/overseer/runner-root';
import { incidentId, runnerRoot, snapshot, tempDir } from './runner-world';

const run = promisify(execFile);
const child = resolve(__dirname, 'ledger-child.mts');
const captured = JSON.parse(readFileSync(resolve(__dirname, 'fixtures/captured-receipts.json'), 'utf8'));

/** Eastern 2026-11-25 12:00, and offsets from it in minutes. EST is UTC-5 in November. */
const at = (minutes = 0) => new Date(Date.parse('2026-11-25T17:00:00.000Z') + minutes * 60_000);
const beforeMidnight = new Date('2026-11-26T04:59:00.000Z'), afterMidnight = new Date('2026-11-26T05:01:00.000Z');
const clock = (time: Date) => ({ now: () => time });
const ask = (stage: Stage, round = 1, incident = incidentId(1)) => budgetRequest(incident, stage, round);
function ceiling(paths: RunnerPaths, micro: number) {
    mkdirSync(paths.control, { recursive: true });
    writeFileSync(paths.budgetConfig, JSON.stringify({ version: 1, dailyCeilingMicroUsd: micro }));
}
function admitted(paths: RunnerPaths, stage: Stage, round = 1, incident = incidentId(1), time = at()) {
    const result = admit(paths, ask(stage, round, incident), clock(time));
    if (!result.admitted) throw new Error(`refused ${result.code}`);
    return result.reservation;
}
const rows = (paths: RunnerPaths): ReservationRow[] => {
    const db = new DatabaseSync(paths.budgetDb, { readOnly: true });
    try { return db.prepare('SELECT * FROM reservations ORDER BY rowid').all() as unknown as ReservationRow[]; } finally { db.close(); }
};
const standing = (paths: RunnerPaths, time = at()) => {
    const read = readStanding(paths, time);
    if ('unreadable' in read) throw new Error(read.unreadable);
    return read.standing;
};
const claude = (extra: Record<string, unknown>) => claudeCost({ type: 'result', subtype: 'success', is_error: false, session_id: 's', ...extra });

test('a reservation that fits the ceiling exactly is admitted, and one micro-USD more is refused', () => {
    const exact = runnerRoot();
    ceiling(exact, 3_000_000);
    expect(admit(exact, ask('triage'), clock(at()))).toMatchObject({ admitted: true, reservation: { reserved: 3_000_000 } });
    expect(admit(exact, ask('triage', 2), clock(at()))).toEqual({ admitted: false, code: 'ceiling' });
    const short = runnerRoot();
    ceiling(short, 2_999_999);
    expect(admit(short, ask('triage'), clock(at()))).toEqual({ admitted: false, code: 'ceiling' });
    expect(rows(short)).toEqual([]);
});

test('24 runs a day are admitted and the 25th is refused', () => {
    const paths = runnerRoot();
    for (let n = 1; n <= 24; n++) admitted(paths, 'triage', 1, incidentId(n));
    expect(admit(paths, ask('triage', 1, incidentId(25)), clock(at()))).toEqual({ admitted: false, code: 'daily-runs' });
    expect(admit(paths, ask('triage', 1, incidentId(25)), clock(at(24 * 60)))).toMatchObject({ admitted: true });
});

test('the request is checked: incident, stage, timeouts, round range and a stage repeated in its round', () => {
    const paths = runnerRoot();
    expect(admit(paths, { ...ask('triage'), incident: 'CEC-1' }, clock(at()))).toEqual({ admitted: false, code: 'invalid-incident' });
    expect(admit(paths, { ...ask('triage'), stage: 'deploy' }, clock(at()))).toEqual({ admitted: false, code: 'unknown-stage' });
    expect(admit(paths, { ...ask('triage'), totalTimeoutMs: Infinity }, clock(at()))).toEqual({ admitted: false, code: 'invalid-timeouts' });
    expect(admit(paths, { ...ask('triage'), inactivityTimeoutMs: undefined as never }, clock(at()))).toEqual({ admitted: false, code: 'invalid-timeouts' });
    for (const [stage, round] of [['triage', 3], ['second-opinion', 2], ['fix', 0], ['review', 3], ['repair', 1.5]] as const)
        expect(admit(paths, ask(stage, round), clock(at())), `${stage} ${round}`).toEqual({ admitted: false, code: 'round-out-of-range' });
    admitted(paths, 'research');
    admitted(paths, 'triage');
    expect(admit(paths, ask('triage'), clock(at()))).toEqual({ admitted: false, code: 'stage-repeated' });
    admitted(paths, 'triage', 2);
    admitted(paths, 'second-opinion');
    expect(admit(paths, ask('second-opinion'), clock(at()))).toEqual({ admitted: false, code: 'stage-repeated' });
    expect(rows(paths).map(row => `${row.stage}:${row.round}`)).toEqual(['research:1', 'triage:1', 'triage:2', 'second-opinion:1']);
});

test('a fix round opened by plan counts once, and a fifth new fix round in a day is refused whichever stage opens it', () => {
    const paths = runnerRoot();
    ceiling(paths, 1_000_000_000);
    admitted(paths, 'plan', 1, incidentId(1));
    admitted(paths, 'plan-review', 1, incidentId(1));
    admitted(paths, 'fix', 1, incidentId(1));
    expect(standing(paths).fixRounds).toEqual({ used: 1, limit: 4 });
    admitted(paths, 'fix', 2, incidentId(1));
    admitted(paths, 'plan', 1, incidentId(2));
    admitted(paths, 'fix', 2, incidentId(2));
    expect(admit(paths, ask('plan', 1, incidentId(3)), clock(at()))).toEqual({ admitted: false, code: 'daily-fix-attempts' });
    expect(admit(paths, ask('fix', 1, incidentId(3)), clock(at()))).toEqual({ admitted: false, code: 'daily-fix-attempts' });
    // Continuing a round already open is not a new attempt.
    admitted(paths, 'fix', 1, incidentId(2));
    expect(standing(paths).fixRounds).toEqual({ used: 4, limit: 4 });
});

test('a fix round opened at 23:59 Eastern keeps its opening day when it continues at 00:01', () => {
    const paths = runnerRoot();
    admitted(paths, 'plan', 1, incidentId(1), beforeMidnight);
    for (const n of [2, 3]) for (const round of [1, 2]) admitted(paths, 'plan', round, incidentId(n), afterMidnight);
    expect(admitted(paths, 'fix', 1, incidentId(1), afterMidnight)).toMatchObject({ reserved: 22_500_000 });
    expect(rows(paths).map(row => row.day)).toEqual(['2026-11-25', '2026-11-26', '2026-11-26', '2026-11-26', '2026-11-26', '2026-11-26']);
    expect(standing(paths, afterMidnight)).toMatchObject({ fixRounds: { used: 4 }, runs: { used: 5 } });
});

test('six distinct deployments a day; a replay keeps its original admission, also the next day', () => {
    const paths = runnerRoot();
    for (let n = 1; n <= 6; n++) expect(admitDeployment(paths, `deploy-${n}`, clock(at()))).toMatchObject({ admitted: true, replay: false });
    expect(admitDeployment(paths, 'deploy-7', clock(at()))).toEqual({ admitted: false, code: 'daily-deployments' });
    expect(admitDeployment(paths, 'deploy-3', clock(at()))).toMatchObject({ admitted: true, replay: true, day: '2026-11-25' });
    expect(admitDeployment(paths, 'deploy-3', clock(at(24 * 60)))).toMatchObject({ admitted: true, replay: true, day: '2026-11-25' });
    expect(admitDeployment(paths, 'deploy-7', clock(at(24 * 60)))).toMatchObject({ admitted: true, replay: false, day: '2026-11-26' });
});

test('two processes reserving at once against room for one: one is admitted, the other refused, one row', async () => {
    const paths = runnerRoot();
    ceiling(paths, 3_000_000);
    expect(readStanding(paths, at())).toMatchObject({ standing: { available: 3_000_000 } });
    admitDeployment(paths, 'create-the-ledger', clock(at()));
    const holder = new DatabaseSync(paths.budgetDb);
    holder.exec('BEGIN IMMEDIATE');
    const start = (n: number) => {
        const proc = spawn(process.execPath, ['--import', 'tsx', child, 'admit', paths.root, JSON.stringify(ask('triage', 1, incidentId(n)))], { stdio: ['ignore', 'pipe', 'inherit'] });
        let out = '';
        const ready = new Promise<void>(done => proc.stdout.on('data', chunk => { out += chunk; if (out.includes('ready\n')) done(); }));
        const result = new Promise<unknown>(done => proc.on('close', () => done(JSON.parse(out.split('\n').filter(Boolean).at(-1)!))));
        return { ready, result };
    };
    const a = start(1), b = start(2);
    await Promise.all([a.ready, b.ready]);
    await new Promise(done => setTimeout(done, 500));
    holder.exec('COMMIT');
    holder.close();
    const results = await Promise.all([a.result, b.result]) as { admitted?: boolean; code?: string }[];
    expect(results.filter(result => result.admitted).length).toBe(1);
    expect(results.filter(result => result.admitted === false).map(result => result.code)).toEqual(['ceiling']);
    expect(rows(paths)).toHaveLength(1);
}, 60_000);

test('admission holds the write lock from BEGIN on: another writer is refused before the first read', () => {
    const paths = runnerRoot();
    admitDeployment(paths, 'create-the-ledger', clock(at()));
    let probed = false;
    admit(paths, ask('triage'), { now: () => at(), hooks: { afterBegin: () => {
        const other = new DatabaseSync(paths.budgetDb);
        try {
            other.exec('PRAGMA busy_timeout=0');
            expect(() => other.exec('BEGIN IMMEDIATE')).toThrow(/locked|busy/i);
            probed = true;
        } finally { other.close(); }
    } } });
    expect(probed).toBe(true);
});

test('a writer lock held past the busy timeout grants nothing', () => {
    const paths = runnerRoot();
    admitDeployment(paths, 'create-the-ledger', clock(at()));
    const holder = new DatabaseSync(paths.budgetDb);
    holder.exec('BEGIN IMMEDIATE');
    try {
        expect(() => admit(paths, ask('triage'), { now: () => at(), busyTimeoutMs: 200 })).toThrow(LedgerError);
        try { admit(paths, ask('triage'), { now: () => at(), busyTimeoutMs: 200 }); } catch (error) { expect((error as LedgerError).code).toBe('ledger-busy'); }
    } finally { holder.exec('ROLLBACK'); holder.close(); }
    expect(rows(paths)).toEqual([]);
});

test('a failed SQLite COMMIT rolls back admission before any invocation', async () => {
    const paths = runnerRoot();
    admitDeployment(paths, 'create-the-ledger', clock(at()));
    const reader = new DatabaseSync(paths.budgetDb, { readOnly: true });
    const invoke = vi.fn(async () => null);
    try {
        const result = await runBudgeted(paths, ask('triage'), invoke, {
            ...clock(at()), busyTimeoutMs: 0,
            hooks: { beforeCommit: () => {
                // A shared read lock in DELETE mode allows the insert but prevents COMMIT.
                reader.exec('BEGIN');
                expect(reader.prepare('SELECT COUNT(*) AS n FROM reservations').get()).toEqual({ n: 0 });
            } },
        });
        expect(result).toEqual({ status: 'ledger-error', code: 'ledger-busy', message: expect.stringMatching(/rolled back:.*locked/i) });
        expect(invoke).not.toHaveBeenCalled();
    } finally { reader.close(); }
    expect(rows(paths)).toEqual([]);
});

test('the clock is read once the write lock is held: a request that waits past midnight is admitted on the new day', () => {
    const paths = runnerRoot();
    let locked = false;
    const result = admit(paths, ask('fix'), { now: () => locked ? new Date('2026-11-26T05:00:30.000Z') : new Date('2026-11-26T04:59:59.000Z'), hooks: { afterBegin: () => { locked = true; } } });
    expect(result).toMatchObject({ admitted: true, reservation: { deadline: new Date(Date.parse('2026-11-26T05:00:30.000Z') + 3_600_000 + 60_000).toISOString() } });
    expect(rows(paths)[0]).toMatchObject({ day: '2026-11-26', admitted_at: '2026-11-26T05:00:30.000Z' });
});

test('captured Claude and Codex receipts settle at their run-cost totals', () => {
    expect(claudeCost(captured.claude.result)).toEqual(captured.claude.expected);
    const rollout = codexCost(parseCodexRollout(captured.codex.rollout, captured.codex.threadId));
    expect(rollout).toEqual(captured.codex.expected);
    expect([captured.claude.expected.microUsd, rollout.microUsd]).toEqual([1_532_697, 714_156]);
    const paths = runnerRoot();
    const a = admitted(paths, 'fix', 1, incidentId(1)), b = admitted(paths, 'review', 1, incidentId(1));
    bindEvidence(paths, a.id, captured.claude.result.session_id, clock(at()));
    bindEvidence(paths, b.id, captured.codex.threadId, clock(at()));
    expect(settle(paths, a.id, { evidenceId: captured.claude.result.session_id, cost: claudeCost(captured.claude.result) }, clock(at(5))).row).toMatchObject({ status: 'settled', final: 1, charged: 1_532_697, receipt_total: 1_532_697 });
    expect(settle(paths, b.id, { evidenceId: captured.codex.threadId, cost: rollout }, clock(at(5))).row).toMatchObject({ status: 'settled', final: 1, charged: 714_156 });
    expect(standing(paths)).toMatchObject({ finalized: 2_246_853, unresolved: 0, available: 100_000_000 - 2_246_853 });
});

test('incomplete evidence charges the largest amount it supports, and a charge above the reservation blocks admission', () => {
    const partial = claude({ total_cost_usd: 25, modelUsage: { 'claude-opus-5-5': { costUSD: 20, costBasis: 'list' }, 'claude-new': { costUSD: 5, costBasis: 'unknown' } } });
    expect(partial).toMatchObject({ completeness: 'partial', partialMicroUsd: 20_000_000, reportedTotalUsd: 25 });
    const componentsOnly = claude({ modelUsage: { 'claude-opus-5-5': { costUSD: 25, costBasis: 'list' } } });
    expect(componentsOnly).toMatchObject({ completeness: 'unpriced', partialMicroUsd: null, reportedTotalUsd: null });
    for (const cost of [partial, componentsOnly]) {
        expect(knownAmount(cost)).toBe(25_000_000);
        const paths = runnerRoot(), fix = admitted(paths, 'fix');
        bindEvidence(paths, fix.id, 's', clock(at()));
        expect(settle(paths, fix.id, { evidenceId: 's', cost }, clock(at(5))).row).toMatchObject({ status: 'overrun', final: 0, charged: 25_000_000 });
        expect(admit(paths, ask('triage', 1, incidentId(2)), clock(at(6)))).toEqual({ admitted: false, code: 'overrun-unreconciled' });
        expect(standing(paths, at(6))).toMatchObject({ available: 0, overruns: [{ id: fix.id, reserved: 22_500_000, charged: 25_000_000, acknowledged: null }] });
    }
});

test('a valid complete zero posts zero; a crash zero, an unpriced Codex run and a coverage gap keep the reservation', () => {
    const paths = runnerRoot(), zero = admitted(paths, 'triage', 1, incidentId(1));
    bindEvidence(paths, zero.id, 's', clock(at()));
    const complete = claude({ total_cost_usd: 0, modelUsage: { 'claude-opus-5-5': { costUSD: 0, costBasis: 'list' } } });
    expect(complete).toMatchObject({ completeness: 'complete', microUsd: 0 });
    expect(settle(paths, zero.id, { evidenceId: 's', cost: complete }, clock(at(1))).row).toMatchObject({ status: 'settled', final: 1, charged: 0 });
    const crash = claude({ subtype: 'error_during_execution', is_error: true, total_cost_usd: 0, modelUsage: {} });
    const gap = codexCost(parseCodexRollout(captured.codex.rollout.split('\n').filter((line: string) => !line.includes('task_complete')).join('\n'), captured.codex.threadId));
    expect(gap.completeness).not.toBe('complete');
    for (const [n, cost] of [[2, crash], [3, codexCost(null)], [4, gap]] as const) {
        const held = admitted(paths, 'triage', 1, incidentId(n));
        bindEvidence(paths, held.id, 's', clock(at()));
        expect(settle(paths, held.id, { evidenceId: 's', cost }, clock(at(1))).row, String(n)).toMatchObject({ status: 'retained', final: 0, charged: 3_000_000 });
    }
});

test('a charge only rises: late evidence raises a retained or abandoned reservation, and a repeat changes nothing', () => {
    const paths = runnerRoot(), retained = admitted(paths, 'fix', 1, incidentId(1));
    bindEvidence(paths, retained.id, 's', clock(at()));
    expect(settle(paths, retained.id, { evidenceId: 's', cost: null }, clock(at(1))).row).toMatchObject({ status: 'retained', charged: 22_500_000 });
    expect(settle(paths, retained.id, { evidenceId: 's', cost: claude({ total_cost_usd: 1 }) }, clock(at(2))).row).toMatchObject({ status: 'retained', charged: 22_500_000 });
    expect(settle(paths, retained.id, { evidenceId: 's', cost: claude({ total_cost_usd: 25 }) }, clock(at(3))).row).toMatchObject({ status: 'overrun', final: 0, charged: 25_000_000 });
    expect(settle(paths, retained.id, { evidenceId: 's', cost: null }, clock(at(4))).row).toMatchObject({ status: 'overrun', charged: 25_000_000 });
    const other = runnerRoot(), abandoned = admitted(other, 'review', 1, incidentId(2));
    // Past its 20-minute total and the minute of grace, the next write abandons it at its full reservation.
    expect(admit(other, ask('triage', 1, incidentId(3)), clock(at(21)))).toMatchObject({ admitted: true });
    expect(rows(other)[0]).toMatchObject({ status: 'abandoned', charged: 4_500_000, final: 0 });
    bindEvidence(other, abandoned.id, 't', clock(at(31)));
    const thirty = claude({ total_cost_usd: 30, modelUsage: { 'claude-opus-5-5': { costUSD: 30, costBasis: 'list' } } });
    expect(settle(other, abandoned.id, { evidenceId: 't', cost: thirty }, clock(at(32))).row).toMatchObject({ status: 'overrun', final: 1, charged: 30_000_000, receipt_total: 30_000_000 });
    expect(settle(other, abandoned.id, { evidenceId: 't', cost: thirty }, clock(at(33)))).toMatchObject({ result: 'duplicate', row: { charged: 30_000_000 } });
    expect(settle(other, abandoned.id, { evidenceId: 't', cost: null }, clock(at(34)))).toMatchObject({ result: 'stale', row: { charged: 30_000_000, final: 1 } });
    expect(() => settle(other, '00000000-0000-4000-8000-000000000000', { evidenceId: null, cost: null }, clock(at(35)))).toThrow('No reservation');
});

test('an acknowledged overrun raised again must be acknowledged again, and a stale acknowledgement is refused', () => {
    const paths = runnerRoot(), fix = admitted(paths, 'fix');
    bindEvidence(paths, fix.id, 's', clock(at()));
    const total = (usd: number) => claude({ total_cost_usd: usd, modelUsage: { 'claude-opus-5-5': { costUSD: usd, costBasis: 'list' } } });
    settle(paths, fix.id, { evidenceId: 's', cost: total(25) }, clock(at(1)));
    expect(reconcile(paths, fix.id, { expectedMicroUsd: 24_000_000, reason: 'looked' }, clock(at(2)))).toMatchObject({ reconciled: false, code: 'stale-amount' });
    expect(reconcile(paths, fix.id, { expectedMicroUsd: 25_000_000, reason: 'looked at it' }, clock(at(2)))).toMatchObject({ reconciled: true, replay: false, row: { ack_micro_usd: 25_000_000 } });
    expect(reconcile(paths, fix.id, { expectedMicroUsd: 25_000_000, reason: 'again' }, clock(at(3)))).toMatchObject({ reconciled: true, replay: true });
    expect(admit(paths, ask('triage', 1, incidentId(2)), clock(at(4)))).toMatchObject({ admitted: true });
    settle(paths, fix.id, { evidenceId: 's', cost: total(30) }, clock(at(5)));
    expect(admit(paths, ask('triage', 2, incidentId(2)), clock(at(6)))).toEqual({ admitted: false, code: 'overrun-unreconciled' });
    expect(reconcile(paths, fix.id, { expectedMicroUsd: 25_000_000, reason: 'old look' }, clock(at(7)))).toMatchObject({ reconciled: false, code: 'stale-amount' });
    expect(reconcile(paths, fix.id, { expectedMicroUsd: 30_000_000, reason: 'looked again' }, clock(at(7)))).toMatchObject({ reconciled: true });
    expect(admit(paths, ask('triage', 2, incidentId(2)), clock(at(8)))).toMatchObject({ admitted: true });
});

test('a hold carries across Eastern midnight: partial, missing and expired reservations leave nothing the next day', () => {
    for (const ending of ['partial', 'missing', 'expired'] as const) {
        const paths = runnerRoot();
        ceiling(paths, 22_500_000);
        const fix = admitted(paths, 'fix', 1, incidentId(1), beforeMidnight);
        bindEvidence(paths, fix.id, 's', clock(beforeMidnight));
        if (ending === 'partial') settle(paths, fix.id, { evidenceId: 's', cost: claude({ total_cost_usd: 1, modelUsage: { m: { costUSD: 1 } } }) }, clock(beforeMidnight));
        if (ending === 'missing') settle(paths, fix.id, { evidenceId: 's', cost: null }, clock(beforeMidnight));
        const nextDay = ending === 'expired' ? new Date(beforeMidnight.getTime() + 62 * 60_000) : afterMidnight;
        expect(standing(paths, beforeMidnight), ending).toMatchObject({ day: '2026-11-25', finalized: 0, unresolved: 22_500_000, available: 0 });
        expect(standing(paths, nextDay), ending).toMatchObject({ day: '2026-11-26', finalized: 0, unresolved: 22_500_000, available: 0 });
        expect(admit(paths, ask('triage', 1, incidentId(2)), clock(nextDay)), ending).toEqual({ admitted: false, code: 'ceiling' });
        expect(rows(paths)[0], ending).toMatchObject({ day: '2026-11-25', status: ending === 'expired' ? 'abandoned' : 'retained', charged: 22_500_000 });
    }
});

test('a process that dies after its admission leaves the hold; wrong-session evidence keeps it and matched evidence releases it', async () => {
    const paths = runnerRoot();
    ceiling(paths, 22_500_000);
    await run(process.execPath, ['--import', 'tsx', child, 'admit-and-die', paths.root, JSON.stringify(ask('fix'))], { timeout: 60_000 }).catch(error => error);
    const [row] = rows(paths);
    expect(row).toMatchObject({ status: 'outstanding', reserved: 22_500_000 });
    // The child used the real clock; every later time is taken from its admission.
    const admitted0 = new Date(row.admitted_at), later = (minutes: number) => new Date(admitted0.getTime() + minutes * 60_000);
    expect(admit(paths, ask('triage', 1, incidentId(2)), clock(later(1)))).toEqual({ admitted: false, code: 'ceiling' });
    bindEvidence(paths, row.id, 'session-a', clock(later(1)));
    const small = claude({ total_cost_usd: 1, modelUsage: { 'claude-opus-5-5': { costUSD: 1, costBasis: 'list' } } });
    expect(settle(paths, row.id, { evidenceId: 'session-b', cost: small }, clock(later(2))).row).toMatchObject({ status: 'retained', final: 0, charged: 22_500_000 });
    expect(admit(paths, ask('triage', 1, incidentId(2)), clock(later(24 * 60)))).toEqual({ admitted: false, code: 'ceiling' });
    expect(settle(paths, row.id, { evidenceId: 'session-a', cost: small }, clock(later(24 * 60))).row).toMatchObject({ status: 'settled', final: 1, charged: 22_500_000, receipt_total: 1_000_000, day: row.day });
    expect(standing(paths, later(24 * 60))).toMatchObject({ finalized: 0, unresolved: 0, available: 22_500_000 });
    expect(standing(paths, later(3))).toMatchObject({ finalized: 22_500_000, unresolved: 0, available: 0 });
});

test('an unacknowledged overrun leaves nothing available whatever the ceiling; acknowledging an incomplete one keeps its hold', () => {
    const paths = runnerRoot();
    ceiling(paths, 1_000_000_000);
    const fix = admitted(paths, 'fix');
    bindEvidence(paths, fix.id, 's', clock(at()));
    settle(paths, fix.id, { evidenceId: 's', cost: claude({ total_cost_usd: 25, modelUsage: { m: { costUSD: 25 } } }) }, clock(at(1)));
    expect(standing(paths, at(1))).toMatchObject({ available: 0, unresolved: 25_000_000 });
    reconcile(paths, fix.id, { expectedMicroUsd: 25_000_000, reason: 'seen' }, clock(at(2)));
    expect(standing(paths, at(2))).toMatchObject({ available: 1_000_000_000 - 25_000_000, unresolved: 25_000_000, overruns: [] });
    const otherSession = claude({ session_id: 'x', total_cost_usd: 30, modelUsage: { m: { costUSD: 30, costBasis: 'list' } } });
    expect(settle(paths, fix.id, { evidenceId: 'x', cost: otherSession }, clock(at(3))).row).toMatchObject({
        status: 'overrun', final: 0, charged: 25_000_000, ack_micro_usd: 25_000_000,
    });
    expect(admit(paths, ask('triage'), clock(at(4)))).toMatchObject({ admitted: true });
});

test('a reservation finalized by a person stays finalized with its reason, and an outstanding one cannot be', () => {
    const paths = runnerRoot(), held = admitted(paths, 'fix'), running = admitted(paths, 'review');
    settle(paths, held.id, { evidenceId: null, cost: null }, clock(at(1)));
    expect(reconcile(paths, running.id, { expectedMicroUsd: 4_500_000, reason: 'x', finalize: true }, clock(at(2)))).toMatchObject({ reconciled: false, code: 'outstanding' });
    expect(reconcile(paths, held.id, { expectedMicroUsd: 22_500_000, reason: 'no overrun to acknowledge' }, clock(at(2)))).toMatchObject({ reconciled: false, code: 'not-overrun' });
    expect(reconcile(paths, held.id, { expectedMicroUsd: 22_500_000, reason: 'process gone (ps), charge left at the reservation', finalize: true }, clock(at(2)))).toMatchObject({ reconciled: true, row: { final: 1 } });
    expect(rows(paths)[0]).toMatchObject({ final: 1, charged: 22_500_000, finalized_reason: 'process gone (ps), charge left at the reservation', finalized_at: at(2).toISOString() });
    expect(standing(paths, at(24 * 60))).toMatchObject({ unresolved: 4_500_000 });
    expect(reconcile(paths, '00000000-0000-4000-8000-000000000000', { expectedMicroUsd: 0, reason: 'x' }, clock(at(3)))).toMatchObject({ reconciled: false, code: 'unknown-reservation' });
});

test('a higher matching partial receipt reopens a manually finalized hold and blocks admission', () => {
    const paths = runnerRoot(), fix = admitted(paths, 'fix');
    bindEvidence(paths, fix.id, 's', clock(at()));
    settle(paths, fix.id, { evidenceId: 's', cost: null }, clock(at(1)));
    expect(reconcile(paths, fix.id, { expectedMicroUsd: 22_500_000, reason: 'invocation ended, kept the reservation', finalize: true }, clock(at(2)))).toMatchObject({ reconciled: true, row: { final: 1 } });
    const partial = claude({ total_cost_usd: 30, modelUsage: { known: { costUSD: 25, costBasis: 'list' }, unknown: { costUSD: 5, costBasis: 'unknown' } } });
    expect(partial.completeness).toBe('partial');
    expect(settle(paths, fix.id, { evidenceId: 'x', cost: partial }, clock(at(3)))).toMatchObject({ result: 'stale', row: { charged: 22_500_000, final: 1 } });
    expect(settle(paths, fix.id, { evidenceId: 's', cost: partial }, clock(at(4))).result).toBe('overrun');
    expect(rows(paths)[0]).toMatchObject({ charged: 30_000_000, status: 'overrun', final: 0 });
    expect(admit(paths, ask('triage'), clock(at(5)))).toEqual({ admitted: false, code: 'overrun-unreconciled' });
    expect(standing(paths, at(5))).toMatchObject({ finalized: 0, unresolved: 30_000_000, available: 0 });
});

test('a reopened hold still applies the reservation floor', () => {
    const paths = runnerRoot(), fix = admitted(paths, 'fix');
    bindEvidence(paths, fix.id, 's', clock(at()));
    const complete = claude({ total_cost_usd: 1, modelUsage: { m: { costUSD: 1, costBasis: 'list' } } });
    expect(settle(paths, fix.id, { evidenceId: 's', cost: complete }, clock(at(1))).row).toMatchObject({ final: 1, charged: 1_000_000 });
    const partial = claude({ total_cost_usd: 2 });
    expect(settle(paths, fix.id, { evidenceId: 's', cost: partial }, clock(at(2))).row).toMatchObject({ final: 0, charged: 22_500_000, status: 'retained' });
});

test('manual finalization replays at its reviewed charge while a higher complete receipt requires acknowledgement', () => {
    const paths = runnerRoot(), fix = admitted(paths, 'fix');
    bindEvidence(paths, fix.id, 's', clock(at()));
    settle(paths, fix.id, { evidenceId: 's', cost: null }, clock(at(1)));
    const finalize = { expectedMicroUsd: 22_500_000, reason: 'invocation ended, kept the reservation', finalize: true };
    expect(reconcile(paths, fix.id, finalize, clock(at(2)))).toMatchObject({ reconciled: true, replay: false });
    expect(reconcile(paths, fix.id, finalize, clock(at(3)))).toMatchObject({ reconciled: true, replay: true, row: { finalized_at: at(2).toISOString() } });
    const complete = claude({ total_cost_usd: 30, modelUsage: { m: { costUSD: 30, costBasis: 'list' } } });
    expect(settle(paths, fix.id, { evidenceId: 's', cost: complete }, clock(at(4))).row).toMatchObject({ charged: 30_000_000, final: 1, status: 'overrun' });
    const reviewed = { expectedMicroUsd: 30_000_000, reason: 'reviewed the matching complete receipt' };
    expect(reconcile(paths, fix.id, { ...reviewed, finalize: true }, clock(at(5)))).toMatchObject({ reconciled: false, code: 'already-final' });
    expect(admit(paths, ask('triage'), clock(at(6)))).toEqual({ admitted: false, code: 'overrun-unreconciled' });
    expect(reconcile(paths, fix.id, reviewed, clock(at(7)))).toMatchObject({ reconciled: true, replay: false, row: { ack_micro_usd: 30_000_000 } });
    expect(admit(paths, ask('triage'), clock(at(8)))).toMatchObject({ admitted: true });
});

test('the ledger, its sidecars and the ceiling file must be regular single-link files; an unreadable ceiling refuses admission', () => {
    for (const name of ['budget.sqlite', 'budget.sqlite-journal']) {
        for (const kind of ['symlink', 'hardlink'] as const) {
            const paths = runnerRoot(), target = join(tempDir(), 'elsewhere');
            mkdirSync(paths.state, { recursive: true });
            if (name.endsWith('-journal')) { admitDeployment(paths, 'create', clock(at())); }
            writeFileSync(target, 'target bytes');
            if (kind === 'symlink') symlinkSync(target, join(paths.state, name)); else linkSync(target, join(paths.state, name));
            const before = readFileSync(target);
            expect(() => admit(paths, ask('triage'), clock(at())), `${name} ${kind}`).toThrow(/single link/);
            expect(readFileSync(target), `${name} ${kind}`).toEqual(before);
        }
    }
    const paths = runnerRoot();
    mkdirSync(paths.control, { recursive: true });
    writeFileSync(paths.budgetConfig, '{"version":1}');
    expect(admit(paths, ask('triage'), clock(at()))).toEqual({ admitted: false, code: 'ceiling-unreadable' });
    expect(standing(paths)).toMatchObject({ ceiling: null, ceilingUnreadable: true, available: 0 });
    expect(snapshot(paths.root)).not.toHaveProperty('/state/budget.sqlite-journal');
});

test('a ceiling file that is a link refuses admission, and a component of unknown basis supports no amount', () => {
    const linked = runnerRoot(), target = join(tempDir(), 'budget.json');
    mkdirSync(linked.control, { recursive: true });
    writeFileSync(target, JSON.stringify({ version: 1, dailyCeilingMicroUsd: 1_000_000_000 }));
    symlinkSync(target, linked.budgetConfig);
    expect(admit(linked, ask('triage'), clock(at()))).toEqual({ admitted: false, code: 'ceiling-unreadable' });
    const unknownBasis = claude({ modelUsage: { 'claude-opus-5-5': { costUSD: 1, costBasis: 'list' }, 'claude-new': { costUSD: 30, costBasis: 'unknown' } } });
    expect(knownAmount(unknownBasis)).toBe(1_000_000);
    const paths = runnerRoot(), fix = admitted(paths, 'fix');
    bindEvidence(paths, fix.id, 's', clock(at()));
    expect(settle(paths, fix.id, { evidenceId: 's', cost: unknownBasis }, clock(at(1))).row).toMatchObject({ status: 'retained', charged: 22_500_000 });
});

test('a ledger reached through a linked state folder, or a sidecar without its database, is refused; status reports either as unreadable', () => {
    const paths = runnerRoot(), elsewhere = tempDir();
    mkdirSync(paths.root, { recursive: true });
    writeFileSync(join(elsewhere, 'budget.sqlite'), 'not ours');
    symlinkSync(elsewhere, paths.state);
    expect(() => admit(paths, ask('triage'), clock(at()))).toThrow('resolves elsewhere');
    expect(readStanding(paths, at())).toEqual({ unreadable: expect.stringContaining('resolves elsewhere') });
    expect(readFileSync(join(elsewhere, 'budget.sqlite'), 'utf8')).toBe('not ours');
    const orphan = runnerRoot();
    mkdirSync(orphan.state, { recursive: true });
    writeFileSync(`${orphan.budgetDb}-journal`, 'left over');
    expect(() => admit(orphan, ask('triage'), clock(at()))).toThrow('the database is damaged');
    expect(readStanding(orphan, at())).toEqual({ unreadable: expect.stringContaining('the database is damaged') });
    const linkedLedger = runnerRoot(), target = join(tempDir(), 'ledger.sqlite');
    mkdirSync(linkedLedger.state, { recursive: true });
    writeFileSync(target, '');
    symlinkSync(target, linkedLedger.budgetDb);
    expect(readStanding(linkedLedger, at())).toEqual({ unreadable: expect.stringContaining('single link') });
});

test('both ledger openers close the connection if the database is missing at the post-open check', () => {
    const paths = runnerRoot();
    admitDeployment(paths, 'create-the-ledger', clock(at()));
    const check = vi.spyOn(rootChecks, 'checkDatabaseFiles');
    const close = vi.spyOn(DatabaseSync.prototype, 'close');
    const disappears = () => check.mockReturnValueOnce({ exists: true, sidecars: [] }).mockReturnValueOnce({ exists: false, sidecars: [] });
    try {
        disappears();
        expect(readStanding(paths, at())).toEqual({ unreadable: expect.stringContaining('missing after opening') });
        expect(close).toHaveBeenCalledTimes(1);
        disappears();
        expect(() => admit(paths, ask('triage'), clock(at()))).toThrow('missing after opening');
        expect(close).toHaveBeenCalledTimes(2);
    } finally {
        check.mockRestore();
        close.mockRestore();
    }
    expect(rows(paths)).toEqual([]);
});

test('a reservation binds one session: the same one again is accepted, another is refused', () => {
    const paths = runnerRoot(), fix = admitted(paths, 'fix');
    bindEvidence(paths, fix.id, 'session-a', clock(at()));
    bindEvidence(paths, fix.id, 'session-a', clock(at()));
    expect(() => bindEvidence(paths, fix.id, 'session-b', clock(at()))).toThrow('already bound to another session');
    expect(rows(paths)[0].evidence_id).toBe('session-a');
    expect(() => bindEvidence(paths, '00000000-0000-4000-8000-000000000000', 'session-a', clock(at()))).toThrow('No reservation');
});

test.each(['', ' \t'])('blank session identity %j cannot bind or release a hold', blank => {
    const paths = runnerRoot(), fix = admitted(paths, 'fix');
    expect(() => bindEvidence(paths, fix.id, blank, clock(at()))).toThrow('must be nonblank');
    expect(rows(paths)[0].evidence_id).toBeNull();
    // Earlier versions could persist a blank binding.
    const db = new DatabaseSync(paths.budgetDb);
    try { db.prepare('UPDATE reservations SET evidence_id=? WHERE id=?').run(blank, fix.id); } finally { db.close(); }
    const zero = claude({ total_cost_usd: 0, modelUsage: { m: { costUSD: 0, costBasis: 'list' } } });
    expect(zero).toMatchObject({ completeness: 'complete', microUsd: 0 });
    expect(settle(paths, fix.id, { evidenceId: blank, cost: zero }, clock(at(1))).row).toMatchObject({ status: 'retained', charged: 22_500_000, final: 0 });
    bindEvidence(paths, fix.id, 's', clock(at(2)));
    expect(rows(paths)[0].evidence_id).toBe('s');
});
