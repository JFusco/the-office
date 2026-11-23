import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, expect, test } from 'vitest';
import { StateParts } from '../../../server/store/state-parts';
import { statementCache } from '../../../server/store/statement-cache';
import { initializeStoreSchema } from '../../../server/store/store-schema';
import { storeTimings } from '../../../server/store/store-timings';
import { timeStatements } from '../../../server/store/timed-statements';

const WRITE_EMPTY_ROW = 'sql: INSERT OR REPLACE INTO state(id,body) VALUES(?,?)';
const DELETE_PARTS = 'sql: DELETE FROM state_parts';
let folder = '', open: DatabaseSync[] = [];
afterEach(() => {
    for (const db of open) db.close();
    open = [];
    if (folder) rmSync(folder, { recursive: true, force: true });
    folder = '';
});

/** One more connection to the one database file, as each process that has the store open holds its own. */
function connection() {
    const fresh = !folder;
    const db = new DatabaseSync(join(folder ||= mkdtempSync(join(tmpdir(), 'state-parts-writers-')), 'office.sqlite')); open.push(db);
    db.exec('PRAGMA journal_mode=WAL');
    if (fresh) initializeStoreSchema(db);
    return db;
}
/** A writer on its own connection, loaded from what is saved, with the statements it writes counted by label. */
function writer() {
    const db = connection(), timings = storeTimings();
    timeStatements(db, timings);
    const stored = new StateParts(db, statementCache(db), timings), state = stored.load() as Record<string, unknown>;
    const counts = () => new Map(Object.entries(timings.report().timings).map(([name, timing]) => [name, timing.calls]));
    /** The statements `work` ran that are not reads. */
    const writes = (work: () => unknown) => {
        const before = counts();
        work();
        return Object.fromEntries([...counts()].map(([name, count]) => [name, count - (before.get(name) ?? 0)] as const)
            .filter(([name, count]) => count && name.startsWith('sql: ') && !name.startsWith('sql: SELECT ')));
    };
    return { db, stored, state, writes };
}
const row = (db: DatabaseSync) => (db.prepare('SELECT body FROM state WHERE id=1').get() as { body: string } | undefined)?.body;
/** The ordered parts as one text, joined here and not by the code under test. */
const joined = (db: DatabaseSync) => `{${(db.prepare('SELECT key,body FROM state_parts ORDER BY position,key').all() as { key: string; body: string }[])
    .map(part => `${JSON.stringify(part.key)}:${part.body}`).join(',')}}`;
/** A store a previous release wrote, open in two processes: the whole row equal to the parts, and a writer on each of two connections. */
function twoWriters() {
    const first = writer();
    first.stored.save({ startedAt: 't0', serverTime: 't0', revision: 1, events: [], flag: false }, false);
    first.db.prepare('INSERT INTO state(id,body) VALUES(1,?)').run(joined(first.db));
    const a = writer(), b = writer();
    expect([a.state, row(b.db)]).toEqual([b.state, joined(b.db)]);
    return { a, b };
}

test('two writers that each change a different start key leave the whole row equal to the parts, with both changes', () => {
    const { a, b } = twoWriters();
    a.state.revision = 2;
    a.stored.save(a.state, false);
    b.state.serverTime = 't1'; // It still remembers `revision` as 1, and writes only what it changed.
    expect(b.writes(() => b.stored.save(b.state, false))).toEqual({
        'sql: INSERT OR REPLACE INTO state_parts(key,position,body) VALUES(?,?,?)': 1, 'sql: UPDATE state SET body=? WHERE id=?': 1,
    });
    const text = '{"startedAt":"t0","serverTime":"t1","revision":2,"events":[],"flag":false}';
    // A row written from the second writer's own memory would hold `revision` 1 beside parts that hold 2.
    expect([row(a.db), joined(a.db)]).toEqual([text, text]);
    expect(JSON.stringify(writer().state)).toBe(text);
});

test('a writer that still remembers the whole row does not write it again after another writer retired it', () => {
    const { a, b } = twoWriters();
    a.state.flag = true; // No start writes this key: the row goes.
    a.stored.save(a.state, false);
    expect(row(b.db)).toBeUndefined();
    b.state.startedAt = 't1';
    expect(b.writes(() => b.stored.save(b.state, false))).toEqual({ 'sql: INSERT OR REPLACE INTO state_parts(key,position,body) VALUES(?,?,?)': 1 });
    const text = '{"startedAt":"t1","serverTime":"t0","revision":1,"events":[],"flag":true}';
    expect([row(a.db), joined(a.db)]).toEqual([undefined, text]);
    expect(JSON.stringify(writer().state)).toBe(text);
    // And never later: its next start still finds no row to keep in step.
    b.state.revision = 2;
    b.stored.save(b.state, false);
    expect([row(a.db), writer().state.revision]).toEqual([undefined, 2]);
});

test('an empty state is saved over whatever another writer saved since: its parts go, the row is the literal {}, and saving it again writes nothing', () => {
    const a = writer();
    expect(a.state).toBeNull(); // Never saved.
    a.stored.save({}, false);
    const b = writer();
    b.state.revision = 1; // A start key: the other writer keeps the row, now `{"revision":1}`, beside its part.
    b.stored.save(b.state, false);
    expect([row(a.db), joined(a.db)]).toEqual(['{"revision":1}', '{"revision":1}']);
    // The first writer remembers an empty state already saved; what is saved now says otherwise.
    expect(a.writes(() => a.stored.save({}, false))).toEqual({ [DELETE_PARTS]: 1, [WRITE_EMPTY_ROW]: 1 });
    expect([row(b.db), joined(b.db), writer().state]).toEqual(['{}', '{}', {}]);
    expect(a.writes(() => a.stored.save({}, false))).toEqual({});
    expect([row(b.db), joined(b.db)]).toEqual(['{}', '{}']);
});
