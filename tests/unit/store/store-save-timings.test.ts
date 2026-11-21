import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import { Store } from '../../../server/store/store';
import { readSavedState } from '../../../server/store/read-saved-state';
import * as security from '../../../server/office/security';

let folder = '';
let testStore: Store | undefined;
afterEach(() => {
    vi.restoreAllMocks();
    testStore?.db.close();
    testStore = undefined;
    if (folder) rmSync(folder, { recursive: true, force: true });
});

function openStore() {
    folder = mkdtempSync(join(tmpdir(), 'store-timings-'));
    const path = join(folder, 'office.sqlite');
    testStore = new Store(path, undefined, folder);
    return { store: testStore, path };
}

const WRITE_ROW = 'sql: INSERT OR REPLACE INTO state(id,body) VALUES(?,?)';
const WRITE_PART = 'sql: INSERT OR REPLACE INTO state_parts(key,position,body) VALUES(?,?,?)';

test('a store reports what its saves and transactions cost, and the saved row is what it was before parts', () => {
    const { store, path } = openStore();
    const before = store.timings.report().timings;
    expect(before['save: redact'].calls).toBe(1); // Opening saves once.
    expect(before['exec: PRAGMA optimize=?']).toMatchObject({ calls: 1, chars: 'PRAGMA optimize=0x10002'.length });
    expect(before[WRITE_PART].calls).toBe(Object.keys(JSON.parse(JSON.stringify(store.state))).length); // Every key, the first time.
    store.transaction(() => { store.state.pilotKey = 'CEC-1'; });
    expect(() => store.transaction(() => { store.state.pilotKey = 'CEC-2'; throw new Error('undone'); })).toThrow('undone');
    const after = store.timings.report().timings;
    expect(after['save: redact'].calls).toBe(2);
    expect(after['save: serialise']).toMatchObject({ calls: 2 });
    expect(after['transaction: rollback copy'].calls).toBe(2);
    expect(after['transaction: whole attempt'].calls).toBe(2);
    expect(after['transaction: listeners after commit'].calls).toBe(1); // Only the committed one reaches its listeners.
    // One key changed, so one part was written, and the whole row once more.
    expect(after[WRITE_PART].calls - before[WRITE_PART].calls).toBe(1);
    expect(after[WRITE_ROW].calls - before[WRITE_ROW].calls).toBe(1);
    expect(after['save: redact'].chars - before['save: redact'].chars).toBe('"CEC-1"'.length);
    expect(store.state.pilotKey).toBe('CEC-1');
    const saved = store.db.prepare('SELECT body FROM state WHERE id=1').get() as { body: string };
    expect(saved.body).toBe(JSON.stringify(security.sanitizeObject(store.state)));
    expect(readSavedState(path)?.pilotKey).toBe('CEC-1');
});

test('the rollback copy is sized by the state as last saved, and SQL run on the connection by other code is counted', () => {
    const { store } = openStore();
    const size = (name: string) => store.timings.report().timings[name]?.chars ?? 0;
    const body = () => (store.db.prepare('SELECT body FROM state WHERE id=1').get() as { body: string }).body;
    const opened = body().length;
    store.transaction(() => { store.state.pilotKey = 'CEC-1'; }); // The copy before this is sized by the save at open.
    expect(size('transaction: rollback copy')).toBe(opened);
    const first = body().length;
    store.transaction(() => { store.state.pilotKey = 'CEC-12345'; });
    expect(body().length).toBe(first + 4);
    expect(size('transaction: rollback copy')).toBe(opened + first);
    // A transaction that throws after its copy still records that copy, at the size last saved.
    expect(() => store.transaction(() => { throw new Error('undone'); })).toThrow('undone');
    expect(size('transaction: rollback copy')).toBe(opened + first + first + 4);
    store.db.prepare("SELECT body FROM effects WHERE status='dispatching'").all();
    expect(store.timings.report().timings['sql: SELECT body FROM effects WHERE status=?'].calls).toBe(1);
});

test.each(['serialise', 'redact'])('a failed %s step writes nothing, and the next save still writes the change', step => {
    const { store } = openStore();
    const report = () => store.timings.report().timings, before = report(), failure = new Error('save step failed');
    const probe = { toJSON: vi.fn(() => 'value') };
    (store.state as unknown as Record<string, unknown>).probe = probe;
    const fail = () => { throw failure; };
    if (step === 'serialise') probe.toJSON.mockImplementationOnce(fail);
    else vi.spyOn(security, 'sanitizeObject').mockImplementationOnce(fail);

    expect(() => store.save()).toThrow(failure);
    const after = report();
    expect(after['save: serialise'].calls).toBe(before['save: serialise'].calls + 1);
    expect(after['save: redact'].calls).toBe(before['save: redact'].calls + (step === 'redact' ? 1 : 0));
    expect([after[WRITE_PART].calls, after[WRITE_ROW].calls]).toEqual([before[WRITE_PART].calls, before[WRITE_ROW].calls]);
    store.save();
    expect(JSON.parse((store.db.prepare('SELECT body FROM state WHERE id=1').get() as { body: string }).body).probe).toBe('value');
});

test.each(['a rejected state write', 'a rollback after an inner save'])('the next rollback copy uses the persisted size after %s', scenario => {
    const { store } = openStore();
    const body = () => (store.db.prepare('SELECT body FROM state WHERE id=1').get() as { body: string }).body;
    const size = () => store.timings.report().timings['transaction: rollback copy']?.chars ?? 0;
    const persisted = body();
    const longerKey = 'CEC-123456789';

    if (scenario === 'a rejected state write') {
        store.db.exec("CREATE TRIGGER refuse_state BEFORE INSERT ON state BEGIN SELECT RAISE(ABORT, 'rejected'); END;");
        store.state.pilotKey = longerKey;
        expect(() => store.save()).toThrow('rejected');
        store.db.exec('DROP TRIGGER refuse_state');
    } else {
        expect(() => store.transaction(() => {
            store.state.pilotKey = longerKey;
            store.save();
            expect(body().length).toBeGreaterThan(persisted.length);
            throw new Error('undone');
        })).toThrow('undone');
    }

    expect(body()).toBe(persisted);
    const before = size();
    store.transaction(() => {});
    expect(size() - before).toBe(persisted.length);
});

test('a failed rollback copy counts as a whole attempt without starting SQL or dispatching listeners', () => {
    const { store } = openStore();
    const failure = new Error('clone failed'), operation = vi.fn(), listener = vi.fn();
    const begun = store.timings.report().timings['exec: BEGIN IMMEDIATE'].calls; // The save at open ran in its own.
    store.commitListeners.add(listener);
    vi.spyOn(globalThis, 'structuredClone').mockImplementationOnce(() => { throw failure; });
    expect(() => store.transaction(operation)).toThrow(failure);

    const report = store.timings.report().timings;
    expect(report['transaction: rollback copy']).toMatchObject({ calls: 1, chars: 0 });
    expect(report['transaction: whole attempt']).toMatchObject({ calls: 1 });
    expect(report['exec: BEGIN IMMEDIATE'].calls).toBe(begun);
    expect(report['exec: ROLLBACK']).toBeUndefined();
    expect(report['transaction: listeners after commit']).toBeUndefined();
    expect(operation).not.toHaveBeenCalled();
    expect(listener).not.toHaveBeenCalled();
});
