import type { DatabaseSync, StatementSync } from 'node:sqlite';
import { sanitizeObject } from '../office/security';
import type { StoreTimings } from './store-timings';
import { joinParts, readSaved, type PartRow } from './saved-state';
import { startStateKey } from './start-state-keys';

interface WrittenPart { position: number; raw: string | undefined; redacted: string }

const WRITE_EMPTY_ROW = "INSERT OR REPLACE INTO state(id,body) VALUES(1,'{}')";
const UPDATE_ROW = 'UPDATE state SET body=? WHERE id=1';
const SAVED_PARTS = 'SELECT key,position,body FROM state_parts ORDER BY position,key';
const ANY_PART = 'SELECT 1 FROM state_parts LIMIT 1';
const DATA_VERSION = 'PRAGMA data_version';
const SAVEPOINT = 'state_parts_save';
const partSize = (key: string, body: string) => JSON.stringify(key).length + 1 + body.length;

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
 * exists is trusted only while no other connection has committed since it was read (`PRAGMA data_version`), and
 * is read again inside the write otherwise; a row kept in step is rebuilt from the parts as they are saved, with
 * an UPDATE that cannot create it.
 */
export class StateParts {
    private written = new Map<string, WrittenPart>();
    /** The whole `state` row held exactly the joined parts when this connection last read or wrote it. */
    private rowMatchesParts = false;
    /** Whether the row exists, as of `seenVersion`; undefined until a write has read it. */
    private rowPresent: boolean | undefined;
    private seenVersion = -1;
    /** The saved text length when another writer's edits may make it differ from the last input. */
    private persistedSize: number | undefined;
    /** The part rows in the database are not what `written` says, so the next save replaces them all. */
    private stale = false;
    constructor(private db: DatabaseSync, private statement: (sql: string) => StatementSync, private timings: StoreTimings) {}

    /**
     * The saved state, or null when nothing was ever saved, chosen by the one rule in `saved-state.ts`. Throws
     * when the two saved copies disagree, before anything is changed.
     */
    load(): unknown {
        // Sample before reading so a concurrent commit during the load also forces a refresh at save.
        const version = this.dataVersion(this.db.prepare(DATA_VERSION));
        const saved = readSaved(this.db);
        this.written = new Map();
        this.rowMatchesParts = saved.rowMatches;
        this.stale = false; this.rowPresent = undefined; this.persistedSize = undefined; this.seenVersion = version;
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
        const { stale, rowMatchesParts, rowPresent, seenVersion, persistedSize } = this, written = new Map(this.written);
        return () => { Object.assign(this, { written, stale, rowMatchesParts, rowPresent, seenVersion, persistedSize }); };
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
            // Neither undo worked and the transaction is still open with part of this save in it. It must not be
            // committed: the connection is closed, which discards the transaction. The store is unusable after this.
            if (!undone) { this.stale = true; try { if (this.db.isTransaction) this.db.close(); } catch { /* The save's failure is the one to report. */ } }
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
        const version = this.dataVersion();
        if (!next.size) {
            if (this.statement(ANY_PART).get()) this.statement('DELETE FROM state_parts').run();
            return this.writeEmpty(next, version);
        }

        const changedElsewhere = this.seenVersion !== -1 && version !== this.seenVersion;
        // The last input tracks this writer's edits. Other connections may have changed the saved parts since.
        const partsMayDiffer = changedElsewhere || this.persistedSize !== undefined;
        const rowPresent = this.rowExists(version);
        const changed = partsMayDiffer ? differing.filter(key => {
            const { position, redacted } = next.get(key)!;
            return !this.statement('SELECT 1 FROM state_parts WHERE key=? AND position=? AND body=?').get(key, position, redacted);
        }) : differing;
        let otherChange = changed.some(key => !startStateKey(key));
        const writes = this.stale ? [...next.keys()] : changed;
        if (this.stale) {
            this.statement('DELETE FROM state_parts').run();
            otherChange ||= removed.some(key => !startStateKey(key));
        }
        for (const key of writes) {
            const part = next.get(key)!;
            this.statement('INSERT OR REPLACE INTO state_parts(key,position,body) VALUES(?,?,?)').run(key, part.position, part.redacted);
        }
        let partsChanged = writes.length > 0;
        if (!this.stale) for (const key of removed) {
            if (!this.statement('DELETE FROM state_parts WHERE key=?').run(key).changes) continue;
            partsChanged = true;
            otherChange ||= !startStateKey(key);
        }
        // Another writer may have removed the keys that the last input still names.
        if (!writes.length && removed.length && !this.statement(ANY_PART).get()) return this.writeEmpty(next, version);

        let size = changedElsewhere || partsChanged ? undefined : this.persistedSize;
        let savedParts: PartRow[] | undefined;
        if (rowPresent && otherChange) {
            this.statement('DELETE FROM state WHERE id=1').run();
            this.rowPresent = false;
            this.rowMatchesParts = false;
        } else if (rowPresent && (partsChanged || (!partsMayDiffer && !this.rowMatchesParts))) {
            // A start is all that has happened since this row was written. Join the parts as saved,
            // including other writers' edits, and update only the existing row.
            savedParts = this.statement(SAVED_PARTS).all() as PartRow[];
            const joined = joinParts(savedParts);
            this.statement(UPDATE_ROW).run(joined);
            this.rowMatchesParts = true;
            size = joined.length;
        }
        this.written = next; this.stale = false;
        if (partsMayDiffer && (savedParts || size === undefined)) {
            savedParts ??= this.statement('SELECT key,position,body FROM state_parts').all() as PartRow[];
            size ??= this.measureParts(savedParts);
            // Once the saved parts and the input agree again, use the ordinary path on subsequent saves.
            this.persistedSize = this.partsMatch(savedParts, next) ? undefined : size;
        }
        return size ?? this.size(next);
    }

