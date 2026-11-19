import { settlementPending } from './publishable';
import { timeLedger } from './time-accounting';
import type { Store } from '../store/store';
import type { TimeEntry, TimeLedgerState } from '../../src/shared';

/** A day that stopped before any write is retried with growing pauses, from five minutes up to six hours. */
export const UNSENT_RETRY_MS = 5 * 60 * 1000;
export const UNSENT_RETRY_MAX_MS = 6 * 60 * 60 * 1000;
export const unsentWait = (releases = 0) => Math.min(UNSENT_RETRY_MS * 3 ** releases, UNSENT_RETRY_MAX_MS);

/**
 * True for a GitHub day marked uncertain with no write outstanding for its ticket: a sync that stops
 * before it writes (a failed read, a board that changed outside the Office) marks the day uncertain
 * although nothing was sent, and the read-back has no write to check. The board field is an absolute
 * total and the ticket has a saved baseline, so writing the current total afterwards cannot
 * double-count, and the sync still refuses a board that differs from the value the Office last wrote.
 * A day whose write may have landed is not this rule's and keeps its read-back.
 */
export function unsentDay(ledger: TimeLedgerState, entry: TimeEntry): boolean {
    return entry.status === 'uncertain' && !!ledger.baselines?.[entry.key] && !settlementPending(ledger, entry.key);
}

/** Says on the day that nothing was written, and stamps the failure so the next try is paced from it. */
export function markUnsent(entry: TimeEntry, error: unknown, at: Date): void {
    entry.unsentCheckedAt = at.toISOString();
    entry.detail = `Time sync stopped before writing, so nothing was sent; the Office tries again: ${String(error)}`;
}

/** The first such day whose next try is due. There is no last try: the pause grows, and the day stays visible until it posts. */
export function dueUnsent(store: Store, now: Date): TimeEntry | null {
    const ledger = timeLedger(store);
    if (store.project.provider !== 'github' || !ledger.enabled || !ledger.githubField) return null;
    return ledger.entries.find(entry => unsentDay(ledger, entry) && (!entry.unsentCheckedAt || now.getTime() - Date.parse(entry.unsentCheckedAt) >= unsentWait(entry.unsentReleases))) || null;
}

/** Returns that day to pending, so the ordinary sync writes the current total with read-back. */
export function releaseUnsent(store: Store, entryId: string): void {
    const now = store.clock.now(), entry = dueUnsent(store, now);
    if (!entry || entry.id !== entryId) return;
    entry.unsentReleases = (entry.unsentReleases || 0) + 1;
    entry.unsentCheckedAt = now.toISOString();
    entry.status = 'pending';
    entry.detail = `No hours write is outstanding for ${entry.key}; the Office writes the current total again with read-back.`;
    store.emit('time-unsent-released', `${entry.key}: ${entry.detail}`, 'pm', entry.key);
    store.save();
}

/** A day that posted starts afresh: a later failure is paced from the start again. */
export function clearUnsent(entry: TimeEntry): void {
    delete entry.unsentReleases;
    delete entry.unsentCheckedAt;
}
