import { DatabaseSync } from 'node:sqlite';
import { afterEach, expect, test, vi } from 'vitest';
import * as security from '../../../server/office/security';
import { LARGE_KEY_CHARS } from '../../../server/store/redact-entries';
import { StateParts } from '../../../server/store/state-parts';
import { statementCache } from '../../../server/store/statement-cache';
import { initializeStoreSchema } from '../../../server/store/store-schema';
import { storeTimings } from '../../../server/store/store-timings';

const SECRET = 'see postgres://user:pw@db.internal/app for details';
let open: DatabaseSync[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const db of open) db.close(); open = []; });

function writer() {
    const db = new DatabaseSync(':memory:'); open.push(db); initializeStoreSchema(db);
    const timings = storeTimings(), stored = new StateParts(db, statementCache(db), timings);
    return { db, stored, redacted: () => timings.report().timings['save: redact']?.chars ?? 0 };
}
const body = (db: DatabaseSync, key: string) => (db.prepare('SELECT body FROM state_parts WHERE key=?').get(key) as { body: string }).body;
/** What must be stored for a value, worked out without the writer. */
const whole = (value: unknown) => JSON.stringify(security.sanitizeObject(JSON.parse(JSON.stringify(value))));
/** A key large enough to be redacted by entry: finished history that never changes, and a stamp that does. */
const large = (stamp: string, note = SECRET) => ({ jobs: Array.from({ length: 40 }, (_, id) => ({ id, note, steps: 'x'.repeat(LARGE_KEY_CHARS / 20) })), time: { publications: [SECRET] }, lastTickAt: stamp });

test('a change to one entry of a large key redacts that entry only, and stores what whole redaction stores', () => {
    const { db, stored, redacted } = writer();
    const state = { coordination: large('one'), paused: false };
    stored.save(state, false);
    expect(body(db, 'coordination')).toBe(whole(state.coordination));
    const before = redacted();
    state.coordination.lastTickAt = 'two';
    stored.save(state, false);
    expect(redacted() - before).toBe('"two"'.length);
    expect(body(db, 'coordination')).toBe(whole(state.coordination));
    expect(body(db, 'coordination')).not.toContain('user:pw');
    // A changed entry that carries a secret is redacted, not stored as it came.
    const mid = redacted();
    state.coordination.time.publications.push('Bearer abc.def');
    stored.save(state, false);
    expect(redacted() - mid).toBe(whole(state.coordination.time).length);
    expect(body(db, 'coordination')).toBe(whole(state.coordination));
    expect(body(db, 'coordination')).not.toContain('abc.def');
});

test('a small key, an array and an object with its own toJSON are redacted whole, as before', () => {
    const { db, stored, redacted } = writer();
    const history = Array.from({ length: 40 }, (_, id) => ({ id, steps: 'x'.repeat(LARGE_KEY_CHARS / 20) }));
    const state = { small: { a: 'one', b: SECRET }, list: history, own: { ...large('one'), toJSON() { return { kept: SECRET, pad: 'x'.repeat(LARGE_KEY_CHARS) }; } } };
    stored.save(state, false);
    for (const key of Object.keys(state)) expect(body(db, key), key).toBe(whole(state[key as keyof typeof state]));
    let before = redacted();
    state.small.a = 'two';
    stored.save(state, false);
    expect(redacted() - before).toBe(whole(state.small).length);
    before = redacted();
    state.list[0].id = 99;
    stored.save(state, false);
    expect(redacted() - before).toBe(whole(state.list).length);
    expect(body(db, 'list')).toBe(whole(state.list));
});

test('a save that is rolled back forgets the entries it redacted', () => {
    const { db, stored } = writer();
    const state = { coordination: large('one') };
    stored.save(state, false);
    db.exec('BEGIN IMMEDIATE');
    const restore = stored.mark();
    state.coordination.jobs[0].note = 'changed inside';
    state.coordination.lastTickAt = 'two';
    stored.save(state, true);
    db.exec('ROLLBACK');
    restore();
    expect(body(db, 'coordination')).toBe(whole(large('one')));
    // The same change again must be written again, from entries as they were before the lost save.
    stored.save(state, false);
    expect(body(db, 'coordination')).toBe(whole(state.coordination));
    state.coordination.jobs[0].note = SECRET;
    stored.save(state, false);
    expect(body(db, 'coordination')).toBe(whole(state.coordination));
});

test('after a restart a large key is redacted whole once and by entry from then on', () => {
    const { db, stored } = writer();
    stored.save({ coordination: large('one') }, false);
    const timings = storeTimings(), again = new StateParts(db, statementCache(db), timings);
    const state = again.load() as { coordination: ReturnType<typeof large> };
    const chars = () => timings.report().timings['save: redact']?.chars ?? 0;
    state.coordination.lastTickAt = 'two';
    again.save(state, false);
    const first = chars();
    expect(first).toBe(whole(state.coordination).length - '{"jobs":,"time":,"lastTickAt":}'.length);
    state.coordination.lastTickAt = 'three';
    again.save(state, false);
    expect(chars() - first).toBe('"three"'.length);
    expect(body(db, 'coordination')).toBe(whole(state.coordination));
});

test('random edits to a large key always store what whole redaction stores', () => {
    const { db, stored } = writer();
    let seed = 7;
    const next = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
    const state: { coordination: Record<string, unknown> } = { coordination: { ...large('one') } };
    for (let round = 0; round < 60; round++) {
        const name = ['lastTickAt', 'requests', 'listener', 'time', 'extra', '7'][Math.floor(next() * 6)];
        if (next() < 0.2) delete state.coordination[name];
        else state.coordination[name] = next() < 0.5 ? `${SECRET} ${round}` : { at: round, note: next() < 0.5 ? SECRET : 'plain' };
        stored.save(state, false);
        expect(body(db, 'coordination'), `round ${round}`).toBe(whole(state.coordination));
    }
});
