import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeAll, describe, expect, test } from 'vitest';
import { alive, killOwned, launchedWith, loadLauncher, pids, readState, seedState, until } from './launch-processes';
import { FAST } from './launch-world';

// Cleanup that cannot be confirmed, and cleanup cut short: the attempt stays current and is
// counted once, whatever later launches find.

beforeAll(loadLauncher);
afterEach(killOwned);

const EPERM = () => Object.assign(new Error('operation not permitted'), { code: 'EPERM' });
/** Probes of any process group are inconclusive; every other signal is real. */
const unprobeable = { kill: (pid: number, signal: NodeJS.Signals | 0) => { if (signal === 0 && pid < 0) throw EPERM(); process.kill(pid, signal); } };
const quick = { ...FAST, absenceWaitMs: 1_000, termGraceMs: 1_000 };
const attempts = (state: { recent: { id: string }[] }, id: string) => state.recent.filter(record => record.id === id).length;

describe.skipIf(process.platform !== 'darwin')('launcher recovery with real processes', () => {
    test('a pass that ended well but whose group cannot be confirmed gone is one orphan, keeps current and resets nothing, across later ticks', async () => {
        const { world, run } = launchedWith('record', { seed: world => seedState(world, null, { consecutiveFailures: 2 }) });
        expect(await run({ system: unprobeable, limits: quick })).toBe(0);
        const first = readState(world.root);
        expect(first.current).toMatchObject({ counted: 'orphan', observation: { reason: expect.any(String) } });
        expect(first).toMatchObject({ consecutiveFailures: 3, counts: { orphan: 1, success: 0 } });
        for (let tick = 0; tick < 3; tick++) expect(await run({ system: unprobeable, limits: quick })).toBe(0);
        const blocked = readState(world.root);
        expect(blocked).toMatchObject({ consecutiveFailures: 3, counts: { orphan: 1, success: 0, lost: 0 }, current: { id: first.current.id } });
        expect(attempts(blocked, first.current.id)).toBe(1);
        // Once the group can be seen gone, it is cleared without another charge and the next pass runs.
        expect(await run()).toBe(0);
        const cleared = readState(world.root);
        expect(cleared).toMatchObject({ current: null, consecutiveFailures: 0, counts: { orphan: 1, success: 1, lost: 0 } });
        expect(attempts(cleared, first.current.id)).toBe(1);
    }, 90_000);

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
        const grandchild = Number(readFileSync(join(world.root, 'grandchild.pid'), 'utf8'));
        pids.push(grandchild);
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
