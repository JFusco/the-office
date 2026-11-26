import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, expect, test } from 'vitest';
import { overseerCommand } from '../../../server/overseer/commands';
import { runnerPaths } from '../../../server/overseer/config';
import { readLauncherState } from '../../../server/overseer/launcher-state';
import { launcherSource } from './launch-world';
import { snapshot, tempDir } from './runner-world';

// The launcher writes its state with Node built-ins; status reads it with zod. These files come
// from the launcher's own transitions and publisher, so a field added or renamed on one side only
// fails here.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let contract: any, files: any, roots: any;
beforeAll(async () => { [contract, files, roots] = await Promise.all((['launcher-state', 'durable-files', 'runner-root'] as const).map(launcherSource)); });

const ID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const AT = '2026-11-26T08:00:00.000Z', LATER = '2026-11-26T08:00:05.000Z';
const attempt = (n: number, extra: Record<string, unknown> = {}) => ({
    id: ID(n), commit: 'a'.repeat(40), entry: '/office/releases/x/server/overseer.ts', startedAt: AT, deadline: '2026-11-26T08:04:00.000Z',
    phase: 'registered', pid: 4321, pgid: 4321, start: 'Thu Nov 26 03:00:00 2026', counted: null, observation: null, ...extra,
});
const members = [{ pid: 4321, pgid: 4321, start: 'Thu Nov 26 03:00:00 2026', command: `/usr/local/bin/node /a path/${'x'.repeat(400)}`.slice(0, 300) }, { pid: 4400, pgid: 4321, start: 'Thu Nov 26 03:00:01 2026', command: 'node -e stubborn' }];

/** One launcher state for each shape the launcher writes. */
function shapes() {
    const empty = contract.emptyState();
    const settledAll = contract.KINDS.reduce((state: unknown, kind: string, n: number) => contract.settle(state, contract.attemptRecord(ID(100 + n), kind, AT, LATER, { detail: `${kind} detail` })), empty);
    let crowded = empty;
    for (let n = 1; n <= 21; n++) crowded = contract.settle(crowded, contract.attemptRecord(ID(n), 'pin', AT, LATER));
    const hung = contract.settle(empty, contract.attemptRecord(ID(7), 'hang', AT, LATER, { detail: 'passed its 240000 ms deadline' }));
    return {
        empty,
        starting: { ...empty, current: attempt(1, { phase: 'starting', pid: null, pgid: null, start: null }) },
        registered: { ...empty, current: attempt(2) },
        blocked: { ...empty, current: attempt(3, { observation: { at: LATER, reason: 'the group’s leader is not this attempt’s helper', members } }) },
        'counted hang awaiting cleanup': { ...hung, current: attempt(7, { counted: 'hang', observation: { at: LATER, reason: 'the group is still there after KILL', members } }) },
        'hang completed after cleanup': contract.completeRecord(hung, ID(7), { exit: { code: null, signal: 'SIGKILL' }, durationMs: 12_000 }),
        'every settled kind': { ...settledAll, last: { ...settledAll.last, exit: { code: 0, signal: null }, outcome: 'idle' } },
        'newest 20 of 21': crowded,
    };
}

test('every state the launcher writes reads back identically through readLauncherState and status, which writes nothing', async () => {
    for (const [name, state] of Object.entries(shapes())) {
        const root = join(tempDir(), 'runner'), paths = roots.launcherPaths(root);
        files.ensurePrivateDirectory(paths.state);
        contract.saveState(paths, state);
        expect(contract.readState(paths), name).toEqual(state);
        expect(readLauncherState(runnerPaths(root)), name).toEqual({ state });
        const before = snapshot(root), lines: string[] = [];
        expect(await overseerCommand(['status'], { env: { OVERSEER_ROOT: root }, log: line => lines.push(line) }), name).toBe(0);
        expect(JSON.parse(lines.join('\n')).launcher, name).toEqual({ state });
        expect(snapshot(root), name).toEqual(before);
    }
    const crowded = shapes()['newest 20 of 21'];
    expect(crowded.recent).toHaveLength(20);
    expect(crowded.recent[0].id).toBe(ID(2));
});

