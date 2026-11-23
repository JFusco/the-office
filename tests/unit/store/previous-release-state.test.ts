import { DatabaseSync } from 'node:sqlite';
import { afterEach, expect, test } from 'vitest';
import { sanitizeObject } from '../../../server/office/security';
import { readSaved } from '../../../server/store/saved-state';
import { StateParts } from '../../../server/store/state-parts';
import { statementCache } from '../../../server/store/statement-cache';
import { initializeStoreSchema } from '../../../server/store/store-schema';
import { storeTimings } from '../../../server/store/store-timings';
import { StateParts as PreviousStateParts } from './previous-state-parts-fixture';

let open: DatabaseSync[] = [];
afterEach(() => { for (const db of open) db.close(); open = []; });
function database() { const db = new DatabaseSync(':memory:'); open.push(db); initializeStoreSchema(db); return db; }
/** This release's loader and writer, and the previous release's, each as a restart makes it. */
const current = (db: DatabaseSync) => new StateParts(db, statementCache(db), storeTimings());
const previous = (db: DatabaseSync) => new PreviousStateParts(statementCache(db), sql => db.exec(sql), storeTimings());
const row = (db: DatabaseSync) => (db.prepare('SELECT body FROM state WHERE id=1').get() as { body: string } | undefined)?.body;
const partRows = (db: DatabaseSync) => db.prepare('SELECT key,position,body FROM state_parts ORDER BY position,key').all() as { key: string; position: number; body: string }[];
const joined = (db: DatabaseSync) => `{${partRows(db).map(part => `${JSON.stringify(part.key)}:${part.body}`).join(',')}}`;
const expected = (state: object) => JSON.stringify(sanitizeObject(state));
const sample = (): Record<string, unknown> => ({ startedAt: 't0', revision: 3, notes: [{ id: 'n1', text: 'see postgres://user:pw@db.internal/app for details' }],
    skipped: undefined, tickets: [{ key: 'CEC-1', title: 'First' }], '10': 'numeric-looking key', nothing: null, empty: {}, flag: false });
/** The two copies as this release reads them: the parts are the state and the row is the same text. */
const matchingCopies = (db: DatabaseSync) => { const { source, rowMatches } = readSaved(db); return [source, rowMatches, row(db) === joined(db)]; };

test('the previous release loads exactly what this one saved without the whole row, and its next save writes the row again for this one to open', () => {
    const db = database(), state = sample(), text = expected(state);
    current(db).save(state, false);
    expect([row(db), joined(db)]).toEqual([undefined, text]);

    const before = previous(db), loaded = before.load() as Record<string, unknown>;
    expect(JSON.stringify(loaded)).toBe(text);
    expect(Object.keys(loaded)).toEqual(Object.keys(JSON.parse(text)));
    loaded.revision = 4; loaded.flag = true;
    const rolledBack = expected(loaded);
    expect(before.save(loaded, false)).toBe(rolledBack.length);
    expect([row(db), joined(db)]).toEqual([rolledBack, rolledBack]);

    // This release opens the two matching copies, keeps the row through a start and removes it with the next other change.
    expect(matchingCopies(db)).toEqual(['parts', true, true]);
    const after = current(db), reopened = after.load() as Record<string, unknown>;
    expect(JSON.stringify(reopened)).toBe(rolledBack);
    reopened.startedAt = 't1'; reopened.revision = 5;
    after.save(reopened, false);
    expect([row(db), joined(db)]).toEqual([expected(reopened), expected(reopened)]);
    reopened.flag = false;
    after.save(reopened, false);
    expect([row(db), joined(db)]).toEqual([undefined, expected(reopened)]);
    expect(JSON.stringify(previous(db).load())).toBe(expected(reopened));
});

test('the previous release keeps the whole row it was not given, even when its first save changes nothing', () => {
    const db = database(), state = { startedAt: 't0', revision: 3, flag: false }, text = expected(state);
    current(db).save(state, false);
    const before = previous(db), loaded = before.load() as object;
    expect(before.save(loaded, false)).toBe(text.length);
    expect([row(db), joined(db)]).toEqual([text, text]);
    expect(matchingCopies(db)).toEqual(['parts', true, true]);
    expect(JSON.stringify(current(db).load())).toBe(text);
});

test('a saved empty object is the literal {} to both releases, and what the previous one saves next this one opens', () => {
    const db = database();
    expect(current(db).save({}, false)).toBe(2);
    expect([row(db), partRows(db)]).toEqual(['{}', []]);
    const before = previous(db);
    expect(before.load()).toEqual({});
    expect(before.save({}, false)).toBe(2);
    expect([row(db), partRows(db), current(db).load()]).toEqual(['{}', [], {}]);
    const state = sample(), text = expected(state);
    before.save(state, false);
    expect([row(db), joined(db)]).toEqual([text, text]);
    expect(matchingCopies(db)).toEqual(['parts', true, true]);
    expect(JSON.stringify(current(db).load())).toBe(text);
});

test('a store nothing was saved in is never saved to both releases, and what the previous one saves first this one opens', () => {
    const db = database();
    expect(current(db).load()).toBeNull();
    expect([row(db), partRows(db)]).toEqual([undefined, []]); // Loading wrote nothing.
    const before = previous(db);
    expect(before.load()).toBeNull();
    const state = sample(), text = expected(state);
    expect(before.save(state, false)).toBe(text.length);
    expect([row(db), joined(db)]).toEqual([text, text]);
    expect(matchingCopies(db)).toEqual(['parts', true, true]);
    expect(JSON.stringify(current(db).load())).toBe(text);
});
