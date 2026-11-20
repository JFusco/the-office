import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DeploymentFence } from '../../../server/office/deployment-fence';
import { projectById } from '../../../server/office/projects';
import { runtimeRevision } from '../../../server/office/revision';
import { controllerEffects } from '../../../server/release/controller-effects';
import type { DeployContext } from '../../../server/release/deploy-context';
import { DeployFacts } from '../../../server/release/deploy-facts';
import { fileDigest, writeManifest } from '../../../server/release/release-manifest';
import { releaseDirectory } from '../../../server/release/release-paths';
import { SERVICE_LABEL } from '../../../server/release/service-plist';
import { recordAdmission } from '../../../server/store/admission-journal';
import { Store } from '../../../server/store/store';

export const FROM = 'a'.repeat(40), TO = 'b'.repeat(40), PIN = 'c'.repeat(40);

/** What the fake machine does when asked; each defaults to the well-behaved answer. */
export interface Behaviour {
    /** `fail`: launchctl errors and the service keeps running. `lost`: it errors although the service stopped. */
    bootout?: 'fail' | 'lost';
    /** `fail`: launchd refuses to load. `silent`: loaded but never answers. `writes`/`admits`: starts, then changes a store. */
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

/** A release directory with a manifest that verifies; `marker` makes its runtime hash distinct. */
export function buildFakeRelease(dataRoot: string, commit: string, marker = commit): string {
    const directory = releaseDirectory(dataRoot, commit);
    mkdirSync(resolve(directory, 'server/release'), { recursive: true });
    writeFileSync(resolve(directory, 'server/index.ts'), `export const release = '${marker}';\n`);
    writeFileSync(resolve(directory, 'server/release/controller-entry.ts'), 'export {};\n');
    writeFileSync(resolve(directory, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0\n');
    writeManifest(directory, { version: 1, commit, hash: runtimeRevision(directory).hash, node: '24.14.0', pnpm: '10.34.9', lockfile: fileDigest(resolve(directory, 'pnpm-lock.yaml')), builtAt: '2026-11-19T12:00:00.000Z' });
    return directory;
}

/**
 * A temporary data root with two releases, a running fake service, a real fence on a real control
 * database, a real project store, and fake `plutil`/`launchctl`/HTTP in front of them. Plists are
 * kept as JSON text; the fake `plutil` treats both formats alike.
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
    const projectDb = resolve(dataRoot, 'office.sqlite'), store = new Store(projectDb, projectById('brain'), dataRoot);
    recordAdmission(store.db, 'request', 'seed', '2026-11-20T00:00:00.000Z');
    store.close();
    const controlDb = resolve(dataRoot, 'office-control.sqlite'), control = new DatabaseSync(controlDb), fence = new DeploymentFence(control);
    const clock = { ms: Date.parse('2026-11-20T03:00:00.000Z') }, calls: string[] = [], alive = new Set<number>([4001]);
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

export type RunnerCall = { program: string; args: string[]; cwd?: string; env?: Record<string, string>; timeout?: number };
/** A command runner that records each call and answers with `answer`. */
export function fakeRunner(answer: (call: RunnerCall) => string | Promise<string>) {
    const calls: RunnerCall[] = [];
    const execute = (async (program: string, args: string[], options: any = {}) => { const call = { program, args, cwd: options.cwd, env: options.env, timeout: options.timeout }; calls.push(call); return answer(call); }) as DeployContext['execute'];
    return { calls, execute };
}
/** What a controller prints: progress lines, then its outcome as the last line. */
export const printedOutcome = (status: string, operation = 'deploy-20261120t030000z-0a0b0c0d') => `{"step":"fence"}\n${JSON.stringify({ status, operation, step: null, reason: 'done' })}\n`;
export const sampleFacts = (controller: string) => DeployFacts.parse({
    kind: 'deploy', controller, tokenDigest: '1'.repeat(64),
    source: { commit: 'a'.repeat(40), directory: '/r/a', loadedHash: '2'.repeat(64), serviceInstanceId: 'i-1', pid: 10 },
    target: { commit: 'b'.repeat(40), directory: '/r/b', hash: '3'.repeat(64), manifestDigest: '4'.repeat(64) },
    plist: { path: '/p', priorSha256: '5'.repeat(64), targetSha256: '6'.repeat(64) },
});
