import { mkdtempSync, readFileSync, realpathSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import { readSavedState } from '../../../server/store/read-saved-state';
import { SavedStateConflict } from '../../../server/store/saved-state';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { sanitizeObject } from '../../../server/office/security';

const dirs: string[] = [];
function database(body?: string, wal = false) {
    const dir = mkdtempSync(join(tmpdir(), 'office-saved-state-'));
    dirs.push(dir);
    const path = join(dir, 'office.sqlite'), db = new DatabaseSync(path);
    if (wal) db.exec('PRAGMA journal_mode=WAL');
    db.exec('CREATE TABLE state(id INTEGER PRIMARY KEY, body TEXT NOT NULL)');
    if (body !== undefined) db.prepare('INSERT INTO state(id,body) VALUES(1,?)').run(body);
    db.close();
    return path;
}
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });

describe('readSavedState', () => {
    it('returns the saved snapshot without changing the file', () => {
        const path = database(JSON.stringify({ tickets: [{ key: 'GH-1' }], outbox: [] }));
        const before = statSync(path).mtimeMs;
        expect(readSavedState(path)).toEqual({ tickets: [{ key: 'GH-1' }], outbox: [] });
        expect(statSync(path).mtimeMs).toBe(before);
    });

    it('reads a WAL database, as the live service uses, without changing the database file', () => {
        const path = database(JSON.stringify({ tickets: [], outbox: [] }), true);
        const before = statSync(path).mtimeMs;
        expect(readSavedState(path)).toEqual({ tickets: [], outbox: [] });
        expect(statSync(path).mtimeMs).toBe(before);
    });

    it('reads a store the service wrote as the service would on restart, with or without its whole row', () => {
        const dir = realpathSync(mkdtempSync(join(tmpdir(), 'office-saved-state-'))); dirs.push(dir);
        const path = join(dir, 'office.sqlite'), store = new Store(path, projectById('brain'), dir);
        store.state.pilotKey = 'GH-7'; store.save();
        const text = JSON.stringify(sanitizeObject(store.state)), expected = JSON.parse(text);
        // The service writes no whole row: the parts are the state.
        expect(store.db.prepare('SELECT COUNT(*) AS n FROM state').get()).toEqual({ n: 0 });
        expect(readSavedState(path)).toEqual(expected);
        // A whole row a previous release left, equal to the parts, changes nothing.
        store.db.prepare('INSERT INTO state(id,body) VALUES(1,?)').run(text);
        expect(readSavedState(path)).toEqual(expected);
        store.close();
    });

    it('refuses a store whose whole row differs from its parts, naming the database, and leaves the file as it was', () => {
        const dir = realpathSync(mkdtempSync(join(tmpdir(), 'office-saved-state-'))); dirs.push(dir);
        const path = join(dir, 'office.sqlite'), store = new Store(path, projectById('brain'), dir);
        // A row written without the parts, by a release from before they existed.
        store.db.prepare('INSERT INTO state(id,body) VALUES(1,?)').run(JSON.stringify({ pilotKey: 'GH-8' }));
        store.db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
        store.db.close();
        const before = readFileSync(path);
        expect(() => readSavedState(path)).toThrow(SavedStateConflict);
        expect(() => readSavedState(path)).toThrow(path);
        expect(() => readSavedState(path)).toThrow('docs/office-process.md');
        expect(readFileSync(path).equals(before)).toBe(true);
    });

    it('reads a saved empty object as empty, not as never saved', () => {
        expect(readSavedState(database('{}'))).toEqual({});
    });

    it('returns null when no state row or no database exists, and creates nothing', () => {
        expect(readSavedState(database())).toBeNull();
        const missing = join(tmpdir(), 'office-saved-state-missing', 'office.sqlite');
        expect(readSavedState(missing)).toBeNull();
        expect(() => statSync(missing)).toThrow();
    });
});
