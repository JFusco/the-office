import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, expect, test, vi } from 'vitest';
import { projectById } from '../../../server/office/projects';
import { sanitizeObject } from '../../../server/office/security';
import { readSavedState } from '../../../server/store/read-saved-state';
import { SavedStateConflict } from '../../../server/store/saved-state';
import { Store } from '../../../server/store/store';
import { initializeStoreSchema } from '../../../server/store/store-schema';
import { savedFingerprint } from './saved-fingerprint-fixture';
import { savedState, savedStateText } from './saved-state-fixture';

let folder = '', open: DatabaseSync[] = [];
afterEach(() => {
    vi.restoreAllMocks();
    for (const db of open) if (db.isOpen) db.close();
    open = [];
    if (folder) rmSync(folder, { recursive: true, force: true });
    folder = '';
});
// The real path: SQLite names a database by it.
const file = () => join(folder = realpathSync(mkdtempSync(join(tmpdir(), 'store-open-'))), 'office.sqlite');
const connect = (path: string) => { const db = new DatabaseSync(path); open.push(db); return db; };
const start = (path: string) => { const store = new Store(path, projectById('brain'), folder); open.push(store.db); return store; };
const schema = (db: DatabaseSync) => db.prepare('SELECT type,name,sql FROM sqlite_master ORDER BY type,name').all();

test('a new store on a new file, which has no state table to read, creates its schema and saves its first state', () => {
    const path = file(), store = start(path);
    expect(store.db.prepare('PRAGMA journal_mode').get()).toEqual({ journal_mode: 'wal' });
    expect(schema(store.db).map(entry => entry.name)).toEqual(expect.arrayContaining(['state', 'state_parts', 'effects_work_key']));
    expect(savedStateText(store)).toBe(JSON.stringify(sanitizeObject(store.state)));
    expect(store.db.prepare('SELECT COUNT(*) AS n FROM state').get()).toEqual({ n: 0 });
    expect(readSavedState(path)?.startedAt).toBe(store.state.startedAt);
});

test('a store whose saved copies disagree is refused before its journal mode, schema or rows are touched', () => {
    const path = file(), made = connect(path);
    made.exec('PRAGMA journal_mode=DELETE');
    initializeStoreSchema(made);
    made.exec(`DROP INDEX effects_work_key; INSERT INTO state_parts VALUES('pilotKey',0,'"CEC-1"'); INSERT INTO state VALUES(1,'{"pilotKey":"CEC-9"}')`);
    made.close();
    const db = connect(path);
    const saved = () => [db.prepare('PRAGMA journal_mode').get(), schema(db), db.prepare('SELECT * FROM state').all(),
        db.prepare('SELECT * FROM state_parts ORDER BY position,key').all(), savedFingerprint({ db })];
    const before = saved();
    expect(before[0]).toEqual({ journal_mode: 'delete' });
    for (const read of [() => start(path), () => readSavedState(path), () => savedState({ db })]) {
        let refusal: unknown;
        try { read(); } catch (error) { refusal = error; }
        expect(refusal).toBeInstanceOf(SavedStateConflict);
        expect((refusal as SavedStateConflict).database).toBe(path);
        expect((refusal as Error).message).toContain(path);
        // Opening used to set WAL and create what the schema lacked before it read the two copies.
        expect(saved()).toEqual(before);
    }
    expect(schema(db).map(entry => entry.name)).not.toContain('effects_work_key');
});

test('a store whose first save fails closes its connection and reports that failure', () => {
    const path = file(), made = connect(path);
    initializeStoreSchema(made);
    made.exec("CREATE TRIGGER refuse_part BEFORE INSERT ON state_parts BEGIN SELECT RAISE(ABORT, 'refused at open'); END;");
    made.close();
    const closed = vi.spyOn(DatabaseSync.prototype, 'close');
    expect(() => start(path)).toThrow('refused at open');
    // Only a refused load used to close it: a failure in any later step left the connection open.
    expect(closed.mock.contexts.map(db => (db as DatabaseSync).isOpen)).toEqual([false]); // The one connection made since: the store's own.
    const after = connect(path);
    expect(after.prepare('SELECT COUNT(*) AS n FROM state_parts').get()).toEqual({ n: 0 });
});