    /** Assumes there are no parts. Keep the last input so another writer's removals stay removed on repeat saves. */
    private writeEmpty(next: Map<string, WrittenPart>, version: number): number {
        const row = this.statement('SELECT body FROM state WHERE id=1').get() as { body: string } | undefined;
        if (row?.body !== '{}') this.statement(WRITE_EMPTY_ROW).run();
        this.written = next; this.stale = false; this.rowMatchesParts = true; this.rowPresent = true;
        this.persistedSize = next.size ? 2 : undefined;
        this.seenVersion = version;
        return 2;
    }

    /** Changes when another connection commits, never for this connection's own writes. */
    private dataVersion(statement = this.statement(DATA_VERSION)): number {
        return (statement.get() as { data_version: number }).data_version;
    }

    /** Whether the whole row exists: remembered while no other connection has committed since it was read. */
    private rowExists(version: number): boolean {
        if (this.rowPresent === undefined || version !== this.seenVersion) {
            this.rowPresent = this.statement('SELECT 1 FROM state WHERE id=1').get() !== undefined;
            this.seenVersion = version;
            if (!this.rowPresent) this.rowMatchesParts = false;
        }
        return this.rowPresent;
    }

    /** Measure in JavaScript string lengths, including JSON escaping of keys, without joining the parts. */
    private measureParts(rows: PartRow[]): number {
        let size = 2 + Math.max(0, rows.length - 1);
        for (const { key, body } of rows) size += partSize(key, body);
        return size;
    }

    private partsMatch(rows: PartRow[], parts: Map<string, WrittenPart>): boolean {
        return rows.length === parts.size && rows.every(({ key, position, body }) => {
            const part = parts.get(key);
            return part?.position === position && part.redacted === body;
        });
    }

    private size(parts: Map<string, WrittenPart>): number {
        let size = 2 + Math.max(0, parts.size - 1);
        for (const [key, part] of parts) size += partSize(key, part.redacted);
        return size;
    }
}
