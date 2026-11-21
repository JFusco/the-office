import { DatabaseSync } from 'node:sqlite';
import { expect, test } from 'vitest';
import { storeTimings } from '../../../server/store/store-timings';
import { statementName, timeStatements } from '../../../server/store/timed-statements';

function connection() {
    const db = new DatabaseSync(':memory:'), timings = storeTimings();
    timeStatements(db, timings);
    db.exec('CREATE TABLE notes (id INTEGER PRIMARY KEY, body TEXT NOT NULL)');
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

test('exec is counted too, so the cost of BEGIN and COMMIT is seen', () => {
    const { db, report } = connection();
    db.exec('BEGIN IMMEDIATE'); db.prepare('INSERT INTO notes(id,body) VALUES(?,?)').run(1, 'a'); db.exec('COMMIT');
    expect(report()['exec: BEGIN IMMEDIATE'].calls).toBe(1);
    expect(report()['exec: COMMIT'].calls).toBe(1);
    expect(db.prepare('SELECT COUNT(*) AS n FROM notes').get()).toEqual({ n: 1 });
    db.close();
});

test('the rest of a statement still works, and named parameters pass through', () => {
    const { db } = connection();
    db.prepare('INSERT INTO notes(id,body) VALUES(:id,:body)').run({ id: 3, body: 'named' });
    const rows = db.prepare('SELECT id,body FROM notes');
    rows.setReadBigInts(true);
    expect([...rows.iterate()]).toEqual([{ id: 3n, body: 'named' }]);
    expect(rows.sourceSQL).toBe('SELECT id,body FROM notes');
    db.close();
});

test('a name is one bounded line that shows no value from the SQL', () => {
    expect(statementName('sql', `SELECT a\n   FROM b ${'x'.repeat(200)}`)).toHaveLength(95);
    expect(statementName('sql', "SELECT body FROM effects WHERE status='dispatching' AND id=17 AND note='it''s'"))
        .toBe('sql: SELECT body FROM effects WHERE status=? AND id=? AND note=?');
    const { db, report } = connection();
    for (const id of [1, 2, 3]) db.prepare(`SELECT body FROM notes WHERE id=${id} AND body<>'secret ${id}'`).get();
    expect(Object.keys(report()).filter(name => name.includes('secret') || /\d/.test(name))).toEqual([]);
    expect(report()['sql: SELECT body FROM notes WHERE id=? AND body<>?'].calls).toBe(3);
    db.close();
});
