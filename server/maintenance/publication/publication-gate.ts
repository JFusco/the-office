import { PUBLICATION_OPERATIONS } from './publication-operations';
import type { Store } from '../../store/store';
import type { EffectIntent } from '../../../src/shared';

/** Attempted maintenance publication writes that have not settled, from any run, optionally only for these targets. */
export function outstandingPublication(store: Pick<Store, 'db'>, options: { exceptRun?: string; targets?: readonly string[]; runs?: readonly string[] } = {}): EffectIntent[] {
    const rows = store.db.prepare(`SELECT body FROM effects WHERE status IN ('dispatching','uncertain') AND json_extract(body,'$.work.kind') = 'maintenance'`).all() as { body: string }[];
    return rows.map(row => JSON.parse(row.body) as EffectIntent).filter(intent => (PUBLICATION_OPERATIONS as readonly string[]).includes(intent.operation)
        && intent.work.id !== options.exceptRun && (!options.targets || options.targets.includes(intent.target)) && (!options.runs || options.runs.includes(intent.work.id)));
}

/**
 * Before a fresh push, draft or link: no other run holds an unsettled write for the same branch, issue or link
 * (#612). Its own read-back must settle it first; a later run never publishes over it.
 */
export function assertNoOutstandingPublication(store: Pick<Store, 'db'>, runId: string, targets: readonly string[]): void {
    const found = outstandingPublication(store, { exceptRun: runId, targets });
    if (found.length) throw new Error(`An earlier run's ${found[0].operation} for ${found[0].target} is unsettled; read it back before publishing again`);
}
