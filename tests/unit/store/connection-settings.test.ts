import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { expect, test } from 'vitest';
import { applyConnectionSettings, closeConnection, optimizeOnOpen } from '../../../server/store/connection-settings';
import { Store } from '../../../server/store/store';
import { ControlStore } from '../../../server/store/control-store';
import { projectById } from '../../../server/office/projects';

const pragma = (db: DatabaseSync, name: string) => Object.values(db.prepare(`PRAGMA ${name}`).get()!)[0];
const fileDatabase = () => join(mkdtempSync(join(process.env.OFFICE_DATA_ROOT!, 'sqlite-')), 'settings.sqlite');

test('a file connection is WAL with FULL durability and a busy timeout', () => {
    const db = new DatabaseSync(fileDatabase());
    applyConnectionSettings(db);
    expect([pragma(db, 'journal_mode'), pragma(db, 'synchronous'), pragma(db, 'busy_timeout')]).toEqual(['wal', 2, 5000]);
    optimizeOnOpen(db);
    closeConnection(db);
    expect(db.isOpen).toBe(false);
});

test('both stores open file databases with the explicit settings and the effects index', () => {
    const path = fileDatabase(), store = new Store(path, projectById('brain')), control = new ControlStore(join(path, '..', 'control.sqlite'));
    try {
        for (const db of [store.db, control.db])
            expect([pragma(db, 'journal_mode'), pragma(db, 'synchronous'), pragma(db, 'busy_timeout')]).toEqual(['wal', 2, 5000]);
        const plan = store.db.prepare('EXPLAIN QUERY PLAN SELECT body FROM effects WHERE work_key=?').all('x') as { detail: string }[];
        expect(plan.map(row => row.detail).join(' ')).toContain('effects_work_key');
    }
    finally { store.close(); control.close(); }
});

test('closing still closes when advisory statistics fail, and a second close still throws', () => {
    const db = new DatabaseSync(':memory:');
    db.exec('CREATE TABLE t(x)');
    const original = db.exec.bind(db);
    db.exec = (sql: string) => { if (sql === 'PRAGMA optimize') throw new Error('busy'); return original(sql); };
    closeConnection(db);
    expect(db.isOpen).toBe(false);
    expect(() => closeConnection(db)).toThrow();
});

test('a store reopened on the same file reads what the cached statements wrote', () => {
    const path = fileDatabase(), first = new Store(path, projectById('brain'));
    first.emit('fixture', 'first event');
    first.close();
    const second = new Store(path, projectById('brain'));
    try { expect(second.replay(0).map(event => event.message)).toContain('first event'); }
    finally { second.close(); }
});
