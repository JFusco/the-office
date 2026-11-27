import { closeSync, constants, openSync, readSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import type { RunCost } from '../../src/contracts/telemetry';
import { easternDay } from '../office/clock';
import { readBoundedNoFollowSync } from '../store/owned-artifact';
import { toMicroUsd } from '../telemetry/run-cost';
import { ABANDON_GRACE_MS, DAILY_LIMITS, DEFAULT_CEILING_MICRO_USD, parseCeiling, reservationFor, ROUND_LIMITS, stagePolicy, timeoutsValid, type AdmissionRequest } from './budget-policy';
import type { RunnerPaths } from './config';
import { checkDatabaseFiles, checkOwnedFile, ensurePrivateDirectory } from './runner-root';

/**
 * The runner's budget ledger: every model reservation and deployment admission, in its own SQLite
 * file (`state/budget.sqlite`, `node:sqlite` only, no Store). Every write is one short
 * `BEGIN IMMEDIATE` transaction on a connection opened for it, so two processes are serialized
 * and a caller that closed its handle can still settle late. No model runs inside a transaction.
 *
 * Money is integer micro-USD, an estimate at list price. A reservation holds its amount until a
 * matching terminal receipt settles it; a missing or incomplete one keeps at least the
 * reservation, across restarts and Eastern days. An overrun blocks every admission until a person
 * acknowledges it at the amount shown.
 */

export type ReservationStatus = 'outstanding' | 'retained' | 'abandoned' | 'settled' | 'overrun';
export interface ReservationRow {
    id: string; day: string; incident: string; stage: string; counter: string; round: number;
    reserved: number; admitted_at: string; deadline: string; total_ms: number; inactivity_ms: number;
    status: ReservationStatus; final: number; charged: number | null; evidence_id: string | null;
    receipt_total: number | null; receipt: string | null; settled_at: string | null;
    ack_micro_usd: number | null; ack_reason: string | null; ack_at: string | null;
    finalized_reason: string | null; finalized_at: string | null;
}

export type RefusalCode = 'overrun-unreconciled' | 'invalid-incident' | 'unknown-stage' | 'invalid-timeouts' | 'round-out-of-range' | 'stage-repeated'
    | 'daily-runs' | 'daily-fix-attempts' | 'ceiling-unreadable' | 'ceiling' | 'invalid-reservation-id' | 'reservation-id-taken';
export interface Reservation { id: string; reserved: number; deadline: string; totalTimeoutMs: number; inactivityTimeoutMs: number }
export type Admission = { admitted: true; reservation: Reservation } | { admitted: false; code: RefusalCode };

/** The ledger could not be written: nothing was granted or changed. */
export class LedgerError extends Error {
    constructor(public code: 'ledger-busy' | 'ledger-failed', message: string) { super(message); }
}

export interface LedgerOptions {
    now?: () => Date;
    busyTimeoutMs?: number;
    /** Test seams around the transaction; never set in production. */
    hooks?: { afterBegin?: () => void; beforeCommit?: () => void };
    /** For reconciliation: refuse to create a ledger that does not exist. */
    mustExist?: boolean;
    /**
     * For admission only: the reservation's ID, chosen by the caller so it can prepare the run's folders
     * under it first. A lowercase UUID not yet in the ledger; otherwise the ledger generates one.
     */
    reservationId?: string;
}

const RESERVATION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY, day TEXT NOT NULL, incident TEXT NOT NULL, stage TEXT NOT NULL, counter TEXT NOT NULL, round INTEGER NOT NULL,
    reserved INTEGER NOT NULL CHECK (reserved > 0), admitted_at TEXT NOT NULL, deadline TEXT NOT NULL, total_ms INTEGER NOT NULL, inactivity_ms INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('outstanding','retained','abandoned','settled','overrun')),
    final INTEGER NOT NULL DEFAULT 0 CHECK (final IN (0,1)), charged INTEGER CHECK (charged IS NULL OR charged >= 0),
    evidence_id TEXT, receipt_total INTEGER, receipt TEXT, settled_at TEXT,
    ack_micro_usd INTEGER, ack_reason TEXT, ack_at TEXT, finalized_reason TEXT, finalized_at TEXT,
    UNIQUE (incident, counter, round, stage)
);
CREATE TABLE IF NOT EXISTS deployments (id TEXT PRIMARY KEY, day TEXT NOT NULL, at TEXT NOT NULL);
`;

const errcode = (error: unknown) => (error as { errcode?: number })?.errcode;
const BUSY = 5;

function openWriter(paths: RunnerPaths, options: LedgerOptions): DatabaseSync {
    const { exists } = checkDatabaseFiles(paths, paths.budgetDb);
    if (!exists && options.mustExist) throw new Error(`There is no budget ledger at ${paths.budgetDb}`);
    ensurePrivateDirectory(paths.state);
    const db = new DatabaseSync(paths.budgetDb);
    try {
        if (!checkDatabaseFiles(paths, paths.budgetDb).exists) throw new Error(`${paths.budgetDb} is missing after opening`);
        db.exec(`PRAGMA busy_timeout=${options.busyTimeoutMs ?? 5000}; PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL;`);
        db.exec(SCHEMA);
    } catch (error) {
        db.close();
        if (errcode(error) === BUSY) throw new LedgerError('ledger-busy', `The budget ledger is locked: ${(error as Error).message}`);
        throw error;
    }
    return db;
}

/**
 * Runs one write transaction. The clock is read once the write lock is held, so the whole decision
 * uses one instant. The work's result is committed, refusals included; an error rolls everything
 * back and reports a ledger error, granting nothing.
 */
function write<T>(paths: RunnerPaths, options: LedgerOptions, work: (db: DatabaseSync, now: Date) => T): T {
    const db = openWriter(paths, options);
    try {
        try { db.exec('BEGIN IMMEDIATE'); }
        catch (error) {
            if (errcode(error) === BUSY) throw new LedgerError('ledger-busy', `The budget ledger is locked: ${(error as Error).message}`);
            throw new LedgerError('ledger-failed', `The budget ledger could not begin a write: ${(error as Error).message}`);
        }
        try {
            options.hooks?.afterBegin?.();
            const result = work(db, (options.now ?? (() => new Date()))());
            options.hooks?.beforeCommit?.();
            db.exec('COMMIT');
            return result;
        } catch (error) {
            if (db.isTransaction) db.exec('ROLLBACK');
            if (error instanceof LedgerError || error instanceof UnknownReservation) throw error;
            throw new LedgerError(errcode(error) === BUSY ? 'ledger-busy' : 'ledger-failed', `The budget ledger write failed and was rolled back: ${(error as Error).message}`);
        }
    } finally { db.close(); }
}

/** A settlement or reconciliation named a reservation the ledger does not hold. */
export class UnknownReservation extends Error {}

/** The daily ceiling: the default when `control/budget.json` is confirmed absent, null when it cannot be trusted. */
export function readCeiling(paths: RunnerPaths): number | null {
    try { if (!checkOwnedFile(paths.budgetConfig)) return DEFAULT_CEILING_MICRO_USD; }
    catch { return null; }
    const read = readBoundedNoFollowSync(paths.budgetConfig, 4096);
    return 'reason' in read ? null : parseCeiling(read.text);
}

const get = (db: DatabaseSync, id: string) => db.prepare('SELECT * FROM reservations WHERE id=?').get(id) as unknown as ReservationRow | undefined;
const count = (db: DatabaseSync, sql: string, ...args: (string | number)[]) => Number((db.prepare(sql).get(...args) as { n: number }).n);

const UNRECONCILED = "status='overrun' AND (ack_micro_usd IS NULL OR ack_micro_usd != charged)";
const HELD_AMOUNT = 'MAX(reserved, COALESCE(charged,0))';

/** Outstanding reservations past their deadline: charged their full reservation, still held. */
function abandonExpired(db: DatabaseSync, at: string) {
    db.prepare("UPDATE reservations SET status='abandoned', charged=reserved, settled_at=? WHERE status='outstanding' AND deadline<=?").run(at, at);
}

/**
 * The one balance rule. Finalized charges count on the day they were admitted; every unresolved
 * reservation, from any day, counts once at the larger of its reservation and its charge. An
 * unacknowledged overrun leaves nothing available.
 */
function balance(db: DatabaseSync, day: string, ceiling: number) {
    const finalized = count(db, 'SELECT COALESCE(SUM(charged),0) AS n FROM reservations WHERE final=1 AND day=?', day);
    const unresolved = count(db, `SELECT COALESCE(SUM(${HELD_AMOUNT}),0) AS n FROM reservations WHERE final=0`);
    const overruns = db.prepare(`SELECT id, reserved, charged, ack_micro_usd FROM reservations WHERE ${UNRECONCILED} ORDER BY rowid`).all() as unknown as { id: string; reserved: number; charged: number; ack_micro_usd: number | null }[];
    return { finalized, unresolved, available: overruns.length ? 0 : Math.max(0, ceiling - finalized - unresolved), overruns };
}

/** Fix rounds opened on a day: the first row of each (incident, round) carries the round's opening day. */
const FIX_ROUNDS_OPENED = "SELECT COUNT(*) AS n FROM reservations r WHERE counter='fix' AND day=? AND NOT EXISTS (SELECT 1 FROM reservations e WHERE e.incident=r.incident AND e.counter='fix' AND e.round=r.round AND e.rowid<r.rowid)";

/**
 * Admits one model invocation, or refuses it with a code. The checks run in order: an
 * unacknowledged overrun on any day, the request's incident, stage, timeouts and round, a stage
 * already run in that round, the day's 24 runs, the day's four newly opened fix rounds, the
 * ceiling file, and the money. A refusal spends nothing; expiry bookkeeping is still saved.
 */
export function admit(paths: RunnerPaths, request: AdmissionRequest, options: LedgerOptions = {}): Admission {
    return write(paths, options, (db, now) => {
        const at = now.toISOString(), day = easternDay(now);
        abandonExpired(db, at);
        const refuse = (code: RefusalCode): Admission => ({ admitted: false, code });
        if (options.reservationId !== undefined && (typeof options.reservationId !== 'string' || !RESERVATION_ID.test(options.reservationId))) return refuse('invalid-reservation-id');
        if (options.reservationId !== undefined && get(db, options.reservationId)) return refuse('reservation-id-taken');
        if (count(db, `SELECT COUNT(*) AS n FROM reservations WHERE ${UNRECONCILED}`)) return refuse('overrun-unreconciled');
        if (typeof request.incident !== 'string' || !/^inc-[0-9a-f]{16}$/.test(request.incident)) return refuse('invalid-incident');
        const policy = typeof request.stage === 'string' ? stagePolicy(request.stage) : null;
        if (!policy) return refuse('unknown-stage');
        if (!timeoutsValid(request.totalTimeoutMs, request.inactivityTimeoutMs)) return refuse('invalid-timeouts');
        if (!Number.isSafeInteger(request.round) || request.round < 1 || request.round > ROUND_LIMITS[policy.counter]) return refuse('round-out-of-range');
        if (count(db, 'SELECT COUNT(*) AS n FROM reservations WHERE incident=? AND counter=? AND round=? AND stage=?', request.incident, policy.counter, request.round, request.stage)) return refuse('stage-repeated');
        if (count(db, 'SELECT COUNT(*) AS n FROM reservations WHERE day=?', day) >= DAILY_LIMITS.modelRuns) return refuse('daily-runs');
        const opensFixRound = policy.counter === 'fix' && !count(db, "SELECT COUNT(*) AS n FROM reservations WHERE incident=? AND counter='fix' AND round=?", request.incident, request.round);
        if (opensFixRound && count(db, FIX_ROUNDS_OPENED, day) >= DAILY_LIMITS.fixRounds) return refuse('daily-fix-attempts');
        const ceiling = readCeiling(paths);
        if (ceiling === null) return refuse('ceiling-unreadable');
        const reserved = reservationFor(policy.allocation);
        if (reserved > balance(db, day, ceiling).available) return refuse('ceiling');
        const id = options.reservationId ?? crypto.randomUUID(), deadline = new Date(now.getTime() + request.totalTimeoutMs + ABANDON_GRACE_MS).toISOString();
        db.prepare("INSERT INTO reservations (id, day, incident, stage, counter, round, reserved, admitted_at, deadline, total_ms, inactivity_ms, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,'outstanding')")
            .run(id, day, request.incident, request.stage, policy.counter, request.round, reserved, at, deadline, request.totalTimeoutMs, request.inactivityTimeoutMs);
        return { admitted: true, reservation: { id, reserved, deadline, totalTimeoutMs: request.totalTimeoutMs, inactivityTimeoutMs: request.inactivityTimeoutMs } };
    });
}

export type Release = { released: true } | { released: false; code: 'unknown-reservation' | 'not-releasable' };

const TIMEOUT_RECEIPT = '{"timeout":true}';

/**
 * Removes a proven non-dispatch. Only the timeout branch may release its own provisional
 * timeout marker. Provider evidence and reconciled charges always keep the row.
 */
export function release(paths: RunnerPaths, id: string, options: LedgerOptions = {}, afterTimeout = false): Release {
    return write(paths, options, db => {
        const row = get(db, id);
        if (!row) return { released: false, code: 'unknown-reservation' } as const;
        const untouched = row.status === 'outstanding' && row.charged === null && row.settled_at === null && row.receipt === null;
        // Expiration can also post the hold if the deadline's own write could not reach the ledger.
        const timeoutOnly = afterTimeout && row.charged === row.reserved
            && (row.receipt === TIMEOUT_RECEIPT || (row.status === 'abandoned' && row.receipt === null));
        if ((!untouched && !timeoutOnly) || row.evidence_id !== null || row.receipt_total !== null || row.final !== 0
            || row.ack_micro_usd !== null || row.ack_at !== null || row.finalized_at !== null) return { released: false, code: 'not-releasable' } as const;
        db.prepare('DELETE FROM reservations WHERE id=?').run(id);
        return { released: true } as const;
    });
}

/** Binds the provider session a reservation's invocation reported at launch. Once bound it cannot change. */
export function bindEvidence(paths: RunnerPaths, id: string, evidenceId: string, options: LedgerOptions = {}): void {
    if (!evidenceId.trim()) throw new Error('The evidence session ID must be nonblank');
    write(paths, options, db => {
        const row = get(db, id);
        if (!row) throw new UnknownReservation(`No reservation ${id}`);
        if (row.evidence_id === evidenceId) return;
        if (row.evidence_id?.trim()) throw new Error(`Reservation ${id} is already bound to another session`);
        db.prepare('UPDATE reservations SET evidence_id=? WHERE id=?').run(evidenceId, id);
    });
}

/**
 * The largest amount incomplete evidence supports. The supported subtotal, the reported total and
 * the valued components may describe the same spend, so the largest is taken, never their sum.
 */
export function knownAmount(cost: RunCost | null): number | null {
    if (!cost) return null;
    const components = cost.components.filter(component => (component.providerBasis === 'list' || component.providerBasis === 'managed') && Number.isSafeInteger(component.microUsd) && component.microUsd! >= 0);
    const candidates = [
        cost.completeness === 'complete' ? cost.microUsd : null,
        cost.partialMicroUsd,
        toMicroUsd(cost.reportedTotalUsd),
        components.length ? components.reduce((sum, component) => sum + component.microUsd!, 0) : null,
    ].filter((amount): amount is number => Number.isSafeInteger(amount) && amount! >= 0);
    return candidates.length ? Math.max(...candidates) : null;
}

export type Settlement = { result: 'settled' | 'retained' | 'overrun' | 'duplicate' | 'stale'; row: ReservationRow };

/**
 * Settles a reservation with what its invocation left: a terminal receipt with the session it was
 * bound to, or nothing. A matching complete receipt posts its total once (a valid zero included)
 * and releases the hold; the charge never falls below what was already posted, but the exact
 * receipt total is kept beside it. A hold keeps the largest of the reservation, the prior charge
 * and the amount supported by matching evidence. Matching incomplete evidence reopens a finalized
 * hold only when it supports a higher charge. A charge above the reservation is an overrun, and
 * a higher overrun charge requires a new acknowledgement.
 */
export function settle(paths: RunnerPaths, id: string, evidence: { evidenceId: string | null; cost: RunCost | null; timeout?: true }, options: LedgerOptions = {}): Settlement {
    return write(paths, options, (db, now) => {
        abandonExpired(db, now.toISOString());
        const row = get(db, id);
        if (!row) throw new UnknownReservation(`No reservation ${id}`);
        const { cost } = evidence;
        const matched = evidence.evidenceId === row.evidence_id && !!row.evidence_id?.trim();
        const complete = matched && cost?.completeness === 'complete' && Number.isSafeInteger(cost.microUsd) && cost.microUsd! >= 0;
        let charged: number, final = row.final, receiptTotal = row.receipt_total;
        if (complete) {
            const amount = cost.microUsd!;
            if (row.final && amount <= row.charged!) return { result: amount === row.receipt_total ? 'duplicate' : 'stale', row };
            charged = row.charged === null ? amount : Math.max(row.charged, amount);
            final = 1;
            receiptTotal = amount;
        } else {
            const known = matched ? knownAmount(cost) : null;
            if (row.final && (known === null || known <= row.charged!)) return { result: 'stale', row };
            charged = Math.max(row.charged ?? 0, row.reserved, known ?? 0);
            final = 0;
        }
        const status: ReservationStatus = charged > row.reserved ? 'overrun' : final ? 'settled' : row.status === 'abandoned' && !cost ? 'abandoned' : 'retained';
        const receipt = evidence.timeout && row.receipt === null && row.evidence_id === null && !cost
            ? TIMEOUT_RECEIPT
            : JSON.stringify({ matched, completeness: cost?.completeness ?? 'missing', microUsd: cost?.microUsd ?? null, partialMicroUsd: cost?.partialMicroUsd ?? null, reportedTotalUsd: cost?.reportedTotalUsd ?? null });
        db.prepare('UPDATE reservations SET charged=?, final=?, receipt_total=?, status=?, receipt=?, settled_at=? WHERE id=?').run(charged, final, receiptTotal, status, receipt, now.toISOString(), id);
        const saved = get(db, id)!;
        return { result: status === 'overrun' ? 'overrun' : final ? 'settled' : 'retained', row: saved };
    });
}

export type ReconcileRefusal = 'unknown-reservation' | 'outstanding' | 'stale-amount' | 'not-overrun' | 'already-final';
export type Reconciliation = { reconciled: true; replay: boolean; row: ReservationRow } | { reconciled: false; code: ReconcileRefusal; row: ReservationRow | null };

/**
 * A person's step. Without `finalize`, acknowledges one overrun at exactly the charge shown, which
 * lets admission resume; any unresolved hold stays. With `finalize`, closes a retained, abandoned
 * or held-overrun reservation at its current charge, on the person's word (`reason`) for how the
 * invocation ended and the charge was established; an overrun is acknowledged at that amount too.
 * An outstanding reservation and a stale amount are refused; an identical repeat changes nothing.
 */
export function reconcile(paths: RunnerPaths, id: string, request: { expectedMicroUsd: number; reason: string; finalize?: boolean }, options: LedgerOptions = {}): Reconciliation {
    return write(paths, { ...options, mustExist: true }, (db, now) => {
        abandonExpired(db, now.toISOString());
        const row = get(db, id) ?? null, at = now.toISOString();
        const refuse = (code: ReconcileRefusal): Reconciliation => ({ reconciled: false, code, row });
        if (!row) return refuse('unknown-reservation');
        if (row.status === 'outstanding') return refuse('outstanding');
        if (row.charged !== request.expectedMicroUsd) return refuse('stale-amount');
        if (request.finalize) {
            // Not final means retained, abandoned or a held overrun: outstanding was refused above, and settled is always final.
            if (row.final) {
                const pendingAcknowledgement = row.status === 'overrun' && row.ack_micro_usd !== row.charged;
                return row.finalized_reason !== null && !pendingAcknowledgement ? { reconciled: true, replay: true, row } : refuse('already-final');
            }
            const ack = row.status === 'overrun' ? row.charged : row.ack_micro_usd;
            db.prepare('UPDATE reservations SET final=1, finalized_reason=?, finalized_at=?, ack_micro_usd=?, ack_reason=COALESCE(?, ack_reason), ack_at=COALESCE(?, ack_at) WHERE id=?')
                .run(request.reason, at, ack, row.status === 'overrun' ? request.reason : null, row.status === 'overrun' ? at : null, id);
        } else {
            if (row.status !== 'overrun') return refuse('not-overrun');
            if (row.ack_micro_usd === row.charged) return { reconciled: true, replay: true, row };
            db.prepare('UPDATE reservations SET ack_micro_usd=?, ack_reason=?, ack_at=? WHERE id=?').run(row.charged, request.reason, at, id);
        }
        return { reconciled: true, replay: false, row: get(db, id)! };
    });
}

/** Admits one deployment for phase 10, at most six distinct ones per Eastern day. A known ID is its original admission. */
export function admitDeployment(paths: RunnerPaths, id: string, options: LedgerOptions = {}): { admitted: true; replay: boolean; day: string; at: string } | { admitted: false; code: 'daily-deployments' } {
    return write(paths, options, (db, now) => {
        const known = db.prepare('SELECT day, at FROM deployments WHERE id=?').get(id) as { day: string; at: string } | undefined;
        if (known) return { admitted: true, replay: true, ...known };
        const day = easternDay(now), at = now.toISOString();
        if (count(db, 'SELECT COUNT(*) AS n FROM deployments WHERE day=?', day) >= DAILY_LIMITS.deployments) return { admitted: false, code: 'daily-deployments' };
        db.prepare('INSERT INTO deployments (id, day, at) VALUES (?,?,?)').run(id, day, at);
        return { admitted: true, replay: false, day, at };
    });
}

export interface Standing {
    day: string;
    ceiling: number | null;
    ceilingUnreadable: boolean;
    finalized: number;
    unresolved: number;
    available: number;
    runs: { used: number; limit: number };
    fixRounds: { used: number; limit: number };
    deployments: { used: number; limit: number };
    holds: { id: string; status: ReservationStatus; held: number }[];
    overruns: { id: string; reserved: number; charged: number; acknowledged: number | null }[];
}

function standingOf(db: DatabaseSync | null, paths: RunnerPaths, now: Date): Standing {
    const day = easternDay(now), ceiling = readCeiling(paths);
    if (!db) return { day, ceiling, ceilingUnreadable: ceiling === null, finalized: 0, unresolved: 0, available: ceiling ?? 0, runs: { used: 0, limit: DAILY_LIMITS.modelRuns }, fixRounds: { used: 0, limit: DAILY_LIMITS.fixRounds }, deployments: { used: 0, limit: DAILY_LIMITS.deployments }, holds: [], overruns: [] };
    const money = balance(db, day, ceiling ?? 0);
    const holds = db.prepare(`
        SELECT id, CASE WHEN status='outstanding' AND deadline<=? THEN 'abandoned' ELSE status END AS status,
            ${HELD_AMOUNT} AS held
        FROM reservations WHERE final=0 ORDER BY rowid
    `).all(now.toISOString()) as unknown as Standing['holds'];
    return {
        day, ceiling, ceilingUnreadable: ceiling === null, finalized: money.finalized, unresolved: money.unresolved, available: ceiling === null ? 0 : money.available,
        runs: { used: count(db, 'SELECT COUNT(*) AS n FROM reservations WHERE day=?', day), limit: DAILY_LIMITS.modelRuns },
        fixRounds: { used: count(db, FIX_ROUNDS_OPENED, day), limit: DAILY_LIMITS.fixRounds },
        deployments: { used: count(db, 'SELECT COUNT(*) AS n FROM deployments WHERE day=?', day), limit: DAILY_LIMITS.deployments },
        holds,
        overruns: money.overruns.map(row => ({ id: row.id, reserved: row.reserved, charged: row.charged, acknowledged: row.ack_micro_usd })),
    };
}

/** The first 100 bytes of a file, read without following a link. */
function header(path: string): Buffer {
    const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW), bytes = Buffer.alloc(100);
    try { return bytes.subarray(0, readSync(fd, bytes, 0, 100, 0)); } finally { closeSync(fd); }
}

/**
 * Today's standing, for `status`: read through a read-only connection, writing nothing and never
 * recovering anything. A ledger confirmed absent is no activity. A ledger that is unsafe, locked,
 * damaged, in another journal format or left with a journal to roll back is reported unreadable,
 * with no balance invented.
 */
export function readStanding(paths: RunnerPaths, now: Date): { standing: Standing } | { unreadable: string } {
    let files;
    try { files = checkDatabaseFiles(paths, paths.budgetDb); }
    catch (error) { return { unreadable: `unsafe: ${(error as Error).message}` }; }
    if (!files.exists) return { standing: standingOf(null, paths, now) };
    if (files.sidecars.includes('-journal')) return { unreadable: 'journal-present: a write is in progress, or one was interrupted and the runner rolls it back on its next write; read again' };
    if (files.sidecars.length) return { unreadable: `unexpected-format: ${files.sidecars.join(', ')} present` };
    let bytes: Buffer;
    try { bytes = header(paths.budgetDb); }
    catch (error) { return { unreadable: `damaged: ${(error as Error).message}` }; }
    if (bytes.length < 100 || bytes.subarray(0, 16).toString('latin1') !== 'SQLite format 3\0') return { unreadable: 'damaged: not an SQLite database' };
    if (bytes[18] !== 1 || bytes[19] !== 1) return { unreadable: 'unexpected-format: not a rollback-journal database' };
    let db: DatabaseSync | undefined;
    try {
        db = new DatabaseSync(paths.budgetDb, { readOnly: true });
        if (!checkDatabaseFiles(paths, paths.budgetDb).exists) throw new Error(`${paths.budgetDb} is missing after opening`);
        db.exec('PRAGMA busy_timeout=0; BEGIN');
        const standing = standingOf(db, paths, now);
        db.exec('COMMIT');
        return { standing };
    } catch (error) {
        return { unreadable: `${errcode(error) === BUSY ? 'busy' : 'damaged'}: ${(error as Error).message}` };
    } finally { try { db?.close(); } catch { /* The read's own error is the one to report. */ } }
}
