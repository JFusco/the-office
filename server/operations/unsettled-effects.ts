import type { Store } from '../store/store';
import type { UnsettledEffects } from './stale-records';

/** Reads the Effects ledger once: every write still dispatching or uncertain, by work key and attempt id. */
export function unsettledEffects(store: Pick<Store, 'db'>): UnsettledEffects {
    const rows = store.db.prepare("SELECT work_key, body FROM effects WHERE status IN ('dispatching','uncertain')").all() as { work_key: string; body: string }[];
    const attempts = new Set<string>();
    for (const row of rows) try { const attempt = (JSON.parse(row.body) as { attemptId?: unknown }).attemptId; if (typeof attempt === 'string' && attempt) attempts.add(attempt); } catch { /* the work key still guards it */ }
    return { workKeys: new Set(rows.map(row => row.work_key)), attempts };
}
