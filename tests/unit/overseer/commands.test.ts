import { execFile } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { expect, test } from 'vitest';
import { overseerCommand, resolveCliRoot } from '../../../server/overseer/commands';
import { runnerPaths } from '../../../server/overseer/config';
import { writeRunnerStop } from '../../../server/overseer/kill-switch';
import { defaultRunnerRoot, physicalPath } from '../../../server/overseer/runner-root';
import { snapshot, tempDir } from './runner-world';

const run = promisify(execFile);
const cli = resolve(__dirname, '../../../server/cli.ts'), recorder = resolve(__dirname, 'record-loads.mjs');

async function command(args: string[], env: NodeJS.ProcessEnv) {
    const lines: string[] = [];
    const code = await overseerCommand(args, { env, log: line => lines.push(line), now: () => new Date('2026-11-25T12:00:00.000Z') });
    return { code, output: lines.join('\n') };
}

test('the CLI root is OVERSEER_ROOT, or the default when it is unset; an empty or relative one is refused', async () => {
    const root = join(tempDir(), 'runner');
    expect(resolveCliRoot({ OVERSEER_ROOT: root }).root).toBe(root);
    expect(resolveCliRoot({}).root).toBe(physicalPath(defaultRunnerRoot()));
    for (const value of ['', 'runner']) {
        const { code, output } = await command(['status'], { OVERSEER_ROOT: value });
        expect(code, value).toBe(2);
        expect(output, value).toContain('must be an absolute path');
    }
    const office = tempDir();
    expect((await command(['pause'], { OVERSEER_ROOT: join(office, 'runner'), OFFICE_DATA_ROOT: office })).code).toBe(2);
});

test('an unknown verb or extra argument prints the usage', async () => {
    const env = { OVERSEER_ROOT: join(tempDir(), 'runner') };
    for (const args of [[], ['stop'], ['status', 'x'], ['pause', '--reason'], ['pause', '--reason', ' '], ['pause', 'x', 'y'], ['unpause', '--all']])
        expect((await command(args, env)).output, args.join(' ')).toContain('pnpm office overseer status');
});

test('status reads the runner files only and creates nothing, also for a root that does not exist', async () => {
    const base = tempDir(), env = { OVERSEER_ROOT: join(base, 'runner') }, before = snapshot(base);
    const { code, output } = await command(['status'], env);
    expect(code).toBe(0);
    expect(JSON.parse(output)).toMatchObject({ root: join(base, 'runner'), stop: { absent: true }, pause: { absent: true }, lock: { absent: true }, lockGuardLeft: false, state: { inFlight: null, lastPass: null }, journal: { events: 0 } });
    expect(snapshot(base)).toEqual(before);
    const paths = runnerPaths(join(base, 'runner'));
    mkdirSync(paths.state, { recursive: true });
    writeFileSync(paths.runnerState, '{');
    mkdirSync(paths.journal);
    writeFileSync(paths.failures, '{"cut');
    expect(JSON.parse((await command(['status'], env)).output)).toMatchObject({ state: { unreadable: 'not valid runner state' }, journal: { problem: expect.stringContaining('cut-short') } });
});

test('pause keeps the first reason, and unpause leaves STOP in place', async () => {
    const env = { OVERSEER_ROOT: join(tempDir(), 'runner') }, paths = runnerPaths(env.OVERSEER_ROOT);
    expect(JSON.parse((await command(['pause', '--reason', 'looking at CEC-154'], env)).output)).toMatchObject({ alreadyPaused: false, pause: { record: { reason: 'looking at CEC-154' } } });
    expect(JSON.parse((await command(['pause'], env)).output)).toMatchObject({ alreadyPaused: true, pause: { record: { reason: 'looking at CEC-154' } } });
    writeRunnerStop(paths, { reason: 'held', instruction: 'look' });
    const stop = readFileSync(paths.stop, 'utf8');
    expect(JSON.parse((await command(['unpause'], env)).output)).toMatchObject({ wasPaused: true, stillStopped: true });
    expect(JSON.parse((await command(['unpause'], env)).output)).toMatchObject({ wasPaused: false });
    expect(readFileSync(paths.stop, 'utf8')).toBe(stop);
});

test('through pnpm office, the controls work while Office configuration is broken, and never load it', async () => {
    const office = tempDir(), root = join(tempDir(), 'runner'), loads = join(tempDir(), 'loads.txt');
    // An Office configuration that fails to load: every ordinary command would stop here.
    writeFileSync(join(office, 'office-config.json'), '{');
    const { VITEST: _, VITEST_POOL_ID: __, VITEST_WORKER_ID: ___, ...inherited } = process.env;
    const env = { ...inherited, NODE_ENV: 'production', OFFICE_DATA_ROOT: office, OVERSEER_ROOT: root, OVERSEER_LOAD_LOG: loads };
    const office$ = (...args: string[]) => run(process.execPath, ['--import', 'tsx', '--import', recorder, cli, ...args], { env, encoding: 'utf8', timeout: 60_000 });
    await expect(office$('status')).rejects.toMatchObject({ stderr: expect.stringContaining('JSON') });
    writeFileSync(loads, '');
    expect(JSON.parse((await office$('overseer', 'pause', '--reason', 'by hand')).stdout)).toMatchObject({ pause: { record: { reason: 'by hand' } } });
    expect(JSON.parse((await office$('overseer', 'status')).stdout)).toMatchObject({ root, pause: { record: { reason: 'by hand' } } });
    expect(JSON.parse((await office$('overseer', 'unpause')).stdout)).toMatchObject({ wasPaused: true, stillStopped: false });
    const loaded = readFileSync(loads, 'utf8').split('\n').filter(url => url.includes('/server/') && !url.includes('node_modules'));
    expect(loaded.some(url => url.endsWith('/server/overseer/commands.ts'))).toBe(true);
    expect(loaded.filter(url => /\/server\/(office\/config|office\/local-config|scheduling|workers|store\/store)\b/.test(url))).toEqual([]);
    await expect(run(process.execPath, ['--import', 'tsx', cli, 'overseer', 'status'], { env: { ...env, OVERSEER_ROOT: 'relative' }, encoding: 'utf8', timeout: 60_000 })).rejects.toMatchObject({ code: 2 });
});
