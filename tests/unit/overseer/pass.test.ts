import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { readFailures } from '../../../server/overseer/failure-journal';
import { pauseRunner, readStop, writeRunnerStop } from '../../../server/overseer/kill-switch';
import { officeReader, OfficeReadError } from '../../../server/overseer/office-client';
import { runPass } from '../../../server/overseer/pass';
import { readRunnerState, type RunnerState } from '../../../server/overseer/runner-state';
import { acquirePassLock } from '../../../server/overseer/single-flight';
import { clock, HEALTH, incidentId, machine, row, runnerRoot, scriptedOffice, snapshot } from './runner-world';

const state = (paths: ReturnType<typeof runnerRoot>): RunnerState => {
    const read = readRunnerState(paths);
    if ('unreadable' in read) throw new Error(read.unreadable);
    return read.state;
};
const down = () => Promise.reject(new OfficeReadError('/api/health could not be read: fetch failed (ECONNREFUSED)'));

test('a pass sends the Office only GETs of health and the research list', async () => {
    const paths = runnerRoot(), calls: { url: string; method?: string; body?: unknown }[] = [];
    const request = (async (url: string, init: RequestInit) => {
        calls.push({ url, method: init.method, body: init.body });
        return new Response(JSON.stringify(url.endsWith('/api/health')
            ? { ok: true, loadedHash: 'a'.repeat(64), serviceInstanceId: 's', pid: 1, busy: false, fence: { status: 'open' } }
            : { incidents: [{ id: incidentId(1), state: 'observed', revision: 1, cause: { source: 'stopped-work' }, research: { eligible: true, at: null }, subjects: [] }] }));
    }) as unknown as typeof fetch;
    const result = await runPass(machine(paths, officeReader('http://127.0.0.1:4318', request)));
    expect(result).toMatchObject({ status: 'recorded', record: { outcome: 'observing', selected: { incident: incidentId(1), kept: false } } });
    expect(calls).toEqual([
        { url: 'http://127.0.0.1:4318/api/health', method: 'GET', body: undefined },
        { url: 'http://127.0.0.1:4318/api/incidents?research=1', method: 'GET', body: undefined },
    ]);
});

test('observing: one incident is picked, kept on the next pass, and its pass is recorded', async () => {
    const paths = runnerRoot(), time = clock(), office = scriptedOffice({ incidents: async () => [row(incidentId(2)), row(incidentId(1))] });
    const first = await runPass(machine(paths, office.reader, { now: time.now }));
    expect(first).toMatchObject({ status: 'recorded', record: { outcome: 'observing', selected: { incident: incidentId(1), kept: false } } });
    time.advance(120_000);
    const second = await runPass(machine(paths, office.reader, { now: time.now }));
    expect(second).toMatchObject({ record: { outcome: 'observing', selected: { incident: incidentId(1), kept: true }, detail: expect.stringContaining('Kept') } });
    const saved = state(paths);
    expect(saved.inFlight).toEqual({ incident: incidentId(1), selectedAt: '2026-11-25T12:00:00.000Z', revision: 1, state: 'observed' });
    expect(saved.observation.incidents).toMatchObject({ at: '2026-11-25T12:02:00.000Z', total: 2 });
    expect(saved.observation.health).toMatchObject({ at: '2026-11-25T12:02:00.000Z', serviceInstanceId: 'service-1', fence: 'open' });
    expect(saved.lastPass).toEqual(second.status === 'recorded' && second.record);
    expect(existsSync(paths.lock)).toBe(false);
});

test('idle: nothing eligible, and a released incident says why', async () => {
    const paths = runnerRoot(), office = scriptedOffice({ incidents: async () => [row(incidentId(1))] });
    await runPass(machine(paths, office.reader));
    office.incidents = async () => [row(incidentId(1), { state: 'fixing' })];
    const result = await runPass(machine(paths, office.reader));
    expect(result).toMatchObject({ record: { outcome: 'idle', released: { incident: incidentId(1), reason: 'state:fixing' } } });
    expect(state(paths).inFlight).toBeNull();
});

