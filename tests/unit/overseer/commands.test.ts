import { execFile } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { promisify } from 'node:util';
import { expect, test } from 'vitest';
import { claudeCost } from '../../../server/telemetry/run-cost';
import { admit, admitDeployment, bindEvidence, settle } from '../../../server/overseer/budget-ledger';
import { budgetRequest } from '../../../server/overseer/budget-policy';
import { overseerCommand, resolveCliRoot } from '../../../server/overseer/commands';
import { runnerPaths } from '../../../server/overseer/config';
import { writeRunnerStop } from '../../../server/overseer/kill-switch';
import { defaultRunnerRoot, physicalPath } from '../../../server/overseer/runner-root';
import { incidentId, snapshot, tempDir } from './runner-world';

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
    const id = '00000000-0000-4000-8000-000000000001';
    for (const args of [[], ['stop'], ['status', 'x'], ['pause', '--reason'], ['pause', '--reason', ' '], ['pause', 'x', 'y'], ['unpause', '--all'],
        ['reconcile-budget'], ['reconcile-budget', id, '--reason', 'x'], ['reconcile-budget', id, '--expected-micro-usd', '5'], ['reconcile-budget', id, '--expected-micro-usd', '5', '--reason', ' '],
        ['reconcile-budget', id, '--expected-micro-usd', '-5', '--reason', 'x'], ['reconcile-budget', 'not-an-id', '--expected-micro-usd', '5', '--reason', 'x'], ['reconcile-budget', id, '--expected-micro-usd', '5', '--reason', 'x', '--all']])
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

const now = () => new Date('2026-11-25T17:00:00.000Z');
const statusOf = async (env: NodeJS.ProcessEnv) => {
    const { code, output } = await command(['status'], env);
    expect(code).toBe(0);
    return JSON.parse(output);
};

test("status shows the billing mode and today's budget standing, reading the ledger without changing anything", async () => {
    const root = join(tempDir(), 'runner'), env = { OVERSEER_ROOT: root }, paths = runnerPaths(root);
    expect(await statusOf(env)).toMatchObject({
        billing: { mode: 'subscription-logins', dedicatedApiKeys: false, accountBackstop: { status: 'not-configured' } },
        budget: { day: '2026-11-25', ceiling: 100_000_000, finalized: 0, unresolved: 0, available: 100_000_000, runs: { used: 0, limit: 24 }, overruns: [] },
    });
    const fix = admit(paths, budgetRequest(incidentId(1), 'fix', 1), { now });
    if (!fix.admitted) throw new Error(fix.code);
    admitDeployment(paths, 'deploy-1', { now });
    const before = snapshot(root);
    expect((await statusOf(env)).budget).toMatchObject({ unresolved: 22_500_000, available: 77_500_000, runs: { used: 1 }, fixRounds: { used: 1 }, deployments: { used: 1 } });
    expect(snapshot(root)).toEqual(before);
    mkdirSync(paths.control, { recursive: true });
    writeFileSync(paths.budgetConfig, '{"version":1,"dailyCeilingMicroUsd":0}');
    expect((await statusOf(env)).budget).toMatchObject({ ceiling: null, ceilingUnreadable: true, available: 0, unresolved: 22_500_000 });
});

