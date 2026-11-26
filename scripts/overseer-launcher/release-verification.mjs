// The launch inputs, established from the pin: the pin and release manifest contracts, the
// runtimeRevision mirror, the pinned tree's entry and its own tsx. The rules of
// server/office/revision.ts and server/release/release-manifest.ts, on Node built-ins.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { assertDirectoryOrAbsent, checkOwnedFile, readOwned } from './durable-files.mjs';
import { boundedString, exactKeys, isDigest, isIso, isSha, message } from './field-checks.mjs';
import { LIMITS } from './limits.mjs';
import { physicalPath, present, within } from './runner-root.mjs';

export const PASS_ENTRY = 'server/overseer.ts';

/** server/overseer/runner-pin.ts RunnerPin. */
export function validPin(pin) {
    return exactKeys(pin, ['version', 'commit', 'directory', 'manifestHash', 'lockfile', 'pinnedAt'])
        && pin.version === 1 && isSha(pin.commit) && boundedString(pin.directory, 4096, 1) && isAbsolute(pin.directory)
        && isDigest(pin.manifestHash) && isDigest(pin.lockfile) && isIso(pin.pinnedAt);
}

/** server/release/release-manifest.ts ReleaseManifestSchema. */
export function validManifest(manifest) {
    return exactKeys(manifest, ['version', 'commit', 'hash', 'node', 'pnpm', 'lockfile', 'builtAt'])
        && manifest.version === 1 && isSha(manifest.commit) && isDigest(manifest.hash) && boundedString(manifest.node, 200, 1)
        && boundedString(manifest.pnpm, 200, 1) && isDigest(manifest.lockfile) && isIso(manifest.builtAt);
}

const digestOf = path => createHash('sha256').update(readFileSync(path)).digest('hex');

/** The same inventory and hash as runtimeRevision(root, assets). */
export function releaseRevision(root, assets = resolve(root, 'dist')) {
    const files = [];
    const walk = directory => {
        if (!existsSync(directory)) return;
        for (const entry of readdirSync(directory, { withFileTypes: true })) {
            const path = resolve(directory, entry.name);
            if (entry.isDirectory()) walk(path);
            else if (entry.isFile()) files.push(path);
        }
    };
    for (const directory of ['server', 'src']) walk(resolve(root, directory));
    walk(assets);
    for (const name of ['package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vite.config.ts'])
        if (existsSync(resolve(root, name))) files.push(resolve(root, name));
    const manifest = files.sort().map(path => ({ path: path.startsWith(assets + '/') ? `dist/${relative(assets, path)}` : relative(root, path), hash: digestOf(path) })).sort((a, b) => a.path.localeCompare(b.path));
    return { hash: createHash('sha256').update(JSON.stringify(manifest)).digest('hex'), manifest };
}

/** The pinned tree's entry: a real `server` folder holding a regular `overseer.ts` at its own physical path. */
export function entryOf(directory) {
    const server = resolve(directory, 'server'), entry = resolve(directory, PASS_ENTRY);
    assertDirectoryOrAbsent(server);
    if (!present(server)) throw new Error(`${server} is missing`);
    if (!checkOwnedFile(entry)) throw new Error(`${entry} is missing`);
    return entry;
}

/** Reads and checks the pin, and re-verifies the tree it names. Returns the pin, the release and its entry, or throws why they cannot be used. */
export function verifiedPin(paths, roots, limits = LIMITS) {
    let text;
    try { text = readOwned(paths.pin, limits.pinMaxBytes); }
    catch (error) { throw new Error(`The runner pin cannot be read: ${message(error)}`); }
    if (text === null) throw new Error(`There is no runner pin at ${paths.pin}; run pnpm office overseer pin COMMIT`);
    let pin;
    try { pin = JSON.parse(text); } catch { throw new Error('The runner pin is not JSON'); }
    if (!validPin(pin)) throw new Error('The runner pin is not a valid version 1 pin');
    const expected = resolve(roots.officeData, 'releases', pin.commit);
    if (physicalPath(pin.directory) !== expected || physicalPath(expected) !== expected) throw new Error(`The pinned directory is not ${expected}`);
    assertDirectoryOrAbsent(expected);
    if (!present(expected)) throw new Error(`The pinned release ${expected} is missing`);
    let manifest;
    try { manifest = JSON.parse(readOwned(resolve(expected, 'release.json'), limits.manifestMaxBytes) ?? 'null'); }
    catch (error) { throw new Error(`The pinned release.json cannot be read: ${message(error)}`); }
    if (!validManifest(manifest)) throw new Error('The pinned release.json is not a valid version 1 manifest');
    if (manifest.commit !== pin.commit || manifest.hash !== pin.manifestHash || manifest.lockfile !== pin.lockfile) throw new Error('The pinned release.json does not match the pin');
    const lockfile = resolve(expected, 'pnpm-lock.yaml');
    if (!checkOwnedFile(lockfile) || digestOf(lockfile) !== manifest.lockfile) throw new Error('The pinned lockfile differs from its manifest');
    const entry = entryOf(expected);
    const revision = releaseRevision(expected);
    if (revision.hash !== manifest.hash) throw new Error('The pinned release’s files differ from its manifest');
    if (!revision.manifest.some(file => file.path === PASS_ENTRY)) throw new Error(`The pinned release’s inventory has no ${PASS_ENTRY}`);
    return { pin, directory: expected, entry };
}

/**
 * The release must load `tsx` from its own node_modules (pnpm's link included), never an
 * ancestor's: a package folder, since Node passes over anything else there and keeps looking
 * in the folders above.
 */
export function localLoader(directory) {
    const link = resolve(directory, 'node_modules', 'tsx');
    try {
        const target = realpathSync(link);
        if (!within(target, resolve(realpathSync(directory), 'node_modules'))) throw new Error('outside the release');
        if (!statSync(target).isDirectory() || !statSync(resolve(target, 'package.json')).isFile()) throw new Error('not a package folder');
        return target;
    } catch (error) { throw new Error(`The pinned release has no tsx of its own (${message(error)})`); }
}
