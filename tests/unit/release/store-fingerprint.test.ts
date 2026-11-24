import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { changedStores, fingerprintStores } from '../../../server/release/store-fingerprint';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
function database(setup = '') {
    const dir = mkdtempSync(resolve(tmpdir(), 'office-fingerprint-')); roots.push(dir);
    const path = resolve(dir, 'office.sqlite'), db = new DatabaseSync(path);
    db.exec(`CREATE TABLE state (id INTEGER PRIMARY KEY, body TEXT NOT NULL); CREATE TABLE effects (id TEXT PRIMARY KEY, body BLOB, n INTEGER); INSERT INTO state VALUES (1, '{"a":1}'); INSERT INTO effects VALUES ('e1', x'00ff', 9007199254740993); ${setup}`);
    db.close();
    return path;
}
const change = (path: string, sql: string) => { const db = new DatabaseSync(path); db.exec(sql); db.close(); };
const digest = (path: string) => fingerprintStores([{ name: 'cec', path }])[0].digest;

test('a fingerprint is stable across reads and does not write the database file', () => {
    const path = database(), before = readFileSync(path);
    const first = digest(path);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(digest(path)).toBe(first);
    expect(readFileSync(path).equals(before)).toBe(true);
});

test.each([
    ['a changed existing row', "UPDATE effects SET body = x'00fe' WHERE id = 'e1'"],
    ['a BLOB replaced by its text representation', "UPDATE effects SET body = 'x00ff' WHERE id = 'e1'"],
    ['an application schema version change', 'PRAGMA user_version = 42'],
    ['a changed large integer', 'UPDATE effects SET n = 9007199254740992'],
    ['a new row', "INSERT INTO effects VALUES ('e2', NULL, 1)"],
    ['a deleted row', 'DELETE FROM state'],
    ['a new empty table', 'CREATE TABLE added (id INTEGER)'],
    ['a new index', 'CREATE INDEX effects_n ON effects(n)'],
])('%s changes the fingerprint', (_, sql) => {
    const path = database(), before = digest(path);
    change(path, sql);
    const after = digest(path);
    expect(after).not.toBe(before);
    expect(digest(path)).toBe(after);
    expect(changedStores([{ name: 'cec', digest: before }], [{ name: 'cec', digest: after }])).toEqual([{ name: 'cec', reason: 'its contents changed' }]);
});

test('a missing file or one that is not a database has no digest, with the reason', () => {
    const dir = mkdtempSync(resolve(tmpdir(), 'office-fingerprint-')); roots.push(dir);
    const junk = resolve(dir, 'junk.sqlite');
    writeFileSync(junk, 'not a database '.repeat(40));
    expect(fingerprintStores([{ name: 'gone', path: resolve(dir, 'gone.sqlite') }, { name: 'junk', path: junk }])).toEqual([
        { name: 'gone', digest: null, reason: expect.stringContaining('does not exist') }, { name: 'junk', digest: null, reason: expect.any(String) },
    ]);
});

test('stores compare as unchanged only when both reads name the same stores with equal digests', () => {
    const a = { name: 'cec', digest: '1'.repeat(64) }, b = { name: 'control', digest: '2'.repeat(64) };
    expect(changedStores([a, b], [b, a])).toEqual([]);
    expect(changedStores([a, b], [a, { ...b, digest: '3'.repeat(64) }])).toEqual([{ name: 'control', reason: 'its contents changed' }]);
    expect(changedStores([a, b], [a])).toEqual([{ name: 'control', reason: expect.stringContaining('not covered') }]);
    expect(changedStores([a], [a, b])).toEqual([{ name: 'control', reason: 'the earlier fingerprint does not cover it' }]);
    expect(changedStores([a, { name: 'control', digest: null, reason: 'locked' }], [a, b])).toEqual([{ name: 'control', reason: expect.stringContaining('locked') }]);
    expect(changedStores([], [])).toEqual([{ name: '*', reason: 'the earlier fingerprint covers no store' }]);
    expect(changedStores([a, a], [a])).toContainEqual({ name: '*', reason: 'a fingerprint names a store twice' });
    expect(changedStores([{ digest: a.digest } as any], [{ digest: a.digest } as any]).length).toBeGreaterThan(0);
});

