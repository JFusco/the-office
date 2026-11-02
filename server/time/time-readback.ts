import { TimeLedger, timeLedger } from './time-ledger';
import { command } from '../workers/process';
import type { Store } from '../store/store';
import type { TimePublication } from '../../src/contracts/timing';

/** A GitHub write that has not landed after this long is not going to. */
export const SETTLE_MS = 10 * 60 * 1000;
/** Uncertain posts are read back at most this often, not every scheduler tick. */
export const READBACK_INTERVAL_MS = 5 * 60 * 1000;

type Readback = TimePublication & { readbackAt?: string; readbackNote?: string; notLanded?: { at: string; by: string; reason: string } };

/** The latest uncertain GitHub publication whose read-back is due. Jira worklogs are additive and keep their human reconciliation. */
export function dueReadback(store: Store, now: Date): Readback | null {
    const ledger = timeLedger(store);
    if (store.project.provider !== 'github' || !ledger.enabled || !ledger.githubField)
        return null;
    for (const entry of ledger.entries.filter(e => e.status === 'uncertain')) {
        const publication = (ledger.publications || []).filter(p => p.provider === 'github' && p.key === entry.key).at(-1) as Readback | undefined;
        if (publication?.status === 'uncertain' && now.getTime() - Date.parse(publication.readbackAt || publication.createdAt) >= READBACK_INTERVAL_MS)
            return publication;
    }
    return null;
}

/**
 * Reads an uncertain GitHub hours write back. The board field holds an absolute total, so one fresh
 * write after a confirmed miss cannot double-count:
 * - the board shows the attempted value: verified, no write (the existing reconcile path);
 * - it still shows the value from before the attempt once the write has settled: recorded as not
 *   landed, and the entry returns to pending for one fresh write with read-back. Only once per key:
 *   a second miss stays with Joe;
 * - anything else (someone edited the board, the card left it): stays uncertain for Joe, said once.
 */
export async function readBackTime(store: Store, publicationId: string, execute: typeof command = command): Promise<void> {
    const now = store.clock.now(), publication = dueReadback(store, now);
    if (!publication || publication.id !== publicationId)
        return;
    const ledger = new TimeLedger(store, execute), entry = timeLedger(store).entries.find(e => e.key === publication.key && e.status === 'uncertain')!;
    publication.readbackAt = now.toISOString();
    store.save();
    const note = (detail: string) => {
        if (publication.readbackNote === detail) return;
        publication.readbackNote = entry.detail = detail;
        store.emit('time-readback', `${publication.key}: ${detail}`, 'pm', publication.key);
        store.save();
    };
    const data = await ledger.graphql('query($item:ID!){node(id:$item){... on ProjectV2Item{fieldValues(first:100){nodes{... on ProjectV2ItemFieldNumberValue{number field{... on ProjectV2Field{id}}}} pageInfo{hasNextPage}}}}}', { item: publication.itemId });
    if (data.node?.fieldValues?.pageInfo?.hasNextPage !== false)
        return note('Hours read-back could not see the board card or its full fields; reconcile by hand.');
    const current = data.node.fieldValues.nodes.find((n: any) => n.field?.id === publication.fieldId)?.number ?? null;
    if (current === publication.intendedValue)
        return ledger.sync(publication.key);
    if (current !== publication.previousValue)
        return note(`Board hours read ${current}h, neither the attempted ${publication.intendedValue}h nor the earlier ${publication.previousValue}h; someone else changed them. Reconcile by hand.`);
    if (now.getTime() - Date.parse(publication.createdAt) < SETTLE_MS)
        return;
    if (timeLedger(store).publications!.some(p => p.key === publication.key && (p as Readback).notLanded?.by === 'office'))
        return note(`A second hours write for ${publication.key} never landed (board still ${current}h); the Office resends only once. Reconcile by hand.`);
    Object.assign(publication, { status: 'not-landed', notLanded: { at: now.toISOString(), by: 'office', reason: `Board read back ${current}h, the value before the attempt, ${Math.round((now.getTime() - Date.parse(publication.createdAt)) / 60000)} minutes after it.` } });
    entry.status = 'pending';
    entry.detail = `The earlier hours write never landed (board still ${current}h); one fresh write with read-back is queued.`;
    store.emit('time-readback', `${publication.key}: ${entry.detail}`, 'pm', publication.key);
    store.save();
}