test('both readers refuse the same malformed files, and status names the unreadable one without touching it', async () => {
    const good = shapes();
    const malformed: Record<string, unknown> = {
        'an unknown top-level key': { ...good.empty, extra: 1 },
        'an unknown key on current': { ...good.registered, current: { ...good.registered.current, extra: 1 } },
        'an unknown key on a record': { ...good['every settled kind'], last: { ...good['every settled kind'].last, extra: 1 } },
        'PGID 1': { ...good.registered, current: attempt(2, { pid: 1, pgid: 1 }) },
        'a PID that is not its group': { ...good.registered, current: attempt(2, { pid: 4321, pgid: 4322 }) },
        'a starting attempt with a PID': { ...good.starting, current: { ...good.starting.current, pid: 4321 } },
        'an unknown kind': { ...good.empty, counts: { ...good.empty.counts, other: 0 } },
        'a missing count': { ...good.empty, counts: Object.fromEntries(Object.entries(good.empty.counts).slice(1)) },
        '21 recent entries': { ...good['newest 20 of 21'], recent: [...good['newest 20 of 21'].recent, good['newest 20 of 21'].recent[0]] },
        'a negative count': { ...good.empty, consecutiveFailures: -1 },
        'version 2': { ...good.empty, version: 2 },
        'an identifier in an array': { ...good.registered, current: { ...good.registered.current, id: [ID(2)] } },
        'a commit in an array': { ...good.registered, current: { ...good.registered.current, commit: ['a'.repeat(40)] } },
        'a date that does not exist': { ...good['every settled kind'], last: { ...good['every settled kind'].last, startedAt: '2026-02-30T08:00:00.000Z' } },
        'hour 24': { ...good.registered, current: { ...good.registered.current, deadline: '2026-11-26T24:00:00.000Z' } },
    };
    for (const [name, state] of Object.entries(malformed)) {
        expect(contract.validState(state), name).toBe(false);
        const root = join(tempDir(), 'runner'), paths = roots.launcherPaths(root);
        files.ensurePrivateDirectory(paths.state);
        const text = `${JSON.stringify(state, null, 2)}\n`;
        writeFileSync(paths.launcherState, text, { mode: 0o600 });
        expect(() => contract.readState(paths), name).toThrow('not valid launcher state');
        expect(readLauncherState(runnerPaths(root)), name).toEqual({ unreadable: 'not valid launcher state' });
        const lines: string[] = [];
        expect(await overseerCommand(['status'], { env: { OVERSEER_ROOT: root }, log: line => lines.push(line) }), name).toBe(0);
        expect(JSON.parse(lines.join('\n')).launcher, name).toEqual({ unreadable: 'not valid launcher state' });
        expect(readFileSync(paths.launcherState, 'utf8'), name).toBe(text);
        expect(() => contract.saveState(paths, state), name).toThrow('Refusing to save invalid launcher state');
    }
    expect(readLauncherState(runnerPaths(join(tempDir(), 'runner')))).toEqual({ absent: true });
});

test('the launcher’s scalar checks are zod’s: ISO times and identifiers agree on every edge', async () => {
    const { z } = await import('zod');
    const fields = await launcherSource('field-checks');
    const times = ['2026-11-26T09:00:00.000Z', '2026-11-26T09:00:00Z', '2026-11-26T09:00:00.1234567890Z', '2028-02-29T00:00:00Z', '2026-11-26T09:00Z', '2026-02-29T00:00:00Z',
        '2026-02-30T09:00:00.000Z', '2026-04-31T00:00:00Z', '2026-11-26T24:00:00Z', '2026-11-26T09:60:00Z', '2026-11-26T09:00:60Z', '2026-11-26T09:00:00+01:00', '2026-11-26 09:00:00Z', ['2026-11-26T09:00:00Z'], 20261126, null];
    for (const value of times) expect(fields.isIso(value), JSON.stringify(value)).toBe(z.iso.datetime().safeParse(value).success);
    const passIds = ['7b0c6a43-62f8-4a49-9f11-8d1b2f6ad0c4', '7B0C6A43-62F8-4A49-9F11-8D1B2F6AD0C4', '00000000-0000-0000-0000-000000000000', 'ffffffff-ffff-ffff-ffff-ffffffffffff',
        '7b0c6a43-62f8-0a49-9f11-8d1b2f6ad0c4', '7b0c6a43-62f8-4a49-cf11-8d1b2f6ad0c4', '7b0c6a4362f84a499f118d1b2f6ad0c4', ['7b0c6a43-62f8-4a49-9f11-8d1b2f6ad0c4']];
    for (const value of passIds) expect(fields.isRfcUuid(value), JSON.stringify(value)).toBe(z.uuid().safeParse(value).success);
    for (const value of [['a'.repeat(40)], 'a'.repeat(40)]) expect(fields.isSha(value), JSON.stringify(value)).toBe(typeof value === 'string');
    for (const value of [[ID(1)], ID(1), ID(1).toUpperCase()]) expect(fields.isUuid(value), JSON.stringify(value)).toBe(value === ID(1));
});

test('status tells a guard that is absent, present, or cannot be looked at, and an owner without a start time is unreadable; it writes nothing', async () => {
    const { chmodSync, mkdirSync: makeDirectory } = await import('node:fs');
    const { readLauncherLock } = await import('../../../server/overseer/launcher-state');
    const root = join(tempDir(), 'runner'), paths = runnerPaths(root);
    makeDirectory(paths.control, { recursive: true, mode: 0o700 });
    expect(readLauncherLock(paths)).toEqual({ absent: true, guardLeft: false });
    writeFileSync(paths.launcherGuard, '');
    expect(readLauncherLock(paths).guardLeft).toBe(true);
    writeFileSync(paths.launcherLock, JSON.stringify({ id: ID(1), pid: 4242, start: '', at: AT }));
    expect(readLauncherLock(paths)).toMatchObject({ unreadable: 'not a launcher owner record' });
    const before = snapshot(root);
    chmodSync(paths.control, 0o000);
    try {
        const read = readLauncherLock(paths);
        expect(read.guardLeft).toEqual({ unreadable: expect.stringContaining('cannot tell whether') });
        expect(read).toHaveProperty('unreadable');
    } finally { chmodSync(paths.control, 0o700); }
    expect(snapshot(root)).toEqual(before);
});
