import type { MaintenanceResult } from '../../src/shared';

/**
 * A vendor review that returns evidenced candidates has done its job even when one observation
 * stays unresolved. Treat that as a partial pass: the candidates proceed to proposal and the
 * unresolved observation rides in the ledger for the next review. Blocked without candidates
 * (no scan evidence, no reachable sources) still stops the run.
 */
export function partialVendorReview(result: Pick<MaintenanceResult, 'outcome' | 'candidates'>): boolean {
    return result.outcome === 'blocked' && result.candidates.length > 0;
}

/** The ledger a partial vendor review leaves behind: its own ledger (or the retained one when it returned none) plus the open observation, dated for the next review. */
export function partialVendorReviewLedger(result: Pick<MaintenanceResult, 'ledger' | 'blocker'>, date: string, retained = ''): string {
    const observation = result.blocker.trim();
    const ledger = result.ledger.trimEnd() || retained.trimEnd();
    if (!observation) return ledger;
    return `${ledger}${ledger ? '\n' : ''}OPEN OBSERVATION (vendor-review ${date}, retained, not blocking): ${observation}`;
}
