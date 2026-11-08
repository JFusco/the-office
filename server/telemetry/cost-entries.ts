import type { CostEntry, CostLedgerState } from '../../src/contracts/telemetry';
import type { Store } from '../store/store';
import { ticketCosts } from './cost-totals';
import { RECONCILE_GRACE_MS } from './run-accounting';
import { validTicket } from '../office/projects';

export function costLedger(store: Store): CostLedgerState | null {
    const time = store.state.coordination?.time;
    return time ? time.cost ??= { githubField: false, entries: [], baselines: {} } : null;
}

const summary = (entry: CostEntry) => entry.partialRuns || entry.unpricedRuns
    ? `Subtotal: ${entry.partialRuns} partially priced, ${entry.unpricedRuns} unpriced run${entry.unpricedRuns === 1 ? '' : 's'} not included in full.`
    : 'All eligible runs priced.';

/**
 * Keeps one cost entry per ticket current with its eligible runs (synchronous, like captureTime).
 * A changed subtotal or coverage makes a new pending revision, except while an attempt is
 * posting or uncertain: that entry stays frozen and is recomputed after reconciliation.
 */
export function captureCost(store: Store): void {
    const time = store.state.coordination?.time, ledger = costLedger(store);
    // Board cost exists only for GitHub projects; Jira/CEC cost is reported in Telemetry, not published.
    if (!time || !ledger || store.project.provider !== 'github' || !time.enabled || time.scopePolicy !== 'model-work-v1') return;
    const now = store.clock.now().toISOString(), at = Date.parse(now);
    let changed = false;
    // A failure that was never dispatched retries on its own once its backoff passes.
    for (const entry of ledger.entries)
        if (entry.status === 'blocked' && entry.retryAt && at >= Date.parse(entry.retryAt)) { Object.assign(entry, { status: 'pending', retryAt: undefined, detail: 'Retrying after a failure that was never dispatched.', updatedAt: now }); changed = true; }
    const context = { captureStartedAt: store.state.telemetryCaptureStartedAt, now: at, graceMs: RECONCILE_GRACE_MS };
    for (const total of ticketCosts(store.state.workLog || [], time, context).values()) {
        if (!validTicket(store.project, total.key)) continue;
        if (total.inProgressRuns && !total.pricedRuns && !total.partialRuns && !total.unpricedRuns) continue;
        const entry = ledger.entries.find(item => item.key === total.key);
        // Frozen while an attempt is unsettled or waiting on Joe's decision; recomputed afterwards.
        if (entry && (['posting', 'uncertain'].includes(entry.status) || entry.needsDecision || entry.coverageDigest === total.coverageDigest)) continue;
        const next: CostEntry = { key: total.key, revision: (entry?.revision ?? 0) + 1, microUsd: total.microUsd, pricedRuns: total.pricedRuns, partialRuns: total.partialRuns, unpricedRuns: total.unpricedRuns, coverageDigest: total.coverageDigest, status: 'pending', detail: '', effectId: null, attempt: 0, intendedUsd: null, updatedAt: now };
        next.detail = `Pending board cost sync. ${summary(next)}`;
        if (entry) Object.assign(entry, next); else ledger.entries.push(next);
        changed = true;
    }
    if (changed) store.save();
}

export { summary as costCoverageSummary };
