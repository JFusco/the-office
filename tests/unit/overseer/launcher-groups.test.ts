import { beforeAll, expect, test } from 'vitest';
import { launcherSource } from './launch-world';

// Process-group ownership with an injected system: nothing is signalled that cannot be
// identified, identity is checked again before KILL, and only ESRCH proves a group gone.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let group: any;
beforeAll(async () => { group = await launcherSource('process-group'); });

const FILE = '/runner root/code/launcher/overseer-launch.mjs', ID = '00000000-0000-4000-8000-000000000009', PGID = 4321;
const START = 'Thu Nov 26 03:00:00 2026', NODE = '/usr/local/bin/node';
const current = { id: ID, pid: PGID, pgid: PGID, start: START };
const line = (pid: number, start: string, command: string) => `${String(pid).padStart(6)} ${String(PGID).padStart(6)} ${start}     ${command}`;
const helper = (start = START, file = FILE, id = ID) => line(PGID, start, `${NODE} ${file} --group ${id}`);
const limits = { termGraceMs: 1_000, absenceWaitMs: 500, pollMs: 100 };

/** A system whose group stays present until `goneAfter` signals of that kind have been sent, and whose `ps` answers in turn. */
function world(listings: { ok?: boolean; stdout: string }[], options: { goneAfter?: 'SIGTERM' | 'SIGKILL'; probe?: 'EPERM' } = {}) {
    const calls: [number, NodeJS.Signals | 0][] = [];
    let clock = 0, gone = false, listing = 0;
    const system = {
        kill: (pid: number, signal: NodeJS.Signals | 0) => {
            calls.push([pid, signal]);
            if (signal === 0) {
                if (options.probe) throw Object.assign(new Error('EPERM'), { code: options.probe });
                if (gone) throw Object.assign(new Error('ESRCH'), { code: 'ESRCH' });
                return;
            }
            if (signal === options.goneAfter) gone = true;
        },
        ps: async (_args?: string[]) => { const next = listings[Math.min(listing++, listings.length - 1)]; return { ok: next.ok ?? true, code: next.ok === false ? 1 : 0, stdout: next.stdout, pid: 99 }; },
        sleep: async (ms: number) => { clock += ms; },
        monotonic: () => clock,
        now: () => new Date('2026-11-26T09:00:00.000Z'),
    };
    return { system, calls, signals: () => calls.filter(([, signal]) => signal !== 0) };
}

test('a group whose leader is this attempt’s helper is sent TERM and, once rechecked, KILL; ESRCH settles it', async () => {
    const quick = world([{ stdout: helper() }], { goneAfter: 'SIGTERM' });
    expect(await group.stopGroup(quick.system, current, FILE, limits)).toEqual({ gone: true, observation: null });
    expect(quick.signals()).toEqual([[-PGID, 'SIGTERM']]);
    const stubborn = world([{ stdout: `${helper()}\n${line(4400, START, 'node -e stubborn')}` }], { goneAfter: 'SIGKILL' });
    expect(await group.stopGroup(stubborn.system, current, FILE, limits)).toEqual({ gone: true, observation: null });
    expect(stubborn.signals()).toEqual([[-PGID, 'SIGTERM'], [-PGID, 'SIGKILL']]);
});

test('identity is checked again after TERM: a leader that changed meanwhile gets no KILL', async () => {
    const reused = world([{ stdout: helper() }, { stdout: helper('Thu Nov 26 03:00:07 2026') }]);
    const result = await group.stopGroup(reused.system, current, FILE, limits);
    expect(result).toMatchObject({ gone: false, observation: { reason: 'after TERM the group’s leader is not this attempt’s helper' } });
    expect(reused.signals()).toEqual([[-PGID, 'SIGTERM']]);
});

test('a leader that is not this attempt’s helper, or a group ps cannot list, is never signalled', async () => {
    const strangers: [string, { ok?: boolean; stdout: string }, string][] = [
        ['another start', { stdout: helper('Thu Nov 26 03:00:01 2026') }, 'not this attempt’s helper'],
        ['another attempt', { stdout: helper(START, FILE, '00000000-0000-4000-8000-000000000010') }, 'not this attempt’s helper'],
        ['the same name elsewhere', { stdout: helper(START, '/elsewhere/code/launcher/overseer-launch.mjs') }, 'not this attempt’s helper'],
        ['no leader', { stdout: line(4400, START, `${NODE} ${FILE} --group ${ID}`) }, 'not this attempt’s helper'],
        ['ps failed', { ok: false, stdout: '' }, 'ps exited 1'],
        ['a line ps should not print', { stdout: 'garbage' }, 'ps printed a line'],
    ];
    for (const [name, listing, reason] of strangers) {
        const { system, signals } = world([listing]);
        expect(await group.stopGroup(system, current, FILE, limits), name).toMatchObject({ gone: false, observation: { reason: expect.stringContaining(reason) } });
        expect(signals(), name).toEqual([]);
    }
});

test('an inconclusive probe never counts as gone, and a group listing no one is gone only on ESRCH', async () => {
    const unknown = world([{ stdout: helper() }], { probe: 'EPERM', goneAfter: 'SIGKILL' });
    expect(group.probeGroup(unknown.system, PGID, PGID)).toBe('unknown');
    expect(await group.waitAbsent(unknown.system, current, 500, limits)).toBe(false);
    expect((await group.stopGroup(unknown.system, current, FILE, limits)).gone).toBe(false);
    const empty = world([{ stdout: '' }]);
    expect(await group.stopGroup(empty.system, current, FILE, limits)).toMatchObject({ gone: false, observation: { reason: 'the group lists no members but is still there' } });
    expect(empty.signals()).toEqual([]);
});

test('the helper is matched on its whole command, before the saved observation is cut to 300 characters', () => {
    const long = `/runner root/${'x'.repeat(320)}/code/launcher/overseer-launch.mjs`;
    const command = `${NODE} ${long} --group ${ID}`;
    expect(group.helperCommandFits(command, long, ID)).toBe(true);
    expect(group.helperCommandFits(command, long.replace(/x(?=\/code)/, 'y'), ID)).toBe(false);
    expect(group.helperCommandFits(command, long, '00000000-0000-4000-8000-000000000010')).toBe(false);
    const inventory = { ok: true, members: [{ pid: PGID, pgid: PGID, start: START, command }] };
    expect(group.leaderMatches(inventory, current, long)).toBe(true);
    expect(group.observation('2026-11-26T09:00:00.000Z', 'why', inventory).members[0].command).toHaveLength(300);
});

test('persisted identities outside 2..2147483647, or a PID that is not its group, are refused before any signal', async () => {
    let listed = 0;
    const { system, calls } = world([{ stdout: helper() }]);
    const counting = { ...system, ps: async (args: string[]) => { listed++; return system.ps(args); } };
    for (const [pid, pgid] of [[0, 0], [1, 1], [-5, -5], [12.5, 12.5], [2_147_483_648, 2_147_483_648], [PGID, PGID + 1]]) {
        expect(() => group.probeGroup(counting, pid, pgid), `${pid}/${pgid}`).toThrow('Refusing to probe');
        await expect(group.stopGroup(counting, { ...current, pid, pgid }, FILE, limits), `${pid}/${pgid}`).rejects.toThrow('Refusing to probe');
        if (pgid !== PGID + 1) expect(await group.groupInventory(counting, pgid), `${pid}/${pgid}`).toMatchObject({ ok: false, reason: `invalid process group ${pgid}` });
    }
    expect(calls).toEqual([]);
    expect(listed).toBe(0);
});
