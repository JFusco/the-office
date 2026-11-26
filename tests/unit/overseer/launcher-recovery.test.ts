import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeAll, describe, expect, test } from 'vitest';
import { alive, killOwned, launchedWith, loadLauncher, readState, registered, seedState, trackGrandchild, until } from './launch-processes';
import { fakeHelper } from './launch-fake-helper';
import { FAST, LAUNCHER } from './launch-world';

// Cleanup that cannot be confirmed, and cleanup cut short: the attempt stays current and is
// counted once, whatever later launches find.

beforeAll(loadLauncher);
afterEach(() => killOwned());

const EPERM = () => Object.assign(new Error('operation not permitted'), { code: 'EPERM' });
/** Probes of any process group are inconclusive; every other signal is real. */
const unprobeable = { kill: (pid: number, signal: NodeJS.Signals | 0) => { if (signal === 0 && pid < 0) throw EPERM(); process.kill(pid, signal); } };
const quick = { ...FAST, absenceWaitMs: 1_000, termGraceMs: 1_000 };
const attempts = (state: { recent: { id: string }[] }, id: string) => state.recent.filter(record => record.id === id).length;

test('recovery logs a newly charged blocked orphan once, then only reports the blockage', async () => {
    const id = randomUUID(), pid = 4321, start = 'Thu Nov 26 03:00:00 2026';
    const logs: string[] = [];
    const { world, run } = launchedWith('record', { seed: world => seedState(world, registered({ id, pid, start })) });
    const system = {
        kill: () => {},
        ps: async (args: string[]) => ({
            ok: true, code: 0,
            stdout: args.includes('-p') ? `${process.pid} ${process.pid} ${start} node test launcher\n` : `${pid} ${pid} ${start} node ${LAUNCHER} --group ${id}\n`,
        }),
        monotonic: () => 0,
    };
    const options = { system, limits: { ...quick, termGraceMs: 0, absenceWaitMs: 0 }, log: (line: string) => logs.push(line) };
    expect(await run(options)).toBe(0);
    expect(await run(options)).toBe(0);
    expect(readState(world.root)).toMatchObject({ current: { id, counted: 'orphan' }, counts: { orphan: 1, success: 0 } });
    const summaries = logs.map(line => JSON.parse(line));
    expect(summaries).toEqual([
        expect.objectContaining({ id, kind: 'orphan', blocked: true, reason: 'the group is still there after KILL' }),
        expect.objectContaining({ blocked: true, reason: 'the group is still there after KILL' }),
    ]);
    expect(summaries[1]).not.toHaveProperty('kind');
    expect(summaries[1]).not.toHaveProperty('id');
});

test.each(['lost', 'orphan'] as const)('recovery logs a settled %s even when the next pass succeeds', async kind => {
    const id = randomUUID(), pid = 2_000_000_000, start = 'Thu Nov 26 03:00:00 2026';
    const helper = fakeHelper({ reportAt: 200 });
    const { world, run, env } = launchedWith('record', { seed: world => seedState(world, registered({ id, pid, start })) });
    const logs: string[] = [];
    let present = kind === 'orphan';
    const system = {
        kill: (target: number, signal: NodeJS.Signals | 0) => {
            if (target !== -pid) return process.kill(target, signal);
            if (!present) throw Object.assign(new Error('no such group'), { code: 'ESRCH' });
            if (signal === 'SIGTERM') present = false;
        },
        ps: (args: string[]) => args.at(-1) === String(pid)
            ? { ok: true, code: 0, stdout: `${pid} ${pid} ${start} node ${helper.file} --group ${id}\n` }
            : helper.ps(args),
    };
    expect(await run({ env: { ...env, HOME: helper.home }, launcherFile: helper.file, log: (line: string) => logs.push(line), system })).toBe(0);
    expect(readState(world.root)).toMatchObject({ current: null, counts: { [kind]: 1, success: 1 }, consecutiveFailures: 0 });
    expect(logs.map(line => JSON.parse(line))).toEqual([expect.objectContaining({ kind, id })]);
});

