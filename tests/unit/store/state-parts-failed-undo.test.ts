import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, expect, test } from 'vitest';
import { StateParts } from '../../../server/store/state-parts';
import { statementCache } from '../../../server/store/statement-cache';
import { Store } from '../../../server/store/store';
import { initializeStoreSchema } from '../../../server/store/store-schema';
import { storeTimings } from '../../../server/store/store-timings';

type Saved = { db: DatabaseSync };
let folder = '', open: DatabaseSync[] = [];
afterEach(() => {
    for (const db of open) if (db.isOpen) db.close();
    open = [];
    if (folder) rmSync(folder, { recursive: true, force: true });
    folder = '';
});

const path = () => join(folder ||= mkdtempSync(join(tmpdir(), 'state-parts-failed-undo-')), 'office.sqlite');
/** One more connection to the one database file. */
function connection() { const db = new DatabaseSync(path()); open.push(db); db.exec('PRAGMA journal_mode=WAL'); return db; }
/** The whole row and the ordered parts as a connection of its own reads them: only what was committed. */
function committed() {
    const db = connection();
    return [(db.prepare('SELECT body FROM state WHERE id=1').get() as { body: string } | undefined)?.body,
        db.prepare('SELECT key,position,body FROM state_parts ORDER BY position,key').all()];
}
/** Refuses the write of one part, and every rollback the code asks for by name. Returns the connection's real `exec`. */
function refuseSaveAndUndo({ db }: Saved, key: string) {
    db.exec(`CREATE TRIGGER refuse_part BEFORE INSERT ON state_parts WHEN NEW.key='${key}' BEGIN SELECT RAISE(ABORT, 'rejected'); END;`);
    const exec = db.exec.bind(db);
    db.exec = (sql: string) => { if (sql.startsWith('ROLLBACK')) throw new Error('undo failed'); return exec(sql); };
    return exec;
}

test('a failed save that no rollback could undo closes the connection, so the part it wrote cannot be committed', () => {
    const db = connection(), state: Record<string, unknown> = { startedAt: 't0', revision: 3, tickets: ['CEC-1'], flag: false };
    initializeStoreSchema(db);
    const stored = new StateParts(db, statementCache(db), storeTimings());
    stored.save(state, false);
    db.prepare('INSERT INTO state(id,body) VALUES(1,?)').run(JSON.stringify(state)); // The row a previous release left.
    const before = committed();
    expect(before).toEqual([JSON.stringify(state), [{ key: 'startedAt', position: 0, body: '"t0"' }, { key: 'revision', position: 1, body: '3' },
        { key: 'tickets', position: 2, body: '["CEC-1"]' }, { key: 'flag', position: 3, body: 'false' }]]);
    const exec = refuseSaveAndUndo({ db }, 'flag');
    exec('BEGIN IMMEDIATE');
    state.revision = 70; state.flag = true; // Two changed parts: `revision` is written, then `flag` is refused.
    expect(() => stored.save(state, true)).toThrow('rejected'); // The first failure is the one reported, not either failed undo.
    // Left open, the transaction would still hold `revision` 70 for the caller to commit.
    expect(db.isOpen).toBe(false);
    expect(() => exec('COMMIT')).toThrow('database is not open');
    expect(committed()).toEqual(before);
});

test('a store transaction whose save could not be undone reports the save\'s own failure, and nothing of it is saved', () => {
    const store = new Store(path(), undefined, folder); open.push(store.db);
    store.transaction(() => { store.state.pilotKey = 'CEC-1'; });
    const before = committed();
    refuseSaveAndUndo(store, 'pilotKey');
    // `paused` comes before `pilotKey`: its part is written, then the next is refused.
    expect(() => store.transaction(() => { store.state.paused = true; store.state.pilotKey = 'CEC-2'; })).toThrow('rejected'); // Not 'undo failed', and not 'database is not open'.
    expect(store.db.isOpen).toBe(false);
    expect([store.state.paused, store.state.pilotKey]).toEqual([false, 'CEC-1']);
    expect(committed()).toEqual(before);
    expect(JSON.stringify(before[1])).toContain('{"key":"pilotKey","position":4,"body":"\\"CEC-1\\""}');
});
