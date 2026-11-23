import { DatabaseSync } from 'node:sqlite';
import { afterEach, expect, test, vi } from 'vitest';
import { sanitizeObject } from '../../../server/office/security';
import * as savedState from '../../../server/store/saved-state';
import { StateParts } from '../../../server/store/state-parts';
import { statementCache } from '../../../server/store/statement-cache';
import { initializeStoreSchema } from '../../../server/store/store-schema';
import { storeTimings } from '../../../server/store/store-timings';
import { timeStatements } from '../../../server/store/timed-statements';

const WRITE_EMPTY_ROW = 'sql: INSERT OR REPLACE INTO state(id,body) VALUES(?,?)';
const UPDATE_ROW = 'sql: UPDATE state SET body=? WHERE id=?';
const ROW_THERE = 'sql: SELECT ? FROM state WHERE id=?';
const ROW_BODY = 'sql: SELECT body FROM state WHERE id=?';
const SAVED_PARTS = 'sql: SELECT key,position,body FROM state_parts ORDER BY position,key';
const ANY_PART = 'sql: SELECT ? FROM state_parts LIMIT ?';
const DELETE_ROW = 'sql: DELETE FROM state WHERE id=?';
const WRITE_PART = 'sql: INSERT OR REPLACE INTO state_parts(key,position,body) VALUES(?,?,?)';
const DELETE_PART = 'sql: DELETE FROM state_parts WHERE key=?';
const DELETE_PARTS = 'sql: DELETE FROM state_parts';
/** Every statement of a save: it reads once whether the whole row is there, and `writes` are all it writes. */
const saving = (writes: Record<string, number> = {}) => ({ [ROW_THERE]: 1, ...writes });
/** A row kept in step is joined from the parts as saved and only updated, never inserted. */
const IN_STEP = { [SAVED_PARTS]: 1, [UPDATE_ROW]: 1 };
/** Every statement of a save of an empty state: it also reads whether any part is saved and what the row holds. */
const emptying = (writes: Record<string, number> = {}) => ({ [ANY_PART]: 1, [ROW_BODY]: 1, ...writes });
const SECRET = 'see postgres://user:pw@db.internal/app for details';
let open: DatabaseSync[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const db of open) db.close(); open = []; });

function database() { const db = new DatabaseSync(':memory:'); open.push(db); initializeStoreSchema(db); return db; }
/** A writer on `db` as a restart makes it, with the statements it runs counted under the store's own timing labels. */
function parts(db: DatabaseSync) {
    const timings = storeTimings();
    timeStatements(db, timings);
    const stored = new StateParts(db, statementCache(db), timings);
    const calls = (name: string) => timings.report().timings[name]?.calls ?? 0;
    const statements = () => Object.entries(timings.report().timings).filter(([name]) => name.startsWith('sql: ')).map(([name, timing]) => [name, timing.calls] as const);
    /** Every statement `work` ran, by label. Take it around the save alone: reading back runs statements too. */
    const during = (work: () => unknown) => {
        const before = new Map(statements());
        work();
        return Object.fromEntries(statements().map(([name, count]) => [name, count - (before.get(name) ?? 0)] as const).filter(([, count]) => count));
    };
    return { stored, calls, during, redactChars: () => timings.report().timings['save: redact']?.chars ?? 0 };
}
type Part = { key: string; position: number; body: string };
const row = (db: DatabaseSync) => (db.prepare('SELECT body FROM state WHERE id=1').get() as { body: string } | undefined)?.body;
const partRows = (db: DatabaseSync) => db.prepare('SELECT key,position,body FROM state_parts ORDER BY position,key').all() as Part[];
const keys = (db: DatabaseSync) => partRows(db).map(part => part.key);
/** The ordered parts as one text, joined here and not by the code under test. */
const joined = (db: DatabaseSync) => `{${partRows(db).map(part => `${JSON.stringify(part.key)}:${part.body}`).join(',')}}`;
/** What is stored as the state: the ordered parts, or the whole row when there are none. */
const persisted = (db: DatabaseSync) => partRows(db).length ? joined(db) : row(db);
/** The whole row a previous release left beside the parts. */
const giveRow = (db: DatabaseSync) => { db.prepare('INSERT INTO state(id,body) VALUES(1,?)').run(joined(db)); };
/** What a save must store, worked out without the writer: the redacted text of the whole state. */
const expected = (state: object) => JSON.stringify(sanitizeObject(state));
const sample = (): Record<string, unknown> => ({ revision: 3, serverTime: '2026-11-21T10:00:00Z', notes: [{ id: 'n1', text: SECRET }], skipped: undefined,
    tickets: [{ key: 'CEC-1', title: 'First' }], '10': 'numeric-looking key', nothing: null, empty: {}, flag: false });
