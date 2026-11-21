import { DatabaseSync } from 'node:sqlite';
import { afterEach, expect, test } from 'vitest';
import { sanitizeObject } from '../../../server/office/security';
import { StateParts } from '../../../server/store/state-parts';
import { statementCache } from '../../../server/store/statement-cache';
import { initializeStoreSchema } from '../../../server/store/store-schema';
import { storeTimings } from '../../../server/store/store-timings';
import { timeStatements } from '../../../server/store/timed-statements';

const WRITE_ROW = 'sql: INSERT OR REPLACE INTO state(id,body) VALUES(?,?)';
const WRITE_PART = 'sql: INSERT OR REPLACE INTO state_parts(key,position,body) VALUES(?,?,?)';
const SECRET = 'see postgres://user:pw@db.internal/app for details';
let open: DatabaseSync[] = [];
afterEach(() => { for (const db of open) db.close(); open = []; });

function database() { const db = new DatabaseSync(':memory:'); open.push(db); initializeStoreSchema(db); return db; }
function parts(db: DatabaseSync) {
    const timings = storeTimings();
    timeStatements(db, timings);
    const stored = new StateParts(statementCache(db), sql => db.exec(sql), timings);
    const calls = (name: string) => timings.report().timings[name]?.calls ?? 0;
    return { stored, calls, writes: () => [calls(WRITE_PART), calls(WRITE_ROW)] };
}
const row = (db: DatabaseSync) => (db.prepare('SELECT body FROM state WHERE id=1').get() as { body: string } | undefined)?.body;
const keys = (db: DatabaseSync) => (db.prepare('SELECT key FROM state_parts ORDER BY position').all() as { key: string }[]).map(part => part.key);
/** What the previous release wrote for the same state. */
const before = (state: object) => JSON.stringify(sanitizeObject(state));
const sample = () => ({ revision: 3, serverTime: '2026-11-21T10:00:00Z', notes: [{ id: 'n1', text: SECRET }], skipped: undefined as unknown,
    tickets: [{ key: 'CEC-1', title: 'First' }], '10': 'numeric-looking key', nothing: null, empty: {}, flag: false });

test('the first save writes every key and the same whole row the previous release wrote; a load gives that state back in order', () => {
    const db = database(), { stored, writes } = parts(db), state = sample();
    expect(stored.load()).toBeNull();
    expect(stored.save(state, false)).toBe(before(state).length);
    expect(row(db)).toBe(before(state));
    expect(row(db)).not.toContain('user:pw');
    expect(writes()).toEqual([8, 1]); // `skipped` has no JSON form, as in the whole row.
    const again = parts(db), loaded = again.stored.load() as Record<string, unknown>;
    expect(JSON.stringify(loaded)).toBe(before(state));
    expect(Object.keys(loaded)).toEqual(Object.keys(JSON.parse(before(state))));
    // The loaded object has no `skipped` key, so the keys after it close up once; their text is not redacted again.
    again.stored.save(loaded, false);
    expect(row(db)).toBe(before(state));
    const closed = again.writes();
    again.stored.save(loaded, false);
    expect(again.writes()).toEqual(closed);
    // A state with no such gap is exactly what was written: saving it after a load writes nothing.
    const plain = database(), first = parts(plain);
    first.stored.save({ a: 1, b: [SECRET], c: { d: null } }, false);
    const next = parts(plain);
    next.stored.save(next.stored.load() as object, false);
    expect(next.writes()).toEqual([0, 0]);
});

test('a save writes only the keys whose content changed, redacted, and the whole row stays what the previous release would write', () => {
    const db = database(), { stored, writes, calls } = parts(db), state = sample();
    stored.save(state, false);
    const first = writes();
    stored.save(state, false);
    expect(writes()).toEqual(first); // Nothing changed: no part, no row.
    state.revision = 4; state.notes.push({ id: 'n2', text: `again ${SECRET}` });
    expect(stored.save(state, false)).toBe(before(state).length);
    expect(writes()).toEqual([first[0] + 2, first[1] + 1]);
    expect(row(db)).toBe(before(state));
    expect(row(db)).not.toContain('user:pw');
    state.tickets[0].title = 'Renamed'; // A change deep inside one key is that key's change.
    stored.save(state, false);
    expect(writes()).toEqual([first[0] + 3, first[1] + 2]);
    expect(row(db)).toBe(before(state));
    expect(calls('exec: BEGIN IMMEDIATE')).toBe(calls('exec: COMMIT')); // Each save outside a transaction is one unit.
});

test('added, removed and reordered keys keep the stored parts and the whole row in step', () => {
    const db = database(), { stored } = parts(db);
    let state: Record<string, unknown> = sample();
    stored.save(state, false);
    delete state.nothing; state.added = { at: 'end' };
    stored.save(state, false);
    expect(row(db)).toBe(before(state));
    expect(keys(db)).toEqual(Object.keys(JSON.parse(before(state))));
    state = { first: 1, ...state }; // A key in front moves every other key.
    stored.save(state, false);
    expect(row(db)).toBe(before(state));
    expect(keys(db)).toEqual(Object.keys(JSON.parse(before(state))));
    expect(JSON.stringify(parts(db).stored.load())).toBe(before(state));
    stored.save({}, false);
    expect([row(db), keys(db)]).toEqual(['{}', []]);
});