test('stopped and paused: the Office is not read, and only the pass record changes', async () => {
    for (const hold of ['stop', 'pause'] as const) {
        const paths = runnerRoot(), office = scriptedOffice({ incidents: async () => [row(incidentId(1))] });
        await runPass(machine(paths, office.reader));
        const before = state(paths);
        if (hold === 'stop') writeRunnerStop(paths, { reason: 'held for a person', instruction: 'look' });
        else pauseRunner(paths, 'looking at a fix');
        office.calls.length = 0;
        const result = await runPass(machine(paths, office.reader));
        expect(result, hold).toMatchObject({ record: { outcome: hold === 'stop' ? 'stopped' : 'paused' } });
        expect(office.calls, hold).toEqual([]);
        const after = state(paths);
        expect({ ...after, lastPass: null }, hold).toEqual({ ...before, lastPass: null });
    }
});

test('service-down: the cached readings keep their times, no incident list is reported, and the in-flight incident stays', async () => {
    const paths = runnerRoot(), time = clock(), office = scriptedOffice({ incidents: async () => [row(incidentId(1))] });
    await runPass(machine(paths, office.reader, { now: time.now }));
    office.health = down;
    time.advance(120_000);
    const result = await runPass(machine(paths, office.reader, { now: time.now }));
    expect(result).toMatchObject({ record: { outcome: 'service-down', cachedHealthAt: '2026-11-25T12:00:00.000Z', cachedIncidentsAt: '2026-11-25T12:00:00.000Z' } });
    expect(result.status === 'recorded' && Object.keys(result.record)).not.toContain('selected');
    const saved = state(paths);
    expect(saved.inFlight?.incident).toBe(incidentId(1));
    expect(saved.observation.health?.at).toBe('2026-11-25T12:00:00.000Z');
    expect(saved.observation.incidents?.at).toBe('2026-11-25T12:00:00.000Z');
    expect(saved.outage).toMatchObject({ failures: 1, journaled: false });
    expect(office.calls.at(-1)).toBe('health');

    const fresh = runnerRoot();
    expect(await runPass(machine(fresh, scriptedOffice({ health: down }).reader))).toMatchObject({ record: { outcome: 'service-down', cachedHealthAt: null, cachedIncidentsAt: null } });
});

test('an outage is journaled once past both thresholds, and restored once', async () => {
    const paths = runnerRoot(), time = clock(), office = scriptedOffice({ health: down });
    for (let pass = 0; pass < 4; pass++) {
        await runPass(machine(paths, office.reader, { now: time.now }));
        time.advance(120_000);
    }
    // Passes at 0, 2, 4 and 6 minutes: the one at 6 crossed five minutes.
    const journal = readFailures(paths, 1000);
    expect(journal.entries?.map(entry => entry.event.kind)).toEqual(['service-down']);
    expect(state(paths).outage).toMatchObject({ failures: 4, journaled: true });
    await runPass(machine(paths, office.reader, { now: time.now }));
    expect(readFailures(paths, 1000).entries).toHaveLength(1);
    office.health = async () => HEALTH;
    const back = await runPass(machine(paths, office.reader, { now: time.now }));
    expect(back).toMatchObject({ record: { outcome: 'idle', note: expect.stringContaining('after an outage') } });
    const events = readFailures(paths, 1000).entries!.map(entry => entry.event);
    expect(events.map(event => event.kind)).toEqual(['service-down', 'service-restored']);
    expect(events[1].episode).toBe(events[0].episode);
    expect(state(paths)).toMatchObject({ outage: null, intent: null });
});