/** A store with `state` saved in parts and no whole row. */
function partsOnly(state: object) {
    const db = database(), writer = parts(db);
    writer.stored.save(state, false);
    return { db, ...writer };
}
/** A store a previous release wrote: `state` in parts and the same text in the whole row, opened by a new writer. */
function inherited(state: object) {
    const { db } = partsOnly(state);
    giveRow(db);
    const writer = parts(db), loaded = writer.stored.load() as Record<string, unknown>;
    return { db, loaded, ...writer };
}

test('the first save writes every key as its own part and no whole row; a load gives that state back in order', () => {
    const db = database(), { stored, during } = parts(db), state = sample(), text = expected(state);
    expect(stored.load()).toBeNull();
    let size = 0;
    expect(during(() => { size = stored.save(state, false); })).toEqual(saving({ [WRITE_PART]: 8 })); // `skipped` has no JSON form.
    expect([size, persisted(db), row(db)]).toEqual([text.length, text, undefined]);
    expect(text).not.toContain('user:pw');
    const again = parts(db), loaded = again.stored.load() as Record<string, unknown>;
    expect(JSON.stringify(loaded)).toBe(text);
    expect(Object.keys(loaded)).toEqual(Object.keys(JSON.parse(text)));
    // The loaded object has no `skipped` key, so the keys after it close up once; their text is not redacted again.
    const redacted = again.redactChars();
    expect(again.during(() => again.stored.save(loaded, false))).toEqual(saving({ [WRITE_PART]: 4 }));
    expect(again.redactChars() - redacted).toBe(0);
    expect([persisted(db), row(db)]).toEqual([text, undefined]);
    expect(again.during(() => again.stored.save(loaded, false))).toEqual(saving());
    // A state with no such gap is exactly what was written: saving it after a load writes nothing.
    const plain = partsOnly({ a: 1, b: [SECRET], c: { d: null } }).db;
    const next = parts(plain), reloaded = next.stored.load() as object;
    expect(next.during(() => next.stored.save(reloaded, false))).toEqual(saving());
});

test('each save in a sequence stores exactly the redacted text of its input, returns that length and loads back the same', () => {
    const db = database(), { stored } = parts(db);
    let state = sample();
    const steps: [string, () => void][] = [
        ['the first save', () => {}],
        ['a change deep inside one key', () => { (state.tickets as { title: string }[])[0].title = 'Renamed'; }],
        ['a secret added inside a key', () => { (state.notes as object[]).push({ id: 'n2', text: `again ${SECRET}` }); }],
        ['an added key', () => { state.added = { at: 'end' }; }],
        ['a removed key', () => { delete state.nothing; }],
        ['a key in front, which moves the others', () => { state = { first: 1, ...state }; }],
        ['a value that lost its JSON form', () => { state.flag = undefined; }],
        ['that value set again', () => { state.flag = true; }],
        ['nothing changed', () => {}],
    ];
    for (const [step, change] of steps) {
        change();
        const text = expected(state); // Before the save, and never from what the writer made.
        expect([step, stored.save(state, false)]).toEqual([step, text.length]);
        expect([step, persisted(db), row(db)]).toEqual([step, text, undefined]);
        expect([step, JSON.stringify(parts(db).stored.load())]).toEqual([step, text]);
    }
    expect(expected(state)).not.toContain('user:pw');
});

