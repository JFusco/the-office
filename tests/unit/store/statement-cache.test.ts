import { DatabaseSync } from 'node:sqlite';
import { expect, test } from 'vitest';
import { statementCache } from '../../../server/store/statement-cache';

test('each SQL text is prepared once and reused with fresh bindings', () => {
    const db = new DatabaseSync(':memory:');
    db.exec('CREATE TABLE t(id INTEGER PRIMARY KEY, v TEXT)');
    let prepared = 0;
    const prepare = db.prepare.bind(db);
    db.prepare = ((sql: string) => { prepared++; return prepare(sql); }) as typeof db.prepare;
    const statement = statementCache(db);
    statement('INSERT INTO t(v) VALUES(?)').run('a');
    statement('INSERT INTO t(v) VALUES(?)').run('b');
    expect(statement('SELECT v FROM t WHERE id=?')).toBe(statement('SELECT v FROM t WHERE id=?'));
    expect(statement('SELECT v FROM t WHERE id=?').get(2)).toEqual({ v: 'b' });
    expect(prepared).toBe(2);
    db.close();
});

test('a store reuses its prepared statements across saves and claims', async () => {
    const { Store } = await import('../../../server/store/store');
    const { projectById } = await import('../../../server/office/projects');
    const store = new Store(':memory:', projectById('brain'));
    const prepare = store.db.prepare.bind(store.db);
    let prepared = 0;
    store.db.prepare = ((sql: string) => { prepared++; return prepare(sql); }) as typeof store.db.prepare;
    try {
        store.save(); store.save();
        expect(store.claim('owner')).toBe(true);
        expect(store.claim('owner')).toBe(true);
        expect(prepared).toBe(2); // the lock SELECT and the lock upsert; save() was prepared in the constructor
    }
    finally { store.close(); }
});
