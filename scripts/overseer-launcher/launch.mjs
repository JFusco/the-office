// The Overseer launcher's entry: run by launchd every 120 seconds, it starts at most one
// observe-only pass of the runner from the pinned, verified release and stops it at its deadline.
// Node built-ins only. pnpm build:overseer-launcher bundles this folder into the one file the
// installer copies, scripts/overseer-launch.mjs; see docs/overseer.md, Launcher.
//
//   node overseer-launch.mjs                  one launch
//   node overseer-launch.mjs --group UUID     the trusted helper that leads one pass's process group
import { randomUUID } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { officeOrigin, passDeadline } from './configuration.mjs';
import { dispatch } from './dispatch-pass.mjs';
import { ensurePrivateDirectory } from './durable-files.mjs';
import { bounded, message } from './field-checks.mjs';
import { helperMain } from './helper.mjs';
import { acquireLauncherLock } from './launcher-lock.mjs';
import { attemptRecord, readState, saveState, settle } from './launcher-state.mjs';
import { LIMITS } from './limits.mjs';
import { defaultSystem } from './process-group.mjs';
import { recoverCurrent } from './recover-attempt.mjs';
import { localLoader, verifiedPin } from './release-verification.mjs';
import { checkRunnerRoot, launcherPaths, protectedRoots } from './runner-root.mjs';

/** This file. In the bundle it is the bundle; read here only. */
const HERE = fileURLToPath(import.meta.url);
/** The launcher file helpers are started from: the bundle itself, or, run from source, the bundle beside this folder. */
export const DEFAULT_LAUNCHER_FILE = basename(HERE) === 'launch.mjs' ? resolve(dirname(HERE), '..', 'overseer-launch.mjs') : HERE;

/**
 * One launchd firing. Takes the launcher lock, recovers anything an earlier launch left, checks
 * the deadline, the Office URL and the pin, then runs at most one pass under its deadline and
 * records how it ended. Returns the exit code: 0 when the outcome was recorded (a failure
 * included), 1 when state could not be read or saved, 2 when the root is unsafe.
 */
export async function launch(options = {}) {
    const env = options.env ?? process.env, system = { ...defaultSystem(), ...options.system }, limits = { ...LIMITS, ...options.limits };
    const log = options.log ?? (line => process.stdout.write(`${line}\n`)), warn = options.warn ?? (line => process.stderr.write(`${line}\n`));
    const launcherFile = options.launcherFile ?? DEFAULT_LAUNCHER_FILE;
    let roots, root;
    try {
        roots = protectedRoots(env, launcherFile);
        root = checkRunnerRoot(env.OVERSEER_ROOT, roots);
    } catch (error) { warn(`overseer launcher refused: ${message(error)}`); return 2; }
    const paths = launcherPaths(root);
    let shuttingDown = false, onShutdown = null;
    const signals = ['SIGTERM', 'SIGINT', 'SIGHUP'], handler = () => { shuttingDown = true; onShutdown?.(); };
    if (!options.noSignalHandlers) for (const signal of signals) process.on(signal, handler);
    let lock;
    try {
        try { ensurePrivateDirectory(paths.state); lock = await acquireLauncherLock(paths, system, randomUUID()); }
        catch (error) { warn(`overseer launcher refused: ${message(error)}`); return 2; }
        if (!lock.held) { warn(`overseer launcher: ${lock.reason}`); return 0; }
        let state;
        try { state = readState(paths); }
        catch (error) { warn(`overseer launcher: ${message(error)}; it is left as it is and no pass starts`); return 1; }
        const save = next => { saveState(paths, next); state = next; };
        const failed = summary => log(JSON.stringify({ at: system.now().toISOString(), ...summary }).slice(0, 2000));
        try {
            const recovered = await recoverCurrent(state, system, launcherFile, limits);
            save(recovered.state);
            if (recovered.blocked) { failed({ blocked: true, reason: state.current?.observation?.reason ?? 'blocked' }); return 0; }
            if (shuttingDown) return 0;
            const at = system.now().toISOString(), refuse = (kind, reason) => {
                save(settle(state, attemptRecord(randomUUID(), kind, at, system.now().toISOString(), { detail: bounded(reason) })));
                failed({ kind, reason: bounded(reason) });
                return 0;
            };
            let deadlineMs, origin;
            try { deadlineMs = passDeadline(env, limits); origin = officeOrigin(env); }
            catch (error) { return refuse('config', message(error)); }
            let pinned;
            try { pinned = verifiedPin(paths, roots, limits); }
            catch (error) { return refuse('pin', message(error)); }
            try { localLoader(pinned.directory); }
            catch (error) { return refuse('startup', message(error)); }
            return await dispatch({ state, save, system, limits, paths, pinned, deadlineMs, origin, env, launcherFile, failed, isShuttingDown: () => shuttingDown, setShutdown: fn => { onShutdown = fn; } });
        } catch (error) {
            warn(`overseer launcher could not record its outcome: ${message(error)}`);
            return 1;
        }
    } finally {
        try { lock?.held && lock.release(); } catch (error) { warn(`overseer launcher could not release its lock: ${message(error)}`); }
        if (!options.noSignalHandlers) for (const signal of signals) process.off(signal, handler);
    }
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(HERE)) {
    if (process.argv[2] === '--group') await helperMain(process.argv[3]);
    else process.exitCode = await launch({ launcherFile: HERE });
}
