import { afterEach, expect, test } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { joinParts, readSaved, savedText, selectSaved, type PartRow } from '../../../server/store/saved-state';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { sanitizeObject } from '../../../server/office/security';
import { savedFingerprint, savedState, savedStateText } from './saved-state';

const stores: Store[] = [], dbs: DatabaseSync[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); dbs.splice(0).forEach(db => db.close()); });
const parts: PartRow[] = [{ key: 'a', position: 0, body: '1' }, { key: 'b "quoted"', position: 1, body: '{"c":[true,null]}' }];
const joined = '{"a":1,"b \\"quoted\\"":{"c":[true,null]}}';

test('parts join to the text that serialising the state gives', () => {
    expect(joinParts(parts)).toBe(joined);
    expect(JSON.parse(joinParts(parts))).toEqual({ a: 1, 'b "quoted"': { c: [true, null] } });
    expect(joinParts([])).toBe('{}');
});

test.each<[string, PartRow[], string | undefined, 'none' | 'row' | 'parts', boolean, string | null]>([
    ['nothing saved', [], undefined, 'none', false, null],
    ['a row and no parts', [], '{"a":2}', 'row', false, '{"a":2}'],
    ['a saved empty object', [], '{}', 'row', true, '{}'],
    ['parts and no row', parts, undefined, 'parts', false, joined],
    ['a row equal to the parts', parts, joined, 'parts', true, joined],
    ['a row that differs from the parts', parts, '{"a":2}', 'row', false, '{"a":2}'],
])('the one rule: %s', (_name, rows, row, source, rowMatches, text) => {
    const selection = selectSaved(rows, row);
    expect(selection).toEqual({ source, rows, row, rowMatches });
    expect(savedText(selection)).toBe(text);
});

function database(schema = true) {
    const db = new DatabaseSync(':memory:'); dbs.push(db);
    db.exec('CREATE TABLE state(id INTEGER PRIMARY KEY, body TEXT NOT NULL)');
    if (schema) db.exec('CREATE TABLE state_parts(key TEXT PRIMARY KEY, position INTEGER NOT NULL, body TEXT NOT NULL)');
    return db;
}
const put = (db: DatabaseSync, rows: PartRow[]) => rows.forEach(row => db.prepare('INSERT OR REPLACE INTO state_parts VALUES(?,?,?)').run(row.key, row.position, row.body));

test('a connection is read as its row and its parts in position order, and a database from before parts reads as its row', () => {
    const db = database();
    put(db, [...parts].reverse());
    expect(readSaved(db)).toEqual({ source: 'parts', rows: parts, row: undefined, rowMatches: false });
    db.prepare('INSERT INTO state VALUES(1,?)').run('{"a":2}');
    expect(savedText(readSaved(db))).toBe('{"a":2}');
    const legacy = database(false);
    expect(readSaved(legacy).source).toBe('none');
    legacy.prepare('INSERT INTO state VALUES(1,?)').run('{"old":true}');
    expect(readSaved(legacy)).toEqual({ source: 'row', rows: [], row: '{"old":true}', rowMatches: false });
});

test('a read leaves no transaction open, and inside the caller\'s transaction reads what that transaction wrote', () => {
    const db = database();
    put(db, parts);
    readSaved(db);
    expect(db.isTransaction).toBe(false);
    db.exec('BEGIN IMMEDIATE');
    put(db, [{ key: 'a', position: 0, body: '9' }]);
    expect(JSON.parse(savedText(readSaved(db))!).a).toBe(9);
    expect(db.isTransaction).toBe(true);
    db.exec('ROLLBACK');
    expect(JSON.parse(savedText(readSaved(db))!).a).toBe(1);
});

test('a store\'s saved state is what a restart reads: the redacted text of its state', () => {
    const store = new Store(':memory:', projectById('brain')); stores.push(store);
    store.state.pilotKey = 'GH-7';
    (store.state as unknown as Record<string, unknown>).probe = { note: 'password=hunter2 and more' };
    store.save();
    expect(savedStateText(store)).toBe(JSON.stringify(sanitizeObject(store.state)));
    expect(savedState(store).pilotKey).toBe('GH-7');
    expect(JSON.stringify(savedState(store))).not.toContain('hunter2');
    expect(() => savedState({ db: database() })).toThrow('Nothing is saved');
});

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
