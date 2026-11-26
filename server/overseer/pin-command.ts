import { lstatSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { writeDurable } from '../release/durable-file';
import { resolveCliRoot } from './commands';
import type { RunnerPaths } from './config';
import { assertDirectoryOrAbsent, checkOwnedFile, ensurePrivateDirectory } from './runner-root';
import { RunnerPin } from './runner-pin';

/**
 * `pnpm office overseer pin COMMIT`: a person pins the verified release the launcher runs passes
 * from. It is the one Overseer verb that loads Office configuration, for the Office data root
 * whose `releases/` it reads, and release verification; server/cli.ts reaches it by its own
 * import so the other verbs never load either. Nothing is created or replaced unless every check
 * passes.
 */

const USAGE = 'pnpm office overseer pin COMMIT (a full 40-character commit of a release built with pnpm office release build)';
export const PIN_ENTRY = 'server/overseer.ts';

export async function pinCommand(args: string[], context: { env?: NodeJS.ProcessEnv; now?: () => Date; log?: (line: string) => void } = {}): Promise<number> {
    const { env = process.env, now = () => new Date(), log = console.log } = context;
    const [commit, ...rest] = args;
    if (rest.length || !commit || !/^[0-9a-f]{40}$/.test(commit)) { log(USAGE); return 2; }
    let paths: RunnerPaths;
    try { paths = resolveCliRoot(env); }
    catch (error) { log(`Refused: ${error instanceof Error ? error.message : String(error)}`); return 2; }
    const refuse = (reason: string) => { log(`Refused, nothing was pinned: ${reason}`); return 1; };
    const [{ DATA }, { verifyRelease }, { releaseDirectory }, { runtimeRevision }] = await Promise.all([
        import('../office/config'), import('../release/release-manifest'), import('../release/release-paths'), import('../office/revision'),
    ]);
    const directory = releaseDirectory(DATA, commit);
    let expected: string;
    try { expected = resolve(realpathSync(DATA), 'releases', commit); }
    catch { return refuse(`the Office data root ${DATA} cannot be resolved`); }
    try {
        if (lstatSync(directory).isSymbolicLink() || realpathSync(directory) !== expected) return refuse(`${directory} is not the release directory ${expected}`);
    } catch { return refuse(`there is no release ${commit}; build it with pnpm office release build ${commit}`); }
    const verification = verifyRelease(expected, commit);
    if (verification.status !== 'verified') return refuse(`release ${commit} is ${verification.status}${'reason' in verification ? `: ${verification.reason}` : ''}`);
    const server = resolve(expected, 'server'), entry = resolve(expected, PIN_ENTRY);
    try {
        assertDirectoryOrAbsent(server);
        if (!checkOwnedFile(entry) || realpathSync(server) !== server) return refuse(`release ${commit} has no ${PIN_ENTRY}`);
    } catch (error) { return refuse(`release ${commit}'s ${PIN_ENTRY} cannot be trusted: ${(error as Error).message}`); }
    if (!runtimeRevision(expected).manifest.some(file => file.path === PIN_ENTRY)) return refuse(`release ${commit}'s verified files do not include ${PIN_ENTRY}`);
    const pin = RunnerPin.parse({ version: 1, commit, directory: expected, manifestHash: verification.manifest.hash, lockfile: verification.manifest.lockfile, pinnedAt: now().toISOString() });
    try {
        ensurePrivateDirectory(paths.code);
        checkOwnedFile(paths.pin);
    } catch (error) { return refuse((error as Error).message); }
    writeDurable(paths.pin, `${JSON.stringify(pin, null, 2)}\n`);
    log(JSON.stringify({ pinned: pin }, null, 2));
    return 0;
}
