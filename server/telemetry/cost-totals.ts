import { createHash } from 'node:crypto';
import type { TimeLedgerState, WorkTime } from '../../src/shared';
import { ISSUE_KEY, isTicketModelWork } from './billable-work';

export interface TicketCost {
    key: string;
    microUsd: number;
    pricedRuns: number;
    partialRuns: number;
    unpricedRuns: number;
    inProgressRuns: number;
    coverageDigest: string;
}

/**
 * Whether a run counts toward the board's cost field: the same window as hours, decided by the
 * run's start (start-inclusive/end-exclusive disabled periods; an open `disabledSince` extends
 * forward). The whole run counts; tokens and dollars are never prorated by elapsed time.
 */
export function inCostWindow(ledger: TimeLedgerState, startedAt: string): boolean {
    const start = Date.parse(startedAt);
    if (!Number.isFinite(start) || start < Date.parse(ledger.activatedAt)) return false;
    if (ledger.disabledSince && start >= Date.parse(ledger.disabledSince)) return false;
    return !(ledger.disabledPeriods || []).some(period => start >= Date.parse(period.start) && start < Date.parse(period.end));
}

/**
 * Per-ticket priced subtotal of eligible runs, across all outcomes (failed and interrupted runs
 * spent money too). Complete valuations count in full; a partial run contributes only its
 * independently valued amount and is also counted as not fully priced; a run with no usable
 * evidence (including runs from before capture existed) is counted as unpriced, never as $0.
 */
export interface CaptureContext { captureStartedAt?: string; now: number; graceMs: number }

/** A captured-era run that just finished may still be getting its accounting; it is in progress, not unpriced. */
const awaitingEvidence = (work: WorkTime, context?: CaptureContext) => !!context?.captureStartedAt && !work.accounting
    && work.startedAt >= context.captureStartedAt && context.now - Date.parse(work.endedAt || work.startedAt) < context.graceMs;

export function ticketCosts(workLog: WorkTime[], ledger: TimeLedgerState, context?: CaptureContext): Map<string, TicketCost> {
    const totals = new Map<string, TicketCost & { parts: string[] }>();
    for (const work of workLog) {
        if (!isTicketModelWork(work) || !ISSUE_KEY.test(work.ticket) || !inCostWindow(ledger, work.startedAt)) continue;
        const total = totals.get(work.ticket) ?? { key: work.ticket, microUsd: 0, pricedRuns: 0, partialRuns: 0, unpricedRuns: 0, inProgressRuns: 0, coverageDigest: '', parts: [] };
        totals.set(work.ticket, total);
        if (['running', 'stopping'].includes(work.status) || awaitingEvidence(work, context)) { total.inProgressRuns++; continue; }
        const cost = work.accounting?.cost;
        if (cost?.completeness === 'complete' && cost.microUsd !== null) { total.microUsd += cost.microUsd; total.pricedRuns++; }
        else if (cost?.completeness === 'partial' && cost.partialMicroUsd !== null) { total.microUsd += cost.partialMicroUsd; total.partialRuns++; }
        else total.unpricedRuns++;
        total.parts.push(`${work.id}:${work.accounting?.evidenceId ?? 'none'}:${cost?.completeness ?? 'uncaptured'}:${cost?.microUsd ?? cost?.partialMicroUsd ?? ''}`);
    }
    return new Map([...totals].map(([key, { parts, ...total }]) => [key, { ...total, coverageDigest: createHash('sha256').update(parts.sort().join('\n')).digest('hex') }]));
}

/** Board value: the pre-existing baseline plus the subtotal, rounded to cents only here. */
export const boardUsd = (baseline: number, microUsd: number) => Math.round((Math.round(baseline * 1_000_000) + microUsd) / 10_000) / 100;
