import { lstatSync, mkdirSync, realpathSync, type Stats } from 'node:fs';
import { isAbsolute, resolve, sep } from 'node:path';
import { ensurePrivateDirectory, physicalPath, type ValidatedRunnerPaths } from './runner-root';

/**
 * One model run's private folders under the runner root: `runs/<id>/{home,tmp,provider,office-data}`.
 * A run never reuses another's folders, so its provider session and transcript start somewhere new.
 * Node built-ins and the runner's own root handling only, like the rest of the root checks.
 *
 * Ownership, mode and link checks are observations at allocation and at handoff. They rely on the
 * folders above the runner root being trusted; a process of the same user can still change a folder
 * after it was checked.
 */

/** A canonical lowercase UUID: the budget ledger's reservation IDs (`budget-ledger.ts#admit`). */
export const RUN_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface RunDirectories { id: string; root: string; home: string; tmp: string; provider: string; officeData: string }
type Child = Exclude<keyof RunDirectories, 'id' | 'root'>;
const CHILDREN: Record<Child, string> = { home: 'home', tmp: 'tmp', provider: 'provider', officeData: 'office-data' };

/** The account the runner runs as; injectable so a test can present a foreign owner. */
export interface DirectoryFacts { uid?: number }

const code = (error: unknown) => (error as NodeJS.ErrnoException)?.code;

export function runnerUid(facts: DirectoryFacts): number {
    const uid = facts.uid ?? process.getuid?.();
    if (!Number.isSafeInteger(uid)) throw new Error('Cannot tell which account the runner runs as; refusing to allocate a run folder');
    return uid!;
}

/** The folders a run with this ID has, or a refusal for a malformed ID. Writes nothing. */
function layout(paths: ValidatedRunnerPaths, id: string): RunDirectories {
    if (typeof id !== 'string' || !RUN_ID.test(id)) throw new Error(`A run ID must be a lowercase UUID, not ${JSON.stringify(String(id).slice(0, 80))}`);
    const root = resolve(paths.runs, id);
    return { id, root, home: resolve(root, CHILDREN.home), tmp: resolve(root, CHILDREN.tmp), provider: resolve(root, CHILDREN.provider), officeData: resolve(root, CHILDREN.officeData) };
}

function statOf(path: string): Stats {
    try { return lstatSync(path); }
    catch (error) { throw new Error(`Cannot read ${path} (${code(error) ?? 'unknown error'}); refusing it`); }
}

const DIRECTORY_MODES = {
    'not-writable': { mask: 0o022, required: 0, description: 'writable only by the runner' },
    private: { mask: 0o077, required: 0, description: 'accessible only to the runner' },
    '0700': { mask: 0o777, required: 0o700, description: '0700' },
};

/** A real directory at its expected physical path, with the required owner and permissions. */
export function assertOwnedDirectory(path: string, uid: number, access: keyof typeof DIRECTORY_MODES): void {
    const stat = statOf(path);
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`${path} must be a directory, not a link or a file`);
    if (stat.uid !== uid) throw new Error(`${path} is owned by uid ${stat.uid}, not the runner's ${uid}; refusing it`);
    const mode = stat.mode & 0o777;
    const { mask, required, description } = DIRECTORY_MODES[access];
    if ((mode & mask) !== required) throw new Error(`${path} has mode ${mode.toString(8)}; it must be ${description}`);
    if (realpathSync(path) !== path) throw new Error(`${path} resolves elsewhere (${realpathSync(path)}); refusing it`);
}

/**
 * Before anything is written: every existing component of the root as it was supplied is a real
 * directory, checked on the spelling itself so a link before a `..` is caught, and the spelling still
 * resolves to the root that was validated.
 */
export function preflightRoot(paths: ValidatedRunnerPaths): void {
    const supplied = paths.suppliedRoot;
    if (typeof supplied !== 'string' || !isAbsolute(supplied)) throw new Error('The runner root was not validated from an absolute path; refusing to allocate a run folder');
    let prefix: string = sep;
    for (const part of supplied.split(sep).filter(Boolean)) {
        prefix = resolve(prefix, part);
        let stat: Stats;
        try { stat = lstatSync(prefix); }
        catch (error) {
            if (code(error) === 'ENOENT') continue; // A later `..` can return to an existing directory.
            throw new Error(`Cannot read ${prefix} (${code(error) ?? 'unknown error'}); refusing it`);
        }
        if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`${prefix} in the runner root ${supplied} must be a directory, not a link or a file`);
    }
    if (physicalPath(supplied) !== paths.root) throw new Error(`The runner root ${supplied} no longer resolves to ${paths.root}; refusing it`);
    if (paths.runs !== resolve(paths.root, 'runs')) throw new Error(`The runs folder ${paths.runs} is not under the runner root ${paths.root}`);
}

/**
 * Claims `runs/<id>` and creates its four folders, each at 0700. The root and `runs` are created if
 * missing; both must belong to the runner, the root writable only by it and `runs` private to it. An ID
 * already used (whatever is there) is refused, as is anything that is a link or a file. A failure after
 * the claim leaves the ID used.
 */
export function createRunDirectories(paths: ValidatedRunnerPaths, id: string, facts: DirectoryFacts = {}): RunDirectories {
    const run = layout(paths, id), uid = runnerUid(facts);
    preflightRoot(paths);
    ensurePrivateDirectory(paths.root);
    assertOwnedDirectory(paths.root, uid, 'not-writable');
    ensurePrivateDirectory(paths.runs);
    assertOwnedDirectory(paths.runs, uid, 'private');
    try { mkdirSync(run.root, { mode: 0o700 }); }
    catch (error) {
        if (code(error) === 'EEXIST') throw new Error(`Run ${id} already exists; a run never reuses another's folders`);
        throw error;
    }
    assertOwnedDirectory(run.root, uid, '0700');
    for (const child of Object.keys(CHILDREN) as Child[]) {
        mkdirSync(run[child], { mode: 0o700 });
        assertOwnedDirectory(run[child], uid, '0700');
    }
    return run;
}

/**
 * Read-only check of a run handed to a worker: it is the layout this runner allocates for its ID, under
 * the validated runner paths, and each folder is still a private directory of the runner at its own
 * physical path. Creates nothing.
 */
export function checkRunDirectories(paths: ValidatedRunnerPaths, run: RunDirectories, facts: DirectoryFacts = {}): void {
    const expected = layout(paths, run.id), uid = runnerUid(facts);
    for (const key of ['root', ...Object.keys(CHILDREN)] as (keyof RunDirectories)[])
        if (run[key] !== expected[key]) throw new Error(`Run ${run.id} ${key} is ${JSON.stringify(String(run[key]).slice(0, 200))}, not ${expected[key]}`);
    assertOwnedDirectory(paths.runs, uid, 'private');
    for (const key of ['root', ...Object.keys(CHILDREN)] as (keyof RunDirectories)[])
        assertOwnedDirectory(expected[key], uid, '0700');
}
