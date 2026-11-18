import type { Receipt } from '../../../src/shared';

/**
 * Why a Brain worker's returned result stops the run for read-back, or '' when it does not.
 * A blocked result stops with its own reason. A write whose outcome is unknown (uncertain) stops too.
 * A write the worker reports as refused before it took effect (not verified, not uncertain) has a
 * known outcome: nothing happened. It is kept in the record and does not stop a completed run.
 */
export function brainResultStop(result: { outcome: string; reason: string; receipts: readonly Pick<Receipt, 'action' | 'target' | 'uncertain'>[] }): string {
    if (result.outcome === 'blocked') return result.reason || 'Brain maintenance returned blocked without a reason';
    const unknown = result.receipts.filter(receipt => receipt.uncertain);
    return unknown.length ? `Brain reported ${unknown.length} write(s) with an unknown outcome (${unknown.map(receipt => receipt.action).join(', ')}); read-back is required` : '';
}
