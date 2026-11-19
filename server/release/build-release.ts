import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import type { command } from '../workers/process';
import { runtimeRevision } from '../office/revision';
import { assertCommit, releaseDirectory, releasePaths } from './release-paths';
import { fileDigest, writeManifest, type ReleaseManifest } from './release-manifest';
import { satisfiesRange } from './engine-range';

type Execute = typeof command;

export interface BuildReleaseOptions {
    /** A git repository that contains the commit; it is only read. */
    repo: string;
    commit: string;
    dataRoot: string;
    execute: Execute;
    now?: () => Date;
}

// Husky's prepare step would otherwise find the checkout that contains `.local/releases` and configure its hooks.
// pnpm would otherwise write the staging path into every command shim's NODE_PATH, dead once the tree is renamed.
const BUILD_ENV = { HUSKY: '0', npm_config_extend_node_path: 'false' };
const MINUTE = 60_000;

/** The Node range and exact pnpm version the commit itself pins in package.json, read from the exported tree. */
function pinnedVersions(tree: string) {
    const manifest = JSON.parse(readFileSync(resolve(tree, 'package.json'), 'utf8'));
    const node = typeof manifest.engines?.node === 'string' ? manifest.engines.node.trim() : '';
    const manager = manifest.packageManager;
    const pnpm = typeof manager === 'string' && manager.startsWith('pnpm@') ? manager.slice('pnpm@'.length).split('+')[0] : '';
    if (!node || !pnpm) throw new Error('The commit does not pin both a Node range (engines.node) and a pnpm version (packageManager)');
    return { node, pnpm };
}

/**
 * Builds one release directory for an exact commit: export, locked install, build, manifest.
 * An existing release is never rebuilt or overwritten, and a failed build leaves nothing behind.
 */
export async function buildRelease(options: BuildReleaseOptions): Promise<{ directory: string; manifest: ReleaseManifest }> {
    const { repo, dataRoot, execute } = options, commit = assertCommit(options.commit), now = options.now || (() => new Date());
    const target = releaseDirectory(dataRoot, commit);
    if (existsSync(target)) throw new Error(`Release ${commit} already exists; a release is never rebuilt in place`);
    const resolved = (await execute('git', ['rev-parse', '--verify', `${commit}^{commit}`], { cwd: repo, readOnly: true, timeout: MINUTE })).trim();
    if (resolved !== commit) throw new Error(`Commit ${commit} is not in ${repo}`);
    const { releases } = releasePaths(dataRoot);
    mkdirSync(releases, { recursive: true, mode: 0o700 });
    const staging = mkdtempSync(resolve(releases, `.staging-${commit.slice(0, 12)}-`));
    try {
        const archive = resolve(staging, 'tree.tar'), tree = resolve(staging, 'tree');
        mkdirSync(tree);
        await execute('git', ['archive', '--format=tar', '-o', archive, commit], { cwd: repo, timeout: 2 * MINUTE });
        await execute('tar', ['-xf', archive, '-C', tree], { cwd: staging, timeout: 2 * MINUTE });
        rmSync(archive);
        const pinned = pinnedVersions(tree);
        const node = (await execute('node', ['--version'], { cwd: tree, env: BUILD_ENV, readOnly: true, timeout: MINUTE })).trim().replace(/^v/, '');
        const pnpm = (await execute('pnpm', ['--version'], { cwd: tree, env: BUILD_ENV, readOnly: true, timeout: MINUTE })).trim();
        if (!satisfiesRange(node, pinned.node)) throw new Error(`Node ${node} is outside the commit's engines range ${pinned.node}; nothing was installed`);
        if (pnpm !== pinned.pnpm) throw new Error(`pnpm ${pnpm} differs from the commit's pinned ${pinned.pnpm}; nothing was installed`);
        await execute('pnpm', ['install', '--frozen-lockfile', '--prod=false'], { cwd: tree, env: BUILD_ENV, timeout: 10 * MINUTE });
        await execute('pnpm', ['build'], { cwd: tree, env: BUILD_ENV, timeout: 10 * MINUTE });
        const manifest: ReleaseManifest = { version: 1, commit, hash: runtimeRevision(tree).hash, node, pnpm, lockfile: fileDigest(resolve(tree, 'pnpm-lock.yaml')), builtAt: now().toISOString() };
        writeManifest(tree, manifest);
        if (existsSync(target)) throw new Error(`Release ${commit} appeared while building; it was left untouched`);
        renameSync(tree, target);
        return { directory: target, manifest };
    } finally {
        rmSync(staging, { recursive: true, force: true });
    }
}
