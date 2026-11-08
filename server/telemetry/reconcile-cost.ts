import type { Store } from '../store/store';
import { command } from '../workers/process';
import { githubGraphql, readNumber } from '../time/board-number-field';
import { costLedger } from './cost-entries';
import { readBackCost } from './cost-readback';

export type CostDecision = '' | 'accept-board' | 'abandon';
export const COST_DECISIONS: readonly CostDecision[] = ['', 'accept-board', 'abandon'];

/**
 * Operator reconciliation for one ticket's cost. Without a decision it only observes: an attempted
 * write is settled by read-back (never resent) and a blocked entry is queued to retry its preflight.
 * Two explicit decisions resolve what observation cannot:
 * - `accept-board`: keep an outside edit, as an adjustment to the baseline (the Office's own
 *   subtotal is not counted twice), then publish from it;
 * - `abandon`: give up on an attempt whose outcome stays unknown; a fresh revision is written, and
 *   the abandoned value is recognised as the Office's own write if it did land.
 */
export async function reconcileCost(store: Store, key: string, decision: CostDecision = '', execute?: typeof command): Promise<void> {
    const ledger = costLedger(store), entry = ledger?.entries.find(item => item.key === key);
    if (!ledger || !entry) throw new Error(`No cost entry for ${key}`);
    const at = store.clock.now().toISOString(), baseline = ledger.baselines[key];
    if (decision === 'abandon') {
        if (!['posting', 'uncertain'].includes(entry.status)) throw new Error('Only an unsettled cost attempt can be abandoned');
        await readBackCost(store, key, execute); // settle it if it can be observed after all
        if (!['posting', 'uncertain'].includes(entry.status)) return;
        store.transaction(() => {
            if (baseline && entry.intendedUsd !== null) baseline.abandonedUsd = entry.intendedUsd;
            Object.assign(entry, { status: 'pending', revision: entry.revision + 1, attempt: entry.attempt + 1, effectId: null, coverageDigest: '', readbackAt: undefined, detail: `Unsettled attempt abandoned by Joe at ${at}; a fresh verified write follows.`, updatedAt: at });
            store.emit('cost-abandoned', `${key}: unsettled cost attempt abandoned by Joe; a fresh verified write follows.`, 'pm', key);
        });
        return;
    }
    if (decision === 'accept-board') {
        if (entry.needsDecision !== 'outside-edit' || !baseline) throw new Error('Nothing to accept: the board has no outside edit on record');
        const current = await readNumber(githubGraphql(store, execute ?? command), baseline.itemId, baseline.fieldId);
        if (current === null) throw new Error('The board field is empty; nothing to accept');
        store.transaction(() => {
            // The human change is the difference from the Office's last verified value.
            baseline.baseline = Math.round((baseline.baseline + current - (baseline.lastWritten ?? 0)) * 1_000_000) / 1_000_000;
            baseline.lastWritten = current;
            Object.assign(entry, { status: 'pending', needsDecision: undefined, coverageDigest: '', detail: `Outside edit to $${current.toFixed(2)} accepted by Joe as a baseline adjustment.`, updatedAt: at });
            store.emit('cost-edit-accepted', `${key}: outside cost edit kept as a baseline adjustment.`, 'pm', key);
        });
        return;
    }
    if (['posting', 'uncertain'].includes(entry.status)) return readBackCost(store, key, execute);
    if (entry.status === 'blocked' && !entry.needsDecision)
        store.transaction(() => Object.assign(entry, { status: 'pending', retryAt: undefined, detail: 'Queued again by reconciliation.', updatedAt: at }));
}
