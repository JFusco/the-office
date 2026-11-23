import type { command } from '../workers/process';
import { assertCommit } from './release-paths';

type Execute = typeof command;
const message = (error: unknown) => error instanceof Error ? error.message : String(error);

/**
 * The oldest commit whose release can read the stores as they are saved now: the one that began reading a
 * project's state from `state_parts`. A store no longer keeps the whole `state` row (`server/store/state-parts.ts`),
 * and a release from before this commit reads only that row: it would start from nothing, and a row it saved
 * would disagree with the parts, so later releases would refuse to open the store (`server/store/saved-state.ts`).
 * Raise it when a store change again leaves older releases unable to read what is saved.
 */
export const RELEASE_FLOOR = '252f1406bf597113394d97e69abc54643532b971';

/**
 * Git reads the commits as they were made and only what the repository already holds: no replacement refs or
 * graft file, which give a commit other parents under the same name, and no fetch of an object the repository
 * lacks, which a partial clone would otherwise make by itself.
 */
const AS_COMMITTED = { GIT_NO_REPLACE_OBJECTS: '1', GIT_GRAFT_FILE: '/dev/null', GIT_NO_LAZY_FETCH: '1', GIT_ALLOW_PROTOCOL: '' };

export type FloorReading = { holds: true } | { holds: false; reason: string };

/**
 * Whether `commit` is the floor or descends from it, by the history in the git repository at `repo`. Read-only:
 * it changes nothing there and contacts no remote. It holds only on proof from a complete history. A shallow
 * clone, a commit or a floor that repository does not have, and a git failure all read as not holding, each
 * with its reason.
 */
export async function readReleaseFloor(execute: Execute, repo: string, commit: string, floor = RELEASE_FLOOR): Promise<FloorReading> {
    const target = assertCommit(commit), oldest = assertCommit(floor);
    const git = (args: string[]) => execute('git', args, { cwd: repo, env: AS_COMMITTED, readOnly: true, timeout: 60_000 });
    const below = (reason: string): FloorReading => ({ holds: false, reason });
    try {
        // A shallow history hides parents, so it cannot say what a commit descends from; only an explicit `false` is complete.
        const shallow = (await git(['rev-parse', '--is-shallow-repository'])).trim();
        if (shallow !== 'false') return below(`The history in ${repo} is ${shallow === 'true' ? 'shallow' : 'not known to be complete'}, so it cannot show whether ${target} descends from the release floor ${oldest}. Fetch the full history there, or run the deploy from a checkout that has it.`);
        for (const [sha, name] of [[target, 'Commit'], [oldest, 'The release floor']] as const) {
            const read = await git(['rev-parse', '--verify', `${sha}^{commit}`]).then(out => ({ sha: out.trim(), failure: '' }), error => ({ sha: '', failure: message(error) }));
            if (read.sha !== sha) return below(`${name} ${sha} could not be read in ${repo}${read.failure ? ` (${read.failure})` : ''}, so whether the release can read the saved stores cannot be told. Fetch it there, or run the deploy from a checkout that has it.`);
        }
        // Commits the floor reaches that the target does not: none exactly when the target contains the floor.
        const missing = (await git(['rev-list', '--max-count=1', oldest, `^${target}`])).trim();
        if (missing) return below(`Release ${target} does not descend from the release floor ${oldest}. A release from before the floor reads only the whole state row, which the stores no longer keep, and would start from nothing.`);
        return { holds: true };
    } catch (error) {
        return below(`The history in ${repo} could not be read to compare ${target} with the release floor ${oldest}: ${message(error)}`);
    }
}
