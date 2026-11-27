import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, beforeAll, describe, expect, test } from 'vitest';
import { alive, killOwned, launch, launchedWith, loadLauncher, loaded, quiet, readState, registered, seedState, trackGrandchild, trackProcess, until, waitingHelper } from './launch-processes';
import { FAST, LAUNCHER, LAUNCHER_SOURCES, launchEnv, layout, release, writePin, type Behavior } from './launch-world';
import { tempDir } from './runner-world';

beforeAll(loadLauncher);
afterEach(() => killOwned());

const groupGone = (pid: number) => loaded.group.probeGroup(loaded.group.defaultSystem(), pid, pid) === 'absent';

/**
 * The production helper with only its drain clock or TERM inventory made controllable, or, in
 * `send-error`, its final exit report failing the way Node reports a write on a closing channel.
 */
async function observedHelper(world: ReturnType<typeof layout>, behavior: Behavior, observation: 'drain' | 'term' | 'send-error') {
    const built = release(world.officeData, behavior, { captureParent: false });
    const file = join(tempDir(), 'observed-helper.mjs');
    const source = (name: string) => JSON.stringify(pathToFileURL(join(LAUNCHER_SOURCES, name + '.mjs')).href);
    writeFileSync(file, `import { readFileSync } from 'node:fs';
import { helperMain } from ${source('helper')};
import { defaultSystem } from ${source('process-group')};
import { LIMITS } from ${source('limits')};
const system = defaultSystem();
let inspections = 0, clock = 0;
const inventory = () => {
    const pid = process.pid, start = 'Thu Nov 26 03:00:00 2026';
    let stdout = \`\${pid} \${pid} \${start} node helper\\n\`;
    try {
        const descendant = Number(readFileSync(process.argv[5] + '/grandchild.pid', 'utf8'));
        if (Number.isSafeInteger(descendant) && descendant > 1) {
            process.kill(descendant, 0);
            stdout += \`\${descendant} \${pid} \${start} node fixture\\n\`;
        }
    } catch { /* the fixture descendant has left */ }
    return { ok: true, code: 0, stdout };
};
if (process.argv[4] === 'send-error') {
    // The final report fails with EPIPE while the channel stays connected: to the callback if one is
    // given, otherwise as an error event on the process, as Node does. Once that delivery returns,
    // the real channel says so.
    const real = process.send.bind(process);
    process.send = (message, ...rest) => {
        if (message?.type !== 'exit') return real(message, ...rest);
        const callback = rest.find(argument => typeof argument === 'function');
        process.nextTick(() => {
            const error = Object.assign(new Error('write EPIPE'), { code: 'EPIPE' });
            if (callback) callback(error); else process.emit('error', error);
            setImmediate(() => real({ type: 'send-failed', callback: Boolean(callback) }));
        });
        return true;
    };
}
const hooks = process.argv[4] === 'send-error' ? {} : process.argv[4] === 'drain' ? {
    ps: inventory,
    sleep: ms => {
        if (ms !== LIMITS.drainMs) return system.sleep(ms);
        process.send({ type: 'draining' });
        return system.sleep(8_000);
    },
} : {
    monotonic: () => clock,
    sleep: async ms => { clock += LIMITS.termGraceMs + LIMITS.absenceWaitMs; await system.sleep(ms); },
    ps: () => {
        const check = ++inspections;
        if (check === 1) return { ok: true, code: 1, stdout: '' };
        if (check === 2) setImmediate(() => process.send?.({ type: 'term-wait-ended' }));
        return inventory();
    },
};
await helperMain(process.argv[3], { ...system, ...hooks });`);
    const child = spawn(process.execPath, [file, '--group', randomUUID(), observation, world.root], { detached: true, stdio: ['ignore', 'ignore', 'ignore', 'ipc'] });
    const messages: { type: string; code?: number; signal?: string | null; stdout?: string; callback?: boolean }[] = [];
    child.on('message', received => messages.push(received as typeof messages[number]));
    const waitFor = async (type: string) => {
        const received = () => messages.find(message => message.type === type);
        expect(await until(() => Boolean(received()) || child.exitCode !== null || child.signalCode !== null), type).toBe(true);
        expect(received(), type).toBeDefined();
        return received()!;
    };
    await trackProcess(child, true);
    await waitFor('ready');
    child.send({ type: 'authorize', directory: built.directory, entry: join(built.directory, 'server/overseer.ts'), env: launchEnv(world) });
    return { child, messages, waitFor };
}