test('fenced and read-failed: health is refreshed, the incident cache and the in-flight incident are not', async () => {
    for (const kind of ['held', 'invalid', 'read-failed'] as const) {
        const paths = runnerRoot(), time = clock(), office = scriptedOffice({ incidents: async () => [row(incidentId(1))] });
        await runPass(machine(paths, office.reader, { now: time.now }));
        const before = state(paths);
        time.advance(120_000);
        if (kind === 'read-failed') office.incidents = () => Promise.reject(new OfficeReadError('/api/incidents?research=1 answered 500'));
        else office.health = async () => ({ ...HEALTH, fence: kind });
        office.calls.length = 0;
        const result = await runPass(machine(paths, office.reader, { now: time.now }));
        expect(result, kind).toMatchObject({ record: { outcome: kind === 'read-failed' ? 'read-failed' : 'fenced' } });
        expect(office.calls, kind).toEqual(kind === 'read-failed' ? ['health', 'incidents'] : ['health']);
        const after = state(paths);
        expect(after.observation.health?.at, kind).toBe('2026-11-25T12:02:00.000Z');
        expect(after.observation.incidents, kind).toEqual(before.observation.incidents);
        expect(after.inFlight, kind).toEqual(before.inFlight);
    }
});

test('a pause or STOP that arrives while the Office is read holds before anything is selected or released', async () => {
    for (const hold of ['pause-during-health', 'stop-during-list'] as const) {
        const paths = runnerRoot(), office = scriptedOffice({ incidents: async () => [row(incidentId(1))] });
        await runPass(machine(paths, office.reader));
        office.incidents = async () => {
            if (hold === 'stop-during-list') writeRunnerStop(paths, { reason: 'arrived mid-pass', instruction: 'look' });
            return [row(incidentId(1), { state: 'fixing' }), row(incidentId(2))];
        };
        office.health = async () => {
            if (hold === 'pause-during-health') pauseRunner(paths, 'arrived mid-pass');
            return HEALTH;
        };
        const result = await runPass(machine(paths, office.reader));
        expect(result, hold).toMatchObject({ record: { outcome: hold === 'stop-during-list' ? 'stopped' : 'paused' } });
        expect(result.status === 'recorded' && result.record.released, hold).toBeUndefined();
        expect(state(paths).inFlight?.incident, hold).toBe(incidentId(1));
    }
});

test('runner state that cannot be read stops the runner and is left exactly as it was', async () => {
    const paths = runnerRoot();
    mkdirSync(paths.state, { recursive: true });
    writeFileSync(paths.runnerState, '{"version":1,');
    const office = scriptedOffice();
    const result = await runPass(machine(paths, office.reader));
    expect(result).toMatchObject({ status: 'recorded', record: { outcome: 'stopped', detail: expect.stringContaining('cannot be read') } });
    expect(readFileSync(paths.runnerState, 'utf8')).toBe('{"version":1,');
    expect(readStop(paths)).toMatchObject({ record: { reason: expect.stringContaining('runner.json cannot be read') } });
    expect(office.calls).toEqual([]);
});

test('a pass refused by another pass changes nothing', async () => {
    const paths = runnerRoot(), office = scriptedOffice({ incidents: async () => [row(incidentId(1))] });
    await runPass(machine(paths, office.reader));
    acquirePassLock(paths, 'other-pass', { pid: 99 });
    const before = snapshot(paths.root);
    office.calls.length = 0;
    const result = await runPass(machine(paths, office.reader, { alive: () => true }));
    expect(result).toMatchObject({ status: 'locked', reason: expect.stringContaining('other-pass (PID 99) holds the runner') });
    expect(snapshot(paths.root)).toEqual(before);
    expect(office.calls).toEqual([]);
});

test('a damaged journal stops the runner before the Office is read, and keeps its bytes', async () => {
    const paths = runnerRoot();
    mkdirSync(paths.journal, { recursive: true });
    writeFileSync(paths.failures, '{"torn"');
    const office = scriptedOffice();
    const result = await runPass(machine(paths, office.reader));
    expect(result).toMatchObject({ record: { outcome: 'stopped', detail: expect.stringContaining('cut-short line') } });
    expect(readFileSync(paths.failures, 'utf8')).toBe('{"torn"');
    expect(office.calls).toEqual([]);
    expect(state(paths).lastPass?.outcome).toBe('stopped');
});
