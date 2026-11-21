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
    expect(after['transaction: begin to commit'].calls).toBe(2);
    expect(after['transaction: listeners after commit'].calls).toBe(1); // Only the committed one reaches its listeners.
    expect(after['sql: INSERT OR REPLACE INTO state(id,body) VALUES(1,?)']).toMatchObject({ calls: 2, chars: after['save: serialise'].chars });
    expect(store.state.pilotKey).toBe('CEC-1');
    const saved = store.db.prepare('SELECT body FROM state WHERE id=1').get() as { body: string };
    expect(saved.body).toBe(JSON.stringify(sanitizeObject(store.state)));
    expect(readSavedState(path)?.pilotKey).toBe('CEC-1');
    store.db.close();
});