test('status reports a ledger it must not read as unreadable, and leaves it exactly as it was', async () => {
    const wal = join(tempDir(), 'runner'), walPaths = runnerPaths(wal);
    mkdirSync(walPaths.state, { recursive: true });
    const db = new DatabaseSync(walPaths.budgetDb);
    db.exec('PRAGMA journal_mode=WAL; CREATE TABLE t (x)');
    db.close();
    const walBefore = snapshot(wal);
    expect((await statusOf({ OVERSEER_ROOT: wal })).budget).toEqual({ unreadable: expect.stringContaining('not a rollback-journal database') });
    expect(snapshot(wal)).toEqual(walBefore);

    const hot = join(tempDir(), 'runner'), hotPaths = runnerPaths(hot);
    admitDeployment(hotPaths, 'create-the-ledger', { now });
    await run(process.execPath, ['--import', 'tsx', resolve(__dirname, 'ledger-child.mts'), 'hot-journal', hot], { timeout: 60_000 }).catch(error => error);
    const hotBefore = snapshot(hot);
    expect(hotBefore).toHaveProperty('/state/budget.sqlite-journal');
    expect((await statusOf({ OVERSEER_ROOT: hot })).budget).toEqual({ unreadable: expect.stringContaining('journal-present') });
    expect(snapshot(hot)).toEqual(hotBefore);
    // The next write rolls the interrupted one back.
    expect(admitDeployment(hotPaths, 'after', { now })).toMatchObject({ admitted: true });
    expect((await statusOf({ OVERSEER_ROOT: hot })).budget).toMatchObject({ deployments: { used: 2 } });

    const damaged = join(tempDir(), 'runner'), damagedPaths = runnerPaths(damaged);
    mkdirSync(damagedPaths.state, { recursive: true });
    writeFileSync(damagedPaths.budgetDb, 'not a database at all, but long enough to have a header of a hundred bytes or more, which it does now.');
    expect((await statusOf({ OVERSEER_ROOT: damaged })).budget).toEqual({ unreadable: 'damaged: not an SQLite database' });
}, 60_000);

test('reconcile-budget acknowledges an overrun at the amount shown, once, and refuses a stale amount or the wrong state', async () => {
    const root = join(tempDir(), 'runner'), env = { OVERSEER_ROOT: root }, paths = runnerPaths(root);
    const missing = await command(['reconcile-budget', '00000000-0000-4000-8000-000000000001', '--expected-micro-usd', '1', '--reason', 'x'], env);
    expect(missing).toMatchObject({ code: 1, output: expect.stringContaining('There is no budget ledger') });
    const fix = admit(paths, budgetRequest(incidentId(1), 'fix', 1), { now });
    if (!fix.admitted) throw new Error(fix.code);
    const id = fix.reservation.id;
    expect(JSON.parse((await command(['reconcile-budget', id, '--expected-micro-usd', '22500000', '--reason', 'x'], env)).output)).toMatchObject({ reconciled: false, code: 'outstanding' });
    bindEvidence(paths, id, 's', { now });
    settle(paths, id, { evidenceId: 's', cost: claudeCost({ type: 'result', subtype: 'success', is_error: false, session_id: 's', total_cost_usd: 25, modelUsage: { m: { costUSD: 25, costBasis: 'list' } } }) }, { now });
    expect((await statusOf(env)).budget).toMatchObject({ available: 0, overruns: [{ id, reserved: 22_500_000, charged: 25_000_000, acknowledged: null }] });
    expect(await command(['reconcile-budget', id, '--expected-micro-usd', '24000000', '--reason', 'looked'], env)).toMatchObject({ code: 1, output: expect.stringContaining('stale-amount') });
    const done = await command(['reconcile-budget', id, '--expected-micro-usd', '25000000', '--reason', 'looked at the run'], env);
    expect(done.code).toBe(0);
    expect(JSON.parse(done.output)).toMatchObject({ reconciled: true, replay: false, row: { ack_micro_usd: 25_000_000, ack_reason: 'looked at the run' } });
    expect(JSON.parse((await command(['reconcile-budget', id, '--expected-micro-usd', '25000000', '--reason', 'again'], env)).output)).toMatchObject({ reconciled: true, replay: true });
    expect(JSON.parse((await command(['reconcile-budget', id, '--expected-micro-usd', '25000000', '--reason', 'already final', '--finalize'], env)).output)).toMatchObject({ reconciled: false, code: 'already-final' });
    expect((await statusOf(env)).budget).toMatchObject({ overruns: [], available: 75_000_000 });
});
