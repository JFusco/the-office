import { resolve } from 'node:path';
import type { OfficeProject } from '../../src/shared';
import { runnerPaths, type RunnerPaths } from './config';
import { assertDirectoryOrAbsent, checkDatabaseFiles, checkOwnedFile, defaultRunnerRoot, ensurePrivateDirectory, physicalPath } from './runner-root';

/**
 * The runner's private Store and Effects, for the runner's own external mutations in later phases
 * (6d forwarding, phase 7 runs). It is the pattern of `server/release/controller-effects.ts`: a
 * Store for a project the Office does not deliver, at a path of its own. It constructs no Offices,
 * runs no `ControlStore.recover` and takes no scheduler claim. Budget accounting is not kept here
 * (see budget-ledger.ts).
 */

/** The runner's own project: not one the Office delivers. */
export const OVERSEER_PROJECT: OfficeProject = { id: 'office-overseer', name: 'Overseer runner', provider: 'github', repo: '/nonexistent/office-overseer', repository: 'JFusco/the-office', target: 'main' };

export type RunnerStore = Awaited<ReturnType<typeof openRunnerStore>>;

/**
 * Opens the runner Store. Importing this module constructs nothing. Before any Office module
 * loads it requires, in order:
 *
 * - the runner root to be the dedicated runner directory, `~/Projects/the-office-overseer`, which
 *   `OVERSEER_ROOT` cannot move (tests name another trusted root), reached through no link;
 * - `OFFICE_DATA_ROOT` to be the runner's own `state/office-data`, as the entry sets it;
 * - that folder to be a real directory, and any `office-config.json` in it a file the runner owns,
 *   because Office configuration reads it when it loads.
 *
 * Then it loads Office configuration and checks the data root it captured, in case it was loaded
 * earlier for another root. Finally it checks the database files and constructs the Store.
 */
export async function openRunnerStore(selected: RunnerPaths, { trustedRoot = defaultRunnerRoot() }: { trustedRoot?: string } = {}) {
    const anchor = resolve(trustedRoot);
    if (physicalPath(anchor) !== anchor) throw new Error(`The dedicated runner directory ${anchor} is reached through a link; refusing it`);
    if (selected.root !== anchor) throw new Error(`The runner Store opens only in the dedicated runner directory ${anchor}, not ${selected.root}`);
    const paths = runnerPaths(anchor);
    if (process.env.OFFICE_DATA_ROOT !== paths.officeData) throw new Error(`OFFICE_DATA_ROOT must be ${paths.officeData} before the runner Store loads`);
    assertDirectoryOrAbsent(paths.state);
    assertDirectoryOrAbsent(paths.officeData);
    checkOwnedFile(resolve(paths.officeData, 'office-config.json'));
    const { DATA } = await import('../office/config');
    if (DATA !== paths.officeData) throw new Error(`Office configuration was loaded for ${DATA}, not the runner's ${paths.officeData}`);
    checkDatabaseFiles(paths, paths.runnerDb);
    ensurePrivateDirectory(paths.state);
    ensurePrivateDirectory(paths.runnerData);
    const [{ Store }, { Effects }] = await Promise.all([import('../store/store'), import('../store/effects')]);
    const store = new Store(paths.runnerDb, OVERSEER_PROJECT, paths.runnerData);
    try {
        if (!checkDatabaseFiles(paths, paths.runnerDb).exists) throw new Error(`${paths.runnerDb} was not created`);
    } catch (error) {
        store.db.close();
        throw error;
    }
    const effects = Object.assign(new Effects(store), { readIntent: (id: string) => store.getEffect<Record<string, unknown>>(id) });
    return { store, effects, close: () => store.db.close() };
}
