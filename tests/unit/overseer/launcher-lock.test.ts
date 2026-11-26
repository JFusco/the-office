import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, expect, test } from 'vitest';
import { FAST, launchEnv, launcherSource, layout, release, writePin } from './launch-world';
import { tempDir } from './runner-world';

// One launcher at a time: a dead owner is reclaimed only on ESRCH and an unchanged reread.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let lock: any, roots: any;
beforeAll(async () => { [lock, roots] = await Promise.all((['launcher-lock', 'runner-root'] as const).map(launcherSource)); });

const ID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const owner = (pid: number, n = 1) => JSON.stringify({ id: ID(n), pid, start: 'Thu Nov 26 03:00:00 2026', at: '2026-11-26T08:00:00.000Z' });
const ESRCH = () => Object.assign(new Error('ESRCH'), { code: 'ESRCH' });
function system(kill: (pid: number, signal: number) => void = () => {}) {
    return { kill, now: () => new Date('2026-11-26T09:00:00.000Z'), ps: async () => ({ ok: true, code: 0, stdout: `${process.pid} ${process.pid} Thu Nov 26 03:00:00 2026 node launcher\n`, pid: 1 }) };
}
function paths(seed?: string) {
    const p = roots.launcherPaths(join(tempDir(), 'runner'));
    mkdirSync(p.control, { recursive: true, mode: 0o700 });
    if (seed !== undefined) writeFileSync(p.lock, seed, { mode: 0o600 });
    return p;
}

test('a free lock is taken with this launcher’s identity, and released only while it is still this launcher’s', async () => {
    const p = paths(), held = await lock.acquireLauncherLock(p, system(), ID(5));
    expect(held.held).toBe(true);
    expect(JSON.parse(readFileSync(p.lock, 'utf8'))).toEqual({ id: ID(5), pid: process.pid, start: 'Thu Nov 26 03:00:00 2026', at: '2026-11-26T09:00:00.000Z' });
    expect(() => readFileSync(p.guard)).toThrow();
    writeFileSync(p.lock, owner(4242, 6));
    held.release();
    expect(readFileSync(p.lock, 'utf8')).toBe(owner(4242, 6));
    const again = await lock.acquireLauncherLock(paths(), system(), ID(7));
    again.release();
});

test('a live owner, one that cannot be probed, an unreadable lock or a guard left behind refuses, and the lock stays', async () => {
    const cases: [string, string | undefined, (pid: number) => void, string, boolean?][] = [
        ['live owner', owner(4242), () => {}, 'holds the lock'],
        ['cannot be probed', owner(4242), () => { throw Object.assign(new Error('EPERM'), { code: 'EPERM' }); }, 'Cannot tell whether launcher PID 4242'],
        ['unreadable lock', '{', () => {}, 'cannot be read'],
        ['another shape', JSON.stringify({ id: ID(1), pid: 4242 }), () => {}, 'cannot be read'],
        ['guard left behind', owner(4242), () => {}, 'left behind', true],
    ];
    for (const [name, seed, kill, reason, guard] of cases) {
        const p = paths(seed);
        if (guard) writeFileSync(p.guard, '');
        const result = await lock.acquireLauncherLock(p, system(kill), ID(9));
        expect(result, name).toMatchObject({ held: false, reason: expect.stringContaining(reason) });
        expect(readFileSync(p.lock, 'utf8'), name).toBe(seed);
        if (guard) expect(readFileSync(p.guard, 'utf8'), name).toBe('');
    }
});

test('a dead owner is reclaimed; one that changed while it was read is not', async () => {
    const p = paths(owner(4242));
    const reclaimed = await lock.acquireLauncherLock(p, system(() => { throw ESRCH(); }), ID(3));
    expect(reclaimed.held).toBe(true);
    expect(JSON.parse(readFileSync(p.lock, 'utf8')).id).toBe(ID(3));
    reclaimed.release();
    const raced = paths(owner(4242));
    const result = await lock.acquireLauncherLock(raced, system(() => { writeFileSync(raced.lock, owner(4343, 2)); throw ESRCH(); }), ID(4));
    expect(result).toMatchObject({ held: false, reason: expect.stringContaining('changed while it was read') });
    expect(readFileSync(raced.lock, 'utf8')).toBe(owner(4343, 2));
});

test('a launcher that cannot read its own start time takes no lock and starts no pass; an owner without one cannot be read', async () => {
    const p = paths(), blind = { ...system(), ps: async () => ({ ok: true, code: 0, stdout: '', pid: 1 }) };
    expect(await lock.acquireLauncherLock(p, blind, ID(8))).toMatchObject({ held: false, reason: expect.stringContaining('start time cannot be read') });
    expect(() => readFileSync(p.lock)).toThrow();
    const empty = paths(JSON.stringify({ id: ID(1), pid: 4242, start: '', at: '2026-11-26T08:00:00.000Z' }));
    expect(await lock.acquireLauncherLock(empty, system(() => { throw ESRCH(); }), ID(9))).toMatchObject({ held: false, reason: expect.stringContaining('cannot be read') });
    const entry = await launcherSource('launch');
    const world = layout(), built = release(world.officeData, 'record');
    writePin(world.root, built);
    expect(await entry.launch({ env: launchEnv(world), limits: FAST, system: { ps: blind.ps }, noSignalHandlers: true, log: () => {}, warn: () => {} })).toBe(0);
    expect(existsSync(join(world.root, 'evidence.json'))).toBe(false);
    expect(existsSync(join(world.root, 'state', 'launcher.json'))).toBe(false);
});
