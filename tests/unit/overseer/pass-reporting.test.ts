import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { afterEach, expect, test } from 'vitest';
import { RUNNER_INCIDENT } from '../../../server/incidents/record-runner-failure';
import { runnerStatus } from '../../../server/overseer/commands';
import { RUNNER_DEFAULTS, type RunnerPaths } from '../../../server/overseer/config';
import { appendFailureLine, failureLine, readFailures } from '../../../server/overseer/failure-journal';
import { pauseRunner, writeRunnerStop } from '../../../server/overseer/kill-switch';
import { officeReader } from '../../../server/overseer/office-client';
import { officeWriter } from '../../../server/overseer/office-writer';
import { runPass, type PassReporting } from '../../../server/overseer/pass';
import { ensurePrivateDirectory } from '../../../server/overseer/runner-root';
import { EMPTY_STATE, readRunnerState, writeRunnerState } from '../../../server/overseer/runner-state';
import { acquirePassLock, PassRefused } from '../../../server/overseer/single-flight';
import { failure, officeWorld, ORIGIN, runnerStore, type OfficeWorld } from './forward-world';
import { HEALTH, machine, runnerRoot, tempDir } from './runner-world';

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

const outage = {
    episode: '7b0c6a43-62f8-4a49-9f11-8d1b2f6ad0c4', since: '2026-11-25T11:54:00.000Z',
    lastFailureAt: '2026-11-25T11:54:00.000Z', failures: 1, reason: 'no answer', journaled: false,
};
const save = (paths: RunnerPaths, state: typeof EMPTY_STATE) => {
    ensurePrivateDirectory(paths.state);
    writeRunnerState(paths, state);
};
const failurePosts = (world: OfficeWorld) => world.posts().filter(line => line === 'POST /api/incidents/runner/failures');

test('counts the outage journaled during observation as pending for the recorded pass', async () => {
    const paths = runnerRoot(), world = officeWorld({ answer: (_, path) => path === '/api/health' ? new Response('down', { status: 503 }) : undefined });
    save(paths, { ...EMPTY_STATE, outage });
    expect(await runPass(machine(paths, officeReader(ORIGIN, world.request), { reporting: reporting(world).value }))).toMatchObject({ record: { outcome: 'service-down' } });
    expect(readFailures(paths, 1000)).toMatchObject({ entries: [{ event: { kind: 'service-down', episode: outage.episode } }], problem: null });
    expect(runnerStatus(paths, new Date(), { origin: ORIGIN }).forwarding).toMatchObject({ known: true, forwarded: 0, pending: 1 });
    expect(failurePosts(world)).toEqual([]);
});

test('an unreadable final journal leaves counts unknown and the independent halt confirmation available', async () => {
    const paths = runnerRoot();
    journal(paths, failure('service-down'));
    const world = officeWorld({ before: (method, path) => {
        if (method === 'GET' && path === '/api/incidents/runner/halt') writeFileSync(paths.failures, 'cut short');
    } });
    await runPass(machine(paths, officeReader(ORIGIN, world.request), { reporting: reporting(world).value }));
    expect(runnerStatus(paths, new Date(), { origin: ORIGIN }).forwarding).toMatchObject({
        known: false, reason: 'the journal could not be counted', halt: { confirmed: { kind: 'running' } },
    });
});

test.each(['conflicting', 'mismatched', 'malformed'] as const)('a %s owed journal line leaves evidence, withholds disputed IDs and reports STOP', async kind => {
    const paths = runnerRoot(), world = officeWorld(), down = failure('service-down'), other = failure('service-down');
    journal(paths, down, other);
    const line = kind === 'conflicting' ? failureLine({ ...down, detail: 'other words' }) : kind === 'mismatched' ? failureLine(other) : '{bad json\n';
    const intent = { id: down.id, line, next: null };
    save(paths, { ...EMPTY_STATE, intent });
    const before = readFileSync(paths.failures);
    expect(await runPass(machine(paths, officeReader(ORIGIN, world.request), { reporting: reporting(world).value }))).toMatchObject({ record: { outcome: 'stopped' } });
    expect(readRunnerState(paths)).toMatchObject({ state: { intent } });
    expect(readFileSync(paths.failures)).toEqual(before);
    const expected = kind === 'mismatched' ? [] : [other.id];
    expect(forwarded(world)).toEqual(expected);
    expect(failurePosts(world)).toHaveLength(expected.length);
    expect(world.runnerReports.halt()).toMatchObject({ kind: 'stopped' });
});

test('a phase with under a millisecond left preserves outage and cached observations without starting an observation request', async () => {
    const paths = runnerRoot(), world = officeWorld();
    const observation = { health: { ...HEALTH, at: outage.since }, incidents: { at: outage.since, total: 0, summaries: [] } };
    save(paths, { ...EMPTY_STATE, outage, observation });
    let reads = 0;
    const value = reporting(world, { monotonic: () => reads++ === 0 ? 0 : 17_999.5 }).value;
    const result = await runPass(machine(paths, officeReader(ORIGIN, world.request), { reporting: value, limits: { manualPassMs: 30_000 } }));
    expect(result).toMatchObject({ record: { outcome: 'read-failed', cachedHealthAt: outage.since, cachedIncidentsAt: outage.since } });
    expect(readRunnerState(paths)).toMatchObject({ state: { outage, observation, lastPass: { outcome: 'read-failed' } } });
    expect(existsSync(paths.failures)).toBe(false);
    expect(world.requests.slice(0, 2)).toEqual(['GET /api/incidents/runner/halt', 'GET /api/health']);
    expect(world.requests.filter(line => line.includes('/api/incidents?research=1'))).toEqual([]);
    expect(world.requests.filter(line => line === 'GET /api/health')).toHaveLength(1); // halt preflight
});

