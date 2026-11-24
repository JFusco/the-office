import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { compareAdmissions, snapshotAdmissions } from '../../../server/release/admission-snapshot';
import { recordAdmission } from '../../../server/store/admission-journal';
import { projectById } from '../../../server/office/projects';
import { Store } from '../../../server/store/store';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
function projectDatabase(admissions: number) {
    const dir = mkdtempSync(resolve(tmpdir(), 'office-admission-snapshot-')); roots.push(dir);
    const path = resolve(dir, 'office.sqlite'), store = new Store(path, projectById('brain'), dir);
    for (let i = 0; i < admissions; i++) recordAdmission(store.db, 'request', `r${i}`, '2026-11-20T00:00:00.000Z');
    store.close();
    return path;
}

test('a snapshot reads each cursor from a real store database without changing the file', () => {
    const a = projectDatabase(2), b = projectDatabase(0), before = readFileSync(a);
    expect(snapshotAdmissions([{ name: 'brain', path: a }, { name: 'cec', path: b }])).toEqual([{ name: 'brain', cursor: 2 }, { name: 'cec', cursor: 0 }]);
    expect(readFileSync(a).equals(before)).toBe(true);
});

test('a missing database, a file that is not a database and one without a journal each report a null cursor with a reason', () => {
    const dir = mkdtempSync(resolve(tmpdir(), 'office-admission-snapshot-')); roots.push(dir);
    const junk = resolve(dir, 'junk.sqlite'), bare = resolve(dir, 'bare.sqlite');
    writeFileSync(junk, 'this is not a database, but it is long enough to be read as a header by sqlite '.repeat(4));
    const db = new DatabaseSync(bare); db.exec('CREATE TABLE other(id INTEGER)'); db.close();
    const result = snapshotAdmissions([{ name: 'gone', path: resolve(dir, 'gone.sqlite') }, { name: 'junk', path: junk }, { name: 'bare', path: bare }]);
    expect(result.map(entry => entry.cursor)).toEqual([null, null, null]);
    expect(result.every(entry => !!entry.reason)).toBe(true);
});

test('unchanged only when every project is covered twice with equal readable cursors', () => {
    const before = [{ name: 'brain', cursor: 2 }, { name: 'cec', cursor: 0 }];
    expect(compareAdmissions(before, [{ name: 'cec', cursor: 0 }, { name: 'brain', cursor: 2 }])).toEqual({ status: 'unchanged' });
    expect(compareAdmissions(before, [{ name: 'brain', cursor: 3 }, { name: 'cec', cursor: 0 }])).toEqual({ status: 'admitted-or-unknown', projects: [{ name: 'brain', reason: 'the cursor moved from 2 to 3' }] });
    expect(compareAdmissions(before, [{ name: 'brain', cursor: 2 }, { name: 'cec', cursor: null, reason: 'locked' }])).toMatchObject({ status: 'admitted-or-unknown', projects: [{ name: 'cec' }] });
    expect(compareAdmissions([{ name: 'brain', cursor: null, reason: 'missing' }], [{ name: 'brain', cursor: 0 }])).toMatchObject({ status: 'admitted-or-unknown' });
    expect(compareAdmissions(before, [{ name: 'brain', cursor: 2 }])).toMatchObject({ status: 'admitted-or-unknown', projects: [{ name: 'cec', reason: 'the later snapshot does not cover it' }] });
    expect(compareAdmissions([{ name: 'brain', cursor: 2 }], before)).toMatchObject({ status: 'admitted-or-unknown', projects: [{ name: 'cec', reason: 'the earlier snapshot does not cover it' }] });
    expect(compareAdmissions([], [])).toMatchObject({ status: 'admitted-or-unknown' });
    // Snapshots read back from a journal receipt are untyped: a missing or non-numeric cursor is unknown, not equal.
    const untyped = (cursor?: unknown) => [{ name: 'brain', ...(cursor === undefined ? {} : { cursor }) }] as never;
    for (const cursor of [undefined, '2', -1, 1.5]) expect(compareAdmissions(untyped(cursor), untyped(cursor))).toMatchObject({ status: 'admitted-or-unknown' });
    expect(compareAdmissions([{ name: 'brain', cursor: 1 }, { name: 'brain', cursor: 1 }], [{ name: 'brain', cursor: 1 }])).toMatchObject({ status: 'admitted-or-unknown' });
});