test('a reloaded part whose redaction changes again is rewritten on the next save', () => {
    const state = { revision: 3, note: '?secret=x y,z', stable: true }, { db } = partsOnly(state);
    const restarted = parts(db), loaded = restarted.stored.load() as typeof state;
    expect(loaded.note).toBe('?secret=[redacted],z');
    loaded.revision++;
    const text = expected(loaded);
    let size = 0;
    expect(restarted.during(() => { size = restarted.stored.save(loaded, false); })).toEqual(saving({ [WRITE_PART]: 2 }));
    expect([size, persisted(db), row(db)]).toEqual([text.length, text, undefined]);
    expect(partRows(db)).toContainEqual({ key: 'note', position: 1, body: '"?secret=[redacted]"' });
    expect(JSON.stringify(parts(db).stored.load())).toBe(text);
});

test('a property toJSON sees its owning key and runs once per save', () => {
    const db = database(), { stored } = parts(db);
    const fixture = () => {
        let calls = 0;
        return { state: { probe: { toJSON: (key: string) => `${key}-${++calls}` } }, calls: () => calls };
    };
    // The expected text comes from a second, equal fixture, so working it out does not use up the writer's call.
    const live = fixture(), text = expected(fixture().state);
    expect(stored.save(live.state, false)).toBe(text.length);
    expect(live.calls()).toBe(1);
    expect(persisted(db)).toBe(text);
    expect(partRows(db)).toEqual([{ key: 'probe', position: 0, body: '"probe-1"' }]);
    expect(JSON.stringify(parts(db).stored.load())).toBe(text);
});

test('in a store without the whole row a save writes one part row for each changed key, deletes a removed one and otherwise only reads whether the row is there', () => {
    const join = vi.spyOn(savedState, 'joinParts');
    const state = sample(), { db, stored, during, calls } = partsOnly(state);
    let size = 0;
    state.revision = 4; (state.notes as object[]).push({ id: 'n2', text: `again ${SECRET}` });
    const changed = expected(state);
    expect(during(() => { size = stored.save(state, false); })).toEqual(saving({ [WRITE_PART]: 2 }));
    expect(size).toBe(changed.length);
    delete state.flag; // The last key: no other key moves.
    const removed = expected(state);
    expect(during(() => { size = stored.save(state, false); })).toEqual(saving({ [DELETE_PART]: 1 }));
    expect(size).toBe(removed.length);
    expect(during(() => { size = stored.save(state, false); })).toEqual(saving()); // Nothing changed: nothing written.
    expect(size).toBe(removed.length);
    // The whole text was never put together, and each save outside a transaction was one unit.
    expect(join).not.toHaveBeenCalled();
    expect(calls('exec: BEGIN IMMEDIATE')).toBe(calls('exec: COMMIT'));
    expect([persisted(db), row(db)]).toEqual([removed, undefined]);
    expect(removed).not.toContain('user:pw');
});

test('a store opened with the whole row keeps it equal to the parts while only start keys change, and never writes it again once it is gone', () => {
    const { db, loaded: state, stored, during } = inherited({ startedAt: 't0', serverTime: 't0', revision: 1, events: [], notes: [{ text: SECRET }], flag: false });
    const join = vi.spyOn(savedState, 'joinParts');
    Object.assign(state, { startedAt: 't1', serverTime: 't1', revision: 2, events: [{ id: 2 }] });
    const started = expected(state);
    expect(during(() => stored.save(state, false))).toEqual(saving({ [WRITE_PART]: 4, ...IN_STEP }));
    expect([row(db), joined(db)]).toEqual([started, started]);
    expect(join).toHaveBeenCalledTimes(1); // The row kept for the previous release is the one use of the whole text.
    expect(during(() => stored.save(state, false))).toEqual(saving());
    state.flag = true;
    const changed = expected(state);
    expect(during(() => stored.save(state, false))).toEqual(saving({ [WRITE_PART]: 1, [DELETE_ROW]: 1 }));
    expect([row(db), joined(db)]).toEqual([undefined, changed]);
    state.revision = 3; state.flag = false;
    expect(during(() => stored.save(state, false))).toEqual(saving({ [WRITE_PART]: 2 }));
    expect(join).toHaveBeenCalledTimes(1);
    expect([row(db), joined(db)]).toEqual([undefined, expected(state)]);
    expect(JSON.stringify(parts(db).stored.load())).toBe(expected(state));
});

