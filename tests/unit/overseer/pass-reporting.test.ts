import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { afterEach, expect, test } from 'vitest';
import { RUNNER_INCIDENT } from '../../../server/incidents/record-runner-failure';
import { RUNNER_DEFAULTS, type RunnerPaths } from '../../../server/overseer/config';
import { appendFailureLine, failureLine } from '../../../server/overseer/failure-journal';
import { pauseRunner, writeRunnerStop } from '../../../server/overseer/kill-switch';
import { officeReader } from '../../../server/overseer/office-client';
import { officeWriter } from '../../../server/overseer/office-writer';
import { runPass, type PassReporting } from '../../../server/overseer/pass';
import { ensurePrivateDirectory } from '../../../server/overseer/runner-root';
import { acquirePassLock, PassRefused } from '../../../server/overseer/single-flight';
import { failure, officeWorld, ORIGIN, runnerStore, type OfficeWorld } from './forward-world';
import { machine, runnerRoot, tempDir } from './runner-world';

const open: { close(): void }[] = [];
afterEach(() => open.splice(0).forEach(item => item.close()));

/** A pass that reports to the given Office, with its private Store in its own folder. */
function reporting(world: OfficeWorld, over: Partial<PassReporting> & { request?: typeof fetch } = {}) {
    const directory = tempDir(), opened: number[] = [];
    const { request = world.request, ...rest } = over;
    const value: PassReporting = {
        origin: ORIGIN,
        openStore: async () => { const store = runnerStore(directory); open.push(store); opened.push(1); return { effects: store.effects, db: store.store.db, close: store.close }; },
        writer: remaining => officeWriter(ORIGIN, request, RUNNER_DEFAULTS, remaining),
        reader: remaining => officeReader(ORIGIN, request, RUNNER_DEFAULTS, remaining),
        monotonic: () => performance.now(), launched: false, parent: 1, ...rest,
    };
    return { value, opened };
}
const journal = (paths: RunnerPaths, ...events: ReturnType<typeof failure>[]) => {
    ensurePrivateDirectory(paths.journal);
    for (const event of events) appendFailureLine(paths, failureLine(event), 1000);
};
const forwarded = (world: OfficeWorld) => world.incidents.events(RUNNER_INCIDENT).filter(event => event.kind === 'runner-failure').map(event => event.id);

test('while STOP holds, and while paused, the journal is still forwarded and the condition reported, and nothing is observed', async () => {
    for (const hold of ['stop', 'pause'] as const) {
        const paths = runnerRoot(), world = officeWorld(), down = failure('service-down');
        journal(paths, down);
        ensurePrivateDirectory(paths.control);
        if (hold === 'stop') writeRunnerStop(paths, { reason: 'held by Joe', instruction: 'remove it' }); else pauseRunner(paths, 'held by Joe');
        const result = await runPass(machine(paths, officeReader(ORIGIN, world.request), { reporting: reporting(world).value }));
        expect(result).toMatchObject({ status: 'recorded', record: { outcome: hold === 'stop' ? 'stopped' : 'paused', detail: expect.stringContaining('Forwarded 1 of 1') } });
        expect(forwarded(world)).toEqual([down.id]);
        expect(world.runnerReports.halt()).toMatchObject({ kind: hold === 'stop' ? 'stopped' : 'paused' });
        expect(world.requests.filter(line => line.includes('/api/incidents?research=1'))).toEqual([]);
        expect(JSON.parse(readFileSync(paths.forwarding, 'utf8'))).toMatchObject({ state: 'complete', forwarded: 1, pending: 0, halt: { confirmed: { kind: hold === 'stop' ? 'stopped' : 'paused' } } });
    }
});

test('runner state that cannot be read still forwards a valid journal, reports the STOP it writes in the same pass, and leaves the state file as it was', async () => {
    const paths = runnerRoot(), world = officeWorld(), down = failure('service-down');
    journal(paths, down);
    ensurePrivateDirectory(paths.state);
    writeFileSync(paths.runnerState, '{"version": 9}');
    const result = await runPass(machine(paths, officeReader(ORIGIN, world.request), { reporting: reporting(world).value }));
    expect(result).toMatchObject({ record: { outcome: 'stopped' } });
    expect(readFileSync(paths.runnerState, 'utf8')).toBe('{"version": 9}');
    expect(forwarded(world)).toEqual([down.id]);
    expect(world.runnerReports.halt()).toMatchObject({ kind: 'stopped', control: 'STOP.json' });
});

test('a pass another pass has locked opens no Store, sends nothing and writes no summary; one whose Store is refused still observes and says so', async () => {
    const paths = runnerRoot(), world = officeWorld(), locked = reporting(world);
    ensurePrivateDirectory(paths.control);
    const other = acquirePassLock(paths, '00000000-0000-4000-8000-000000000009', { pid: process.pid, alive: () => true, now: () => new Date() });
    try { expect(await runPass(machine(paths, officeReader(ORIGIN, world.request), { reporting: locked.value, alive: () => true }))).toMatchObject({ status: 'locked' }); }
    finally { other.release(); }
    expect([locked.opened, world.requests, existsSync(paths.forwarding)]).toEqual([[], [], false]);
    const refused = reporting(world, { openStore: () => Promise.reject(new Error('The runner Store opens only in the dedicated runner directory')) });
    const result = await runPass(machine(paths, officeReader(ORIGIN, world.request), { reporting: refused.value }));
    expect(result).toMatchObject({ record: { outcome: 'idle', detail: expect.stringContaining('Forwarding unavailable: The runner Store opens only') } });
    expect(world.posts()).toEqual([]);
});

test('the pass lock is held until the halt report and the record are saved', async () => {
    const paths = runnerRoot(), world = officeWorld();
    let release: () => void = () => {}, reached: () => void = () => {}, held = false;
    const reading = new Promise<void>(done => { reached = done; });
    const request: typeof fetch = async (input, init) => {
        if (String(input).endsWith('/api/incidents/runner/halt') && (init?.method ?? 'GET') === 'GET' && !held) { held = true; reached(); await new Promise<void>(done => { release = done; }); }
        return world.request(input, init);
    };
    const pass = runPass(machine(paths, officeReader(ORIGIN, request), { reporting: reporting(world, { request }).value }));
    await reading;
    expect(() => acquirePassLock(paths, '00000000-0000-4000-8000-000000000008', { pid: process.pid, alive: () => true, now: () => new Date() })).toThrow(PassRefused);
    release();
    expect(await pass).toMatchObject({ status: 'recorded' });
    acquirePassLock(paths, '00000000-0000-4000-8000-000000000008', { pid: process.pid, alive: () => true, now: () => new Date() }).release();
});

test('a pass the launcher started, whose registered deadline cannot be read, observes and defers its reports', async () => {
    const paths = runnerRoot(), world = officeWorld(), launched = reporting(world, { launched: true, parent: 4242 });
    journal(paths, failure('service-down'));
    const result = await runPass(machine(paths, officeReader(ORIGIN, world.request), { reporting: launched.value }));
    expect(result).toMatchObject({ record: { outcome: 'idle', detail: expect.stringContaining('Reporting deferred') } });
    expect([launched.opened, world.posts()]).toEqual([[], []]);
    expect(JSON.parse(readFileSync(paths.forwarding, 'utf8'))).toMatchObject({ state: 'complete', forwarded: null, pending: null, halt: null });
});
