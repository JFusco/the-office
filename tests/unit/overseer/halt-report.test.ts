import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { runnerPaths } from '../../../server/overseer/config';
import { reportHalt } from '../../../server/overseer/halt-report';
import { pauseRunner, unpauseRunner, writeRunnerStop } from '../../../server/overseer/kill-switch';
import { officeWriter } from '../../../server/overseer/office-writer';
import { ensurePrivateDirectory } from '../../../server/overseer/runner-root';
import { officeWorld, ORIGIN, runnerStore, type OfficeWorld } from './forward-world';
import { tempDir } from './runner-world';

const open: { close(): void }[] = [];
afterEach(() => open.splice(0).forEach(item => item.close()));
const PASS = '7b0c6a43-62f8-4a49-9f11-8d1b2f6ad0c4';
let clock = Date.parse('2026-11-26T12:00:00.000Z');
const now = () => new Date(clock += 1000);
function runner() {
    const paths = runnerPaths(join(tempDir(), 'runner'));
    ensurePrivateDirectory(paths.control);
    const store = runnerStore(); open.push(store);
    return { paths, ...store };
}
const report = (world: OfficeWorld, r: ReturnType<typeof runner>) => reportHalt({ paths: r.paths, origin: ORIGIN, state: r.state, effects: r.effects, writer: officeWriter(ORIGIN, world.request), pass: PASS, now });

test('a STOP is reported; after its reply is lost and STOP is removed, the running condition overtakes it at a higher sequence and the Office holds that', async () => {
    let losing = true;
    const world = officeWorld({ lose: method => method === 'POST' && losing }), r = runner();
    writeRunnerStop(r.paths, { reason: 'journal damaged', instruction: 'settle it' }, now);
    expect(await report(world, r)).toMatchObject({ confirmed: null, pending: { kind: 'stopped', control: 'STOP.json', reason: 'STOP: journal damaged' } });
    expect(world.runnerReports.halt()).toMatchObject({ sequence: 1, kind: 'stopped' });
    losing = false;
    rmSync(r.paths.stop);
    expect(await report(world, r)).toMatchObject({ confirmed: { kind: 'running', control: null }, pending: null });
    expect(world.runnerReports.halt()).toMatchObject({ sequence: 2, kind: 'running' });
    expect(world.posts()).toHaveLength(2);
    // Unchanged: nothing more is sent.
    expect(await report(world, r)).toMatchObject({ confirmed: { kind: 'running' }, pending: null });
    expect(world.posts()).toHaveLength(2);
});

test('a STOP delayed until after its clear is refused as stale, and the clear stands', async () => {
    let held: (() => Promise<Response>) | null = null;
    const world = officeWorld(), r = runner();
    // The first POST is held back and delivered only after the second.
    const request: typeof fetch = async (input, init) => {
        if (init?.method === 'POST' && !held) { held = () => world.request(input, init); throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNRESET' } }); }
        return world.request(input, init);
    };
    writeRunnerStop(r.paths, { reason: 'journal damaged', instruction: 'settle it' }, now);
    await reportHalt({ paths: r.paths, origin: ORIGIN, state: r.state, effects: r.effects, writer: officeWriter(ORIGIN, request), pass: PASS, now });
    rmSync(r.paths.stop);
    expect(await reportHalt({ paths: r.paths, origin: ORIGIN, state: r.state, effects: r.effects, writer: officeWriter(ORIGIN, request), pass: PASS, now })).toMatchObject({ confirmed: { kind: 'running' } });
    const late = await held!();
    expect([late.status, (await late.json()).result]).toEqual([409, 'stale']);
    expect(world.runnerReports.halt()).toMatchObject({ sequence: 2, kind: 'running' });
});

test('the Office holding this sequence with other content is a conflict, and the condition is published again above it', async () => {
    const world = officeWorld(), r = runner();
    world.runnerReports.recordHalt({ version: 1, sequence: 1, kind: 'paused', control: 'pause.json', reason: 'Paused: elsewhere', since: '2026-11-26T11:00:00.000Z', pass: PASS, reportedAt: '2026-11-26T11:00:00.000Z' }, new Date());
    // This runner froze sequence 1 for STOP before it read the Office.
    r.state.saveHalt(ORIGIN, { highWater: 1, pending: { version: 1, sequence: 1, kind: 'stopped', control: 'STOP.json', reason: 'STOP: x', since: '2026-11-26T11:30:00.000Z', pass: PASS, reportedAt: '2026-11-26T11:30:00.000Z' }, attempt: 1, confirmed: null, conflict: null });
    expect(await report(world, r)).toMatchObject({ conflict: 'The Office holds sequence 1 with other content', confirmed: { kind: 'running' } });
    expect(world.runnerReports.halt()).toMatchObject({ sequence: 2, kind: 'running' });
});

test('an unreadable pause is a stop naming pause.json with no time; a long reason is cut to 500; a valid pause outlives the removal of STOP', async () => {
    const world = officeWorld(), r = runner();
    writeFileSync(r.paths.pause, 'not json');
    expect(await report(world, r)).toMatchObject({ confirmed: { kind: 'stopped', control: 'pause.json', since: null } });
    rmSync(r.paths.pause);
    writeRunnerStop(r.paths, { reason: 'x'.repeat(2000), instruction: 'settle it' }, now);
    const long = await report(world, r);
    expect(long.confirmed!.reason).toHaveLength(500);
    pauseRunner(r.paths, 'Paused by Joe', now);
    rmSync(r.paths.stop);
    expect(await report(world, r)).toMatchObject({ confirmed: { kind: 'paused', control: 'pause.json', reason: 'Paused: Paused by Joe', since: expect.any(String) } });
    unpauseRunner(r.paths);
    expect(await report(world, r)).toMatchObject({ confirmed: { kind: 'running' } });
});