const others = (): Record<string, unknown> => ({ startedAt: 't0', revision: 1, notes: [{ text: SECRET }], tickets: ['CEC-1'], flag: false });
test.each<[string, (state: Record<string, unknown>) => Record<string, unknown>, Record<string, number>]>([
    ['added', state => ({ ...state, added: 1 }), { [WRITE_PART]: 1 }],
    ['removed', state => Object.fromEntries(Object.entries(state).filter(([key]) => key !== 'flag')), { [DELETE_PART]: 1 }],
    ['moved', ({ tickets, flag, ...rest }) => ({ ...rest, flag, tickets }), { [WRITE_PART]: 2 }],
    ['given other content', state => ({ ...state, flag: true }), { [WRITE_PART]: 1 }],
])('the first save in which a key no start writes is %s removes the whole row, in one statement', (_name, change, writes) => {
    const { db, loaded, stored, during } = inherited(others());
    const state = change(loaded), text = expected(state);
    let size = 0;
    expect(during(() => { size = stored.save(state, false); })).toEqual(saving({ ...writes, [DELETE_ROW]: 1 }));
    expect([size, row(db), joined(db)]).toEqual([text.length, undefined, text]);
    state.revision = 2;
    expect(during(() => stored.save(state, false))).toEqual(saving({ [WRITE_PART]: 1 }));
    expect([row(db), joined(db)]).toEqual([undefined, expected(state)]);
});

test('a change that redaction hides writes nothing and keeps the whole row', () => {
    const { db, loaded, stored, during, redactChars } = inherited(others());
    const before = [row(db), partRows(db)], text = expected(loaded), redacted = redactChars();
    (loaded.notes as { text: string }[])[0].text = 'see postgres://user:another@db.internal/app for details';
    expect(expected(loaded)).toBe(text);
    let size = 0;
    expect(during(() => { size = stored.save(loaded, false); })).toEqual(saving());
    expect(redactChars() - redacted).toBe(JSON.stringify(JSON.parse(text).notes).length); // It was redacted again, and came out the same.
    expect([size, row(db), partRows(db)]).toEqual([text.length, ...before]);
    // The row is still there for a start to keep in step.
    loaded.revision = 2;
    expect(during(() => stored.save(loaded, false))).toEqual(saving({ [WRITE_PART]: 1, ...IN_STEP }));
    expect([row(db), joined(db)]).toEqual([expected(loaded), expected(loaded)]);
});

test('a store that has only the old row loads from it, and its first save writes every part and removes the row', () => {
    const db = database(), legacy = expected(sample());
    db.prepare('INSERT INTO state(id,body) VALUES(1,?)').run(legacy);
    const { stored, during } = parts(db), loaded = stored.load() as Record<string, unknown>;
    expect(JSON.stringify(loaded)).toBe(legacy);
    loaded.revision = 4; // The edit and the loaded state are saved together.
    const text = expected(loaded);
    let size = 0;
    expect(during(() => { size = stored.save(loaded, false); })).toEqual(saving({ [WRITE_PART]: 8, [DELETE_ROW]: 1 }));
    expect([size, row(db), joined(db)]).toEqual([text.length, undefined, text]);
    expect(JSON.stringify(parts(db).stored.load())).toBe(text);
});

test('a whole row that differs from the parts stops the load, and nothing is changed', () => {
    const state = sample(), { db } = partsOnly(state);
    db.prepare('INSERT INTO state(id,body) VALUES(1,?)').run(expected({ ...state, revision: 9 }));
    const before = [row(db), partRows(db)], { stored } = parts(db);
    expect(() => stored.load()).toThrow(savedState.SavedStateConflict);
    expect(() => stored.load()).toThrow(/:memory:.*docs\/office-process\.md/);
    expect([db.isTransaction, row(db), partRows(db)]).toEqual([false, ...before]);
});

