import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { savedFingerprint } from './saved-fingerprint-fixture';

type PartRow = { key: string; position: number; body: string };
const dbs: DatabaseSync[] = [], dirs: string[] = [];
afterEach(() => { dbs.splice(0).forEach(db => db.close()); dirs.splice(0).forEach(dir => rmSync(dir, { recursive: true, force: true })); });
const parts: PartRow[] = [{ key: 'a', position: 0, body: '1' }, { key: 'b', position: 1, body: '{"c":[true,null]}' }];
function database(path = ':memory:') {
    const db = new DatabaseSync(path); dbs.push(db);
    db.exec('CREATE TABLE IF NOT EXISTS state(id INTEGER PRIMARY KEY, body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS state_parts(key TEXT PRIMARY KEY, position INTEGER NOT NULL, body TEXT NOT NULL)');
    return db;
}
const put = (db: DatabaseSync, rows: PartRow[]) => rows.forEach(row => db.prepare('INSERT OR REPLACE INTO state_parts VALUES(?,?,?)').run(row.key, row.position, row.body));

test('the fingerprint is stable between reads and changes with any saved value, its type, or the schema', () => {
    const db = database();
    db.exec('CREATE TABLE other(id INTEGER PRIMARY KEY, n, payload BLOB) ; CREATE TABLE keyed(k TEXT PRIMARY KEY, v) WITHOUT ROWID');
    // Written as SQL literals: a JavaScript number is bound as a real.
    db.exec("INSERT INTO other VALUES(1,5,x'0102')");
    db.prepare('INSERT INTO keyed VALUES(?,?)').run('x', 'text');
    put(db, parts);
    const store = { db }, first = savedFingerprint(store);
    expect(savedFingerprint(store)).toBe(first);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    const changes: [string, string][] = [
        ['an integer becomes a real', 'UPDATE other SET n=5.0'], ['a blob changes', "UPDATE other SET payload=x'0103'"], ['a text becomes a blob', "UPDATE keyed SET v=x'74657874'"],
        ['a part row is deleted', "DELETE FROM state_parts WHERE key='a'"], ['a part moves', "UPDATE state_parts SET position=7 WHERE key='a'"],
        ['a row is added to a table without a rowid', "INSERT INTO keyed VALUES('y','text')"], ['the whole row appears', "INSERT INTO state VALUES(1,'{}')"],
        ['the schema version changes', 'PRAGMA user_version=3'], ['a table is added', 'CREATE TABLE added(id)'],
    ];
    for (const [name, sql] of changes) {
        db.exec('SAVEPOINT change'); db.exec(sql);
        expect(savedFingerprint(store), name).not.toBe(first);
        db.exec('ROLLBACK TO change'); db.exec('RELEASE change');
        if (name === 'the schema version changes') db.exec('PRAGMA user_version=0');
        expect(savedFingerprint(store), `${name}, undone`).toBe(first);
    }
});

test('the fingerprint ignores planner statistics and the physical order of rows, and a failed read is thrown', () => {
    const db = database();
    put(db, parts);
    const store = { db }, first = savedFingerprint(store);
    db.exec('CREATE INDEX by_position ON state_parts(position)');
    const indexed = savedFingerprint(store);
    db.exec('ANALYZE');
    expect(savedFingerprint(store)).toBe(indexed);
    expect(indexed).not.toBe(first);
    db.exec("DELETE FROM state_parts WHERE key='a'");
    put(db, [parts[0]]);
    expect(savedFingerprint(store)).toBe(indexed);
    db.close(); dbs.splice(dbs.indexOf(db), 1);
    expect(() => savedFingerprint(store)).toThrow();
});

test('a fingerprint is one snapshot: another connection\'s commit between two tables is not in it, and is in the next', () => {
    const dir = mkdtempSync(join(tmpdir(), 'office-fingerprint-')); dirs.push(dir);
    const path = join(dir, 'office.sqlite'), reader = database(path);
    reader.exec('PRAGMA journal_mode=WAL; CREATE TABLE admissions(id INTEGER PRIMARY KEY, kind TEXT)');
    put(reader, parts);
    const writer = database(path), store = { db: reader }, before = savedFingerprint(store);
    let committed = false;
    const during = savedFingerprint(store, () => {
        if (committed) return;
        committed = true;
        writer.exec("BEGIN IMMEDIATE; INSERT INTO admissions(kind) VALUES('claim'); UPDATE state_parts SET body='2' WHERE key='a'; COMMIT");
    });
    expect(committed).toBe(true);
    expect(during).toBe(before);
    expect(reader.isTransaction).toBe(false);
    expect(savedFingerprint(store)).not.toBe(before);
});

test('a caller\'s transaction stays open, and a failed read ends the one the fingerprint opened', () => {
    const db = database();
    put(db, parts);
    db.exec('BEGIN');
    savedFingerprint({ db });
    expect(db.isTransaction).toBe(true);
    db.exec('ROLLBACK');
    expect(() => savedFingerprint({ db }, () => { throw new Error('read failed'); })).toThrow('read failed');
    expect(db.isTransaction).toBe(false);
});