test('fixture teardown skips reused or unconfirmed identities and forgets completed fixtures', async () => {
    const make = () => spawn(process.execPath, ['-e', "process.on('disconnect', () => process.exit(0))"], {
        detached: true, stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
    });
    const reusedGroup = make(), reusedPid = make(), unknown = make(), matching = make(), completed = make();
    const fixtures = [reusedGroup, reusedPid, unknown, matching, completed];
    const start = 'Thu Nov 26 03:00:00 2026';
    const identity = (pid: number, time = start, command = 'node fixture') => ({ ok: true, code: 0, stdout: `${pid} ${pid} ${time} ${command}\n` });
    try {
        const startup = { ps: async (args: string[]) => identity(Number(args.at(-1))) };
        for (const fixture of fixtures) expect(await trackProcess(fixture, fixture === reusedGroup || fixture === matching, startup)).not.toBeNull();
        const completedExit = once(completed, 'exit');
        completed.disconnect();
        await completedExit;
        const checked: number[] = [], signals: [number, NodeJS.Signals][] = [];
        const cleanup = {
            ps: async (args: string[]) => {
                const pid = Number(args.at(-1));
                checked.push(pid);
                if (pid === reusedGroup.pid) return identity(pid, 'Thu Nov 26 03:01:00 2026');
                if (pid === reusedPid.pid) return identity(pid, start, 'node unrelated');
                if (pid === unknown.pid) return { ok: false, code: null, stdout: '' };
                return identity(pid);
            },
            kill: (pid: number, signal: NodeJS.Signals) => signals.push([pid, signal]),
        };
        await killOwned(cleanup);
        expect(checked).toEqual([reusedGroup.pid, reusedPid.pid, unknown.pid, matching.pid]);
        expect(signals).toEqual([[-matching.pid!, 'SIGKILL']]);
        checked.length = 0;
        await killOwned(cleanup);
        expect(checked).toEqual([]);
    } finally {
        for (const fixture of fixtures) if (fixture.connected) fixture.disconnect();
    }
});

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

    test('the production helper sends exited while a descendant still holds its output pipes', async () => {
        const world = layout();
        const helper = await observedHelper(world, 'record-with-stubborn-child', 'drain');
        const releasePipes = join(world.root, 'release-pipes');
        try {
            await helper.waitFor('draining');
            const grandchild = await trackGrandchild(world.root);
            expect(alive(grandchild)).toBe(true);
            expect(helper.messages.some(message => message.type === 'exited')).toBe(true);
            expect(helper.messages.some(message => message.type === 'exit')).toBe(false);
            writeFileSync(releasePipes, '');
            const report = await helper.waitFor('exit');
            expect(report).toMatchObject({ code: 0, signal: null });
            expect(JSON.parse(report.stdout!.trim())).toMatchObject({ outcome: 'idle', officeDataRoot: join(world.root, 'state/office-data') });
            expect(await until(() => groupGone(helper.child.pid!))).toBe(true);
        } finally {
            writeFileSync(releasePipes, '');
            if (helper.child.connected) helper.child.disconnect();
        }
    }, 30_000);

    test('a helper stays the leader through an empty inventory and an expired TERM wait until disconnect stops its group', async () => {
        const world = layout();
        const helper = await observedHelper(world, 'hang', 'term');
        try {
            expect(await until(() => existsSync(join(world.root, 'grandchild.pid')))).toBe(true);
            const grandchild = await trackGrandchild(world.root);
            expect(helper.child.kill('SIGTERM')).toBe(true);
            await helper.waitFor('term-wait-ended');
            // The helper and a TERM-resistant fixture remain for the outside launcher to identify.
            expect(alive(helper.child.pid!)).toBe(true);
            expect(alive(grandchild)).toBe(true);
            helper.child.disconnect();
            expect(await until(() => groupGone(helper.child.pid!))).toBe(true);
            expect(alive(grandchild)).toBe(false);
        } finally {
            writeFileSync(join(world.root, 'release-pipes'), '');
            if (helper.child.connected) helper.child.disconnect();
            await until(() => groupGone(helper.child.pid!), 5_000);
        }
    }, 30_000);

    test('a TERM sent to a positively identified lone helper lets it leave promptly', async () => {
        const helper = await waitingHelper();
        expect(helper.child.kill('SIGTERM')).toBe(true);
        expect(await until(() => helper.child.exitCode !== null)).toBe(true);
        expect(helper.child.exitCode).toBe(143);
        expect(groupGone(helper.pid)).toBe(true);
    }, 20_000);

    test('a recorded helper still running is ours: it is stopped and counted once as an orphan before the next pass', async () => {
        const helper = await waitingHelper();
        const logs: string[] = [];
        const { world, run } = launchedWith('record', { seed: world => seedState(world, registered(helper)) });
        expect(await run({ log: (line: string) => logs.push(line) })).toBe(0);
        expect(alive(helper.pid)).toBe(false);
        expect(readState(world.root)).toMatchObject({ current: null, counts: { orphan: 1, success: 1 } });
        expect(logs.map(line => JSON.parse(line))).toEqual([expect.objectContaining({ kind: 'orphan', id: helper.id })]);
    }, 60_000);

    test('a recorded group whose leader is not this attempt’s helper is left alone and blocks every pass', async () => {
        const sentinel = spawn(process.execPath, ['-e', "process.on('disconnect', () => process.exit(0))"], { detached: true, stdio: ['ignore', 'ignore', 'ignore', 'ipc'] });
        try {
            expect(await trackProcess(sentinel, true)).not.toBeNull();
            await until(() => alive(sentinel.pid!));
            const identity = { id: randomUUID(), pid: sentinel.pid!, start: 'Thu Nov 26 03:00:00 2026' };
            const { world, run } = launchedWith('record', { seed: world => seedState(world, registered(identity)) });
            for (let tick = 0; tick < 3; tick++) expect(await run()).toBe(0);
            expect(alive(sentinel.pid!)).toBe(true);
            const state = readState(world.root);
            expect(state.current).toMatchObject({ pid: sentinel.pid, observation: { reason: expect.stringContaining('not this attempt’s helper') } });
            expect(state.counts).toMatchObject({ success: 0, orphan: 0, lost: 0 });
            expect(existsSync(join(world.root, 'evidence.json'))).toBe(false);
        } finally {
            if (sentinel.connected) sentinel.disconnect();
        }
    }, 60_000);

    test('a recorded group already gone is counted once as lost; an unregistered start blocks for a person', async () => {
        const gone = spawn(process.execPath, ['-e', ''], { stdio: 'ignore' });
        await new Promise(done => gone.once('exit', done));
        const lost = { id: randomUUID(), pid: gone.pid!, start: 'Thu Nov 26 03:00:00 2026' };
        const logs: string[] = [];
        const { world, run } = launchedWith('record', { seed: world => seedState(world, registered(lost)) });
        expect(await run({ log: (line: string) => logs.push(line) })).toBe(0);
        expect(readState(world.root)).toMatchObject({ current: null, counts: { lost: 1, success: 1 } });
        expect(logs.map(line => JSON.parse(line))).toEqual([expect.objectContaining({ kind: 'lost', id: lost.id })]);
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
        const logs: string[] = [];
        expect(await tick({ log: (line: string) => logs.push(line) })).toBe(0);
        const state = readState(replay.root);
        expect(state.counts).toMatchObject({ hang: 1, orphan: 0, lost: 0, success: 1 });
        expect(state.recent.filter((record: { id: string }) => record.id === hung.id)).toHaveLength(1);
        expect(logs).toEqual([]);
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
        await trackProcess(launcher);
        await until(() => existsSync(join(world.root, 'grandchild.pid')));
        const grandchild = await trackGrandchild(world.root);
        launcher.kill('SIGTERM');
        await new Promise(done => launcher.once('exit', done));
        expect(alive(grandchild)).toBe(false);
        expect(readState(world.root)).toMatchObject({ current: null, counts: { interrupted: 1, hang: 0 }, consecutiveFailures: 0 });
    }, 60_000);

    test('a launcher that dies while its stop waits out TERM leaves the helper to escalate: the group is gone and counted once', async () => {
        const world = layout(), built = release(world.officeData, 'hang');
        writePin(world.root, built);
        const launcher = spawn(process.execPath, [LAUNCHER], { env: launchEnv(world, { OVERSEER_PASS_DEADLINE_MS: '60000' }), stdio: 'ignore' });
        await trackProcess(launcher);
        await until(() => existsSync(join(world.root, 'grandchild.pid')));
        const grandchild = await trackGrandchild(world.root);
        const { id, pid: helperPid } = readState(world.root).current;
        // The launcher sends TERM to the group and waits; the helper waits with it; the grandchild ignores TERM.
        launcher.kill('SIGTERM');
        await new Promise(done => setTimeout(done, 1_000));
        launcher.kill('SIGKILL');
        await new Promise(done => launcher.once('exit', done));
        // Each poll keeps what it saw, so a recurrence says which process outlived the window.
        let last = { grandchild: true, helper: true };
        const gone = await until(() => { last = { grandchild: alive(grandchild), helper: alive(helperPid) }; return !last.grandchild && !last.helper; }, 25_000);
        expect(gone, `after 25 s: grandchild ${grandchild} alive ${last.grandchild}, helper ${helperPid} alive ${last.helper}`).toBe(true);
        // Recovery comes before configuration: with a bad deadline, the next launch only settles the attempt.
        expect(await launch({ env: launchEnv(world, { OVERSEER_PASS_DEADLINE_MS: 'never' }), limits: FAST, ...quiet })).toBe(0);
        const state = readState(world.root);
        expect(state).toMatchObject({ current: null, counts: { lost: 1, interrupted: 0, config: 1 } });
        expect(state.recent.filter((record: { id: string }) => record.id === id)).toHaveLength(1);
    }, 60_000);

    test('a failed exit report leaves the helper able to stop its group on disconnect', async () => {
        const world = layout(), { child, messages } = await observedHelper(world, 'record-with-stubborn-child', 'send-error');
        const helperPid = child.pid!;
        try {
            expect(await until(() => existsSync(join(world.root, 'grandchild.pid')))).toBe(true);
            const grandchild = await trackGrandchild(world.root);
            // The pass exits by itself; its TERM-resistant descendant keeps the pipes, so the report follows the drain.
            const delivered = () => messages.find(message => message.type === 'send-failed');
            await until(() => Boolean(delivered()) || child.exitCode !== null || child.signalCode !== null, 10_000);
            expect(delivered(), `the helper ended (code ${child.exitCode}, signal ${child.signalCode}) before its failed report was delivered; grandchild ${grandchild} alive ${alive(grandchild)}`).toBeDefined();
            expect(delivered()!.callback).toBe(true);
            expect(child.connected).toBe(true);
            expect([alive(helperPid), alive(grandchild)]).toEqual([true, true]);
            // The launcher goes away: the helper stops its own group, TERM-resistant child included.
            child.disconnect();
            expect(await until(() => groupGone(helperPid) && !alive(helperPid) && !alive(grandchild), 25_000)).toBe(true);
        } finally {
            writeFileSync(join(world.root, 'release-pipes'), '');
            if (child.connected) child.disconnect();
            await until(() => child.exitCode !== null || child.signalCode !== null, 5_000);
        }
    }, 60_000);

    test('a helper whose launcher dies stops its own group; before authorization it just leaves', async () => {
        const world = layout(), built = release(world.officeData, 'hang');
        writePin(world.root, built);
        const launcher = spawn(process.execPath, [LAUNCHER], { env: launchEnv(world, { OVERSEER_PASS_DEADLINE_MS: '60000' }), stdio: 'ignore' });
        await trackProcess(launcher);
        await until(() => existsSync(join(world.root, 'grandchild.pid')));
        const grandchild = await trackGrandchild(world.root);
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
