import { afterEach, expect, test, vi } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { removeStaleSessionSnapshots, STALE_SNAPSHOT_MS, SNAPSHOT_SWEEP_MS, sweepStaleSessionSnapshots } from '../../../server/workers/session-snapshot-cleanup';
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

test('a directory too young at start is taken by a later sweep, as after a restart within seconds of a crash', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    const root = temp(), left = join(root, `${SNAPSHOT_PREFIX}crashed`);
    mkdirSync(left); writeFileSync(join(left, 'clone'), 'left behind');
    const timer = sweepStaleSessionSnapshots(root);
    try {
        expect(existsSync(left)).toBe(true);
        vi.advanceTimersByTime(SNAPSHOT_SWEEP_MS);
        expect(existsSync(left)).toBe(false);
    } finally { clearInterval(timer); vi.useRealTimers(); }
});

test('a link named like a capture directory is left alone, and so is what it points at', () => {
    const root = temp(), outside = temp(), kept = join(outside, 'keep.txt'), link = join(root, `${SNAPSHOT_PREFIX}link`);
    writeFileSync(kept, 'not ours'); symlinkSync(outside, link); aged(outside, STALE_SNAPSHOT_MS + 1000);
    expect(removeStaleSessionSnapshots(root, Date.now() + STALE_SNAPSHOT_MS * 2)).toBe(0);
    expect([existsSync(link), existsSync(kept)]).toEqual([true, true]);
});
