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
