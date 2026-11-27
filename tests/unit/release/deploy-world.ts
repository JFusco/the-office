import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DeploymentFence } from '../../../server/office/deployment-fence';
import { projectById } from '../../../server/office/projects';
import { runtimeRevision } from '../../../server/office/revision';
import { controllerEffects } from '../../../server/release/controller-effects';
import { CONTROLLER_RUNTIME } from '../../../server/release/controller-start-check';
import type { DeployContext } from '../../../server/release/deploy-context';
import { DeployFacts } from '../../../server/release/deploy-facts';
import { fileDigest, writeManifest } from '../../../server/release/release-manifest';
import { releaseDirectory } from '../../../server/release/release-paths';
import { SERVICE_LABEL } from '../../../server/release/service-plist';
import { recordAdmission } from '../../../server/store/admission-journal';
import { ControlStore } from '../../../server/store/control-store';
import { Store } from '../../../server/store/store';
import { command } from '../../../server/workers/process';

export const FROM = 'a'.repeat(40), TO = 'b'.repeat(40), PIN = 'c'.repeat(40);

/** What the fake machine does when asked; each defaults to the well-behaved answer. */
export interface Behaviour {
    /** `fail`: launchctl errors and the service keeps running. `lost`: it errors although the service stopped. */
    bootout?: 'fail' | 'lost';
    /** `fail`: launchd refuses to load. `silent`: started but never answers. `writes`/`admits`: starts, then changes a store beyond what a start writes. */
    bootstrap?: 'fail' | 'silent' | 'writes' | 'admits' | 'wrong-hash' | 'unfenced';
    busy?: boolean;
    acquire?: 'fail';
    release?: 'fail';
}

export interface World {
    root: string; dataRoot: string; plistPath: string; ctx: DeployContext;
    behaviour: Behaviour;
    /** Every mutation the controller dispatched, in order. */
    calls: string[];
    service: { loaded: boolean; pid: number | null; instance: string | null; hash: string | null };
    fence: DeploymentFence;
    projectDb: string;
    clock: { ms: number };
    plist: () => Record<string, any>;
    hashOf: (commit: string) => string;
    close: () => void;
}

/**
 * A release directory with a manifest that verifies; `marker` makes its runtime hash distinct. `runtime`, when
 * given, is the release's controller runtime source; the release then loads with the checkout's installed tsx.
 */
