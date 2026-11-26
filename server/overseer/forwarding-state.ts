import type { DatabaseSync } from 'node:sqlite';
import { FailureReceipt, HaltReport } from '../incidents/runner-report';

/**
 * What the runner knows about its reports to one Office origin, kept in its private Store beside
 * Effects (which keeps the evidence of each dispatch): for every journal event, the digest it was
 * forwarded as, the attempt in use, and the Office's receipt or why it conflicts; where the next
 * pass resumes its turns; and its halt reports. Runner-only tables, created when first used.
 */

export interface ForwardRecord {
    eventId: string;
    /** The digest of the journal entry this record is for: a different entry under the same ID never inherits it. */
    digest: string;
    /** The attempt whose intent is `forward:<event>:<attempt>`; it advances only past a send refused before dispatch. */
    attempt: number;
    receipt: FailureReceipt | null;
    conflict: string | null;
    /** Why it is not forwarded yet, as the last pass saw it. */
    reason: string;
}

/** Where the next pass takes its first turn, and the last event each kind of turn examined. */
export interface ForwardCursor { turn: 'send' | 'read'; sendAfter: string | null; readAfter: string | null }

export interface HaltState {
    /** The highest sequence this runner used or saw at the Office. */
    highWater: number;
    /** A report frozen before dispatch and not yet confirmed, with the attempt its intent uses. */
    pending: HaltReport | null;
    attempt: number;
    /** The last report the Office was read back holding as this runner sent it. */
    confirmed: HaltReport | null;
    conflict: string | null;
    displaced?: { report: HaltReport; attempt: number }[];
}

const EMPTY_HALT: HaltState = { highWater: 0, pending: null, attempt: 1, confirmed: null, conflict: null };

export class ForwardingState {
    constructor(private db: DatabaseSync) {}

    prepareFailures(): void {
        const { db } = this;
        db.exec('CREATE TABLE IF NOT EXISTS overseer_forward (origin TEXT NOT NULL, event_id TEXT NOT NULL, body TEXT NOT NULL, PRIMARY KEY(origin, event_id))');
        db.exec('CREATE TABLE IF NOT EXISTS overseer_forward_cursor (origin TEXT PRIMARY KEY, body TEXT NOT NULL)');
        db.exec('CREATE INDEX IF NOT EXISTS overseer_forward_event ON overseer_forward(event_id)');
    }

    prepareHalt(): void {
        this.db.exec('CREATE TABLE IF NOT EXISTS overseer_halt (origin TEXT PRIMARY KEY, body TEXT NOT NULL)');
    }

    record(origin: string, eventId: string): ForwardRecord | null {
        const row = this.db.prepare('SELECT body FROM overseer_forward WHERE origin=? AND event_id=?').get(origin, eventId) as { body: string } | undefined;
        if (!row) return null;
        return this.parseRecord(row.body, eventId);
    }

    otherRecords(origin: string, eventId: string): { origin: string; record: ForwardRecord }[] {
        const rows = this.db.prepare('SELECT origin, body FROM overseer_forward WHERE event_id=? AND origin<>?').all(eventId, origin) as { origin: string; body: string }[];
        return rows.map(row => ({ origin: row.origin, record: this.parseRecord(row.body, eventId) }));
    }

    private parseRecord(body: string, eventId: string): ForwardRecord {
        const saved = JSON.parse(body) as ForwardRecord;
        if (saved?.eventId !== eventId || !Number.isSafeInteger(saved.attempt) || saved.attempt < 1 ||
            typeof saved.digest !== 'string' || !/^[a-f0-9]{64}$/.test(saved.digest) || typeof saved.reason !== 'string' ||
            (saved.conflict !== null && typeof saved.conflict !== 'string'))
            throw new Error('The saved forwarding record is invalid');
        const receipt = saved.receipt === null ? null : FailureReceipt.parse(saved.receipt);
        if (receipt && (receipt.eventId !== eventId || receipt.digest !== saved.digest))
            throw new Error('The saved forwarding receipt does not match its journal entry');
        return { ...saved, receipt };
    }

    save(origin: string, record: ForwardRecord): void {
        this.db.prepare('INSERT INTO overseer_forward(origin,event_id,body) VALUES(?,?,?) ON CONFLICT(origin,event_id) DO UPDATE SET body=excluded.body')
            .run(origin, record.eventId, JSON.stringify({ ...record, reason: record.reason.slice(0, 500), conflict: record.conflict?.slice(0, 500) ?? null }));
    }

    cursor(origin: string): ForwardCursor {
        const row = this.db.prepare('SELECT body FROM overseer_forward_cursor WHERE origin=?').get(origin) as { body: string } | undefined;
        return row ? JSON.parse(row.body) as ForwardCursor : { turn: 'send', sendAfter: null, readAfter: null };
    }

    saveCursor(origin: string, cursor: ForwardCursor): void {
        this.db.prepare('INSERT INTO overseer_forward_cursor(origin,body) VALUES(?,?) ON CONFLICT(origin) DO UPDATE SET body=excluded.body').run(origin, JSON.stringify(cursor));
    }

    halt(origin: string): HaltState {
        const row = this.db.prepare('SELECT body FROM overseer_halt WHERE origin=?').get(origin) as { body: string } | undefined;
        if (!row) return { ...EMPTY_HALT };
        const saved = JSON.parse(row.body) as HaltState;
        return {
            ...saved, pending: saved.pending ? HaltReport.parse(saved.pending) : null,
            confirmed: saved.confirmed ? HaltReport.parse(saved.confirmed) : null,
            displaced: saved.displaced?.map(({ report, attempt }) => ({ report: HaltReport.parse(report), attempt })),
        };
    }

    otherHalts(origin: string): { origin: string; halt: HaltState }[] {
        const rows = this.db.prepare('SELECT origin FROM overseer_halt WHERE origin<>?').all(origin) as { origin: string }[];
        return rows.map(row => ({ origin: row.origin, halt: this.halt(row.origin) }));
    }

    saveHalt(origin: string, halt: HaltState): void {
        this.db.prepare('INSERT INTO overseer_halt(origin,body) VALUES(?,?) ON CONFLICT(origin) DO UPDATE SET body=excluded.body').run(origin, JSON.stringify(halt));
    }
}