test('a saved empty state is the literal {} in the whole row with no parts, and saving it again writes nothing', () => {
    const db = database(), { stored, during } = parts(db);
    expect(stored.load()).toBeNull(); // Never saved is not the same as saved empty.
    let size = 0;
    expect(during(() => { size = stored.save({}, false); })).toEqual(emptying({ [WRITE_EMPTY_ROW]: 1 }));
    expect([size, row(db), keys(db)]).toEqual([2, '{}', []]);
    expect(during(() => stored.save({}, false))).toEqual(emptying());
    const restarted = parts(db), loaded = restarted.stored.load();
    expect(loaded).toEqual({});
    expect(restarted.during(() => { size = restarted.stored.save(loaded as object, false); })).toEqual(emptying());
    expect([size, row(db), keys(db)]).toEqual([2, '{}', []]);
    // A state whose every value has no JSON form is saved as empty too.
    const state = { gone: undefined, call: () => 1 };
    expect(expected(state)).toBe('{}');
    const omitted = database();
    expect(parts(omitted).stored.save(state, false)).toBe(2);
    expect([row(omitted), keys(omitted)]).toEqual(['{}', []]);
});

test('clearing the last key leaves the literal {} in the whole row, which a later save treats as any row a store was opened with', () => {
    const { db, stored, during } = partsOnly({ flag: true });
    let size = 0;
    expect(during(() => { size = stored.save({}, false); })).toEqual(emptying({ [DELETE_PARTS]: 1, [WRITE_EMPTY_ROW]: 1 }));
    expect([size, row(db), keys(db), parts(db).stored.load()]).toEqual([2, '{}', [], {}]);
    // Only a start key: the row stays, equal to the parts.
    expect(during(() => { size = stored.save({ revision: 1 }, false); })).toEqual(saving({ [WRITE_PART]: 1, ...IN_STEP }));
    expect([size, row(db), joined(db)]).toEqual([14, '{"revision":1}', '{"revision":1}']);
    // Another key: the row goes.
    expect(during(() => stored.save({ revision: 1, flag: false }, false))).toEqual(saving({ [WRITE_PART]: 1, [DELETE_ROW]: 1 }));
    expect([row(db), joined(db)]).toEqual([undefined, '{"revision":1,"flag":false}']);
});

test('clearing legacy-only state persists an empty row even after a rolled-back attempt', () => {
    const db = database(), legacy = expected(sample());
    db.prepare('INSERT INTO state(id,body) VALUES(1,?)').run(legacy);
    const { stored } = parts(db);
    expect(JSON.stringify(stored.load())).toBe(legacy);
    const restore = stored.mark();
    db.exec('BEGIN IMMEDIATE');
    expect(stored.save({}, true)).toBe(2);
    expect(row(db)).toBe('{}');
    db.exec('ROLLBACK');
    restore();
    expect(row(db)).toBe(legacy);
    stored.save({}, false);
    expect([row(db), keys(db), parts(db).stored.load()]).toEqual(['{}', [], {}]);
});

test.each(['no whole row', 'a whole row'])('writes rolled back by the caller\'s transaction are forgotten in a store with %s, so the next save writes them again', kind => {
    const withRow = kind === 'a whole row', state = sample(), { db, stored } = withRow ? inherited(state) : partsOnly(state);
    const before = [row(db), partRows(db)], asWritten = stored.mark();
    db.exec('BEGIN IMMEDIATE');
    state.flag = true;
    stored.save(state, true);
    expect([row(db), joined(db)]).toEqual([undefined, expected(state)]);
    db.exec('ROLLBACK'); asWritten();
    expect([row(db), partRows(db)]).toEqual(before);
    // The row came back with the rollback, and so did the memory that it is there: a start still keeps it in step.
    state.flag = false; state.revision = 50;
    stored.save(state, false);
    expect([row(db), joined(db)]).toEqual([withRow ? expected(state) : undefined, expected(state)]);
    state.flag = true; // Without the restore this would see nothing to write.
    stored.save(state, false);
    expect([row(db), joined(db)]).toEqual([undefined, expected(state)]);
    expect(JSON.stringify(parts(db).stored.load())).toBe(expected(state));
});

