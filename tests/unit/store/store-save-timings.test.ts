import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import { Store } from '../../../server/store/store';
import { readSavedState } from '../../../server/store/read-saved-state';
import * as security from '../../../server/office/security';
import * as saved from '../../../server/store/saved-state';
import { savedState, savedStateText } from './saved-state-fixture';

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
const UPDATE_ROW = 'sql: UPDATE state SET body=? WHERE id=?';
const SAVED_PARTS = 'sql: SELECT key,position,body FROM state_parts ORDER BY position,key';
/** Every statement of a save: it reads once whether the whole row is there, and `writes` are all it writes. */
const saving = (writes: Record<string, number> = {}) => ({ 'sql: SELECT ? FROM state WHERE id=?': 1, ...writes });
const WRITE_PART = 'sql: INSERT OR REPLACE INTO state_parts(key,position,body) VALUES(?,?,?)';
const row = (store: Store) => (store.db.prepare('SELECT body FROM state WHERE id=1').get() as { body: string } | undefined)?.body;
/** What a save must store, worked out without the writer: the redacted text of the whole state. */
const expected = (store: Store) => JSON.stringify(security.sanitizeObject(store.state));
/** The statements the store has run, by its own timing label. */
const statements = (store: Store) => new Map(Object.entries(store.timings.report().timings).filter(([name]) => name.startsWith('sql: ')).map(([name, timing]) => [name, timing.calls]));
/** Every statement `work` ran. Take it around the save alone: reading back runs statements too. */
function during(store: Store, work: () => unknown) {
    const before = statements(store);
    work();
    return Object.fromEntries([...statements(store)].map(([name, count]) => [name, count - (before.get(name) ?? 0)] as const).filter(([, count]) => count));
}
/** Gives the open store the whole row a previous release left beside the parts, and starts it again. */
function restartWithRow(store: Store, path: string) {
    store.db.prepare('INSERT INTO state(id,body) VALUES(1,?)').run(savedStateText(store));
    store.close();
    testStore = new Store(path, undefined, folder);
    expect(row(testStore)).toBe(expected(testStore));
    return testStore;
}

test('a store reports what its saves and transactions cost, and writes its state as parts with no whole row', () => {
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
    // One key changed, so one part was written, and the whole row never.
    expect(after[WRITE_PART].calls - before[WRITE_PART].calls).toBe(1);
    expect([after[WRITE_ROW], row(store)]).toEqual([undefined, undefined]);
    expect(after['save: redact'].chars - before['save: redact'].chars).toBe('"CEC-1"'.length);
    expect(store.state.pilotKey).toBe('CEC-1');
    expect(savedStateText(store)).toBe(expected(store));
    expect(readSavedState(path)?.pilotKey).toBe('CEC-1');
});

test('in a store without the whole row a transaction writes one part row for each changed key and never puts the whole text together', () => {
    const { store } = openStore();
    const join = vi.spyOn(saved, 'joinParts');
    expect(during(store, () => store.transaction(() => { store.state.pilotKey = 'CEC-1'; store.state.paused = true; }))).toEqual(saving({ [WRITE_PART]: 2 }));
    const state = store.state as unknown as Record<string, unknown>;
    expect(during(store, () => store.transaction(() => { state.probe = 'added last'; }))).toEqual(saving({ [WRITE_PART]: 1 }));
    expect(during(store, () => store.transaction(() => { delete state.probe; }))).toEqual(saving({ 'sql: DELETE FROM state_parts WHERE key=?': 1 }));
    expect(during(store, () => store.transaction(() => {}))).toEqual(saving()); // Nothing changed: nothing written.
    expect(during(store, () => store.save())).toEqual(saving());
    expect(join).not.toHaveBeenCalled();
    expect([row(store), savedStateText(store)]).toEqual([undefined, expected(store)]);
});

