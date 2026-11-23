import type { DatabaseSync, StatementSync } from 'node:sqlite';
import { sanitizeObject } from '../office/security';
import type { StoreTimings } from './store-timings';
import { joinParts, readSaved, type PartRow, type SavedSelection } from './saved-state';
import { startStateKey } from './start-state-keys';

interface WrittenPart { position: number; raw: string | undefined; redacted: string }

const WRITE_EMPTY_ROW = "INSERT OR REPLACE INTO state(id,body) VALUES(1,'{}')";
const UPDATE_ROW = 'UPDATE state SET body=? WHERE id=1';
const SAVED_PARTS = 'SELECT key,position,body FROM state_parts ORDER BY position,key';
const SAVEPOINT = 'state_parts_save';

/**
 * A project's state saved as one row per top-level key (`state_parts`), so a save redacts and writes only the
 * keys whose content changed. It remembers what it last wrote for each key: the unredacted text it compared and
 * the redacted text it stored.
 *
 * Releases before this one also wrote the whole state as one `state` row. A store opened with that row keeps it
 * in step, byte for byte, while only the keys a service start rewrites change (`start-state-keys.ts`), so a start
 * writes what it always wrote. The first save that changes any other saved key removes the row, and it is never
 * written again: the previous release reads the parts when the row is absent. A saved empty object is the one
 * state the parts cannot hold, so it keeps the row, as the literal `{}`. Top-level keys keep their order through
 * `position`.
 *
 * Another connection may have the same store open (the deployment controller's processes do). So whether the row
 * exists is read inside each write, never remembered, and a row kept in step is rebuilt from the parts as they
 * are saved, with an UPDATE that cannot create it.
 */
export class StateParts {
    private written = new Map<string, WrittenPart>();
    /** The whole `state` row held exactly the joined parts when this connection last read or wrote it. Whether a row exists at all is read in each write. */
    private rowMatchesParts = false;
    /** The part rows in the database are not what `written` says, so the next save replaces them all. */
    private stale = false;
    constructor(private db: DatabaseSync, private statement: (sql: string) => StatementSync, private timings: StoreTimings) {}

    /**
     * The saved state, or null when nothing was ever saved, chosen by the one rule in `saved-state.ts`. Throws
     * when the two saved copies disagree, before anything is changed. `saved` is what the caller already read.
     */
    load(saved: SavedSelection = readSaved(this.db)): unknown {
        this.written = new Map();
        this.rowMatchesParts = saved.rowMatches;
        this.stale = false;
        if (saved.source !== 'parts') return saved.source === 'row' ? JSON.parse(saved.row!) : null;
        return Object.fromEntries(saved.rows.map(({ key, position, body }) => {
            const value: unknown = JSON.parse(body);
            // A stored value becomes live again on load, and redacting it again can change its text.
            const raw = JSON.stringify(sanitizeObject(value)) === body ? body : undefined;
            this.written.set(key, { position, raw, redacted: body });
            return [key, value];
        }));
    }

    /** What is remembered as written, to put back when the database rolls those writes back. */
    mark(): () => void {
        const written = new Map(this.written), stale = this.stale, rowMatchesParts = this.rowMatchesParts;
        return () => { this.written = written; this.stale = stale; this.rowMatchesParts = rowMatchesParts; };
    }

    /**
     * Writes the keys of `state` whose saved text differs from what was last written and returns the size of the
     * whole saved text. `inTransaction` says the caller's transaction already makes these writes one unit;
     * otherwise they get their own. Inside the caller's transaction the save is a savepoint, so a failed save is
     * undone by itself and the caller may still commit its other work. A failed save leaves the database and this
     * memory as they were.
     */
    save(state: object, inTransaction: boolean): number {
        const restore = this.mark();
        this.db.exec(inTransaction ? `SAVEPOINT ${SAVEPOINT}` : 'BEGIN IMMEDIATE');
        try {
            const size = this.write(state);
            this.db.exec(inTransaction ? `RELEASE ${SAVEPOINT}` : 'COMMIT');
            return size;
        } catch (error) {
            // SQLite may already have ended the transaction (RAISE(ROLLBACK), a failed commit). The first failure is the one to report.
            const attempt = (sql: string) => { try { if (this.db.isTransaction) this.db.exec(sql); return true; } catch { return false; } };
            // A save that cannot be undone by itself must not stay committable: the caller's whole transaction goes.
            const undone = attempt(inTransaction ? `ROLLBACK TO ${SAVEPOINT}; RELEASE ${SAVEPOINT}` : 'ROLLBACK') || attempt('ROLLBACK');
            restore();
            // Neither undo worked and the transaction is still open: nothing remembered can be trusted for the
            // part rows, so the next save replaces them all.
            if (!undone && this.db.isTransaction) this.stale = true;
            throw error;
        }
    }