test.each(['table', 'row'] as const)('a forwarding %s failure preserves evidence and the local outcome and closes the Store under the lock', async kind => {
    const paths = runnerRoot(), world = officeWorld(), down = failure('service-down'), store = runnerStore();
    open.push(store);
    journal(paths, down);
    ensurePrivateDirectory(paths.control);
    const db = store.store.db;
    const corrupt = '{"eventId": false}';
    if (kind === 'table') db.exec('CREATE TABLE overseer_forward (wrong TEXT)');
    else {
        writeRunnerStop(paths, { reason: 'operator stop', instruction: 'inspect' });
        store.state.prepareFailures();
        db.prepare('INSERT INTO overseer_forward(origin,event_id,body) VALUES(?,?,?)').run(ORIGIN, down.id, corrupt);
    }
    const before = readFileSync(paths.failures);
    let closedUnderLock = false, retained: unknown;
    const value = reporting(world, { openStore: async () => ({
        db, effects: store.effects, close: () => {
            closedUnderLock = existsSync(paths.lock);
            retained = kind === 'row' ? db.prepare('SELECT body FROM overseer_forward').get()?.body : db.prepare('PRAGMA table_info(overseer_forward)').get()?.name;
            store.close();
        },
    }) }).value;
    const outcome = kind === 'table' ? 'idle' : 'stopped';
    expect(await runPass(machine(paths, officeReader(ORIGIN, world.request), { reporting: value }))).toMatchObject({ record: { outcome, detail: expect.stringContaining('Forwarding unavailable') } });
    expect(readRunnerState(paths)).toMatchObject({ state: { lastPass: { outcome } } });
    expect(readFileSync(paths.failures)).toEqual(before);
    expect([closedUnderLock, existsSync(paths.lock), retained]).toEqual([true, false, kind === 'row' ? corrupt : 'wrong']);
    expect(failurePosts(world)).toEqual([]);
    expect(world.runnerReports.halt()?.kind).toBe(kind === 'row' ? 'stopped' : 'running');
});

test('an invalid UTF-8 line stops the pass without any failure POST or change to the journal bytes', async () => {
    const paths = runnerRoot(), world = officeWorld();
    const line = failureLine(failure('service-down', undefined, undefined, '€'));
    const bytes = Buffer.from(line);
    bytes[bytes.indexOf('€')] = 0xff;
    ensurePrivateDirectory(paths.journal);
    writeFileSync(paths.failures, bytes);
    expect(await runPass(machine(paths, officeReader(ORIGIN, world.request), { reporting: reporting(world).value }))).toMatchObject({ record: { outcome: 'stopped', detail: expect.stringContaining('UTF-8') } });
    expect(failurePosts(world)).toEqual([]);
    expect(readFileSync(paths.failures)).toEqual(bytes);
});

test('a failed halt GET leaves a new STOP pending in the completed summary until it can be reported', async () => {
    const paths = runnerRoot(), store = runnerStore(), haltPath = '/api/incidents/runner/halt';
    open.push(store);
    let unreachable = false;
    const world = officeWorld({ answer: (method, path) => {
        if (unreachable && method === 'GET' && path === haltPath) throw new Error('x'.repeat(800));
        return undefined;
    } });
    const value = reporting(world, { openStore: async () => ({ effects: store.effects, db: store.store.db, close: () => {} }) }).value;
    const pass = () => runPass(machine(paths, officeReader(ORIGIN, world.request), { reporting: value }));
    await pass();
    const sent = world.posts().length;
    expect(world.runnerReports.halt()?.kind).toBe('running');
    writeRunnerStop(paths, { reason: 'operator stop', instruction: 'inspect' });
    unreachable = true;
    expect(await pass()).toMatchObject({ record: { outcome: 'stopped' } });
    const saved = JSON.parse(readFileSync(paths.forwarding, 'utf8'));
    expect(saved).toMatchObject({ state: 'complete', halt: { confirmed: { kind: 'running' }, pending: { kind: 'stopped' }, detail: expect.stringContaining('could not be read back') } });
    expect(saved.halt.detail.length).toBeLessThanOrEqual(500);
    expect(world.posts()).toHaveLength(sent);
    unreachable = false;
    await pass();
    expect(world.runnerReports.halt()?.kind).toBe('stopped');
    expect(world.posts()).toHaveLength(sent + 1);
});

test('a pass the launcher started, whose registered deadline cannot be read, observes and defers its reports', async () => {
    const paths = runnerRoot(), world = officeWorld(), launched = reporting(world, { launched: true, parent: 4242 });
    journal(paths, failure('service-down'));
    const result = await runPass(machine(paths, officeReader(ORIGIN, world.request), { reporting: launched.value }));
    expect(result).toMatchObject({ record: { outcome: 'idle', detail: expect.stringContaining('Reporting deferred') } });
    expect([launched.opened, world.posts()]).toEqual([[], []]);
    expect(JSON.parse(readFileSync(paths.forwarding, 'utf8'))).toMatchObject({ state: 'complete', forwarded: null, pending: null, halt: null });
});