test('a save that fails part way leaves the database and what is remembered as they were', () => {
    const state = sample(), { db, stored, during } = partsOnly(state);
    const before = partRows(db), prior = structuredClone(state);
    db.exec("CREATE TRIGGER refuse_part BEFORE INSERT ON state_parts WHEN NEW.key='flag' BEGIN SELECT RAISE(ABORT, 'rejected'); END;");
    state.revision = 60; state.flag = true; // `revision` is written before `flag` is refused.
    expect(() => stored.save(state, false)).toThrow('rejected');
    expect([db.isTransaction, row(db), partRows(db)]).toEqual([false, undefined, before]);
    let size = 0;
    expect(during(() => { size = stored.save(prior, false); })).toEqual(saving()); // What was saved before is still what is remembered.
    expect(size).toBe(expected(prior).length);
    db.exec('DROP TRIGGER refuse_part');
    expect(stored.save(state, false)).toBe(expected(state).length);
    expect([row(db), joined(db)]).toEqual([undefined, expected(state)]);
    expect(JSON.stringify(parts(db).stored.load())).toBe(expected(state));
});

test.each([['its own transaction', false], ['the caller\'s transaction', true]])('a failure after the whole row was removed, in %s, puts the row, the parts and what is remembered back', (_owner, inTransaction) => {
    const state = sample(), { db, stored, during } = inherited(state);
    const before = [row(db), partRows(db)], prior = structuredClone(state);
    db.exec("CREATE TRIGGER refuse_retirement AFTER DELETE ON state BEGIN SELECT RAISE(ABORT, 'rejected after retirement'); END;");
    state.revision = 60; state.flag = true;
    if (inTransaction) db.exec('BEGIN IMMEDIATE');
    expect(() => stored.save(state, inTransaction)).toThrow('rejected after retirement');
    expect(db.isTransaction).toBe(inTransaction);
    if (inTransaction) db.exec('COMMIT'); // The caller may still commit: the failed save undid itself.
    expect([row(db), partRows(db)]).toEqual(before);
    let size = 0;
    expect(during(() => { size = stored.save(prior, false); })).toEqual(saving());
    expect(size).toBe(expected(prior).length);
    db.exec('DROP TRIGGER refuse_retirement');
    expect(during(() => { size = stored.save(state, false); })).toEqual(saving({ [WRITE_PART]: 2, [DELETE_ROW]: 1 }));
    expect([size, row(db), joined(db)]).toEqual([expected(state).length, undefined, expected(state)]);
    expect(JSON.stringify(parts(db).stored.load())).toBe(expected(state));
});

test('a save that fails inside the caller\'s transaction is undone by itself: the caller commits its other work, and a retry saves everything', () => {
    const state = sample(), { db, stored } = partsOnly(state);
    const before = partRows(db), text = expected(state);
    db.exec("CREATE TABLE other_work(n INTEGER); CREATE TRIGGER refuse_part BEFORE INSERT ON state_parts WHEN NEW.key='flag' BEGIN SELECT RAISE(ABORT, 'rejected'); END;");
    db.exec('BEGIN IMMEDIATE');
    db.exec('INSERT INTO other_work VALUES(1)');
    state.revision = 70; state.flag = true; // Two changed parts: `revision` is written, then `flag` is refused.
    expect(() => stored.save(state, true)).toThrow('rejected');
    expect(db.isTransaction).toBe(true);
    db.exec('INSERT INTO other_work VALUES(2)');
    db.exec('COMMIT'); // No retry: what is committed is the other work and the state as it was.
    expect([row(db), partRows(db), JSON.stringify(parts(db).stored.load())]).toEqual([undefined, before, text]);
    expect(db.prepare('SELECT n FROM other_work ORDER BY n').all()).toEqual([{ n: 1 }, { n: 2 }]);
    db.exec('DROP TRIGGER refuse_part');
    expect(stored.save(state, false)).toBe(expected(state).length);
    expect([row(db), joined(db)]).toEqual([undefined, expected(state)]);
    expect(JSON.stringify(parts(db).stored.load())).toBe(expected(state));
});

