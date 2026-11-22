import { createHash } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { OfficeSnapshot } from '../../../src/shared';
import { readSaved, savedText } from '../../../server/store/saved-state';

type Saved = { db: DatabaseSync };

/** The saved state of a store's own connection as text, or null when nothing was ever saved. */
export function savedStateText(store: Saved): string | null {
    return savedText(readSaved(store.db));
}

/** The saved state as a restarted service would read it: parsed from what is stored, so redacted. Throws when nothing was saved. */
export function savedState<T = OfficeSnapshot>(store: Saved): T {
    const text = savedStateText(store);
    if (text === null) throw new Error('Nothing is saved in this store');
    return JSON.parse(text) as T;
}

/**
 * A digest of everything saved in a store's database: its schema version, its schema, and every row of every
 * table except SQLite's planner statistics. Equal digests mean equal contents, so it shows that a pass wrote
 * nothing. Rows are compared as a set, so their physical order does not matter; an integer and a real of the
 * same value differ, as do a text and a blob. A read failure is thrown, never hidden.
 */
export function savedFingerprint(store: Saved): string {
    const { db } = store, hash = createHash('sha256');
    const all = (sql: string) => { const statement = db.prepare(sql); statement.setReadBigInts(true); return statement.all() as Record<string, unknown>[]; };
    const encode = (value: unknown): unknown => value instanceof Uint8Array ? ['blob', Buffer.from(value).toString('hex')]
        : typeof value === 'bigint' ? ['integer', value.toString()] : typeof value === 'number' ? ['real', Object.is(value, -0) ? '-0' : String(value)] : value;
    const text = (row: Record<string, unknown>) => JSON.stringify(Object.entries(row).map(([column, value]) => [column, encode(value)]));
    hash.update(text(all('PRAGMA user_version')[0]));
    const schema = all("SELECT type,name,tbl_name,sql FROM sqlite_master ORDER BY type,name").filter(entry => !/^sqlite_stat[1-4]$/.test(String(entry.tbl_name)));
    for (const entry of schema) hash.update(`\n${text(entry)}`);
    for (const { name } of schema.filter(entry => entry.type === 'table')) {
        hash.update(`\ntable ${JSON.stringify(name)}`);
        for (const row of all(`SELECT * FROM "${String(name).replaceAll('"', '""')}"`).map(text).sort()) hash.update(`\n${row}`);
    }
    return hash.digest('hex');
}
