import { afterEach, expect, test } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { removeStaleSessionSnapshots, STALE_SNAPSHOT_MS } from '../../../server/workers/session-snapshot-cleanup';
import { SNAPSHOT_PREFIX } from '../../../server/workers/session-context-snapshot';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
function temp() { const root = mkdtempSync(join(tmpdir(), 'office-cleanup-test-')); roots.push(root); return root; }
function aged(path: string, ms: number) { const at = new Date(Date.now() - ms); utimesSync(path, at, at); }

test('a capture directory left by a service that died is removed with what it holds; a fresh one and other entries are kept', () => {
    const root = temp();
    const stale = join(root, `${SNAPSHOT_PREFIX}dead1`), fresh = join(root, `${SNAPSHOT_PREFIX}live1`), other = join(root, 'something-else'), file = join(root, `${SNAPSHOT_PREFIX}a-file`);
    for (const directory of [stale, fresh, other]) mkdirSync(directory);
    writeFileSync(join(stale, 'clone'), 'left behind'); writeFileSync(file, 'not a directory');
    aged(stale, STALE_SNAPSHOT_MS + 1000); aged(other, STALE_SNAPSHOT_MS + 1000); aged(file, STALE_SNAPSHOT_MS + 1000);
    expect(removeStaleSessionSnapshots(root)).toBe(1);
    expect([existsSync(stale), existsSync(fresh), existsSync(other), existsSync(file)]).toEqual([false, true, true, true]);
    expect(removeStaleSessionSnapshots(root)).toBe(0);
});

test('a missing temporary directory is not an error', () => {
    expect(removeStaleSessionSnapshots(join(temp(), 'absent'))).toBe(0);
});
