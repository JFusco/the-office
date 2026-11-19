import { afterEach, expect, test } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileDigest, readManifest, verifyRelease, writeManifest } from '../../../server/release/release-manifest';
import { runtimeRevision } from '../../../server/office/revision';

const COMMIT = 'c'.repeat(40);
const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
function release(withManifest = true) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-manifest-')); roots.push(root);
    mkdirSync(resolve(root, 'server')); writeFileSync(resolve(root, 'server/index.ts'), 'export {};\n');
    writeFileSync(resolve(root, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0\n');
    if (withManifest) writeManifest(root, { version: 1, commit: COMMIT, hash: runtimeRevision(root).hash, node: '24.14.0', pnpm: '10.34.9', lockfile: fileDigest(resolve(root, 'pnpm-lock.yaml')), builtAt: '2026-11-19T12:00:00.000Z' });
    return root;
}

test('a matching directory verifies, and the manifest is outside the hashed runtime', () => {
    const root = release();
    expect(verifyRelease(root, COMMIT)).toMatchObject({ status: 'verified', manifest: { commit: COMMIT } });
});

test('a changed runtime file, a changed lockfile or a different commit is a mismatch', () => {
    const changed = release(); writeFileSync(resolve(changed, 'server/index.ts'), 'export const changed = true;\n');
    expect(verifyRelease(changed)).toMatchObject({ status: 'mismatch', reason: expect.stringContaining('runtime hash') });
    const lockfile = release(); writeFileSync(resolve(lockfile, 'pnpm-lock.yaml'), 'lockfileVersion: 9.1\n');
    expect(verifyRelease(lockfile)).toMatchObject({ status: 'mismatch', reason: 'lockfile differs from the manifest' });
    expect(verifyRelease(release(), 'd'.repeat(40))).toMatchObject({ status: 'mismatch', reason: expect.stringContaining('manifest names') });
});

test('a hand-built release has no manifest, and a malformed manifest is rejected', () => {
    expect(verifyRelease(release(false))).toEqual({ status: 'unmanifested' });
    const malformed = release(false); writeFileSync(resolve(malformed, 'release.json'), JSON.stringify({ version: 1, commit: 'short' }));
    expect(() => readManifest(malformed)).toThrow();
});