const state = (at: string, revision: number, rest = '"paused":false') => `UPDATE state SET body = '{"startedAt":"${at}","serverTime":"${at}","revision":${revision},"events":[${revision}],${rest}}'`;
const parts = (at: string, revision: number) => `INSERT OR REPLACE INTO state_parts VALUES ('startedAt', 0, '"${at}"'), ('serverTime', 1, '"${at}"'), ('revision', 2, '${revision}'), ('events', 3, '[${revision}]')`;
const PROJECT = `CREATE TABLE events (id INTEGER PRIMARY KEY AUTOINCREMENT, body TEXT NOT NULL); INSERT INTO events(body) VALUES ('{"kind":"office-opened"}'); CREATE TABLE admissions (seq INTEGER PRIMARY KEY AUTOINCREMENT); CREATE TABLE state_parts (key TEXT PRIMARY KEY, position INTEGER NOT NULL, body TEXT NOT NULL); ${state('t0', 1)}; ${parts('t0', 1)}; INSERT INTO state_parts VALUES ('paused', 4, 'false')`;
const START = `INSERT INTO events(body) VALUES ('{"kind":"office-opened","at":"t1"}'); ${state('t1', 2)}; ${parts('t1', 2)}`;
const project = (path: string, since?: ReturnType<typeof fingerprintStores>) => fingerprintStores([{ name: 'cec', path }], { projects: ['cec'], since });

test('a project store that a release only started compares as unchanged', () => {
    const path = database(PROJECT), before = project(path);
    expect(before).toEqual([{ name: 'cec', digest: expect.stringMatching(/^[0-9a-f]{64}$/), eventsThrough: 1 }]);
    change(path, `${START}; ${START}; ANALYZE`);
    expect(changedStores(before, project(path, JSON.parse(JSON.stringify(before))))).toEqual([]);
    // The start replaced its four parts, which now sit after the one it left alone.
    const db = new DatabaseSync(path, { readOnly: true });
    try { expect(db.prepare('SELECT key FROM state_parts ORDER BY rowid').all().map(row => row.key)).toEqual(['paused', 'startedAt', 'serverTime', 'revision', 'events']); } finally { db.close(); }
    // The same writes are a change in a store that is not a project's.
    expect(fingerprintStores([{ name: 'cec', path }])[0].digest).not.toBe(fingerprintStores([{ name: 'cec', path: database(PROJECT) }])[0].digest);
});

test.each([
    ['another part of the state', state('t1', 2, '"paused":true')],
    ['a start key the previous release cannot read', state('t1', 2).replace('"events":[2]', '"events":"gone"')],
    ['a removed start key', state('t1', 2).replace('"startedAt":"t1",', '')],
    ['a state that no longer parses', "UPDATE state SET body = 'startedAt'"],
    ['an event the earlier read covered', `UPDATE events SET body = '{"kind":"office-opened","at":"t9"}' WHERE id = 1`],
    ['a removed event', 'DELETE FROM events'],
    ['an event no start records', `INSERT INTO events(body) VALUES ('{"kind":"work-time-reported"}')`],
    ['an event that does not parse', "INSERT INTO events(body) VALUES ('office-opened')"],
    ['an effect', "UPDATE effects SET n = 1 WHERE id = 'e1'"],
    ['the schema', 'CREATE TABLE added (key TEXT PRIMARY KEY)'],
    ['another state part', `UPDATE state_parts SET body = 'true' WHERE key = 'paused'`],
    ['a start part the previous release cannot read', `UPDATE state_parts SET body = '"gone"' WHERE key = 'events'`],
    ['a removed start part', `DELETE FROM state_parts WHERE key = 'startedAt'`],
    ['the counter of another table', 'INSERT INTO admissions DEFAULT VALUES; DELETE FROM admissions'],
    ['an event counter that no longer names the last event', "UPDATE sqlite_sequence SET seq = 99 WHERE name = 'events'"],
    ['the place of a start part among the keys', "UPDATE state_parts SET position = 9 WHERE key = 'revision'"],
])('a start that also changes %s is a changed project store', (_, sql) => {
    const path = database(PROJECT), before = project(path);
    change(path, `${START}; ${sql}`);
    expect(changedStores(before, project(path, before))).toEqual([{ name: 'cec', reason: 'its contents changed' }]);
});

