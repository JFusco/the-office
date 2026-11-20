import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { pinnedController, readControllerPin, writeControllerPin } from '../../../server/release/controller-pin';
import { deployPaths } from '../../../server/release/deploy-paths';
import { releaseDirectory } from '../../../server/release/release-paths';
import { buildFakeRelease } from './deploy-world';

const PIN = 'c'.repeat(40), NEWER = 'd'.repeat(40), TARGET = 'b'.repeat(40);
const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
function dataRoot() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-launch-')); roots.push(root);
    for (const commit of [PIN, NEWER, TARGET]) buildFakeRelease(root, commit);
    return root;
}

test('a pin names a verified release with a controller entry, and survives a reread', () => {
    const root = dataRoot();
    expect(readControllerPin(root)).toBeNull();
    expect(writeControllerPin(root, PIN, () => new Date('2026-11-20T03:00:00.000Z'))).toEqual({ version: 1, commit: PIN, pinnedAt: '2026-11-20T03:00:00.000Z' });
    expect(readControllerPin(root)?.commit).toBe(PIN);
    expect(pinnedController(root, PIN).entry).toBe(resolve(releaseDirectory(root, PIN), 'server/release/controller-entry.ts'));
    rmSync(resolve(releaseDirectory(root, NEWER), 'server/release/controller-entry.ts'));
    // Removing a hashed file makes the release a mismatch before the missing entry is even considered.
    expect(() => writeControllerPin(root, NEWER)).toThrow(/mismatch|no server\/release\/controller-entry.ts/);
    writeFileSync(deployPaths(root).pin, '{"version":1,"commit":"short"}');
    expect(() => readControllerPin(root)).toThrow();
});
