import { lstatSync } from 'node:fs';
import { readStanding, reconcile } from './budget-ledger';
import { BILLING_MODE } from './budget-policy';
import type { RunnerPaths } from './config';
import { RUNNER_DEFAULTS } from './config';
import { readFailures } from './failure-journal';
import { readLauncherLock, readLauncherState } from './launcher-state';
import { pauseRunner, readPause, readStop, unpauseRunner } from './kill-switch';
import { readRunnerPin } from './runner-pin';
import { defaultRunnerRoot, ensurePrivateDirectory, validateRunnerRoot } from './runner-root';
import { readRunnerState } from './runner-state';
import { readPassOwner } from './single-flight';

/**
 * `pnpm office overseer status | pause [--reason TEXT] | unpause | reconcile-budget ...`. These
 * read and write the runner's own files only and never contact the Office, so they work while
 * the Office is down. `pin` is server/overseer/pin-command.ts, reached by its own import. `status` reads the budget ledger through a read-only connection and opens
 * no Store. The Office's switch for automatic repair resumes is separate
 * (`pnpm office incident pause-resumes`).
 */

const USAGE = 'pnpm office overseer status | pause [--reason TEXT] | unpause | reconcile-budget RESERVATION --expected-micro-usd N --reason TEXT [--finalize] | pin COMMIT';

/** The CLI's root: `OVERSEER_ROOT`, or `~/Projects/the-office-overseer` when it is unset. An empty or relative value is refused. */
export function resolveCliRoot(env: NodeJS.ProcessEnv): RunnerPaths {
    return validateRunnerRoot(env.OVERSEER_ROOT === undefined ? defaultRunnerRoot() : env.OVERSEER_ROOT, env);
}

const guardPresent = (path: string) => {
    try { lstatSync(path); return true; } catch { return false; }
};

/** Everything the runner's files say about it, reading each and creating nothing. */
export function runnerStatus(paths: RunnerPaths, now: Date = new Date()) {
    const read = readRunnerState(paths), journal = readFailures(paths, RUNNER_DEFAULTS.journalLimit), budget = readStanding(paths, now);
    const state = 'unreadable' in read ? read : (({ inFlight, outage, intent, observation, lastPass }) => ({
        inFlight, outage, intent: intent && { id: intent.id },
        observation: { healthAt: observation.health?.at ?? null, incidentsAt: observation.incidents?.at ?? null },
        lastPass,
    }))(read.state);
    return {
        root: paths.root, stop: readStop(paths), pause: readPause(paths), lock: readPassOwner(paths), lockGuardLeft: guardPresent(paths.guard),
        state, journal: journal.problem === null ? { events: journal.entries.length, limit: RUNNER_DEFAULTS.journalLimit } : { problem: journal.problem },
        billing: BILLING_MODE, budget: 'standing' in budget ? budget.standing : budget,
        pin: readRunnerPin(paths), launcher: readLauncherState(paths), launcherLock: readLauncherLock(paths),
    };
}

/** `reconcile-budget RESERVATION --expected-micro-usd N --reason TEXT [--finalize]`, or null when malformed. */
function reconcileArgs(rest: string[]) {
    const [id, ...flags] = rest, out: { id: string; expectedMicroUsd?: number; reason?: string; finalize: boolean } = { id, finalize: false };
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) return null;
    for (let index = 0; index < flags.length; index++) {
        const flag = flags[index];
        if (flag === '--finalize' && !out.finalize) out.finalize = true;
        else if (flag === '--expected-micro-usd' && out.expectedMicroUsd === undefined && /^\d{1,15}$/.test(flags[index + 1] ?? '')) out.expectedMicroUsd = Number(flags[++index]);
        else if (flag === '--reason' && out.reason === undefined) {
            const reason = flags[++index]?.trim();
            if (!reason || ['--finalize', '--expected-micro-usd', '--reason'].includes(reason)) return null;
            out.reason = reason.slice(0, 2000);
        } else return null;
    }
    return out.expectedMicroUsd === undefined || out.reason === undefined ? null : out as Required<typeof out>;
}

export async function overseerCommand(args: string[], context: { env?: NodeJS.ProcessEnv; now?: () => Date; log?: (line: string) => void } = {}): Promise<number> {
    const { env = process.env, now = () => new Date(), log = console.log } = context;
    const [verb, ...rest] = args;
    const reasonAt = rest.indexOf('--reason'), reason = reasonAt < 0 ? 'Paused by a person' : rest[reasonAt + 1];
    const reconciling = verb === 'reconcile-budget' ? reconcileArgs(rest) : null;
    const known = verb === 'status' || verb === 'unpause' ? rest.length === 0 : verb === 'pause' ? (rest.length === 0 || (rest.length === 2 && reasonAt === 0 && !!reason?.trim())) : !!reconciling;
    if (!known) { log(USAGE); return 2; }
    let paths: RunnerPaths;
    try { paths = resolveCliRoot(env); }
    catch (error) { log(`Refused: ${error instanceof Error ? error.message : String(error)}`); return 2; }
    const print = (value: unknown) => log(JSON.stringify(value, null, 2));
    if (verb === 'status') { print(runnerStatus(paths, now())); return 0; }
    if (verb === 'pause') {
        ensurePrivateDirectory(paths.control);
        const { written, pause } = pauseRunner(paths, reason, now);
        print({ paused: true, alreadyPaused: !written, pause, stop: readStop(paths) });
        return 0;
    }
    if (reconciling) {
        try {
            const result = reconcile(paths, reconciling.id, reconciling, { now });
            print(result);
            return result.reconciled ? 0 : 1;
        } catch (error) {
            log(`The budget ledger could not be reconciled: ${error instanceof Error ? error.message : String(error)}`);
            return 1;
        }
    }
    const removed = unpauseRunner(paths), stop = readStop(paths);
    print({ wasPaused: removed, stop, stillStopped: !('absent' in stop) });
    return 0;
}