export function buildFakeRelease(dataRoot: string, commit: string, marker = commit, runtime?: string): string {
    const directory = releaseDirectory(dataRoot, commit);
    mkdirSync(resolve(directory, 'server/release'), { recursive: true });
    writeFileSync(resolve(directory, 'server/index.ts'), `export const release = '${marker}';\n`);
    writeFileSync(resolve(directory, 'server/release/controller-entry.ts'), 'export {};\n');
    writeFileSync(resolve(directory, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0\n');
    if (runtime !== undefined) {
        writeFileSync(resolve(directory, 'package.json'), '{ "type": "module" }\n');
        writeFileSync(resolve(directory, CONTROLLER_RUNTIME), runtime);
        mkdirSync(resolve(directory, 'node_modules'), { recursive: true });
        if (!existsSync(resolve(directory, 'node_modules/tsx'))) symlinkSync(realpathSync(resolve(__dirname, '../../../node_modules/tsx')), resolve(directory, 'node_modules/tsx'), 'dir');
    }
    writeManifest(directory, { version: 1, commit, hash: runtimeRevision(directory).hash, node: '24.14.0', pnpm: '10.34.9', lockfile: fileDigest(resolve(directory, 'pnpm-lock.yaml')), builtAt: '2026-11-19T12:00:00.000Z' });
    return directory;
}

/**
 * A temporary data root with two releases, a running fake service, a real fence on a real control
 * database, a real project store, and fake `plutil`/`launchctl`/HTTP in front of them. Every start
 * of the fake service opens and writes both stores as the real one does. Plists are kept as JSON
 * text; the fake `plutil` treats both formats alike.
 */
export function world(behaviour: Behaviour = {}): World {
    const root = mkdtempSync(resolve(tmpdir(), 'office-deploy-')), dataRoot = resolve(root, '.local'), plistPath = resolve(root, 'LaunchAgents', `${SERVICE_LABEL}.plist`);
    mkdirSync(resolve(root, 'LaunchAgents'), { recursive: true }); mkdirSync(dataRoot, { recursive: true });
    const directories = Object.fromEntries([FROM, TO, PIN].map(commit => [commit, buildFakeRelease(dataRoot, commit)]));
    const hashOf = (commit: string) => runtimeRevision(directories[commit]).hash;
    writeFileSync(plistPath, JSON.stringify({
        Label: SERVICE_LABEL, KeepAlive: true, RunAtLoad: true, ThrottleInterval: 30, WorkingDirectory: directories[FROM],
        ProgramArguments: ['/usr/local/bin/node', '--import', 'tsx', resolve(directories[FROM], 'server/index.ts')],
        EnvironmentVariables: { OFFICE_DATA_ROOT: dataRoot, PATH: `${directories[FROM]}/node_modules/.bin:/usr/bin` },
    }));
    const projectDb = resolve(dataRoot, 'office.sqlite'), controlDb = resolve(dataRoot, 'office-control.sqlite');
    const clock = { ms: Date.parse('2026-11-20T03:00:00.000Z') }, calls: string[] = [], alive = new Set<number>([4001]);
    // What a service start writes before it can answer (`Offices`, then `server/index.ts`): the control store
    // opens and recovers; the project store opens, recovers and records that the office is open.
    const start = (fenced: boolean) => {
        const at = { now: () => new Date(clock.ms), monotonic: () => 0 }, opened = new ControlStore(controlDb, at);
        opened.recover(); opened.close();
        const store = new Store(projectDb, projectById('brain'), dataRoot, at);
        store.recover(fenced); store.emit('office-opened', 'Brain office is open.');
        return store;
    };
    const store = start(false);
    recordAdmission(store.db, 'request', 'seed', '2026-11-20T00:00:00.000Z');
    store.close();
    const control = new DatabaseSync(controlDb), fence = new DeploymentFence(control);
    const service: World['service'] = { loaded: true, pid: 4001, instance: 'instance-1', hash: hashOf(FROM) };
    let pids = 4001, instances = 1, answering = true, fenced = true;
    const plist = () => JSON.parse(readFileSync(plistPath, 'utf8'));
    const mutate = (path: string, sql: string) => { const db = new DatabaseSync(path); try { db.exec(sql); } finally { db.close(); } };

    const execute = (async (program: string, args: string[]) => {
        if (program === 'plutil' && args[1] === 'json') return readFileSync(args[4], 'utf8');
        if (program === 'plutil' && args[1] === 'xml1') { copyFileSync(args[4], args[3]); return ''; }
        if (program !== 'launchctl') throw new Error(`unexpected command ${program} ${args.join(' ')}`);
        if (args[0] === 'print') {
            if (!service.loaded) throw new Error(`launchctl exited 113: Bad request.\nCould not find service "${SERVICE_LABEL}" in domain for user gui: 505`);
            return 'state = running';
        }
        calls.push(args[0]);
        if (args[0] === 'bootout') {
            if (world.behaviour.bootout === 'fail') throw new Error('launchctl exited 5: Boot-out failed: 5: Input/output error');
            service.loaded = false; if (service.pid) alive.delete(service.pid); service.pid = null; answering = false;
            if (world.behaviour.bootout === 'lost') throw new Error('launchctl exited 36: Operation now in progress');
            return '';
        }
        if (args[0] === 'bootstrap') {
            const mode = world.behaviour.bootstrap;
            if (mode === 'fail') throw new Error('launchctl exited 5: Bootstrap failed: 5: Input/output error');
            const commit = String(plist().WorkingDirectory).split('/').at(-1)!;
            service.loaded = true; service.pid = ++pids; alive.add(service.pid); service.instance = `instance-${++instances}`;
            service.hash = mode === 'wrong-hash' ? 'f'.repeat(64) : hashOf(commit); answering = mode !== 'silent'; fenced = mode !== 'unfenced';
            start(fence.read().status !== 'open').close();
            if (mode === 'writes') mutate(projectDb, "CREATE TABLE IF NOT EXISTS migrated (id INTEGER); INSERT INTO migrated VALUES (1)");
            if (mode === 'admits') mutate(projectDb, "INSERT INTO admissions (kind, ref, at) VALUES ('request', 'after-start', '2026-11-20T03:05:00.000Z')");
            return '';
        }
        throw new Error(`unexpected launchctl ${args.join(' ')}`);
    }) as DeployContext['execute'];

    const office: DeployContext['office'] = {
        health: async () => {
            if (!service.loaded || !answering) throw new Error('connect ECONNREFUSED 127.0.0.1:4318');
            return { ok: true, loadedHash: service.hash, serviceInstanceId: service.instance, pid: service.pid, busy: !!world.behaviour.busy, fence: fenced ? fence.read() : { status: 'open' } };
        },
        fence: async () => { if (!service.loaded || !answering) throw new Error('connect ECONNREFUSED 127.0.0.1:4318'); return fence.read(); },
        acquireFence: async (token, deployment) => { calls.push('acquire'); if (world.behaviour.acquire === 'fail') throw new Error('/api/deployment-fence answered 500'); return fence.acquire(token, deployment); },
        releaseFence: async token => { calls.push('release'); if (world.behaviour.release === 'fail') throw new Error('/api/deployment-fence answered 500'); return fence.release(token); },
    };
    const { effects, close } = controllerEffects(dataRoot);
    const ctx: DeployContext = {
        dataRoot, execute, office, effects, plistPath, domain: 'gui/505',
        projects: [{ name: 'brain', path: projectDb }], databases: [{ name: 'brain', path: projectDb }, { name: 'office-control', path: controlDb }], archives: [resolve(dataRoot, 'archive')],
        timings: { idleDeadlineMs: 60_000, idleIntervalMs: 1_000, stopDeadlineMs: 10_000, startDeadlineMs: 10_000, pollMs: 1_000 },
        now: () => new Date(clock.ms), sleep: async ms => { clock.ms += ms; }, alive: pid => alive.has(pid),
    };
    const world: World = { root, dataRoot, plistPath, ctx, behaviour, calls, service, fence, projectDb, clock, plist, hashOf, close: () => { close(); control.close(); if (existsSync(root)) rmSync(root, { recursive: true, force: true }); } };
    return world;
}

export type RunnerCall = { program: string; args: string[]; cwd?: string; env?: Record<string, string>; timeout?: number; readOnly?: boolean };
/** A command runner that records each call and answers with `answer`. */
export function fakeRunner(answer: (call: RunnerCall) => string | Promise<string>) {
    const calls: RunnerCall[] = [];
    const execute = (async (program: string, args: string[], options: any = {}) => { const call = { program, args, cwd: options.cwd, env: options.env, timeout: options.timeout, readOnly: options.readOnly }; calls.push(call); return answer(call); }) as DeployContext['execute'];
    return { calls, execute };
}

/** Whether a call is a controller start check (`controller-start-check.ts`) rather than a launch. */
export const isStartCheck = (call: RunnerCall) => !!call.args.at(-1)?.endsWith(CONTROLLER_RUNTIME);

/**
 * `fakeRunner` for controller launches. Each start check is answered by `check`, which passes by default, and
 * kept in `checks`; every other call is answered by `answer` and kept in `calls`. `log` holds both, in order.
 */
export function launchRunner(answer: (call: RunnerCall) => string | Promise<string>, check: (call: RunnerCall) => string | Promise<string> = () => '') {
    const calls: RunnerCall[] = [], checks: RunnerCall[] = [];
    const { calls: log, execute } = fakeRunner(call => isStartCheck(call) ? (checks.push(call), check(call)) : (calls.push(call), answer(call)));
    return { calls, checks, log, execute };
}

/**
 * Runs a start check for real, from `directory` with `dataRoot` only, and refuses anything else. Vitest's variables
 * are removed and NODE_ENV is production, so the release's configuration rules run as they would in a deployment.
 */
export const realStartCheck = (directory: string, dataRoot: string) => (call: RunnerCall) => {
    if (!isStartCheck(call) || call.cwd !== directory || call.env?.OFFICE_DATA_ROOT !== dataRoot) throw new Error(`unexpected command ${call.program} ${call.args.join(' ')}`);
    return command(call.program, call.args, { cwd: call.cwd, env: { ...call.env, NODE_ENV: 'production' }, envRemove: ['VITEST', 'VITEST_POOL_ID', 'VITEST_WORKER_ID'], timeout: Math.min(call.timeout ?? 60_000, 60_000), readOnly: call.readOnly });
};

/** The message the incident's controller release threw for an `autoAdopt` it did not support. */
export const AUTO_ADOPT_REJECTED = 'Project autoAdopt must list unique supported dependency bots on a GitHub project';

/**
 * A controller runtime that checks `autoAdopt` against `bots` as it loads, the way a release's `localBindings`
 * does, then prints the bots it read. `depth` throws from that many nested calls, giving the error a long stack.
 */
export const autoAdoptRuntime = (bots: string[], depth = 0) => `import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
Error.stackTraceLimit = Infinity;
const supported = ${JSON.stringify(bots)};
const config = JSON.parse(readFileSync(resolve(process.env.OFFICE_DATA_ROOT, 'office-config.json'), 'utf8'));
const check = depth => {
    if (depth > 0) return check(depth - 1);
    for (const project of config.projects ?? [])
        if (project.autoAdopt !== undefined && (project.provider !== 'github' || project.autoAdopt.some(bot => !supported.includes(bot)) || new Set(project.autoAdopt).size !== project.autoAdopt.length))
            throw new Error(${JSON.stringify(AUTO_ADOPT_REJECTED)});
};
check(${depth});
console.log(JSON.stringify((config.projects ?? []).flatMap(project => project.autoAdopt ?? [])));
`;

/** A complete GitHub project entry for office-config.json that adopts `bots`. */
export const autoAdoptConfig = (bots: string[]) => `${JSON.stringify({ projects: [{ id: 'demo', name: 'Demo', provider: 'github', repo: '/nonexistent/demo', repository: 'example/demo', target: 'main', autoAdopt: bots }] }, null, 2)}\n`;
/** What a controller prints: progress lines, then its outcome as the last line. */
export const printedOutcome = (status: string, operation = 'deploy-20261120t030000z-0a0b0c0d') => `{"step":"fence"}\n${JSON.stringify({ status, operation, step: null, reason: 'done' })}\n`;
export const sampleFacts = (controller: string) => DeployFacts.parse({
    kind: 'deploy', controller, tokenDigest: '1'.repeat(64),
    source: { commit: 'a'.repeat(40), directory: '/r/a', loadedHash: '2'.repeat(64), serviceInstanceId: 'i-1', pid: 10 },
    target: { commit: 'b'.repeat(40), directory: '/r/b', hash: '3'.repeat(64), manifestDigest: '4'.repeat(64) },
    plist: { path: '/p', priorSha256: '5'.repeat(64), targetSha256: '6'.repeat(64) },
});