test('a failed save whose own undo fails ends the caller\'s whole transaction, so nothing of it can be committed', () => {
    const state = sample(), { db, stored, during } = partsOnly(state);
    const before = partRows(db), text = expected(state);
    db.exec("CREATE TABLE other_work(n INTEGER); CREATE TRIGGER refuse_part BEFORE INSERT ON state_parts WHEN NEW.key='flag' AND NEW.body='true' BEGIN SELECT RAISE(ABORT, 'rejected'); END;");
    const exec = db.exec;
    db.exec = (sql: string) => { if (sql.startsWith('ROLLBACK TO')) throw new Error('undo failed'); return exec(sql); };
    db.exec('BEGIN IMMEDIATE');
    db.exec('INSERT INTO other_work VALUES(1)');
    state.revision = 70; state.flag = true; // Two changed parts: `revision` is written, then `flag` is refused.
    expect(() => stored.save(state, true)).toThrow('rejected'); // The first failure is the one reported.
    db.exec = exec;
    // No retry. The half-written save went with the transaction, and so did the caller's other work.
    expect(db.isTransaction).toBe(false);
    expect(() => db.exec('COMMIT')).toThrow(/no transaction is active/);
    expect([row(db), partRows(db), JSON.stringify(parts(db).stored.load())]).toEqual([undefined, before, text]);
    expect(db.prepare('SELECT n FROM other_work').all()).toEqual([]);
    // What is remembered is what is saved: the part rows are not replaced, and the change is written as any other.
    db.exec('DROP TRIGGER refuse_part');
    expect(during(() => stored.save(state, false))).toEqual(saving({ [WRITE_PART]: 2 }));
    expect(JSON.stringify(parts(db).stored.load())).toBe(expected(state));
});

test('a failed save that no rollback could undo, in a transaction still open, makes the next save replace every part', () => {
    const state = sample(), { db, stored, during } = partsOnly(state);
    db.exec("CREATE TRIGGER refuse_part BEFORE INSERT ON state_parts WHEN NEW.key='flag' AND NEW.body='true' BEGIN SELECT RAISE(ABORT, 'rejected'); END;");
    const exec = db.exec;
    db.exec = (sql: string) => { if (sql.startsWith('ROLLBACK')) throw new Error('undo failed'); return exec(sql); };
    db.exec('BEGIN IMMEDIATE');
    state.revision = 70; state.flag = true;
    expect(() => stored.save(state, true)).toThrow('rejected'); // The first failure is the one reported.
    db.exec = exec;
    expect(db.isTransaction).toBe(true);
    expect(partRows(db)).toContainEqual({ key: 'revision', position: 1, body: '70' }); // Still written, and not remembered.
    state.revision = 3; state.flag = false; // Back to what is remembered: without the replacement `revision` would stay 70.
    expect(during(() => stored.save(state, true))).toEqual(saving({ [DELETE_PARTS]: 1, [WRITE_PART]: 8 }));
    db.exec('COMMIT');
    expect([row(db), joined(db)]).toEqual([undefined, expected(state)]);
    expect(JSON.stringify(parts(db).stored.load())).toBe(expected(state));
});

test('a key cleared and set again in place moves no other key', () => {
    const state: Record<string, unknown> = { first: 1, pendingMail: { id: 'm1' }, big: ['kept'], last: true };
    const { db, stored, during } = partsOnly(state);
    state.pendingMail = undefined; // Still a key of the object, with nothing to save.
    expect(during(() => stored.save(state, false))).toEqual(saving({ [DELETE_PART]: 1 })); // `big` and `last` are not rewritten.
    expect(joined(db)).toBe(expected(state));
    state.pendingMail = { id: 'm2' };
    expect(during(() => stored.save(state, false))).toEqual(saving({ [WRITE_PART]: 1 }));
    expect([row(db), joined(db)]).toEqual([undefined, expected(state)]);
    expect(JSON.stringify(parts(db).stored.load())).toBe(expected(state));
});
