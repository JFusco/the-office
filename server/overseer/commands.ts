import { lstatSync } from 'node:fs';
import type { RunnerPaths } from './config';
import { RUNNER_DEFAULTS } from './config';
import { readFailures } from './failure-journal';
import { pauseRunner, readPause, readStop, unpauseRunner } from './kill-switch';
import { defaultRunnerRoot, ensurePrivateDirectory, validateRunnerRoot } from './runner-root';
import { readRunnerState } from './runner-state';
import { readPassOwner } from './single-flight';

/**
 * `pnpm office overseer status | pause [--reason TEXT] | unpause`. These read and write the
 * runner's own files only: they open no database and never contact the Office, so they work
 * while the Office is down. The Office's switch for automatic repair resumes is separate
 * (`pnpm office incident pause-resumes`).
 */

const USAGE = 'pnpm office overseer status | pause [--reason TEXT] | unpause';

/** The CLI's root: `OVERSEER_ROOT`, or `~/Projects/the-office-overseer` when it is unset. An empty or relative value is refused. */
export function resolveCliRoot(env: NodeJS.ProcessEnv): RunnerPaths {
    return validateRunnerRoot(env.OVERSEER_ROOT === undefined ? defaultRunnerRoot() : env.OVERSEER_ROOT, env);
}

const guardPresent = (path: string) => {
    try { lstatSync(path); return true; } catch { return false; }
};

/** Everything the runner's files say about it, reading each and creating nothing. */
export function runnerStatus(paths: RunnerPaths) {
    const read = readRunnerState(paths), journal = readFailures(paths, RUNNER_DEFAULTS.journalLimit);
    const state = 'unreadable' in read ? read : (({ inFlight, outage, intent, observation, lastPass }) => ({
        inFlight, outage, intent: intent && { id: intent.id },
        observation: { healthAt: observation.health?.at ?? null, incidentsAt: observation.incidents?.at ?? null },
        lastPass,
    }))(read.state);
    return {
        root: paths.root, stop: readStop(paths), pause: readPause(paths), lock: readPassOwner(paths), lockGuardLeft: guardPresent(paths.guard),
        state, journal: journal.problem === null ? { events: journal.entries.length, limit: RUNNER_DEFAULTS.journalLimit } : { problem: journal.problem },
    };
}

export async function overseerCommand(args: string[], context: { env?: NodeJS.ProcessEnv; now?: () => Date; log?: (line: string) => void } = {}): Promise<number> {
    const { env = process.env, now = () => new Date(), log = console.log } = context;
    const [verb, ...rest] = args;
    const reasonAt = rest.indexOf('--reason'), reason = reasonAt < 0 ? 'Paused by a person' : rest[reasonAt + 1];
    const known = verb === 'status' || verb === 'unpause' ? rest.length === 0 : verb === 'pause' ? (rest.length === 0 || (rest.length === 2 && reasonAt === 0 && !!reason?.trim())) : false;
    if (!known) { log(USAGE); return 2; }
    let paths: RunnerPaths;
    try { paths = resolveCliRoot(env); }
    catch (error) { log(`Refused: ${error instanceof Error ? error.message : String(error)}`); return 2; }
    const print = (value: unknown) => log(JSON.stringify(value, null, 2));
    if (verb === 'status') { print(runnerStatus(paths)); return 0; }
    if (verb === 'pause') {
        ensurePrivateDirectory(paths.control);
        const { written, pause } = pauseRunner(paths, reason, now);
        print({ paused: true, alreadyPaused: !written, pause, stop: readStop(paths) });
        return 0;
    }
    const removed = unpauseRunner(paths), stop = readStop(paths);
    print({ wasPaused: removed, stop, stillStopped: !('absent' in stop) });
    return 0;
}
