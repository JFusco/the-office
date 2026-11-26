import { lstatSync, mkdirSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { privateDirectories, runnerPaths, type RunnerPaths } from './config';

/**
 * Where the runner may write, checked before it writes anything. Node built-ins only, like
 * `config.ts`: the entry runs these checks before any Office module loads.
 */

/** The checkout this code runs from; its `.local` is an Office data root (see `server/office/config.ts`). */
const CHECKOUT = fileURLToPath(new URL('../../', import.meta.url));
/** A directory holding any of these is an Office data root, configured or not. */
const MARKERS = ['office-control.sqlite', 'controller-pin.json', 'deployments'];

export const defaultRunnerRoot = () => resolve(homedir(), 'Projects/the-office-overseer');

const code = (error: unknown) => (error as NodeJS.ErrnoException)?.code;

/** Whether a path exists, without following a final link. Anything but a clear absence is inconclusive and refused. */
function present(path: string): boolean {
    try { lstatSync(path); return true; }
    catch (error) {
        if (code(error) === 'ENOENT') return false;
        throw new Error(`Cannot tell whether ${path} exists (${code(error) ?? 'unknown error'}); refusing it`);
    }
}

/**
 * The physical form of a path that may not exist yet: its nearest existing ancestor through
 * `realpath`, then the missing components. A dangling link is refused.
 */
export function physicalPath(path: string): string {
    let existing = resolve(path);
    const missing: string[] = [];
    while (!present(existing)) {
        const parent = dirname(existing);
        if (parent === existing) throw new Error(`No part of ${path} exists`);
        missing.unshift(basename(existing));
        existing = parent;
    }
    try { return join(realpathSync(existing), ...missing); }
    catch (error) { throw new Error(`${existing} cannot be resolved (${code(error) ?? 'unknown error'}); a dangling link is refused`); }
}

/** Path-component containment: `child` is `parent` or lies beneath it. */
export function within(child: string, parent: string): boolean {
    const path = relative(parent, child);
    return path === '' || (path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path));
}

const ancestry = (path: string) => {
    const chain = [path];
    for (let parent = dirname(path); parent !== chain.at(-1); parent = dirname(parent)) chain.push(parent);
    return chain;
};

/** A private folder that already exists must be a real directory, not a link or a file. */
export function assertDirectoryOrAbsent(path: string): void {
    let stat;
    try { stat = lstatSync(path); }
    catch (error) {
        if (code(error) === 'ENOENT') return;
        throw new Error(`Cannot read ${path} (${code(error) ?? 'unknown error'}); refusing it`);
    }
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`${path} must be a directory, not a link or a file`);
}

/** Validated runner paths, with the root as it was supplied: allocating a run folder rechecks that spelling (`run-directories.ts`). */
export type ValidatedRunnerPaths = RunnerPaths & { suppliedRoot: string };

/**
 * The runner's paths for a root that is safe to write into. Refused, before anything is written:
 * a relative or empty root; a root that is, contains or lies inside the inherited
 * `OFFICE_DATA_ROOT` (resolved as `server/office/config.ts` resolves it) or this checkout's
 * `.local`; a root beneath an Office data root marker, on the path as given or as resolved; a
 * dangling link or an inconclusive lookup; and a private folder that exists as a link or a file.
 */
export function validateRunnerRoot(supplied: string, env: NodeJS.ProcessEnv): ValidatedRunnerPaths {
    if (!supplied || !isAbsolute(supplied)) throw new Error('The Overseer root must be an absolute path');
    const root = physicalPath(supplied), checkoutData = resolve(CHECKOUT, '.local');
    const guarded = [resolve(env.OFFICE_DATA_ROOT || checkoutData), checkoutData];
    for (const office of guarded) {
        const physical = physicalPath(office);
        if (within(root, physical) || within(physical, root)) throw new Error(`The Overseer root ${root} overlaps the Office data root ${physical}`);
    }
    for (const directory of new Set([...ancestry(resolve(supplied)), ...ancestry(root)]))
        for (const marker of MARKERS)
            if (present(join(directory, marker))) throw new Error(`The Overseer root ${root} is at or inside an Office data root (${join(directory, marker)} exists)`);
    const paths = runnerPaths(root);
    privateDirectories(paths).forEach(assertDirectoryOrAbsent);
    return { ...paths, suppliedRoot: supplied };
}

/** The pass entry's root: `OVERSEER_ROOT` is required; there is no default. */
export function requireRunnerRoot(env: NodeJS.ProcessEnv): ValidatedRunnerPaths {
    if (env.OVERSEER_ROOT === undefined) throw new Error('The Overseer pass needs OVERSEER_ROOT, an absolute path');
    return validateRunnerRoot(env.OVERSEER_ROOT, env);
}

/**
 * Creates one private folder (mode 0700) if needed, then checks that what exists is a real
 * directory at its expected physical place, so a link swapped in meanwhile is refused.
 */
export function ensurePrivateDirectory(path: string): void {
    assertDirectoryOrAbsent(path);
    mkdirSync(path, { recursive: true, mode: 0o700 });
    assertDirectoryOrAbsent(path);
    if (realpathSync(path) !== path) throw new Error(`${path} resolves elsewhere (${realpathSync(path)}); refusing it`);
}

const SIDECARS = ['-journal', '-wal', '-shm'];

/**
 * A runner-owned file that may exist: if it does, it must be a regular file with a single link at
 * its own physical path. Anything else, and a lookup that cannot be told, is refused. Returns
 * whether it exists.
 */
export function checkOwnedFile(path: string): boolean {
    let stat;
    try { stat = lstatSync(path); }
    catch (error) {
        if (code(error) === 'ENOENT') return false;
        throw new Error(`Cannot tell whether ${path} exists (${code(error) ?? 'unknown error'}); refusing it`);
    }
    // lstat: a link is not a regular file.
    if (!stat.isFile() || stat.nlink !== 1) throw new Error(`${path} must be a regular file with a single link`);
    if (realpathSync(path) !== path) throw new Error(`${path} resolves elsewhere (${realpathSync(path)}); refusing it`);
    return true;
}

/**
 * Checks a runner database and its `-journal`, `-wal` and `-shm` files before anything opens them:
 * it must sit directly in the runner's state folder, and each file present must pass
 * `checkOwnedFile`. Sidecars without their database are damaged state. Returns which exist.
 */
export function checkDatabaseFiles(paths: RunnerPaths, database: string): { exists: boolean; sidecars: string[] } {
    if (dirname(database) !== paths.state) throw new Error(`${database} is not in the runner's state folder ${paths.state}`);
    const exists = checkOwnedFile(database), sidecars = SIDECARS.filter(suffix => checkOwnedFile(`${database}${suffix}`));
    if (!exists && sidecars.length) throw new Error(`${database} is missing but its ${sidecars.join(', ')} file remains; the database is damaged`);
    return { exists, sidecars };
}
