import { DatabaseSync } from 'node:sqlite';
import { afterEach, expect, test } from 'vitest';
import { codexThreadMetadata, METADATA_CHUNK } from '../../../server/workers/codex-thread-metadata';
import { accountCodexProcesses } from '../../../server/workers/codex-process-inventory';
import { loadedCodexSession } from '../../../server/workers/session-bridge';

let open: DatabaseSync[] = [];
afterEach(() => { for (const db of open) db.close(); open = []; });
function threads(rows: [id: string, path: string][]) {
    const db = new DatabaseSync(':memory:'); open.push(db);
    db.exec('CREATE TABLE threads (id TEXT PRIMARY KEY, cwd TEXT, name TEXT, title TEXT, git_branch TEXT, thread_source TEXT, source TEXT, rollout_path TEXT)');
    const insert = db.prepare('INSERT INTO threads VALUES(?,?,?,?,?,?,?,?)');
    for (const [id, path] of rows) insert.run(id, '/repo', null, `Task ${id}`, 'main', 'user', 'cli', path);
    let queries = 0;
    const counted = { prepare: (sql: string) => { queries++; return db.prepare(sql); } };
    return { db: counted, queries: () => queries };
}
const path = (n: number) => `/Users/test/.codex/sessions/2026/11/21/rollout-${n}.jsonl`;

test('every wanted transcript is read in one query, and the rows are the ones a single lookup returned', () => {
    const { db, queries } = threads([['a', path(1)], ['b', path(2)], ['c', path(3)]]);
    const found = codexThreadMetadata(db, [path(1), path(3), path(1), path(9)]);
    expect(queries()).toBe(1);
    expect([...found.keys()].sort()).toEqual([path(1), path(3)]);
    expect(found.get(path(3))).toEqual({ id: 'c', cwd: '/repo', name: null, title: 'Task c', git_branch: 'main', thread_source: 'user', source: 'cli', rollout_path: path(3) });
    expect(found.has(path(9))).toBe(false);
});

test('a path with more than one row keeps the first in table order', () => {
    // Ids that sort the other way, so only table order gives this answer.
    const { db } = threads([['z-inserted-first', path(1)], ['a-inserted-second', path(1)]]);
    expect(codexThreadMetadata(db, [path(1)]).get(path(1))).toMatchObject({ id: 'z-inserted-first' });
});

test('more paths than one statement should bind are read in chunks, and no path is lost', () => {
    const count = METADATA_CHUNK * 2 + 7, rows = Array.from({ length: count }, (_, n) => [`t${n}`, path(n)] as [string, string]);
    const { db, queries } = threads(rows);
    const found = codexThreadMetadata(db, rows.map(([, p]) => p));
    expect(queries()).toBe(3);
    expect(found.size).toBe(count);
    expect(found.get(path(count - 1))).toMatchObject({ id: `t${count - 1}` });
});

test('with no paths nothing is read, but a database without the expected table is still refused', () => {
    const { db } = threads([['a', path(1)]]);
    expect(codexThreadMetadata(db, []).size).toBe(0);
    const empty = new DatabaseSync(':memory:'); open.push(empty);
    expect(() => codexThreadMetadata(empty, [])).toThrow(/no such table/);
    expect(() => codexThreadMetadata(empty, [path(1)])).toThrow(/no such table/);
});

test('a transcript with no metadata row is still refused by the inventory, never treated as absent', () => {
    const { db } = threads([['a', path(1)]]);
    const metadata = codexThreadMetadata(db, [path(1), path(2)]);
    const load = (p: string) => loadedCodexSession(metadata.get(p));
    const sessions = accountCodexProcesses(`p41\nn${path(1)}`, load, new Set());
    expect([sessions.length, sessions[0]]).toMatchObject([1, { id: 'a', provider: 'codex' }]);
    expect(() => accountCodexProcesses(`p41\nn${path(1)}\np42\nn${path(2)}`, load, new Set())).toThrow('A live Codex session has no metadata');
});
