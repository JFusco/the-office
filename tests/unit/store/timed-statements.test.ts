import { DatabaseSync } from 'node:sqlite';
import { expect, test } from 'vitest';
import { statementCache } from '../../../server/store/statement-cache';
import { storeTimings } from '../../../server/store/store-timings';
import { statementName, timedStatements } from '../../../server/store/timed-statements';

test('statements return what they returned before, and each call is counted under its SQL text', () => {
    const db = new DatabaseSync(':memory:'), timings = storeTimings();
    db.exec('CREATE TABLE notes (id INTEGER PRIMARY KEY, body TEXT NOT NULL)');
    const statement = timedStatements(statementCache(db), timings);
    const insert = 'INSERT INTO notes(id,body)\n            VALUES(?,?)';
    expect(statement(insert).run(1, 'abcd').changes).toBe(1);
    statement(insert).run(2, 'ef');
    expect(statement('SELECT body FROM notes WHERE id=?').get(2)).toEqual({ body: 'ef' });
    expect(statement('SELECT body FROM notes ORDER BY id').all()).toEqual([{ body: 'abcd' }, { body: 'ef' }]);
    expect(statement(insert)).toBe(statement(insert));
    const report = timings.report().timings;
    expect(report['sql: INSERT INTO notes(id,body) VALUES(?,?)']).toMatchObject({ calls: 2, chars: 6 });
    expect(report['sql: SELECT body FROM notes WHERE id=?']).toMatchObject({ calls: 1, chars: 0 });
    expect(() => statement(insert).run(1, 'again')).toThrow();
    expect(timings.report().timings['sql: INSERT INTO notes(id,body) VALUES(?,?)'].calls).toBe(3);
    db.close();
});

test('a statement name is one bounded line', () => {
    expect(statementName(`SELECT a\n   FROM b ${'x'.repeat(200)}`)).toHaveLength(95);
});
