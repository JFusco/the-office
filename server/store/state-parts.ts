import type { StatementSync } from 'node:sqlite';
import { sanitizeObject } from '../office/security';
import type { StoreTimings } from './store-timings';

interface WrittenPart { position: number; raw: string; redacted: string }
type PartRow = { key: string; body: string };

const ROW = 'INSERT OR REPLACE INTO state(id,body) VALUES(1,?)';

/**
 * A project's state saved as one row per top-level key (`state_parts`), so a save redacts and writes only the
 * keys whose content changed. It remembers what it last wrote for each key: the unredacted text it compared and
 * the redacted text it stored.
 *
 * For this release the whole `state` row is still written with every change, joined from the redacted parts and
 * byte-for-byte what `JSON.stringify(sanitizeObject(state))` gives, so the previous release can still read a
 * current state. Top-level keys keep their order through `position`.
 */
export class StateParts {
    private written = new Map<string, WrittenPart>();
    /** The part rows in the database are not what `written` says, so the next save replaces them all. */
    private stale = false;
    constructor(private statement: (sql: string) => StatementSync, private exec: (sql: string) => void, private timings: StoreTimings) {}

    /**
     * The saved state, or null when nothing was ever saved. Parts are used only when they are exactly what the
     * `state` row holds; a row written without them (by the previous release, after a rollback) wins.
     */
    load(): unknown {
        const row = this.statement('SELECT body FROM state WHERE id=1').get() as { body: string } | undefined;
        const rows = this.statement('SELECT key,body FROM state_parts ORDER BY position,key').all() as PartRow[];
        this.written = new Map(); this.stale = false;
        if (!rows.length) return row ? JSON.parse(row.body) : null;
        if (row && row.body !== whole(rows)) { this.stale = true; return JSON.parse(row.body); }
        // What was stored is already redacted and in the form it serialises to again, so it is also the text to compare with.
        rows.forEach(({ key, body }, position) => this.written.set(key, { position, raw: body, redacted: body }));
        return Object.fromEntries(rows.map(({ key, body }) => [key, JSON.parse(body)]));
    }

    /** What is remembered as written, to put back when the database rolls those writes back. */
    mark(): () => void {
        const written = new Map(this.written), stale = this.stale;
        return () => { this.written = written; this.stale = stale; };
    }

    /**
     * Writes the keys of `state` that differ from what was last written and returns the size of the whole saved
     * text. `inTransaction` says the caller's transaction already makes these writes one unit; otherwise they get
     * their own. A failed save leaves the database and this memory as they were.
     */
    save(state: object, inTransaction: boolean): number {
        const restore = this.mark();
        if (!inTransaction) this.exec('BEGIN IMMEDIATE');
        try {
            const size = this.write(state);
            if (!inTransaction) this.exec('COMMIT');
            return size;
        } catch (error) {
            if (!inTransaction) { try { this.exec('ROLLBACK'); } catch { /* The first failure is the one to report. */ } }
            restore();
            throw error;
        }
    }

    private write(state: object): number {
        // Keys whose value has no JSON form are left out, exactly as serialising the whole object leaves them out.
        const parts = this.timings.time('save: serialise', () => Object.entries(state)
            .map(([key, value]) => ({ key, value, raw: JSON.stringify(value) as string | undefined }))
            .filter((part): part is { key: string; value: unknown; raw: string } => part.raw !== undefined),
        found => found.reduce((sum, part) => sum + part.raw.length, 0));
        const next = new Map<string, WrittenPart>(), changed: string[] = [];
        this.timings.time('save: redact', () => parts.forEach(({ key, value, raw }, position) => {
            const before = this.stale ? undefined : this.written.get(key);
            const redacted = before?.raw === raw ? before.redacted : JSON.stringify(sanitizeObject(value));
            if (!before || before.raw !== raw || before.position !== position) changed.push(key);
            next.set(key, { position, raw, redacted });
        }), () => changed.reduce((sum, key) => sum + next.get(key)!.redacted.length, 0));
        const removed = this.stale ? [] : [...this.written.keys()].filter(key => !next.has(key));
        if (!this.stale && !changed.length && !removed.length) return this.size(next);
        if (this.stale) this.statement('DELETE FROM state_parts').run();
        for (const key of changed) {
            const part = next.get(key)!;
            this.statement('INSERT OR REPLACE INTO state_parts(key,position,body) VALUES(?,?,?)').run(key, part.position, part.redacted);
        }
        for (const key of removed) this.statement('DELETE FROM state_parts WHERE key=?').run(key);
        const body = whole([...next].map(([key, part]) => ({ key, body: part.redacted })));
        this.statement(ROW).run(body);
        this.written = next; this.stale = false;
        return body.length;
    }

    private size(parts: Map<string, WrittenPart>): number {
        let size = 2 + Math.max(0, parts.size - 1);
        for (const [key, part] of parts) size += JSON.stringify(key).length + 1 + part.redacted.length;
        return size;
    }
}

/** The text of the whole state from its redacted parts, in order: what serialising the redacted state gives. */
function whole(rows: PartRow[]): string {
    return `{${rows.map(({ key, body }) => `${JSON.stringify(key)}:${body}`).join(',')}}`;
}