test('planner statistics are no part of any fingerprint, and an unusable earlier bound reads every event', () => {
    const path = database(PROJECT), plain = digest(path), before = project(path);
    change(path, 'ANALYZE');
    expect(digest(path)).toBe(plain);
    change(path, START);
    for (const eventsThrough of [undefined, -1, 1.5, '1'])
        expect(changedStores(before, project(path, [{ ...before[0], eventsThrough } as any]))).toEqual([{ name: 'cec', reason: 'its contents changed' }]);
});

test('a missing project store is marked absent; a missing store that is not a project and an unreachable project path are not', () => {
    const dir = mkdtempSync(resolve(tmpdir(), 'office-fingerprint-')); roots.push(dir);
    const plain = resolve(dir, 'plain');
    writeFileSync(plain, 'a regular file where a directory is expected');
    expect(fingerprintStores([
        { name: 'cec', path: resolve(dir, 'gone.sqlite') }, { name: 'office-control', path: resolve(dir, 'control.sqlite') }, { name: 'brain', path: resolve(plain, 'office.sqlite') },
    ], { projects: ['cec', 'brain'] })).toEqual([
        { name: 'cec', digest: null, absent: true, reason: expect.stringContaining('does not exist') },
        { name: 'office-control', digest: null, reason: expect.stringContaining('does not exist') },
        { name: 'brain', digest: null, reason: expect.stringContaining('ENOTDIR') },
    ]);
});

test('a store absent in both reads is unchanged; one created or gone since, or unreadable now, is a change', () => {
    const absent = { name: 'cec', digest: null, absent: true as const, reason: 'missing' }, control = { name: 'office-control', digest: '2'.repeat(64) }, cec = { name: 'cec', digest: '1'.repeat(64) };
    expect(changedStores([absent, control], JSON.parse(JSON.stringify([control, absent])))).toEqual([]);
    expect(changedStores([absent, control], [cec, control])).toEqual([{ name: 'cec', reason: 'created since the old service stopped' }]);
    expect(changedStores([cec, control], [absent, control])).toEqual([{ name: 'cec', reason: 'its store no longer exists' }]);
    expect(changedStores([absent], [{ name: 'cec', digest: null, reason: 'locked' }])).toEqual([{ name: 'cec', reason: 'the later fingerprint is unreadable: locked' }]);
    expect(changedStores([absent, control], [control])).toEqual([{ name: 'cec', reason: 'the later fingerprint is unreadable: not covered' }]);
    // A missing control store is read unmarked, so it never matches.
    const missingControl = { name: 'office-control', digest: null, reason: 'does not exist' };
    expect(changedStores([missingControl], [missingControl])).toEqual([{ name: 'office-control', reason: 'the earlier fingerprint is unreadable: does not exist' }]);
});

test.each<[string, unknown]>([
    ['a marker that is not literally true', { name: 'cec', digest: null, absent: 'true' }],
    ['a false marker', { name: 'cec', digest: null, absent: false }],
    ['a null marker', { name: 'cec', digest: null, absent: null }],
    ['a marked entry with a digest', { name: 'cec', digest: '1'.repeat(64), absent: true }],
    ['a marked entry with no digest', { name: 'cec', absent: true }],
])('%s blocks the comparison on either side', (_, entry) => {
    const absent = { name: 'cec', digest: null, absent: true as const }, readable = { name: 'cec', digest: '1'.repeat(64) };
    for (const other of [absent, readable]) {
        expect(changedStores([entry] as never, [other])).toEqual([{ name: 'cec', reason: 'the earlier fingerprint has a malformed absent marker' }]);
        expect(changedStores([other], [entry] as never)).toEqual([{ name: 'cec', reason: 'the later fingerprint has a malformed absent marker' }]);
    }
});

test('receipts without a marker read as before: a readable digest matches, an unmarked null for a missing file does not', () => {
    const path = database(), readable = JSON.parse(JSON.stringify(fingerprintStores([{ name: 'cec', path }])));
    expect(readable[0]).not.toHaveProperty('absent');
    expect(changedStores(readable, fingerprintStores([{ name: 'cec', path }]))).toEqual([]);
    const old = JSON.parse(JSON.stringify([{ name: 'cec', digest: null, reason: '/x/office.sqlite does not exist' }]));
    for (const now of [{ name: 'cec', digest: null, absent: true as const }, readable[0], ...old])
        expect(changedStores(old, [now])).toEqual([{ name: 'cec', reason: 'the earlier fingerprint is unreadable: /x/office.sqlite does not exist' }]);
});
