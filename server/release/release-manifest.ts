import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { runtimeRevision } from '../office/revision';

export const MANIFEST_FILE = 'release.json';

/** What a release directory claims to hold. The hash is the one the service reports as its loaded revision. */
export const ReleaseManifestSchema = z.object({
    version: z.literal(1),
    commit: z.string().regex(/^[0-9a-f]{40}$/),
    hash: z.string().regex(/^[0-9a-f]{64}$/),
    node: z.string().min(1),
    pnpm: z.string().min(1),
    lockfile: z.string().regex(/^[0-9a-f]{64}$/),
    builtAt: z.iso.datetime(),
}).strict();
export type ReleaseManifest = z.infer<typeof ReleaseManifestSchema>;

export const fileDigest = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');

export function writeManifest(directory: string, manifest: ReleaseManifest): void {
    writeFileSync(resolve(directory, MANIFEST_FILE), `${JSON.stringify(ReleaseManifestSchema.parse(manifest), null, 2)}\n`, { mode: 0o600 });
}

/** The saved manifest, or null when the directory has none (a release built by hand). A malformed manifest throws. */
export function readManifest(directory: string): ReleaseManifest | null {
    const path = resolve(directory, MANIFEST_FILE);
    return existsSync(path) ? ReleaseManifestSchema.parse(JSON.parse(readFileSync(path, 'utf8'))) : null;
}

export type ReleaseVerification =
    | { status: 'verified'; manifest: ReleaseManifest }
    | { status: 'unmanifested' }
    | { status: 'mismatch'; manifest: ReleaseManifest; reason: string };

/** Re-hashes the directory: a manifest is only as good as the files still matching it. */
export function verifyRelease(directory: string, expectedCommit?: string): ReleaseVerification {
    const manifest = readManifest(directory);
    if (!manifest) return { status: 'unmanifested' };
    if (expectedCommit && manifest.commit !== expectedCommit) return { status: 'mismatch', manifest, reason: `manifest names ${manifest.commit}, directory names ${expectedCommit}` };
    const lockfile = resolve(directory, 'pnpm-lock.yaml');
    if (!existsSync(lockfile) || fileDigest(lockfile) !== manifest.lockfile) return { status: 'mismatch', manifest, reason: 'lockfile differs from the manifest' };
    const hash = runtimeRevision(directory).hash;
    return hash === manifest.hash ? { status: 'verified', manifest } : { status: 'mismatch', manifest, reason: `runtime hash ${hash} differs from the manifest` };
}