test('a state row written without its parts, as the previous release writes it, wins over older parts', () => {
    const db = database(), { stored } = parts(db), state: Record<string, unknown> = sample();
    stored.save(state, false);
    // The previous release runs after a rollback: it rewrites the row and knows nothing of parts.
    const newer = { ...state, revision: 9, onlyInRow: true }; delete (newer as Record<string, unknown>).tickets;
    db.prepare('INSERT OR REPLACE INTO state(id,body) VALUES(1,?)').run(before(newer));
    const after = parts(db), loaded = after.stored.load() as Record<string, unknown>;
    expect(JSON.stringify(loaded)).toBe(before(newer));
    loaded.revision = 10;
    after.stored.save(loaded, false);
    expect(row(db)).toBe(before(loaded));
    expect(keys(db)).toEqual(Object.keys(loaded)); // The stale `tickets` part is gone.
    expect(JSON.stringify(parts(db).stored.load())).toBe(before(loaded));
});

test('a store that has only the old row loads from it and writes its parts on the first save', () => {
    const db = database(), state = sample();
    db.prepare('INSERT OR REPLACE INTO state(id,body) VALUES(1,?)').run(before(state));
    const { stored, writes } = parts(db), loaded = stored.load() as Record<string, unknown>;
    expect(JSON.stringify(loaded)).toBe(before(state));
    stored.save(loaded, false);
    expect(writes()).toEqual([8, 1]);
    expect(row(db)).toBe(before(state));
});

test('writes rolled back by the caller\'s transaction are forgotten, so the next save writes them again', () => {
    const db = database(), { stored } = parts(db), state = sample();
    stored.save(state, false);
    const saved = row(db), asWritten = stored.mark();
    db.exec('BEGIN IMMEDIATE');
    state.revision = 50;
    stored.save(state, true);
    expect(row(db)).toBe(before(state));
    db.exec('ROLLBACK'); asWritten();
    expect(row(db)).toBe(saved);
    stored.save(state, false); // Without the restore this would see nothing to write.
    expect(row(db)).toBe(before(state));
    expect(JSON.stringify(parts(db).stored.load())).toBe(before(state));
});

test('a save that fails part way leaves the database and what is remembered as they were', () => {
    const db = database(), { stored } = parts(db), state = sample();
    stored.save(state, false);
    const saved = row(db);
    db.exec("CREATE TRIGGER refuse_state BEFORE INSERT ON state BEGIN SELECT RAISE(ABORT, 'rejected'); END;");
    state.revision = 60; state.flag = true;
    expect(() => stored.save(state, false)).toThrow('rejected');
    db.exec('DROP TRIGGER refuse_state');
    expect(row(db)).toBe(saved);
    expect(JSON.stringify(parts(db).stored.load())).toBe(saved); // The part rows written before the failure went with it.
    stored.save(state, false);
    expect(row(db)).toBe(before(state));
});

test('a key cleared and set again in place moves no other key', () => {
    const db = database(), { stored, writes } = parts(db);
    const state: Record<string, unknown> = { first: 1, pendingMail: { id: 'm1' }, big: ['kept'], last: true };
    stored.save(state, false);
    const before1 = writes();
    state.pendingMail = undefined; // Still a key of the object, with nothing to save.
    stored.save(state, false);
    expect(row(db)).toBe(before(state));
    expect(writes()).toEqual([before1[0], before1[1] + 1]); // Its row is removed; `big` and `last` are not rewritten.
    state.pendingMail = { id: 'm2' };
    stored.save(state, false);
    expect(writes()).toEqual([before1[0] + 1, before1[1] + 2]);
    expect(row(db)).toBe(before(state));
    expect(JSON.stringify(parts(db).stored.load())).toBe(before(state));
});

test('a save that fails on a write inside the caller\'s transaction makes the next save replace every part', () => {
    const db = database(), { stored } = parts(db), state = sample();
    stored.save(state, false);
    db.exec('BEGIN IMMEDIATE');
    db.exec("CREATE TEMP TRIGGER refuse_state BEFORE INSERT ON state BEGIN SELECT RAISE(ABORT, 'rejected'); END;");
    state.revision = 70;
    expect(() => stored.save(state, true)).toThrow('rejected'); // The part row for `revision` is written, the row is not.
    db.exec('DROP TRIGGER refuse_state');
    state.revision = 3; // Back to what is remembered: without the replacement this key would be skipped.
    stored.save(state, true);
    db.exec('COMMIT');
    expect(row(db)).toBe(before(state));
    expect(JSON.stringify(parts(db).stored.load())).toBe(before(state));
    const rows = db.prepare('SELECT key,body FROM state_parts ORDER BY position').all() as { key: string; body: string }[];
    expect(`{${rows.map(part => `${JSON.stringify(part.key)}:${part.body}`).join(',')}}`).toBe(before(state));
});
