import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import { readSavedState } from '../../../server/store/read-saved-state';
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
        const dir = mkdtempSync(join(tmpdir(), 'office-saved-state-')); dirs.push(dir);
        const path = join(dir, 'office.sqlite'), store = new Store(path, projectById('brain'), dir);
        store.state.pilotKey = 'GH-7'; store.save();
        const expected = JSON.parse(JSON.stringify(sanitizeObject(store.state)));
        expect(readSavedState(path)).toEqual(expected);
        // Without the whole row the parts are the state.
        store.db.exec('DELETE FROM state');
        expect(readSavedState(path)).toEqual(expected);
        // A row that differs from the parts was written without them, and is the state.
        store.db.prepare('INSERT INTO state(id,body) VALUES(1,?)').run(JSON.stringify({ pilotKey: 'GH-8' }));
        expect(readSavedState(path)).toEqual({ pilotKey: 'GH-8' });
        store.close();
    });

    it('returns null when no state row or no database exists, and creates nothing', () => {
        expect(readSavedState(database())).toBeNull();
        const missing = join(tmpdir(), 'office-saved-state-missing', 'office.sqlite');
        expect(readSavedState(missing)).toBeNull();
        expect(() => statSync(missing)).toThrow();
    });
});