test('a store opened with the whole row updates it for a start, equal to the parts, and removes it once with the first other change', () => {
    const opened = openStore(), store = restartWithRow(opened.store, opened.path);
    store.state.startedAt = store.state.serverTime = '2026-11-22T09:00:00.000Z';
    expect(during(store, () => store.save())).toEqual(saving({ [WRITE_PART]: 2, [SAVED_PARTS]: 1, [UPDATE_ROW]: 1 })); // Updated from the saved parts, never inserted.
    expect([row(store), savedStateText(store)]).toEqual([expected(store), expected(store)]);
    expect(during(store, () => store.transaction(() => { store.state.pilotKey = 'CEC-1'; }))).toEqual(saving({ [WRITE_PART]: 1, 'sql: DELETE FROM state WHERE id=?': 1 }));
    expect([row(store), savedStateText(store)]).toEqual([undefined, expected(store)]);
    expect(during(store, () => store.transaction(() => { store.state.pilotKey = 'CEC-2'; }))).toEqual(saving({ [WRITE_PART]: 1 }));
    expect(row(store)).toBeUndefined();
});

test('the rollback copy is sized by the state as last saved, and SQL run on the connection by other code is counted', () => {
    const { store } = openStore();
    const size = (name: string) => store.timings.report().timings[name]?.chars ?? 0;
    const body = () => { expect(savedStateText(store)).toBe(expected(store)); return expected(store); };
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
    expect([after[WRITE_PART].calls, after[WRITE_ROW]]).toEqual([before[WRITE_PART].calls, undefined]);
    store.save();
    expect(savedState<{ probe: string }>(store).probe).toBe('value');
});

test.each(['a rejected part write', 'a failure after the whole row was removed', 'a rollback after an inner save'])('the next rollback copy uses the persisted size after %s', scenario => {
    const opened = openStore(), withRow = scenario === 'a failure after the whole row was removed';
    const store = withRow ? restartWithRow(opened.store, opened.path) : opened.store;
    const size = () => store.timings.report().timings['transaction: rollback copy']?.chars ?? 0;
    const persisted = savedStateText(store), kept = row(store);
    const longerKey = 'CEC-123456789';
    expect(persisted).toBe(expected(store));

    if (scenario === 'a rollback after an inner save') {
        expect(() => store.transaction(() => {
            store.state.pilotKey = longerKey;
            store.save();
            expect(savedStateText(store).length).toBe(persisted.length + longerKey.length);
            throw new Error('undone');
        })).toThrow('undone');
    } else {
        // Without the whole row a save inserts only parts, so that is where it is refused; with it, after the row went.
        store.db.exec(withRow ? "CREATE TRIGGER refuse_save AFTER DELETE ON state BEGIN SELECT RAISE(ABORT, 'rejected'); END;"
            : "CREATE TRIGGER refuse_save BEFORE INSERT ON state_parts WHEN NEW.key='pilotKey' BEGIN SELECT RAISE(ABORT, 'rejected'); END;");
        store.state.pilotKey = longerKey;
        expect(() => store.save()).toThrow('rejected');
        store.db.exec('DROP TRIGGER refuse_save');
        store.state.pilotKey = '';
    }

    expect([savedStateText(store), row(store)]).toEqual([persisted, kept]);
    expect(kept).toBe(withRow ? persisted : undefined);
    const before = size();
    store.transaction(() => {});
    expect(size() - before).toBe(persisted.length);
    // The change is still written once nothing refuses it, and the next copy is sized by it.
    store.transaction(() => { store.state.pilotKey = longerKey; });
    expect([savedStateText(store), row(store)]).toEqual([expected(store), undefined]);
    store.transaction(() => {});
    expect(size() - before).toBe(persisted.length * 3 + longerKey.length);
});

test('a failed rollback copy counts as a whole attempt without starting SQL or dispatching listeners', () => {
    const { store } = openStore();
    const failure = new Error('clone failed'), operation = vi.fn(), listener = vi.fn();
    const opened = store.timings.report().timings;
    // The save at open ran in its own transaction. The read before it was made before statements were timed.
    const begun = opened['exec: BEGIN IMMEDIATE'].calls;
    expect([opened['exec: BEGIN'], opened['exec: ROLLBACK']]).toEqual([undefined, undefined]);
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
