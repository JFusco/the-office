import { afterEach, expect, test } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { joinParts, readSaved, savedText, selectSaved, type PartRow } from '../../../server/store/saved-state';

const dbs: DatabaseSync[] = [];
afterEach(() => { dbs.splice(0).forEach(db => db.close()); });
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

test('a failed read ends the read transaction it opened and reports the failure itself', () => {
    const db = new DatabaseSync(':memory:'); dbs.push(db);
    expect(() => readSaved(db)).toThrow(/no such table: state/);
    expect(db.isTransaction).toBe(false);
});