describe.skipIf(process.platform !== 'darwin')('launcher recovery with real processes', () => {
    test('a pass that ended well but whose group cannot be confirmed gone is one orphan, keeps current and resets nothing, across later ticks', async () => {
        const { world, run } = launchedWith('record', { seed: world => seedState(world, null, { consecutiveFailures: 2 }) });
        expect(await run({ system: unprobeable, limits: quick })).toBe(0);
        const first = readState(world.root);
        expect(first.current).toMatchObject({ counted: 'orphan', observation: { reason: expect.any(String) } });
        const record = { id: first.current.id, kind: 'orphan', exit: { code: 0, signal: null }, outcome: 'idle' };
        expect(first).toMatchObject({ consecutiveFailures: 3, counts: { orphan: 1, success: 0 }, last: record, recent: [record] });
        for (let tick = 0; tick < 3; tick++) expect(await run({ system: unprobeable, limits: quick })).toBe(0);
        const blocked = readState(world.root);
        expect(blocked).toMatchObject({ consecutiveFailures: 3, counts: { orphan: 1, success: 0, lost: 0 }, current: { id: first.current.id } });
        expect(attempts(blocked, first.current.id)).toBe(1);
        expect(blocked.last).toEqual(first.last);
        expect(blocked.recent).toEqual(first.recent);
        // Once the group can be seen gone, it is cleared without another charge and the next pass runs.
        expect(await run()).toBe(0);
        const cleared = readState(world.root);
        expect(cleared).toMatchObject({ current: null, consecutiveFailures: 0, counts: { orphan: 1, success: 1, lost: 0 } });
        expect(attempts(cleared, first.current.id)).toBe(1);
    }, 90_000);

    test.each([
        ['an exit-zero report', undefined, 'orphan', { code: 0, signal: null }, 'idle'],
        ['a reported spawn error', 'fixture spawn error', 'startup', { code: null, signal: null }, null],
    ] as const)('%s retains its exit facts when cleanup cannot be confirmed', async (_, reportError, kind, exit, outcome) => {
        const helper = fakeHelper({ reportAt: 200, reportError });
        const { world, run, env } = launchedWith('record');
        const options = { env: { ...env, HOME: helper.home }, launcherFile: helper.file, system: { ...unprobeable, ps: helper.ps }, limits: quick };
        expect(await run(options)).toBe(0);
        const first = readState(world.root), id = first.current.id;
        const detail = reportError ?? 'the pass’s group could not be confirmed gone';
        const record = { id, kind, exit, outcome, detail };
        expect(first).toMatchObject({ current: { id, counted: kind, observation: { reason: expect.any(String) } }, counts: { [kind]: 1, success: 0, exit: 0 }, last: record, recent: [record] });
        expect(await run(options)).toBe(0);
        const replay = readState(world.root);
        expect(replay.counts).toEqual(first.counts);
        expect(replay.recent).toEqual(first.recent);
    }, 30_000);

    for (const survivor of [true, false]) test(`a hang is counted before its first signal; cleanup cut short is settled by a later launch, without a second count, ${survivor ? 'its group still running' : 'its group already gone'}`, async () => {
        const { world, run } = launchedWith('hang', { deadlineMs: 1_000 });
        let atFirstTerm: { counts: Record<string, number>; current: { counted: string | null } } | null = null;
        // Cleanup cut short: the first signal finds the hang already saved, and no signal reaches the group.
        const cutShort = { kill: (pid: number, signal: NodeJS.Signals | 0) => {
            if (pid < 0 && signal === 'SIGTERM' && !atFirstTerm) atFirstTerm = readState(world.root);
            if (pid < 0 && signal !== 0) return;
            process.kill(pid, signal);
        } };
        expect(await run({ system: cutShort, limits: quick })).toBe(0);
        expect(atFirstTerm).toMatchObject({ counts: { hang: 1 }, current: { counted: 'hang' } });
        const left = readState(world.root), id = left.current.id;
        const grandchild = await trackGrandchild(world.root);
        expect(left).toMatchObject({ counts: { hang: 1 }, consecutiveFailures: 1, current: { counted: 'hang' } });
        // Later ticks that cannot tell the group's standing only update its observation.
        for (let tick = 0; tick < 3; tick++) expect(await run({ system: unprobeable, limits: quick })).toBe(0);
        expect(readState(world.root)).toMatchObject({ counts: { hang: 1, orphan: 0, lost: 0 }, consecutiveFailures: 1, current: { id, observation: { reason: 'the recorded group cannot be probed' } } });
        // The helper, let go, stops its own group only after its 10 s TERM grace; until then the group is still running.
        if (survivor) expect(alive(grandchild)).toBe(true);
        else {
            process.kill(-left.current.pgid, 'SIGKILL');
            expect(await until(() => !alive(left.current.pid) && !alive(grandchild))).toBe(true);
        }
        // Recovery comes before the pin is read: with the pin gone, the attempt is still settled.
        rmSync(join(world.root, 'code/pin.json'));
        expect(await run({ limits: quick })).toBe(0);
        const settled = readState(world.root);
        expect(alive(grandchild)).toBe(false);
        expect(settled).toMatchObject({ current: null, counts: { hang: 1, orphan: 0, lost: 0, pin: 1 }, consecutiveFailures: 2 });
        expect(attempts(settled, id)).toBe(1);
    }, 90_000);
});
