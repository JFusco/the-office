import type { DatabaseSync } from 'node:sqlite';

/** One top-level key of a saved state, as `state_parts` holds it: its place among the keys and its redacted JSON text. */
export type PartRow = { key: string; position: number; body: string };

/** Which saved copy is the state, with what was read: `rowMatches` says the whole row is exactly the joined parts. */
export interface SavedSelection { source: 'none' | 'row' | 'parts'; rows: PartRow[]; row: string | undefined; rowMatches: boolean }

/** A store whose two saved copies disagree. Nothing was changed; a person decides which copy is the state. */
export class SavedStateConflict extends Error {
    constructor(readonly database: string) {
        super(`The saved state in ${database} exists in two copies that disagree: the whole state row and the state parts. Neither was changed and this store was not opened. See "A store whose saved copies disagree" in docs/office-process.md.`);
        this.name = 'SavedStateConflict';
    }
}

/** The text of the whole state from its parts, in order: what serialising the redacted state gives. */
export function joinParts(rows: PartRow[]): string {
    return `{${rows.map(({ key, body }) => `${JSON.stringify(key)}:${body}`).join(',')}}`;
}

/**
 * The one rule for which saved copy is the state. `rows` are the part rows in `position, key` order and `row`
 * is the body of the whole `state` row, if there is one. With no parts the row is the state: a store from before
 * parts existed, or a saved empty object. With parts and no row, or a row that is byte for byte the joined parts,
 * the parts are the state. With parts and a row that differs, the two copies disagree. Only a release from before
 * parts existed writes the row alone, and it may have started from the row or, finding none, from nothing; the
 * bytes cannot say which, so neither copy is taken: `SavedStateConflict`, naming `database`, is thrown.
 */
export function selectSaved(rows: PartRow[], row: string | undefined, database: string): SavedSelection {
    const rowMatches = row !== undefined && row === joinParts(rows);
    if (rows.length && row !== undefined && !rowMatches) throw new SavedStateConflict(database);
    return { source: rows.length ? 'parts' : row === undefined ? 'none' : 'row', rows, row, rowMatches };
}

/** The saved state as text, or null when nothing was ever saved. */
export function savedText(selection: SavedSelection): string | null {
    return selection.source === 'none' ? null : selection.source === 'row' ? selection.row! : joinParts(selection.rows);
}

/**
 * Reads the whole row and the parts through `db` in one snapshot and selects between them. Inside the caller's
 * own transaction it reads that transaction's view; otherwise it opens a read transaction for the two reads. A
 * database from before parts existed has no `state_parts` table and reads as a row alone, and one with no `state`
 * table has nothing saved. Writes nothing, and sets nothing on the connection or the file. Throws
 * `SavedStateConflict`, naming the database, when the two copies disagree.
 */
export function readSaved(db: DatabaseSync): SavedSelection {
    const own = !db.isTransaction;
    if (own) db.exec('BEGIN');
    try {
        const table = (name: string) => !!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name);
        const row = table('state') ? db.prepare('SELECT body FROM state WHERE id=1').get() as { body: string } | undefined : undefined;
        const parts = table('state_parts') ? db.prepare('SELECT key,position,body FROM state_parts ORDER BY position,key').all() as PartRow[] : [];
        return selectSaved(parts, row?.body, db.location() ?? ':memory:');
    } finally {
        // SQLite may already have ended the transaction after a failed read: the first failure is the one to report.
        if (own && db.isTransaction) db.exec('ROLLBACK');
    }
}
