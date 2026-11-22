import { createHash } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';

/**
 * A digest of everything saved in a store's database: its schema version, its schema, and every row of every
 * table except SQLite's planner statistics. Equal digests mean equal contents, so it shows that a pass wrote
 * nothing. Rows are compared as a set, so their physical order does not matter; an integer and a real of the
 * same value differ, as do a text and a blob. Everything is read in one snapshot: its own read transaction, or
 * the caller's when one is open. A read failure is thrown, never hidden. `afterTable` is called after each table
 * is read, for the test that another connection's commit in between is not seen.
 */
export function savedFingerprint(store: { db: DatabaseSync }, afterTable: (name: string) => void = () => {}): string {
    const { db } = store, hash = createHash('sha256'), own = !db.isTransaction;
    const all = (sql: string) => { const statement = db.prepare(sql); statement.setReadBigInts(true); return statement.all() as Record<string, unknown>[]; };
    const encode = (value: unknown): unknown => value instanceof Uint8Array ? ['blob', Buffer.from(value).toString('hex')]
        : typeof value === 'bigint' ? ['integer', value.toString()] : typeof value === 'number' ? ['real', Object.is(value, -0) ? '-0' : String(value)] : value;
    const text = (row: Record<string, unknown>) => JSON.stringify(Object.entries(row).map(([column, value]) => [column, encode(value)]));
    if (own) db.exec('BEGIN');
    try {
        hash.update(text(all('PRAGMA user_version')[0]));
        const schema = all("SELECT type,name,tbl_name,sql FROM sqlite_master ORDER BY type,name").filter(entry => !/^sqlite_stat[1-4]$/.test(String(entry.tbl_name)));
        for (const entry of schema) hash.update(`\n${text(entry)}`);
        for (const { name } of schema.filter(entry => entry.type === 'table')) {
            hash.update(`\ntable ${JSON.stringify(name)}`);
            for (const row of all(`SELECT * FROM "${String(name).replaceAll('"', '""')}"`).map(text).sort()) hash.update(`\n${row}`);
            afterTable(String(name));
        }
    } finally {
        if (own && db.isTransaction) db.exec('ROLLBACK');
    }
    return hash.digest('hex');
}
