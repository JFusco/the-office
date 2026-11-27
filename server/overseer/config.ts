import { resolve } from 'node:path';

/**
 * The runner's fixed limits. Node built-ins only: the entry reads this file before it has fixed
 * the data root that Office modules capture when they load.
 */
export const RUNNER_DEFAULTS = {
    /** One incident in flight at a time. */
    inFlight: 1,
    /** How often the launcher (phase 6c) starts a pass. A pass itself runs once. */
    intervalMs: 120_000,
    /** Each HTTP attempt, its body included. */
    requestTimeoutMs: 30_000,
    maxResponseBytes: 8 * 1024 * 1024,
    /** A deployment stops and restarts the service for about a minute, so a gap shorter than this is not an outage. */
    serviceDownAfterMs: 300_000,
    serviceDownAfterFailures: 2,
    /** Failure events kept for forwarding; a full journal stops the runner. */
    journalLimit: 1_000,
    /** Journal events one pass examines for forwarding: sends and read-backs together. */
    forwardLimit: 20,
    /** A pass run by hand, outside the launcher, takes this long at most. */
    manualPassMs: 240_000,
    /** The end of a pass kept for saving its records: no request runs into it. */
    finalizeMs: 6_000,
    /** Forwarding takes at most a quarter of a pass, and never longer than this. */
    forwardMaxMs: 30_000,
} as const;
export type RunnerLimits = { [K in keyof typeof RUNNER_DEFAULTS]: number };

/** Every file the runner owns under its root: control files, journals and state each in their own folder. */
export interface RunnerPaths {
    root: string;
    control: string;
    journal: string;
    state: string;
    /** The runner process's `OFFICE_DATA_ROOT`; never the Office's. */
    officeData: string;
    stop: string;
    pause: string;
    lock: string;
    guard: string;
    failures: string;
    runnerState: string;
    /** What the last pass forwarded and reported, for `status` (forwarding-status.ts). */
    forwarding: string;
    /** The runner's private Store and its data folder (`runner-store.ts`); only the Store opener creates them. */
    runnerDb: string;
    runnerData: string;
    /** The budget ledger (`budget-ledger.ts`) and the optional ceiling override. */
    budgetDb: string;
    budgetConfig: string;
    /** The launcher's own (`scripts/overseer-launch.mjs`): the code pin, the installed launcher, its state, its lock and launchd's logs. */
    code: string;
    pin: string;
    launcherCopy: string;
    launcherState: string;
    launcherLock: string;
    launcherGuard: string;
    logs: string;
    /** One private folder per model run (`run-directories.ts`); a pass never creates it. */
    runs: string;
    /** The sandbox wrapper's own short temporary folder per run (`worker-sandbox-run.ts`); never opened to a payload. */
    wrapperTmp: string;
    /** Runner-owned provider sign-ins Joe enrolls (`provider-auth/sign-in-paths.ts`); never opened to a payload. */
    providers: string;
}

export function runnerPaths(root: string): RunnerPaths {
    const control = resolve(root, 'control'), journal = resolve(root, 'journal'), state = resolve(root, 'state');
    return {
        root, control, journal, state, officeData: resolve(state, 'office-data'),
        stop: resolve(control, 'STOP.json'), pause: resolve(control, 'pause.json'),
        lock: resolve(control, 'pass.lock'), guard: resolve(control, 'pass.lock.reclaim'),
        failures: resolve(journal, 'failures.jsonl'), runnerState: resolve(state, 'runner.json'), forwarding: resolve(state, 'forwarding.json'),
        runnerDb: resolve(state, 'runner.sqlite'), runnerData: resolve(state, 'runner-data'),
        budgetDb: resolve(state, 'budget.sqlite'), budgetConfig: resolve(control, 'budget.json'),
        code: resolve(root, 'code'), pin: resolve(root, 'code', 'pin.json'), launcherCopy: resolve(root, 'code', 'launcher', 'overseer-launch.mjs'),
        launcherState: resolve(state, 'launcher.json'), launcherLock: resolve(control, 'launcher.lock'), launcherGuard: resolve(control, 'launcher.lock.reclaim'),
        logs: resolve(root, 'logs'), runs: resolve(root, 'runs'), wrapperTmp: resolve(root, 'w'), providers: resolve(root, 'providers'),
    };
}

/** The folders the runner writes into, in the order they are created. */
export const privateDirectories = (paths: RunnerPaths) => [paths.control, paths.journal, paths.state, paths.officeData];

export const DEFAULT_OFFICE_URL = 'http://127.0.0.1:4318';
// The Office answers only these origins (server/office/security.ts safeOrigin), so the runner accepts no others.
const LOOPBACK = new Set(['127.0.0.1', 'localhost']);

/**
 * The Office the runner reads: `OVERSEER_OFFICE_URL`, or the default port on loopback. Only a bare
 * HTTP origin on a loopback host is accepted, because the runner reads the local Office and nothing
 * else.
 */
export function officeUrl(env: NodeJS.ProcessEnv): string {
    const raw = env.OVERSEER_OFFICE_URL ?? DEFAULT_OFFICE_URL;
    let url: URL;
    try { url = new URL(raw); } catch { throw new Error(`OVERSEER_OFFICE_URL is not a URL: ${raw.slice(0, 200)}`); }
    if (url.protocol !== 'http:' || !LOOPBACK.has(url.hostname)) throw new Error('OVERSEER_OFFICE_URL must be an http: origin on 127.0.0.1 or localhost');
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash || /[?#]/.test(raw))
        throw new Error('OVERSEER_OFFICE_URL must be a bare origin, without credentials, a path, a query or a fragment');
    return url.origin;
}
