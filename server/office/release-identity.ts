import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { readActiveRelease } from '../release/active-release';
import { fileDigest, MANIFEST_FILE, readManifest } from '../release/release-manifest';
import { releaseCommitOf } from '../release/release-paths';

/** Which release serves, when records the service can check agree on it; otherwise why that is not known. */
export type ReleaseIdentity =
    | { status: 'verified'; commit: string; hash: string; manifestDigest: string; operation: string; activatedAt: string }
    | { status: 'unknown'; reason: string };

/**
 * The release this service runs. `verified` only when all of these agree: the service runs from a
 * release directory of its data root, that directory's `release.json` names the directory's commit
 * and the hash loaded at start-up, and the receipt a deployment wrote after verifying its
 * activation names the same commit and hash and the digest of that `release.json`.
 *
 * Read on demand and never cached: a release that starts under a deployment is unknown until that
 * deployment records it, and a release no deployment recorded stays unknown. How the process was
 * started is not part of it: the same recorded release restarted is still verified. Never throws,
 * and a reason never carries text read from a file.
 */
export function releaseIdentity({ root, dataRoot, loadedHash }: { root: string; dataRoot: string; loadedHash: string }): ReleaseIdentity {
    const unknown = (reason: string): ReleaseIdentity => ({ status: 'unknown', reason });
    try {
        // Physical paths: the service's root comes from its module URL, the data root from configuration, and either can be an alias.
        const commit = releaseCommitOf(realpathSync(dataRoot), realpathSync(root));
        if (!commit) return unknown('the service does not run from a release directory of its data root');
        let manifest;
        try { manifest = readManifest(root); } catch { return unknown(`release ${commit} has a release.json that cannot be read`); }
        if (!manifest) return unknown(`release ${commit} has no release.json`);
        if (manifest.commit !== commit) return unknown(`release.json names commit ${manifest.commit}, its directory names ${commit}`);
        if (manifest.hash !== loadedHash) return unknown('the code loaded at start-up differs from the hash in release.json');
        const active = readActiveRelease(dataRoot);
        if (!active) return unknown('no deployment has recorded an active release');
        if (active.commit !== commit) return unknown(`the deployment receipt names release ${active.commit}, not ${commit}`);
        if (active.hash !== loadedHash) return unknown('the deployment receipt names another runtime hash');
        if (active.manifestDigest !== fileDigest(resolve(root, MANIFEST_FILE))) return unknown('release.json differs from the one the deployment froze');
        return { status: 'verified', commit, hash: loadedHash, manifestDigest: active.manifestDigest, operation: active.operation, activatedAt: active.activatedAt };
    } catch {
        return unknown('the release records could not be read');
    }
}
