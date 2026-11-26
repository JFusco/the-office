import type { RunCost } from '../../src/contracts/telemetry';
import { inactivityWatch } from '../workers/inactivity-watch';
import { admit, bindEvidence, LedgerError, settle, type LedgerOptions, type RefusalCode, type Reservation, type Settlement } from './budget-ledger';
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

type Settled = { ok: true; settlement: Settlement } | { ok: false; error: Error };
export type BudgetedOutcome =
    | { status: 'refused'; code: RefusalCode }
    | { status: 'ledger-error'; code: LedgerError['code']; message: string }
    | { status: 'completed'; reservation: Reservation; result: InvocationResult; settled: Settled }
    | { status: 'failed'; reservation: Reservation; error: Error; settled: Settled }
    /** `late` settles the original reservation if the invocation ever ends; until then its hold stays. */
    | { status: 'timed-out'; reservation: Reservation; reason: 'total' | 'inactivity'; retained: Settled; late: Promise<Settled> };

const asError = (error: unknown) => error instanceof Error ? error : new Error(String(error));

export async function runBudgeted(paths: RunnerPaths, request: AdmissionRequest, invoke: (run: BudgetedInvocation) => Promise<InvocationResult | null>, options: LedgerOptions = {}): Promise<BudgetedOutcome> {
    let admission;
    try { admission = admit(paths, request, options); }
    catch (error) {
        if (error instanceof LedgerError) return { status: 'ledger-error', code: error.code, message: error.message };
        throw error;
    }
    if (!admission.admitted) return { status: 'refused', code: admission.code };
    const { reservation } = admission, controller = new AbortController();
    let bound: string | null = null, done = false;
    // Each settlement opens its own short transaction, so a late one works after the caller has moved on.
    const settleWith = (evidence: InvocationResult | null): Settled => {
        try { return { ok: true, settlement: settle(paths, reservation.id, { evidenceId: evidence?.evidenceId ?? null, cost: evidence?.cost ?? null }, options) }; }
        catch (error) { return { ok: false, error: asError(error) }; }
    };
    return new Promise<BudgetedOutcome>(resolve => {
        const stop = (reason: 'total' | 'inactivity') => {
            if (done) return;
            done = true;
            clearTimeout(total);
            quiet.clear();
            controller.abort(new Error(`The invocation passed its ${reason} timeout`));
            resolve({ status: 'timed-out', reservation, reason, retained: settleWith(null), late });
        };
        const total = setTimeout(() => stop('total'), reservation.totalTimeoutMs);
        const quiet = inactivityWatch(reservation.inactivityTimeoutMs, () => stop('inactivity'));
        const run: BudgetedInvocation = {
            reservation: reservation.id, signal: controller.signal, totalTimeoutMs: reservation.totalTimeoutMs, inactivityTimeoutMs: reservation.inactivityTimeoutMs,
            bindSession: evidenceId => { bindEvidence(paths, reservation.id, evidenceId, options); bound = evidenceId; },
            activity: () => { if (!done) quiet.progress(); },
        };
        // Handlers are attached before anything can settle, so a result that arrives after a timeout still settles the same reservation.
        const outcome = Promise.resolve().then(() => invoke(run)).then(
            result => ({ kind: 'result' as const, result: result ?? { evidenceId: bound, cost: null } }),
            error => ({ kind: 'error' as const, error: asError(error) }));
        const late: Promise<Settled> = outcome.then(ended => settleWith(ended.kind === 'result' ? ended.result : null));
        outcome.then(ended => late.then(settled => {
            if (done) return;
            done = true;
            clearTimeout(total);
            quiet.clear();
            resolve(ended.kind === 'result' ? { status: 'completed', reservation, result: ended.result, settled } : { status: 'failed', reservation, error: ended.error, settled });
        }));
    });
}
