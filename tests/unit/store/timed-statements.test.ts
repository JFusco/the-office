import { DatabaseSync } from 'node:sqlite';
import { expect, test } from 'vitest';
import { storeTimings } from '../../../server/store/store-timings';
import { statementName, timeStatements } from '../../../server/store/timed-statements';

const SCHEMA = 'CREATE TABLE notes (id INTEGER PRIMARY KEY, body TEXT NOT NULL)';

function connection() {
    const db = new DatabaseSync(':memory:'), timings = storeTimings();
    timeStatements(db, timings);
    db.exec(SCHEMA);
    return { db, timings, report: () => timings.report().timings };
}

test('every statement on the connection returns what it returned before and is counted under its SQL name', () => {
    const { db, report } = connection();
    const insert = db.prepare('INSERT INTO notes(id,body)\n            VALUES(?,?)');
    expect(insert.run(1, 'abcd')).toMatchObject({ changes: 1, lastInsertRowid: 1 });
    insert.run(2, 'ef');
    expect(db.prepare('SELECT body FROM notes WHERE id=?').get(2)).toEqual({ body: 'ef' });
    expect(db.prepare('SELECT body FROM notes WHERE id=?').get(9)).toBeUndefined();
    expect(db.prepare('SELECT body FROM notes ORDER BY id').all()).toEqual([{ body: 'abcd' }, { body: 'ef' }]);
    // Written text is counted on a run, read text on a get or all; a read that finds nothing reads none.
    expect(report()['sql: INSERT INTO notes(id,body) VALUES(?,?)']).toMatchObject({ calls: 2, chars: 6 });
    expect(report()['sql: SELECT body FROM notes WHERE id=?']).toMatchObject({ calls: 2, chars: 2 });
    expect(report()['sql: SELECT body FROM notes ORDER BY id']).toMatchObject({ calls: 1, chars: 6 });
    expect(() => insert.run(1, 'again')).toThrow();
    expect(report()['sql: INSERT INTO notes(id,body) VALUES(?,?)'].calls).toBe(3);
    db.close();
});

test('exec reports the original SQL length for each completed call', () => {
    const { db, report } = connection();
    for (const id of [1, 2]) {
        db.exec('BEGIN IMMEDIATE');
        db.prepare('INSERT INTO notes(id,body) VALUES(?,?)').run(id, 'a');
        db.exec('COMMIT');
    }
    expect(report()[`exec: ${SCHEMA}`]).toMatchObject({ calls: 1, chars: SCHEMA.length });
    expect(report()['exec: BEGIN IMMEDIATE']).toMatchObject({ calls: 2, chars: 2 * 'BEGIN IMMEDIATE'.length });
    expect(report()['exec: COMMIT']).toMatchObject({ calls: 2, chars: 2 * 'COMMIT'.length });
    expect(db.prepare('SELECT COUNT(*) AS n FROM notes').get()).toEqual({ n: 2 });
    db.close();
});

test('the rest of a statement still works, and named parameters pass through', () => {
    const { db, report } = connection();
    const named = 'INSERT INTO notes(id,body) VALUES(:id,:body)';
    db.prepare(named).run({ id: 3, body: 'named' });
    expect(report()[`sql: ${named}`]).toMatchObject({ calls: 1, chars: 5 });

    const mixed = 'INSERT INTO notes(id,body) SELECT :id, :body || ? WHERE length(?)=1';
    let reads = 0;
    const bindings = { id: 4, get body() { reads++; return 'mix'; } };
    expect(db.prepare(mixed).run(bindings, 'ed', Uint8Array.of(42))).toMatchObject({ changes: 1, lastInsertRowid: 4 });
    expect(reads).toBe(1);
    expect(report()['sql: INSERT INTO notes(id,body) SELECT :id, :body || ? WHERE length(?)=?'])
        .toMatchObject({ calls: 1, chars: 5 });

    const rows = db.prepare('SELECT id,body FROM notes');
    rows.setReadBigInts(true);
    expect([...rows.iterate()]).toEqual([{ id: 3n, body: 'named' }, { id: 4n, body: 'mixed' }]);
    expect(rows.sourceSQL).toBe('SELECT id,body FROM notes');
    db.close();
});

test('tag stores time run, get and all and preserve native results and iteration', () => {
    const { db, report } = connection();
    const tag = db.createTagStore(4);
    expect(tag.db).toBe(db);
    expect(tag.capacity).toBe(4);
    expect(tag.run`INSERT INTO notes(id,body) VALUES(${1},${'tagged'})`)
        .toMatchObject({ changes: 1, lastInsertRowid: 1 });
    expect(tag.get`SELECT body FROM notes WHERE id=${1}`).toEqual({ body: 'tagged' });
    expect(tag.all`SELECT body FROM notes ORDER BY id`).toEqual([{ body: 'tagged' }]);
    const after = report();
    expect(after['sql: INSERT INTO notes(id,body) VALUES(?,?)']).toMatchObject({ calls: 1, chars: 6 });
    expect(after['sql: SELECT body FROM notes WHERE id=?']).toMatchObject({ calls: 1, chars: 6 });
    expect(after['sql: SELECT body FROM notes ORDER BY id']).toMatchObject({ calls: 1, chars: 6 });
    expect(tag.size).toBe(3);
    expect([...tag.iterate`SELECT id FROM notes`]).toEqual([{ id: 1 }]);
    expect(report()).toEqual(after);
    db.close();
});

test('a name is one bounded line that shows no value from the SQL', () => {
    expect(statementName('sql', "SELECT body FROM effects WHERE status='dispatching' AND id=17 AND note='it''s'"))
        .toBe('sql: SELECT body FROM effects WHERE status=? AND id=? AND note=?');
    const { db, report } = connection();
    for (const [id, literal] of ['0x1_A', '23.4', '.75', '1_000.2_3e-4_5', '1.'].entries())
        db.prepare(`SELECT body FROM notes WHERE id=${literal} AND body<>'secret ${id}'`).get();
    for (const comment of ["-- someone's comment\n", "/* someone's comment */"])
        expect(db.prepare(`SELECT ${comment} 'the hidden value' AS body`).get()).toEqual({ body: 'the hidden value' });
    expect(Object.keys(report()).filter(name => name.includes('secret') || /\d/.test(name))).toEqual([]);
    expect(report()['sql: SELECT body FROM notes WHERE id=? AND body<>?'].calls).toBe(5);
    expect(report()['sql: SELECT ? AS body']).toMatchObject({ calls: 2, chars: 32 });
    expect(statementName('exec', 'PRAGMA user_version="123"')).toBe('exec: PRAGMA user_version=?');
    db.close();
});

test('bounded names distinguish trailing clauses and group literal-only changes', () => {
    const { db, report } = connection();
    const prefix = (value: string) => `SELECT\n  '${value}' AS col_${'x'.repeat(100)} `;
    const first = prefix('private') + 'WHERE 1 ORDER BY 1';
    const second = prefix('private') + 'WHERE 1 LIMIT 1';
    for (const sql of [first, second, prefix('different value') + 'WHERE 1 ORDER BY 1'])
        db.prepare(sql).get();
    const firstName = statementName('sql', first), secondName = statementName('sql', second);
    expect(firstName).not.toBe(secondName);
    expect(firstName).toHaveLength(95);
    expect(secondName).toHaveLength(95);
    expect(firstName).not.toMatch(/[\r\n]|private/);
    expect(report()[firstName]).toMatchObject({ calls: 2, chars: 22 });
    expect(report()[secondName]).toMatchObject({ calls: 1, chars: 7 });
    db.close();
});
