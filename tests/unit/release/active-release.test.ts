import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { readActiveRelease, type ActiveRelease } from '../../../server/release/active-release';
import { releasePaths } from '../../../server/release/release-paths';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
const receipt: ActiveRelease = { version: 1, commit: 'b'.repeat(40), hash: '1'.repeat(64), manifestDigest: '2'.repeat(64), previous: 'a'.repeat(40), operation: 'deploy-20261120t030000z-0a0b0c0d', serviceInstanceId: 'instance-2', activatedAt: '2026-11-20T03:00:09.000Z' };

test('the receipt is read whole; a missing, hand-written, extended or unparsable record is not a receipt', () => {
    const dataRoot = mkdtempSync(resolve(tmpdir(), 'office-active-')); roots.push(dataRoot);
    const save = (text: string) => writeFileSync(releasePaths(dataRoot).active, text);
    expect(readActiveRelease(dataRoot)).toBeNull();
    save(JSON.stringify(receipt));
    expect(readActiveRelease(dataRoot)).toEqual(receipt);
    for (const other of [JSON.stringify({ commit: receipt.commit, verified: true }), JSON.stringify({ ...receipt, note: 'edited' }), JSON.stringify({ ...receipt, commit: 'b'.repeat(7) }), '{"version":1']) {
        save(other);
        expect(readActiveRelease(dataRoot)).toBeNull();
    }
});
