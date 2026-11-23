/**
 * The loader and writer of the release before the whole `state` row was retired, kept to show that release still
 * reads and writes a store this one saved (a rollback needs no restore).
 *
 * Verbatim from `origin/main` at 7d89ca0 (unchanged since b948b75): the `StateParts` class of `server/store/state-parts.ts` (last changed in
 * eec65d3) with the `joinParts` and `selectSaved` it used from `server/store/saved-state.ts`, whose rule was that
 * a row differing from the parts wins. Only the import paths differ. Do not modernise this file or point it at
 * the current `saved-state.ts`: it must stay independent of the code it is compared with.
 */
import type { StatementSync } from 'node:sqlite';
import { sanitizeObject } from '../../../server/office/security';
import type { StoreTimings } from '../../../server/store/store-timings';

/** One top-level key of a saved state, as `state_parts` holds it: its place among the keys and its redacted JSON text. */
export type PartRow = { key: string; position: number; body: string };

/** Which saved copy is the state, with what was read: `rowMatches` says the whole row is exactly the joined parts. */
export interface SavedSelection { source: 'none' | 'row' | 'parts'; rows: PartRow[]; row: string | undefined; rowMatches: boolean }

/** The text of the whole state from its parts, in order: what serialising the redacted state gives. */
export function joinParts(rows: PartRow[]): string {
    return `{${rows.map(({ key, body }) => `${JSON.stringify(key)}:${body}`).join(',')}}`;
}

/**
 * The one rule for which saved copy is the state. `rows` are the part rows in `position, key` order and `row`
 * is the body of the whole `state` row, if there is one. With no parts the row is the state. A row that differs
 * from the joined parts was written without them (by a release from before parts existed, after a rollback),
 * so the row is the state and the parts are stale. Otherwise the parts are the state.
 */
export function selectSaved(rows: PartRow[], row: string | undefined): SavedSelection {
    const rowMatches = row !== undefined && row === joinParts(rows);
    const source = rows.length && (row === undefined || rowMatches) ? 'parts' : row === undefined ? 'none' : 'row';
    return { source, rows, row, rowMatches };
}

interface WrittenPart { position: number; raw: string | undefined; redacted: string }

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
    private rowMatchesParts = false;
    /** The part rows in the database are not what `written` says, so the next save replaces them all. */
    private stale = false;
    constructor(private statement: (sql: string) => StatementSync, private exec: (sql: string) => void, private timings: StoreTimings) {}

    /**
     * The saved state, or null when nothing was ever saved, chosen by the one rule in `saved-state.ts`.
     */
    load(): unknown {
        const row = this.statement('SELECT body FROM state WHERE id=1').get() as { body: string } | undefined;
        const rows = this.statement('SELECT key,position,body FROM state_parts ORDER BY position,key').all() as PartRow[];
        const saved = selectSaved(rows, row?.body);
        this.written = new Map();
        this.rowMatchesParts = saved.rowMatches;
        this.stale = rows.length > 0 && saved.source === 'row';
        if (saved.source !== 'parts') return saved.source === 'row' ? JSON.parse(saved.row!) : null;
        return Object.fromEntries(rows.map(({ key, position, body }) => {
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
            // Inside the caller's transaction some part rows may already be written and may yet be committed:
            // nothing remembered can be trusted for them, so the next save replaces every part.
            if (inTransaction) this.stale = true;
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
        const next = new Map<string, WrittenPart>(), changed: string[] = [];
        this.timings.time('save: redact', () => {
            let chars = 0;
            for (const { key, raw, position } of parts) {
                const before = this.stale ? undefined : this.written.get(key);
                let redacted: string;
                if (before?.raw === raw) redacted = before.redacted;
                else {
                    redacted = JSON.stringify(sanitizeObject(JSON.parse(raw)));
                    chars += redacted.length;
                }
                if (before?.raw !== raw || before.position !== position) changed.push(key);
                next.set(key, { position, raw, redacted });
            }
            return chars;
        }, chars => chars);
        const removed = this.stale ? [] : [...this.written.keys()].filter(key => !next.has(key));
        if (this.rowMatchesParts && !this.stale && !changed.length && !removed.length) return this.size(next);
        if (this.stale) this.statement('DELETE FROM state_parts').run();
        for (const key of changed) {
            const part = next.get(key)!;
            this.statement('INSERT OR REPLACE INTO state_parts(key,position,body) VALUES(?,?,?)').run(key, part.position, part.redacted);
        }
        for (const key of removed) this.statement('DELETE FROM state_parts WHERE key=?').run(key);
        const body = joinParts([...next].map(([key, part]) => ({ key, position: part.position, body: part.redacted })));
        this.statement(ROW).run(body);
        this.written = next; this.stale = false; this.rowMatchesParts = true;
        return body.length;
    }

    private size(parts: Map<string, WrittenPart>): number {
        let size = 2 + Math.max(0, parts.size - 1);
        for (const [key, part] of parts) size += JSON.stringify(key).length + 1 + part.redacted.length;
        return size;
    }
}
