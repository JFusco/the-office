import { spawn } from 'node:child_process';
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, beforeAll, describe, expect, test } from 'vitest';
import { alive, killOwned, launchedWith, loadLauncher, loaded, quiet, readState, registered, seedState, waitingHelper } from './launch-processes';
import { FAST, LAUNCHER, LAUNCHER_SOURCES, launchEnv, layout } from './launch-world';
import { snapshot, tempDir } from './runner-world';

// Which launcher file a launch starts helpers from, and how a helper is recognized as this
// launcher's for this attempt: by its complete path, whatever it holds, compared before any bound.

beforeAll(loadLauncher);
afterEach(killOwned);

/** A copy of the committed bundle at the given path. */
function bundleAt(path: string) {
    mkdirSync(join(path, '..'), { recursive: true });
    copyFileSync(LAUNCHER, path);
    return path;
}

test('run from source, the launcher starts helpers from the bundle beside its folder and protects that checkout’s .local by default', async () => {
    const checkout = join(tempDir(), 'checkout'), sources = join(checkout, 'scripts', 'overseer-launcher');
    cpSync(LAUNCHER_SOURCES, sources, { recursive: true });
    mkdirSync(join(checkout, '.local'));
    const entry = await import(pathToFileURL(join(sources, 'launch.mjs')).href);
    expect(entry.DEFAULT_LAUNCHER_FILE).toBe(join(realpathSync(checkout), 'scripts', 'overseer-launch.mjs'));
    const env = { PATH: process.env.PATH, HOME: checkout };
    const inside = join(checkout, '.local', 'runner'), before = snapshot(checkout);
    expect(await entry.launch({ env: { ...env, OVERSEER_ROOT: inside }, limits: FAST, ...quiet })).toBe(2);
    expect(snapshot(checkout)).toEqual(before);
    const outside = join(tempDir(), 'runner');
    expect(await entry.launch({ env: { ...env, OVERSEER_ROOT: outside, OVERSEER_PASS_DEADLINE_MS: '30000' }, limits: FAST, ...quiet })).toBe(0);
    expect(readState(outside)).toMatchObject({ counts: { pin: 1 }, current: null });
});

test('run directly from source, the launcher protects its own checkout’s .local and writes nothing there', async () => {
    const checkout = join(tempDir(), 'checkout'), sources = join(checkout, 'scripts', 'overseer-launcher');
    cpSync(LAUNCHER_SOURCES, sources, { recursive: true });
    mkdirSync(join(checkout, '.local'));
    const before = snapshot(checkout);
    const child = spawn(process.execPath, [join(sources, 'launch.mjs')], { env: { PATH: process.env.PATH, HOME: checkout, OVERSEER_ROOT: join(checkout, '.local', 'runner') }, stdio: 'ignore' });
    expect(await new Promise(done => child.once('exit', done))).toBe(2);
    expect(snapshot(checkout)).toEqual(before);
}, 30_000);

describe.skipIf(process.platform !== 'darwin')('helper identity with real processes', () => {
    test('the installed copy, missing either protected Office root, refuses and writes nothing', async () => {
        const world = layout(), copy = bundleAt(join(world.root, 'code', 'launcher', 'overseer-launch.mjs'));
        for (const missing of ['OVERSEER_CHECKOUT_DATA_ROOT', 'OFFICE_DATA_ROOT']) {
            const env = launchEnv(world);
            delete env[missing];
            const before = snapshot(world.base);
            const child = spawn(process.execPath, [copy], { cwd: world.root, env, stdio: 'ignore' });
            expect(await new Promise(done => child.once('exit', done)), missing).toBe(2);
            expect(snapshot(world.base), missing).toEqual(before);
        }
    }, 30_000);

    test('a helper whose launcher file lies elsewhere under the same name is never authorized: startup, and no pass starts', async () => {
        const { world, run } = launchedWith('record');
        const elsewhere = '/elsewhere/scripts/overseer-launch.mjs';
        const real = loaded.group.defaultSystem();
        const system = { ps: async (args: string[]) => {
            const result = await real.ps(args);
            return args.includes('-p') ? { ...result, stdout: result.stdout.replace(LAUNCHER, elsewhere) } : result;
        } };
        expect(await run({ system })).toBe(0);
        expect(readState(world.root)).toMatchObject({ current: null, counts: { startup: 1, success: 0 }, last: { kind: 'startup', detail: 'the helper could not be registered' } });
        expect(existsSync(join(world.root, 'evidence.json'))).toBe(false);
    }, 30_000);

    test('a helper that leaves before it is ready is a startup failure and no pass starts', async () => {
        const quitter = join(tempDir(), 'overseer-launch.mjs');
        writeFileSync(quitter, 'process.exit(1);\n');
        const { world, run } = launchedWith('record', { launch: { launcherFile: quitter } });
        expect(await run()).toBe(0);
        expect(readState(world.root)).toMatchObject({ current: null, counts: { startup: 1 }, last: { kind: 'startup' } });
        expect(existsSync(join(world.root, 'evidence.json'))).toBe(false);
    }, 30_000);

    test('a launcher path with spaces, longer than the saved command bound, is matched in full: its orphan is stopped and its next pass runs', async () => {
        const deep = join(realpathSync(tempDir()), 'a folder with spaces', 'x'.repeat(150), 'y'.repeat(150));
        const file = bundleAt(join(deep, 'A', 'overseer-launch.mjs')), helper = await waitingHelper(file);
        expect(helper.command.length).toBeGreaterThan(300);
        const { world, run } = launchedWith('record', { seed: world => seedState(world, registered(helper)), launch: { launcherFile: file } });
        expect(await run()).toBe(0);
        expect(alive(helper.pid)).toBe(false);
        const state = readState(world.root);
        expect(state).toMatchObject({ current: null, counts: { orphan: 1, success: 1 } });
        expect(JSON.parse(readFileSync(join(world.root, 'evidence.json'), 'utf8')).parent).toBe(`${process.execPath} ${file} --group ${state.last.id}`);
    }, 60_000);

    test('a live leader whose launcher path differs only past the saved bound is not ours: it keeps current, gets no signal and blocks', async () => {
        const deep = join(realpathSync(tempDir()), 'a folder with spaces', 'x'.repeat(150), 'y'.repeat(150));
        const theirs = bundleAt(join(deep, 'A', 'overseer-launch.mjs')), ours = bundleAt(join(deep, 'B', 'overseer-launch.mjs'));
        const helper = await waitingHelper(theirs);
        expect(helper.command.slice(0, 300)).toBe(`${process.execPath} ${ours} --group ${helper.id}`.slice(0, 300));
        const { world, run } = launchedWith('record', { seed: world => seedState(world, registered(helper)), launch: { launcherFile: ours } });
        for (let tick = 0; tick < 2; tick++) expect(await run()).toBe(0);
        expect(alive(helper.pid)).toBe(true);
        const state = readState(world.root);
        expect(state.current).toMatchObject({ id: helper.id, observation: { reason: expect.stringContaining('not this attempt’s helper') } });
        expect(state.current.observation.members[0].command).toBe(helper.command.slice(0, 300));
        expect(state.counts).toMatchObject({ orphan: 0, lost: 0, success: 0 });
        expect(existsSync(join(world.root, 'evidence.json'))).toBe(false);
    }, 60_000);
});
