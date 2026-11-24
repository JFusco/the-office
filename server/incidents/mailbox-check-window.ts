import type { DatabaseSync } from 'node:sqlite';

export interface MailCheckOutcome { id: number; kind: 'mail-delivered' | 'mail-blocked'; at: string }

/** The last completed check by event order, even if a subsequent check has started. */
export function lastMailCheckOutcome(db: Pick<DatabaseSync, 'prepare'>): MailCheckOutcome | null {
    const row = db.prepare("SELECT id, json_extract(body, '$.kind') AS kind, json_extract(body, '$.at') AS at FROM events WHERE json_extract(body, '$.kind') IN ('mail-delivered', 'mail-blocked') ORDER BY id DESC LIMIT 1").get() as MailCheckOutcome | undefined;
    return typeof row?.at === 'string' ? row : null;
}

/** A mailbox check that ended blocked: when it started reading and when it recorded its failure. */
export interface FailedMailCheck { checkedAt: string; blockedAt: string }

/**
 * The project's last mailbox check, read from its persisted event log so that later traffic cannot age
 * it out of the snapshot. `checkMail` records `mail-check` before it reads and `mail-delivered` or
 * `mail-blocked` when it ends; queuing another check records neither. Null unless the latest outcome
 * is a failure and the event before it is the start of that same check.
 */
export function lastFailedMailCheck(db: Pick<DatabaseSync, 'prepare'>): FailedMailCheck | null {
    const rows = db.prepare("SELECT body FROM events WHERE json_extract(body, '$.kind') IN ('mail-check', 'mail-delivered', 'mail-blocked') ORDER BY id DESC LIMIT 2").all() as { body: string }[];
    const [outcome, start] = rows.map(row => JSON.parse(row.body) as { kind?: unknown; at?: unknown });
    return outcome?.kind === 'mail-blocked' && start?.kind === 'mail-check' && typeof outcome.at === 'string' && typeof start.at === 'string' ? { checkedAt: start.at, blockedAt: outcome.at } : null;
}
