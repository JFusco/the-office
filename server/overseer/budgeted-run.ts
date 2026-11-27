import type { RunCost } from '../../src/contracts/telemetry';
import { inactivityWatch } from '../workers/inactivity-watch';
import { admit, bindEvidence, LedgerError, release, settle, type LedgerOptions, type RefusalCode, type Reservation, type Settlement } from './budget-ledger';
import type { AdmissionRequest } from './budget-policy';
import type { RunnerPaths } from './config';

/**
 * The one boundary every model invocation passes through: admit, invoke, settle. Phase 7 supplies
 * the invocation; 6b qualifies the boundary with injected ones. The caller gets control back by
 * the invocation's total or inactivity deadline whatever the invocation does. Whether the provider
 * process has actually exited is phase 7's to confirm.
 */

/** What an invocation is handed. `bindSession` records the provider session it started; `activity` reports output. */
export interface BudgetedInvocation {
    reservation: string;
    signal: AbortSignal;
    totalTimeoutMs: number;
    inactivityTimeoutMs: number;
    bindSession: (evidenceId: string) => void;
    activity: () => void;
}
/** What an invocation returns: the session its receipt belongs to, and the receipt valued by `run-cost.ts`. */
export interface InvocationResult { evidenceId: string | null; cost: RunCost | null }

/**
 * Runner-owned proof that nothing was dispatched: the invocation refused before its executor ran,
 * or the executor refused before spawning, with no session bound. Only runner code raises it; the
 * reservation is released instead of settled, so the refusal spends no slot.
 */
export class NotDispatched extends Error {}
/** A trusted failure after launch that still left a validated receipt: its cost is settled, and the call stays failed. */
export class AttributedFailure extends Error {
    constructor(message: string, readonly result: InvocationResult) { super(message); }
}

type Settled = { ok: true; settlement: Settlement } | { ok: false; error: Error; evidence: InvocationResult | null };
type Released = { ok: true; released: true } | { ok: false; error: Error; evidence: null };
export type BudgetedOutcome =
    | { status: 'refused'; code: RefusalCode }
    | { status: 'ledger-error'; code: LedgerError['code']; message: string }
    | { status: 'completed'; reservation: Reservation; result: InvocationResult; settled: Settled }
    | { status: 'failed'; reservation: Reservation; error: Error; settled: Settled }
    /** Proven never dispatched: the reservation was removed, and nothing was spent. */
    | { status: 'not-dispatched'; reservation: Reservation; error: NotDispatched }
    /** `late` settles the original reservation if the invocation ever ends; until then its hold stays. */
    | { status: 'timed-out'; reservation: Reservation; reason: 'total' | 'inactivity'; retained: Settled; late: Promise<Settled | Released> };

const asError = (error: unknown) => error instanceof Error ? error : new Error(String(error));

type Ended =
    | { kind: 'result'; result: InvocationResult }
    | { kind: 'not-dispatched'; error: NotDispatched }
    | { kind: 'error'; error: Error; evidence: InvocationResult | null };

export async function runBudgeted(paths: RunnerPaths, request: AdmissionRequest, invoke: (run: BudgetedInvocation) => Promise<InvocationResult | null>, options: LedgerOptions = {}): Promise<BudgetedOutcome> {
    let admission;
    try { admission = admit(paths, request, options); }
    catch (error) {
        return { status: 'ledger-error', code: error instanceof LedgerError ? error.code : 'ledger-failed', message: asError(error).message };
    }
    if (!admission.admitted) return { status: 'refused', code: admission.code };
    const { reservationId: _admitted, ...writeOptions } = options;
    const { reservation } = admission, controller = new AbortController();
    let bound: string | null = null, done = false;
    // Each settlement opens its own short transaction, so a late one works after the caller has moved on.
    const settleWith = (evidence: InvocationResult | null, settleOptions = writeOptions): Settled => {
        try { return { ok: true, settlement: settle(paths, reservation.id, { evidenceId: evidence?.evidenceId ?? null, cost: evidence?.cost ?? null }, settleOptions) }; }
        catch (error) { return { ok: false, error: asError(error), evidence }; }
    };
    // A proven non-dispatch removes the row; nothing settles it afterwards. A row that is no longer untouched keeps its hold.
    const releaseWith = (): Released => {
        if (bound !== null) return { ok: false, error: new Error('A session was bound, so the call may have been dispatched; its hold stays'), evidence: null };
        try {
            const freed = release(paths, reservation.id, writeOptions);
            return freed.released ? { ok: true, released: true } : { ok: false, error: new Error(`The reservation could not be released (${freed.code}); its hold stays`), evidence: null };
        } catch (error) { return { ok: false, error: asError(error), evidence: null }; }
    };
    return new Promise<BudgetedOutcome>(resolve => {
        const stop = (reason: 'total' | 'inactivity') => {
            if (done) return;
            done = true;
            clearTimeout(total);
            quiet.clear();
            controller.abort(new Error(`The invocation passed its ${reason} timeout`));
            resolve({ status: 'timed-out', reservation, reason, retained: settleWith(null, { ...writeOptions, busyTimeoutMs: 0 }), late });
        };
        const total = setTimeout(() => stop('total'), reservation.totalTimeoutMs);
        const quiet = inactivityWatch(reservation.inactivityTimeoutMs, () => stop('inactivity'));
        const run: BudgetedInvocation = {
            reservation: reservation.id, signal: controller.signal, totalTimeoutMs: reservation.totalTimeoutMs, inactivityTimeoutMs: reservation.inactivityTimeoutMs,
            bindSession: evidenceId => { bindEvidence(paths, reservation.id, evidenceId, writeOptions); bound = evidenceId; },
            activity: () => { if (!done) quiet.progress(); },
        };
        // Handlers are attached before anything can settle, so a result that arrives after a timeout still settles the same reservation.
        const outcome: Promise<Ended> = Promise.resolve().then(() => invoke(run)).then(
            result => ({ kind: 'result' as const, result: result ?? { evidenceId: bound, cost: null } }),
            error => error instanceof NotDispatched ? { kind: 'not-dispatched' as const, error }
                : { kind: 'error' as const, error: asError(error), evidence: error instanceof AttributedFailure ? error.result : null });
        // One terminal branch per ending: a release never meets a later settlement of the same row.
        const late: Promise<Settled | Released> = outcome.then(ended => ended.kind === 'not-dispatched' ? releaseWith()
            : settleWith(ended.kind === 'result' ? ended.result : ended.evidence));
        outcome.then(ended => late.then(finished => {
            if (done) return;
            done = true;
            clearTimeout(total);
            quiet.clear();
            if (ended.kind === 'not-dispatched') {
                resolve(finished.ok ? { status: 'not-dispatched', reservation, error: ended.error }
                    : { status: 'ledger-error', code: 'ledger-failed', message: `${ended.error.message}; ${finished.error.message}` });
                return;
            }
            const settled = finished as Settled;
            resolve(ended.kind === 'result' ? { status: 'completed', reservation, result: ended.result, settled } : { status: 'failed', reservation, error: ended.error, settled });
        }));
    });
}