    private write(state: object): number {
        // Keys whose value has no JSON form are left out, exactly as serialising the whole object leaves them out.
        // A key keeps its place among all keys, so one that is cleared and set again in place moves no other key.
        const parts = this.timings.time('save: serialise', () => Object.entries(state).flatMap(([key, value], position) => {
            // The wrapper supplies the owning key to toJSON. Use the captured value for redaction too.
            const entry = JSON.stringify({ [key]: value });
            if (entry === '{}') return [];
            const raw = entry.slice(JSON.stringify(key).length + 2, -1);
            return [{ key, position, raw }];
        }),
        found => found.reduce((sum, part) => sum + part.raw.length, 0));
        const next = new Map<string, WrittenPart>(), differing: string[] = [];
        this.timings.time('save: redact', () => {
            let chars = 0;
            for (const { key, raw, position } of parts) {
                const before = this.written.get(key);
                let redacted: string;
                if (before?.raw === raw) redacted = before.redacted;
                else {
                    redacted = JSON.stringify(sanitizeObject(JSON.parse(raw)));
                    chars += redacted.length;
                }
                // What is saved differs only when the redacted text or the place of the key does: a change that
                // redaction hides leaves the stored bytes as they are.
                if (before?.redacted !== redacted || before.position !== position) differing.push(key);
                next.set(key, { position, raw, redacted });
            }
            return chars;
        }, chars => chars);
        const removed = [...this.written.keys()].filter(key => !next.has(key));
        if (!next.size) return this.writeEmpty(next);
        // Read now, inside the write's transaction: another connection may have removed the row since it was last seen.
        const rowPresent = this.statement('SELECT 1 FROM state WHERE id=1').get() !== undefined;
        // `written` is the last state known to be saved, also while the part rows are stale, so it is what a
        // previous release's row is judged against.
        const otherChange = [...differing, ...removed].some(key => !startStateKey(key));
        const changed = this.stale ? [...next.keys()] : differing;
        if (this.stale) this.statement('DELETE FROM state_parts').run();
        for (const key of changed) {
            const part = next.get(key)!;
            this.statement('INSERT OR REPLACE INTO state_parts(key,position,body) VALUES(?,?,?)').run(key, part.position, part.redacted);
        }
        if (!this.stale) for (const key of removed) this.statement('DELETE FROM state_parts WHERE key=?').run(key);
        if (rowPresent && otherChange) {
            this.statement('DELETE FROM state WHERE id=1').run();
            this.rowMatchesParts = false;
        } else if (rowPresent && (changed.length || removed.length || !this.rowMatchesParts)) {
            // A start is all that has happened since this row was written: keep it as the previous release reads it.
            // It is joined from the parts as saved, which may hold another connection's keys, and only updated.
            this.statement(UPDATE_ROW).run(joinParts(this.statement(SAVED_PARTS).all() as PartRow[]));
            this.rowMatchesParts = true;
        } else if (!rowPresent) this.rowMatchesParts = false;
        this.written = next; this.stale = false;
        return this.size(next);
    }

    /** A saved empty object has no part rows, and no parts with no row would read as never saved: the row holds `{}`. */
    private writeEmpty(next: Map<string, WrittenPart>): number {
        // Judged on what is saved now, not on what is remembered: another connection may have written since.
        if (this.statement('SELECT 1 FROM state_parts LIMIT 1').get()) this.statement('DELETE FROM state_parts').run();
        const row = this.statement('SELECT body FROM state WHERE id=1').get() as { body: string } | undefined;
        if (row?.body !== '{}') this.statement(WRITE_EMPTY_ROW).run();
        this.written = next; this.stale = false; this.rowMatchesParts = true;
        return 2;
    }

    private size(parts: Map<string, WrittenPart>): number {
        let size = 2 + Math.max(0, parts.size - 1);
        for (const [key, part] of parts) size += JSON.stringify(key).length + 1 + part.redacted.length;
        return size;
    }
}