test.each([undefined, '', '   ', 1])('equal cursors cannot match an unidentified project (%s)', name => {
    const receipt = [{ ...(name === undefined ? {} : { name }), cursor: 0 }] as never;
    expect(compareAdmissions(receipt, receipt)).toMatchObject({ status: 'admitted-or-unknown' });
});

test('a project file that does not exist is marked absent; one that cannot be looked up is not', () => {
    const dir = mkdtempSync(resolve(tmpdir(), 'office-admission-snapshot-')); roots.push(dir);
    const plain = resolve(dir, 'plain');
    writeFileSync(plain, 'a regular file where a directory is expected');
    expect(snapshotAdmissions([{ name: 'gone', path: resolve(dir, 'gone.sqlite') }, { name: 'blocked', path: resolve(plain, 'office.sqlite') }])).toEqual([
        { name: 'gone', cursor: null, absent: true, reason: expect.stringContaining('does not exist') },
        { name: 'blocked', cursor: null, reason: expect.stringContaining('ENOTDIR') },
    ]);
});

test('a store absent in both snapshots is unchanged; one created or gone since, or unreadable now, is not', () => {
    const absent = { name: 'brain', cursor: null, absent: true as const, reason: 'missing' }, cec = { name: 'cec', cursor: 0 };
    expect(compareAdmissions([absent, cec], JSON.parse(JSON.stringify([cec, absent])))).toEqual({ status: 'unchanged' });
    expect(compareAdmissions([absent, cec], [{ name: 'brain', cursor: 0 }, cec])).toEqual({ status: 'admitted-or-unknown', projects: [{ name: 'brain', reason: 'created since the old service stopped' }] });
    expect(compareAdmissions([{ name: 'brain', cursor: 0 }, cec], [absent, cec])).toEqual({ status: 'admitted-or-unknown', projects: [{ name: 'brain', reason: 'its store no longer exists' }] });
    expect(compareAdmissions([absent], [{ name: 'brain', cursor: null, reason: 'locked' }])).toEqual({ status: 'admitted-or-unknown', projects: [{ name: 'brain', reason: 'the later cursor is unknown: locked' }] });
    expect(compareAdmissions([absent, cec], [cec])).toEqual({ status: 'admitted-or-unknown', projects: [{ name: 'brain', reason: 'the later snapshot does not cover it' }] });
});

test.each<[string, unknown]>([
    ['a marker that is not literally true', { name: 'brain', cursor: null, absent: 'true' }],
    ['a false marker', { name: 'brain', cursor: null, absent: false }],
    ['a null marker', { name: 'brain', cursor: null, absent: null }],
    ['a marked entry with a cursor', { name: 'brain', cursor: 2, absent: true }],
    ['a marked entry with no cursor', { name: 'brain', absent: true }],
])('%s blocks the comparison on either side', (_, entry) => {
    const absent = { name: 'brain', cursor: null, absent: true as const }, readable = { name: 'brain', cursor: 2 };
    for (const other of [absent, readable]) {
        expect(compareAdmissions([entry] as never, [other])).toEqual({ status: 'admitted-or-unknown', projects: [{ name: 'brain', reason: 'the earlier entry has a malformed absent marker' }] });
        expect(compareAdmissions([other], [entry] as never)).toEqual({ status: 'admitted-or-unknown', projects: [{ name: 'brain', reason: 'the later entry has a malformed absent marker' }] });
    }
});

test('receipts without a marker read as before: a readable cursor matches, an unmarked null for a missing file does not', () => {
    const readable = JSON.parse(JSON.stringify([{ name: 'brain', cursor: 1 }]));
    expect(compareAdmissions(readable, [{ name: 'brain', cursor: 1 }])).toEqual({ status: 'unchanged' });
    const old = JSON.parse(JSON.stringify([{ name: 'brain', cursor: null, reason: '/x/office.sqlite does not exist' }]));
    for (const now of [{ name: 'brain', cursor: null, absent: true as const }, { name: 'brain', cursor: 0 }, ...old])
        expect(compareAdmissions(old, [now])).toEqual({ status: 'admitted-or-unknown', projects: [{ name: 'brain', reason: 'the earlier cursor is unknown: /x/office.sqlite does not exist' }] });
});
