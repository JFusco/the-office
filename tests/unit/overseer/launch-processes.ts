import { spawn, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { FAST, LAUNCHER, launchEnv, launcherSource, layout, release, writePin, type Behavior } from './launch-world';

/** Test support for launcher tests with real processes: the modules they drive, owned processes, helpers waiting to be authorized, and seeded state. */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const loaded: { entry: any; contract: any; group: any } = { entry: null, contract: null, group: null };
export async function loadLauncher() {
    [loaded.entry, loaded.contract, loaded.group] = await Promise.all((['launch', 'launcher-state', 'process-group'] as const).map(launcherSource));
}

/** One launch from the maintained source, starting helpers from the committed bundle unless told otherwise. */
export const launch = (options: Record<string, unknown>) => loaded.entry.launch({ launcherFile: LAUNCHER, ...options });
export const quiet = { noSignalHandlers: true, log: () => {}, warn: () => {} };

type Identity = { pid: number; pgid: number; start: string; command: string };
type ProcessSystem = {
    ps: (args: string[]) => Promise<{ ok: boolean; code: number | null; stdout: string }>;
    kill: (pid: number, signal: NodeJS.Signals) => unknown;
};
const owned = new Map<number, { identity: Identity; group: boolean }>();

export async function trackProcess(child: ChildProcess, group = false, system: Pick<ProcessSystem, 'ps'> = loaded.group.defaultSystem()): Promise<Identity | null> {
    const pid = child.pid;
    if (!pid || pid < 2 || child.exitCode !== null || child.signalCode !== null) return null;
    const identity: Identity | null = await loaded.group.processIdentity(system, pid);
    if (!identity || !identity.command || (group && identity.pgid !== pid) || child.exitCode !== null || child.signalCode !== null) return null;
    const entry = { identity, group };
    owned.set(pid, entry);
    child.once('exit', () => { if (owned.get(pid) === entry) owned.delete(pid); });
    return identity;
}

export async function trackGrandchild(root: string) {
    const pid = Number(readFileSync(join(root, 'grandchild.pid'), 'utf8'));
    if (Number.isSafeInteger(pid) && pid > 1) {
        const identity: Identity | null = await loaded.group.processIdentity(loaded.group.defaultSystem(), pid);
        if (identity?.command.endsWith(` ${root}`)) owned.set(pid, { identity, group: false });
    }
    return pid;
}

/** Signal only a fixture whose live identity still matches the one captured at startup. */
export async function killOwned(system: ProcessSystem = loaded.group.defaultSystem()) {
    for (const [pid, entry] of owned) {
        const { identity, group } = entry;
        const current: Identity | null = await loaded.group.processIdentity(system, pid);
        if (owned.get(pid) !== entry) continue;
        owned.delete(pid);
        if (!current || current.pgid !== identity.pgid || current.start !== identity.start || current.command !== identity.command) continue;
        try { system.kill(group ? -pid : pid, 'SIGKILL'); } catch { /* gone */ }
    }
}

export const readState = (root: string) => JSON.parse(readFileSync(join(root, 'state/launcher.json'), 'utf8'));
export const alive = (pid: number) => { try { process.kill(pid, 0); return true; } catch (error) { return (error as NodeJS.ErrnoException).code !== 'ESRCH'; } };
export const until = async (test: () => boolean, ms = 10_000) => { const end = Date.now() + ms; while (!test() && Date.now() < end) await new Promise(done => setTimeout(done, 50)); return test(); };

/** A world with a release of the given behavior pinned, and one in-process launch of it. */
export function launchedWith(behavior: Behavior, options: { deadlineMs?: number; seed?: (world: ReturnType<typeof layout>) => void; env?: NodeJS.ProcessEnv; launch?: Record<string, unknown> } = {}) {
    const world = layout(), built = release(world.officeData, behavior);
    writePin(world.root, built);
    options.seed?.(world);
    const env = launchEnv(world, { OVERSEER_PASS_DEADLINE_MS: String(options.deadlineMs ?? 20_000), ...options.env });
    return { world, built, env, run: (extra: Record<string, unknown> = {}) => launch({ env, limits: FAST, ...quiet, ...options.launch, ...extra }) };
}

/** A helper started the way the launcher starts one, from the given launcher file, waiting to be authorized, and its recorded identity. */
export async function waitingHelper(file = LAUNCHER) {
    const id = randomUUID(), child = spawn(process.execPath, [file, '--group', id], { detached: true, stdio: ['ignore', 'ignore', 'ignore', 'ipc'] });
    let ready = false;
    child.once('message', () => { ready = true; });
    const identity = await trackProcess(child, true);
    if (!identity || !(await until(() => ready || child.exitCode !== null || child.signalCode !== null)) || !ready) {
        if (child.connected) child.disconnect();
        throw new Error('Could not identify a ready test helper');
    }
    return { id, child, ...identity };
}

export const registered = (helper: { id: string; pid: number; start: string }, extra: Record<string, unknown> = {}) => ({
    id: helper.id, commit: 'a'.repeat(40), entry: '/nowhere/server/overseer.ts', startedAt: '2026-11-26T08:00:00.000Z', deadline: '2026-11-26T08:04:00.000Z',
    phase: 'registered', pid: helper.pid, pgid: helper.pid, start: helper.start, counted: null, observation: null, ...extra,
});

export const seedState = (world: ReturnType<typeof layout>, current: unknown, extra: Record<string, unknown> = {}) => {
    mkdirSync(join(world.root, 'state'), { recursive: true, mode: 0o700 });
    writeFileSync(join(world.root, 'state/launcher.json'), JSON.stringify({ ...loaded.contract.emptyState(), current, ...extra }));
};
