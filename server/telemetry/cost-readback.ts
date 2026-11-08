import type { CostEntry } from '../../src/contracts/telemetry';
import { Effects } from '../store/effects';
import type { Store } from '../store/store';
import { githubGraphql, readNumber } from '../time/board-number-field';
import { READBACK_INTERVAL_MS } from '../time/time-readback';
import { command } from '../workers/process';
import { costLedger } from './cost-entries';
import { costPublishingInProgress, settle } from './cost-ledger';

/**
 * The next cost entry whose attempt needs settling: uncertain writes (read back on a cadence) and
 * entries left `posting` by a restart. The interval is only a polling cadence; it never implies
 * that a write did not land.
 */
export function dueCostReadback(store: Store, now: Date): CostEntry | null {
    const ledger = costLedger(store);
    if (!ledger || store.project.provider !== 'github' || costPublishingInProgress(store)) return null;
    return ledger.entries.find(entry => entry.status === 'posting'
        || entry.status === 'uncertain' && now.getTime() - Date.parse(entry.readbackAt || entry.updatedAt) >= READBACK_INTERVAL_MS) ?? null;
}

/**
 * Settles one entry's attempt from durable effect state and observation only; nothing is resent.
 * - verified effect (e.g. a restart after verification): finalize the ledger, idempotently;
 * - prepared or rejected, or no effect at all: provably never dispatched, so a new attempt may follow;
 * - dispatching or uncertain: read the board; only the exact intended value verifies it.
 */
export async function readBackCost(store: Store, key: string, execute: typeof command = command): Promise<void> {
    const ledger = costLedger(store), entry = ledger?.entries.find(item => item.key === key && ['posting', 'uncertain'].includes(item.status));
    if (!ledger || !entry || costPublishingInProgress(store)) return;
    const effect = entry.effectId ? store.getEffect<{ item: string; field: string; usd: number }>(entry.effectId) : null;
    if (effect?.status === 'verified') { settle(store, entry, effect.payload.usd, 'verified by read-back'); return; }
    if (!effect || effect.status === 'prepared' || effect.status === 'rejected') {
        store.transaction(() => Object.assign(entry, { status: 'pending', attempt: entry.attempt + 1, detail: 'Earlier attempt was never dispatched; queued for a fresh, verified write.', updatedAt: store.clock.now().toISOString() }));
        return;
    }
    const graphql = githubGraphql(store, execute);
    const verified = await new Effects(store).reconcile(effect.id, async intent => {
        const payload = intent.payload as { item: string; field: string; usd: number };
        const observed = await readNumber(graphql, payload.item, payload.field);
        return { verified: observed === payload.usd, receipt: { observed } };
    }).catch(() => false);
    if (verified) { settle(store, entry, effect.payload.usd, 'verified by read-back'); return; }
    store.transaction(() => Object.assign(entry, { status: 'uncertain', readbackAt: store.clock.now().toISOString(), detail: 'Board does not show the attempted cost; an old value does not prove the write failed. Left for reconciliation; never resent.' }));
}
