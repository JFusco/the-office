import type { DatabaseSync } from 'node:sqlite';

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

/** The saved state as text, or null when nothing was ever saved. */
export function savedText(selection: SavedSelection): string | null {
    return selection.source === 'none' ? null : selection.source === 'row' ? selection.row! : joinParts(selection.rows);
}

/**
 * Reads the whole row and the parts through `db` in one snapshot and selects between them. Inside the caller's
 * own transaction it reads that transaction's view; otherwise it opens a read transaction for the two reads. A
 * database from before parts existed has no `state_parts` table and reads as a row alone. Writes nothing.
 */
export function readSaved(db: DatabaseSync): SavedSelection {
    const own = !db.isTransaction;
    if (own) db.exec('BEGIN');
    try {
        const row = db.prepare('SELECT body FROM state WHERE id=1').get() as { body: string } | undefined;
        const parts = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='state_parts'").get()
            ? db.prepare('SELECT key,position,body FROM state_parts ORDER BY position,key').all() as PartRow[] : [];
        return selectSaved(parts, row?.body);
    } finally {
        if (own) db.exec('ROLLBACK');
    }
}
