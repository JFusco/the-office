import { afterEach, expect, test } from 'vitest';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { releaseIdentity } from '../../../server/office/release-identity';
import { runtimeRevision } from '../../../server/office/revision';
import type { ActiveRelease } from '../../../server/release/active-release';
import { fileDigest, MANIFEST_FILE, readManifest, writeManifest } from '../../../server/release/release-manifest';
import { releasePaths } from '../../../server/release/release-paths';
import { buildFakeRelease } from '../release/deploy-world';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
const COMMIT = 'b'.repeat(40), OTHER = 'a'.repeat(40), OP = 'deploy-20261120t030000z-0a0b0c0d';

/** A data root holding one built release and the receipt a deployment would have written for it. */
function served(receipt: Partial<ActiveRelease> | null = {}) {
    const dataRoot = realpathSync(mkdtempSync(resolve(tmpdir(), 'office-identity-'))); roots.push(dataRoot);
    const root = buildFakeRelease(dataRoot, COMMIT), loadedHash = runtimeRevision(root).hash, manifestDigest = fileDigest(resolve(root, MANIFEST_FILE));
    const write = (over: Partial<ActiveRelease>) => writeFileSync(releasePaths(dataRoot).active, JSON.stringify({ version: 1, commit: COMMIT, hash: loadedHash, manifestDigest, previous: OTHER, operation: OP, serviceInstanceId: 'instance-2', activatedAt: '2026-11-20T03:00:09.000Z', ...over }));
    if (receipt) write(receipt);
    return { dataRoot, root, loadedHash, manifestDigest, write };
}
const reason = (identity: ReturnType<typeof releaseIdentity>) => identity.status === 'unknown' ? identity.reason : 'verified';

test('a release is verified when its directory, its manifest, the loaded hash and the deployment receipt agree', () => {
    const { dataRoot, root, loadedHash, manifestDigest } = served();
    expect(releaseIdentity({ root, dataRoot, loadedHash })).toEqual({ status: 'verified', commit: COMMIT, hash: loadedHash, manifestDigest, operation: OP, activatedAt: '2026-11-20T03:00:09.000Z' });
    // The service's own root ends in a separator.
    expect(releaseIdentity({ root: `${root}/`, dataRoot, loadedHash }).status).toBe('verified');
});

test('a service that does not run from a release directory of its data root is unknown', () => {
    const { dataRoot, root, loadedHash } = served();
    expect(reason(releaseIdentity({ root: dataRoot, dataRoot, loadedHash }))).toBe('the service does not run from a release directory of its data root');
    mkdirSync(resolve(dataRoot, 'elsewhere'));
    expect(reason(releaseIdentity({ root, dataRoot: resolve(dataRoot, 'elsewhere'), loadedHash }))).toBe('the service does not run from a release directory of its data root');
    expect(reason(releaseIdentity({ root, dataRoot: resolve(dataRoot, 'missing'), loadedHash }))).toBe('the release records could not be read');
});

test('a data root or a release root reached through an alias is the same release', () => {
    const { dataRoot, root, loadedHash } = served();
    const alias = `${dataRoot}-alias`; roots.push(alias);
    symlinkSync(dataRoot, alias);
    expect(releaseIdentity({ root, dataRoot: alias, loadedHash }).status).toBe('verified');
    expect(releaseIdentity({ root: resolve(alias, 'releases', COMMIT), dataRoot, loadedHash }).status).toBe('verified');
});

test('a release without a manifest, or with one that names another commit or another hash, is unknown', () => {
    const { dataRoot, root, loadedHash } = served();
    const manifest = readManifest(root)!;
    writeManifest(root, { ...manifest, commit: OTHER });
    expect(reason(releaseIdentity({ root, dataRoot, loadedHash }))).toBe(`release.json names commit ${OTHER}, its directory names ${COMMIT}`);
    writeManifest(root, { ...manifest, hash: '0'.repeat(64) });
    expect(reason(releaseIdentity({ root, dataRoot, loadedHash }))).toBe('the code loaded at start-up differs from the hash in release.json');
    // A reason never repeats what a file held.
    writeFileSync(resolve(root, MANIFEST_FILE), '{"version":1,"token":"ghp_secretsecretsecretsecretsecretsecret"');
    expect(reason(releaseIdentity({ root, dataRoot, loadedHash }))).toBe(`release ${COMMIT} has a release.json that cannot be read`);
    rmSync(resolve(root, MANIFEST_FILE));
    expect(reason(releaseIdentity({ root, dataRoot, loadedHash }))).toBe(`release ${COMMIT} has no release.json`);
});

test('code that changed since the release was built is unknown: the hash loaded at start-up is what is compared', () => {
    const { dataRoot, root } = served();
    writeFileSync(resolve(root, 'server/index.ts'), 'export const release = "edited by hand";\n');
    expect(reason(releaseIdentity({ root, dataRoot, loadedHash: runtimeRevision(root).hash }))).toBe('the code loaded at start-up differs from the hash in release.json');
});

test('a release no deployment recorded, or recorded by hand, is unknown', () => {
    const { dataRoot, root, loadedHash } = served(null);
    expect(reason(releaseIdentity({ root, dataRoot, loadedHash }))).toBe('no deployment has recorded an active release');
    writeFileSync(releasePaths(dataRoot).active, JSON.stringify({ commit: COMMIT, verified: true, validation: 'by hand' }));
    expect(reason(releaseIdentity({ root, dataRoot, loadedHash }))).toBe('no deployment has recorded an active release');
});

test('a receipt for another release, another hash or another manifest is unknown', () => {
    const { dataRoot, root, loadedHash, write } = served();
    write({ commit: OTHER });
    expect(reason(releaseIdentity({ root, dataRoot, loadedHash }))).toBe(`the deployment receipt names release ${OTHER}, not ${COMMIT}`);
    write({ hash: '0'.repeat(64) });
    expect(reason(releaseIdentity({ root, dataRoot, loadedHash }))).toBe('the deployment receipt names another runtime hash');
    write({ manifestDigest: '0'.repeat(64) });
    expect(reason(releaseIdentity({ root, dataRoot, loadedHash }))).toBe('release.json differs from the one the deployment froze');
    write({});
    expect(releaseIdentity({ root, dataRoot, loadedHash }).status).toBe('verified');
});

test('a manifest rewritten after the deployment froze it is unknown, even when it still names the same commit and hash', () => {
    const { dataRoot, root, loadedHash } = served();
    writeManifest(root, { ...readManifest(root)!, builtAt: '2026-11-21T00:00:00.000Z' });
    expect(reason(releaseIdentity({ root, dataRoot, loadedHash }))).toBe('release.json differs from the one the deployment froze');
});
