import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeAll, describe, expect, test } from 'vitest';
import { alive, killOwned, launch, launchedWith, loadLauncher, loaded, owned, pids, quiet, readState, registered, seedState, until, waitingHelper } from './launch-processes';
import { FAST, LAUNCHER, launchEnv, layout, release, writePin, type Behavior } from './launch-world';

beforeAll(loadLauncher);
afterEach(killOwned);

describe.skipIf(process.platform !== 'darwin')('the launcher with real processes', () => {
    test('a pass runs from the pinned release with only its own environment, and success resets the consecutive count', async () => {
        const { world, built, run } = launchedWith('record', { seed: world => seedState(world, null, { consecutiveFailures: 3 }) });
        expect(await run()).toBe(0);
        expect(readState(world.root)).toMatchObject({ current: null, consecutiveFailures: 0, counts: { success: 1 }, last: { kind: 'success', outcome: 'idle', exit: { code: 0, signal: null } } });
        const evidence = JSON.parse(readFileSync(join(world.root, 'evidence.json'), 'utf8'));
        expect(evidence.cwd).toBe(built.directory);
        expect(evidence.argv).toEqual([join(built.directory, 'server/overseer.ts'), 'pass']);
        // macOS gives every process __CF_USER_TEXT_ENCODING itself; nothing else may come from the launcher's environment.
        expect(Object.keys(evidence.env).filter(key => key !== '__CF_USER_TEXT_ENCODING').sort()).toEqual(['HOME', 'NODE_ENV', 'OVERSEER_ROOT', 'PATH']);
        expect(evidence.env).toMatchObject({ OVERSEER_ROOT: world.root, NODE_ENV: 'production' });
        const { world: other, run: withUrl } = launchedWith('record', { env: { OVERSEER_OFFICE_URL: 'http://localhost:5000/' } });
        await withUrl();
        expect(JSON.parse(readFileSync(join(other.root, 'evidence.json'), 'utf8')).env.OVERSEER_OFFICE_URL).toBe('http://localhost:5000');
    }, 60_000);

    test('each way a pass ends is classified once its group is gone', async () => {
        const cases: [Behavior, string, number][] = [
            [{ exit: 2 }, 'startup', 1], [{ exit: 3 }, 'locked', 0], [{ exit: 1 }, 'exit', 1], [{ exit: 7 }, 'exit', 1], [{ exit: 0 }, 'exit', 1],
            ['no-markers-exit-1', 'exit', 1], ['bootstrap-then-exit-1', 'startup', 1],
        ];
        for (const [behavior, kind, consecutive] of cases) {
            const { world, run } = launchedWith(behavior);
            expect(await run(), JSON.stringify(behavior)).toBe(0);
            expect(readState(world.root), JSON.stringify(behavior)).toMatchObject({ current: null, consecutiveFailures: consecutive, last: { kind } });
        }
    }, 120_000);

    test('a pass past its deadline is counted as a hang, and its whole group, grandchild included, is stopped and confirmed gone', async () => {
        const { world, run } = launchedWith('hang', { deadlineMs: 1_500 });
        const started = Date.now();
        expect(await run()).toBe(0);
        const grandchild = Number(readFileSync(join(world.root, 'grandchild.pid'), 'utf8'));
        expect(alive(grandchild)).toBe(false);
        const state = readState(world.root);
        expect(state).toMatchObject({ current: null, counts: { hang: 1 }, consecutiveFailures: 1 });
        expect(state.recent.filter((record: { kind: string }) => record.kind === 'hang')).toHaveLength(1);
        expect(Date.now() - started).toBeLessThan(15_000);
    }, 60_000);

    test('a pass that exits with a valid record while a TERM-resistant child holds its pipes is a success once that child is killed, well before its deadline', async () => {
        const { world, run } = launchedWith('record-with-stubborn-child', { deadlineMs: 30_000, seed: world => seedState(world, null, { consecutiveFailures: 2 }) });
        const started = Date.now();
        expect(await run()).toBe(0);
        // The stop starts as soon as the pass exits: well inside the 8 s a lone helper would be given to leave.
        expect(Date.now() - started).toBeLessThan(7_000);
        expect(alive(Number(readFileSync(join(world.root, 'grandchild.pid'), 'utf8')))).toBe(false);
        expect(readState(world.root)).toMatchObject({ current: null, consecutiveFailures: 0, counts: { success: 1, hang: 0 } });
    }, 60_000);

    test('a recorded helper still running is ours: it is stopped and counted once as an orphan before the next pass', async () => {
        const helper = await waitingHelper();
        const { world, run } = launchedWith('record', { seed: world => seedState(world, registered(helper)) });
        expect(await run()).toBe(0);
        expect(alive(helper.pid)).toBe(false);
        expect(readState(world.root)).toMatchObject({ current: null, counts: { orphan: 1, success: 1 } });
    }, 60_000);

    test('a recorded group whose leader is not this attempt’s helper is left alone and blocks every pass', async () => {
        const sentinel = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { detached: true, stdio: 'ignore' });
        owned.push(sentinel);
        await until(() => alive(sentinel.pid!));
        const identity = { id: randomUUID(), pid: sentinel.pid!, start: 'Thu Nov 26 03:00:00 2026' };
        const { world, run } = launchedWith('record', { seed: world => seedState(world, registered(identity)) });
        for (let tick = 0; tick < 3; tick++) expect(await run()).toBe(0);
        expect(alive(sentinel.pid!)).toBe(true);
        const state = readState(world.root);
        expect(state.current).toMatchObject({ pid: sentinel.pid, observation: { reason: expect.stringContaining('not this attempt’s helper') } });
        expect(state.counts).toMatchObject({ success: 0, orphan: 0, lost: 0 });
        expect(existsSync(join(world.root, 'evidence.json'))).toBe(false);
    }, 60_000);

    test('a recorded group already gone is counted once as lost; an unregistered start blocks for a person', async () => {
        const gone = spawn(process.execPath, ['-e', ''], { stdio: 'ignore' });
        await new Promise(done => gone.once('exit', done));
        const { world, run } = launchedWith('record', { seed: world => seedState(world, registered({ id: randomUUID(), pid: gone.pid!, start: 'Thu Nov 26 03:00:00 2026' })) });
        expect(await run()).toBe(0);
        expect(readState(world.root)).toMatchObject({ current: null, counts: { lost: 1, success: 1 } });
        const starting = { ...registered({ id: randomUUID(), pid: 0, start: '' }), phase: 'starting', pid: null, pgid: null, start: null };
        const { world: blocked, run: again } = launchedWith('record', { seed: world => seedState(world, starting) });
        expect(await again()).toBe(0);
        expect(await again()).toBe(0);
        expect(readState(blocked.root)).toMatchObject({ current: { phase: 'starting', observation: { reason: expect.stringContaining('before its helper was registered') } }, counts: { success: 0 } });
    }, 60_000);

    test('an earlier pass is recovered before the next configuration is checked, and a counted hang is never counted again', async () => {
        const helper = await waitingHelper();
        const { world, run } = launchedWith('record', { env: { OVERSEER_PASS_DEADLINE_MS: 'never' }, seed: world => seedState(world, registered(helper)) });
        expect(await run()).toBe(0);
        expect(alive(helper.pid)).toBe(false);
        expect(readState(world.root)).toMatchObject({ current: null, counts: { orphan: 1, config: 1 } });
        const hung = await waitingHelper();
        const hangRecord = { id: hung.id, kind: 'hang', startedAt: '2026-11-26T08:00:00.000Z', durationMs: 1, exit: null, outcome: null, detail: 'passed its deadline' };
        const seeded = { counts: { ...loaded.contract.emptyState().counts, hang: 1 }, consecutiveFailures: 1, last: hangRecord, recent: [hangRecord] };
        const { world: replay, run: tick } = launchedWith('record', { seed: world => seedState(world, registered(hung, { counted: 'hang' }), seeded) });
        expect(await tick()).toBe(0);
        const state = readState(replay.root);
        expect(state.counts).toMatchObject({ hang: 1, orphan: 0, lost: 0, success: 1 });
        expect(state.recent.filter((record: { id: string }) => record.id === hung.id)).toHaveLength(1);
    }, 60_000);

    test('two launchers at once: the second leaves the first and its state alone', async () => {
        const { world, run } = launchedWith('record-with-stubborn-child');
        const first = run();
        await until(() => existsSync(join(world.root, 'control/launcher.lock')));
        const warnings: string[] = [];
        expect(await launch({ env: launchEnv(world), limits: FAST, noSignalHandlers: true, log: () => {}, warn: (line: string) => warnings.push(line) })).toBe(0);
        expect(warnings.join('\n')).toContain('holds the lock');
        expect(await first).toBe(0);
        expect(readState(world.root).counts).toMatchObject({ success: 1 });
    }, 60_000);

    test('a launcher asked to stop stops its pass’s group, TERM-resistant child included, and records it interrupted', async () => {
        const world = layout(), built = release(world.officeData, 'hang');
        writePin(world.root, built);
        const launcher = spawn(process.execPath, [LAUNCHER], { env: launchEnv(world, { OVERSEER_PASS_DEADLINE_MS: '60000' }), stdio: 'ignore' });
        await until(() => existsSync(join(world.root, 'grandchild.pid')));
        const grandchild = Number(readFileSync(join(world.root, 'grandchild.pid'), 'utf8'));
        pids.push(grandchild);
        launcher.kill('SIGTERM');
        await new Promise(done => launcher.once('exit', done));
        expect(alive(grandchild)).toBe(false);
        expect(readState(world.root)).toMatchObject({ current: null, counts: { interrupted: 1, hang: 0 }, consecutiveFailures: 0 });
    }, 60_000);

    test('a launcher that dies while its stop waits out TERM leaves the helper to escalate: the group is gone and counted once', async () => {
        const world = layout(), built = release(world.officeData, 'hang');
        writePin(world.root, built);
        const launcher = spawn(process.execPath, [LAUNCHER], { env: launchEnv(world, { OVERSEER_PASS_DEADLINE_MS: '60000' }), stdio: 'ignore' });
        await until(() => existsSync(join(world.root, 'grandchild.pid')));
        const grandchild = Number(readFileSync(join(world.root, 'grandchild.pid'), 'utf8'));
        pids.push(grandchild);
        const { id, pid: helperPid } = readState(world.root).current;
        // The launcher sends TERM to the group and waits; the helper waits with it; the grandchild ignores TERM.
        launcher.kill('SIGTERM');
        await new Promise(done => setTimeout(done, 1_000));
        launcher.kill('SIGKILL');
        await new Promise(done => launcher.once('exit', done));
        expect(await until(() => !alive(grandchild) && !alive(helperPid), 25_000)).toBe(true);
        // Recovery comes before configuration: with a bad deadline, the next launch only settles the attempt.
        expect(await launch({ env: launchEnv(world, { OVERSEER_PASS_DEADLINE_MS: 'never' }), limits: FAST, ...quiet })).toBe(0);
        const state = readState(world.root);
        expect(state).toMatchObject({ current: null, counts: { lost: 1, interrupted: 0, config: 1 } });
        expect(state.recent.filter((record: { id: string }) => record.id === id)).toHaveLength(1);
    }, 60_000);

    test('a helper whose launcher dies stops its own group; before authorization it just leaves', async () => {
        const world = layout(), built = release(world.officeData, 'hang');
        writePin(world.root, built);
        const launcher = spawn(process.execPath, [LAUNCHER], { env: launchEnv(world, { OVERSEER_PASS_DEADLINE_MS: '60000' }), stdio: 'ignore' });
        await until(() => existsSync(join(world.root, 'grandchild.pid')));
        const grandchild = Number(readFileSync(join(world.root, 'grandchild.pid'), 'utf8'));
        pids.push(grandchild);
        const helperPid = readState(world.root).current.pid;
        launcher.kill('SIGKILL');
        expect(await until(() => !alive(grandchild) && !alive(helperPid), 20_000)).toBe(true);
        // The next launch finds the attempt gone and counts it once.
        expect(await launch({ env: launchEnv(world, { OVERSEER_PASS_DEADLINE_MS: '1000' }), limits: FAST, ...quiet })).toBe(0);
        expect(readState(world.root).counts).toMatchObject({ lost: 1 });
        const waiting = await waitingHelper();
        waiting.child.disconnect();
        expect(await until(() => !alive(waiting.pid))).toBe(true);
    }, 60_000);
});
