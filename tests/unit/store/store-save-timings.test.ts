import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { Store } from '../../../server/store/store';
import { readSavedState } from '../../../server/store/read-saved-state';
import { sanitizeObject } from '../../../server/office/security';

let folder = '';
afterEach(() => { if (folder) rmSync(folder, { recursive: true, force: true }); });

test('a store reports what its saves and transactions cost, and saves exactly what it saved before', () => {
    folder = mkdtempSync(join(tmpdir(), 'store-timings-'));
    const path = join(folder, 'office.sqlite'), store = new Store(path, undefined, folder);
    const before = store.timings.report().timings;
    expect(before['save: redact'].calls).toBe(1); // Opening saves once.
    store.transaction(() => { store.state.pilotKey = 'CEC-1'; });
    expect(() => store.transaction(() => { store.state.pilotKey = 'CEC-2'; throw new Error('undone'); })).toThrow('undone');
    const after = store.timings.report().timings;
    expect(after['save: redact'].calls).toBe(2);
    expect(after['save: serialise']).toMatchObject({ calls: 2 });
    expect(after['save: serialise'].chars).toBeGreaterThan(0);
    expect(after['transaction: rollback copy'].calls).toBe(2);
    expect(after['transaction: whole attempt'].calls).toBe(2);
    expect(after['transaction: listeners after commit'].calls).toBe(1); // Only the committed one reaches its listeners.
    expect(after['sql: INSERT OR REPLACE INTO state(id,body) VALUES(?,?)']).toMatchObject({ calls: 2, chars: after['save: serialise'].chars });
    expect(after['save: redact'].chars).toBe(after['save: serialise'].chars);
    expect(after['exec: BEGIN IMMEDIATE'].calls).toBe(2);
    expect([after['exec: COMMIT'].calls, after['exec: ROLLBACK'].calls]).toEqual([1, 1]);
    expect(store.state.pilotKey).toBe('CEC-1');
    const saved = store.db.prepare('SELECT body FROM state WHERE id=1').get() as { body: string };
    expect(saved.body).toBe(JSON.stringify(sanitizeObject(store.state)));
    expect(readSavedState(path)?.pilotKey).toBe('CEC-1');
    store.db.close();
});

test('each step is sized by the saved text, and SQL run on the connection by other code is counted for this store', () => {
    folder = mkdtempSync(join(tmpdir(), 'store-timings-'));
    const store = new Store(join(folder, 'office.sqlite'), undefined, folder);
    const size = (name: string) => store.timings.report().timings[name].chars;
    const opened = size('save: serialise');
    store.transaction(() => { store.state.pilotKey = 'CEC-1'; }); // The copy before this is sized by the save at open.
    expect(size('transaction: rollback copy')).toBe(opened);
    const first = size('save: serialise') - opened;
    store.transaction(() => { store.state.pilotKey = 'CEC-12345'; });
    expect(size('save: serialise') - opened - first).toBe(first + 4);
    expect(size('transaction: rollback copy')).toBe(opened + first);
    // A transaction that throws after its copy still records that copy, at the size last saved.
    expect(() => store.transaction(() => { throw new Error('undone'); })).toThrow('undone');
    expect(size('transaction: rollback copy')).toBe(opened + first + first + 4);
    store.db.prepare("SELECT body FROM effects WHERE status='dispatching'").all();
    expect(store.timings.report().timings['sql: SELECT body FROM effects WHERE status=?'].calls).toBe(1);
    store.db.close();
});
