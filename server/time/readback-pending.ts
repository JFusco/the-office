import { READBACK_INTERVAL_MS, SETTLE_MS } from './time-readback';
import type { TimePublication } from '../../src/contracts/timing';

type Read = TimePublication & { readbackNote?: string };
interface Ledger { publications?: TimePublication[] }

/**
 * True while an unconfirmed GitHub hours write is still the Office's own to settle: its read-back runs
 * every few minutes, and after the settle window it either verifies the write or sends it once more.
 * It is a person's once the read-back has left a note (the board changed elsewhere, the card is gone, a
 * second miss in a row), or once that window and one more read-back have passed without settling it.
 * A day with no recorded write, and a Jira worklog, are never pending here.
 */
export function hoursReadbackPending(ledger: Ledger | undefined, entry: { key: string; status: string }, now: Date): boolean {
    if (entry.status !== 'uncertain') return false;
    const publication = (ledger?.publications || []).filter(p => p.provider === 'github' && p.key === entry.key).at(-1) as Read | undefined;
    if (!publication || publication.status !== 'uncertain' || publication.readbackNote) return false;
    const age = now.getTime() - Date.parse(publication.createdAt);
    return Number.isFinite(age) && age < SETTLE_MS + READBACK_INTERVAL_MS;
}
