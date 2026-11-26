import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { expect, test, vi } from 'vitest';
import { acquirePassLock, PassRefused, pidAlive, readPassOwner } from '../../../server/overseer/single-flight';
import { runnerRoot } from './runner-world';

const now = () => new Date('2026-11-25T12:00:00.000Z');
const owner = (path: string) => JSON.parse(readFileSync(path, 'utf8'));

test('a pass takes the lock, records who holds it and leaves no guard', () => {
    const paths = runnerRoot(), lock = acquirePassLock(paths, 'pass-a', { pid: 111, now });
    expect(owner(paths.lock)).toEqual({ pid: 111, pass: 'pass-a', at: '2026-11-25T12:00:00.000Z' });
    expect(lock.reclaimed).toBeNull();
    expect(existsSync(paths.guard)).toBe(false);
});

test('a second pass is refused while the owner is alive, and the lock is left as it was', () => {
    const paths = runnerRoot();
    acquirePassLock(paths, 'pass-a', { pid: 111, now });
    const before = readFileSync(paths.lock, 'utf8');
    expect(() => acquirePassLock(paths, 'pass-b', { pid: 222, alive: () => true })).toThrow(PassRefused);
    expect(() => acquirePassLock(paths, 'pass-b', { pid: 222, alive: () => true })).toThrow('pass-a (PID 111) holds the runner');
    expect(readFileSync(paths.lock, 'utf8')).toBe(before);
    expect(existsSync(paths.guard)).toBe(false);
});

test("a dead owner's lock is reclaimed, naming the owner it replaced", () => {
    const paths = runnerRoot();
    acquirePassLock(paths, 'pass-a', { pid: 111, now });
    const lock = acquirePassLock(paths, 'pass-b', { pid: 222, alive: pid => pid !== 111, now });
    expect(lock.reclaimed).toMatchObject({ pid: 111, pass: 'pass-a' });
    expect(owner(paths.lock)).toMatchObject({ pid: 222, pass: 'pass-b' });
});

test('liveness that cannot be told refuses the pass', () => {
    const paths = runnerRoot();
    acquirePassLock(paths, 'pass-a', { pid: 111, now });
    expect(() => acquirePassLock(paths, 'pass-b', { pid: 222, alive: () => { throw new Error('EINVAL'); } })).toThrow('Cannot tell whether pass pass-a');
    expect(owner(paths.lock).pass).toBe('pass-a');
});

test('pidAlive treats ESRCH as dead, EPERM as alive, and anything else as inconclusive', () => {
    const kill = vi.spyOn(process, 'kill');
    try {
        kill.mockImplementationOnce(() => { throw Object.assign(new Error('gone'), { code: 'ESRCH' }); });
        expect(pidAlive(5)).toBe(false);
        kill.mockImplementationOnce(() => { throw Object.assign(new Error('not yours'), { code: 'EPERM' }); });
        expect(pidAlive(5)).toBe(true);
        kill.mockImplementationOnce(() => { throw Object.assign(new Error('odd'), { code: 'EINVAL' }); });
        expect(() => pidAlive(5)).toThrow('odd');
    } finally { kill.mockRestore(); }
    const exited = spawnSync(process.execPath, ['-e', '']).pid!;
    expect(pidAlive(exited)).toBe(false);
    expect(pidAlive(process.pid)).toBe(true);
});

test('an owner that changes while it is read is not taken over, even when both are dead', () => {
    const paths = runnerRoot();
    acquirePassLock(paths, 'pass-a', { pid: 111, now });
    const alive = () => {
        writeFileSync(paths.lock, JSON.stringify({ pid: 333, pass: 'pass-c', at: '2026-11-25T12:01:00.000Z' }));
        return false;
    };
    expect(() => acquirePassLock(paths, 'pass-b', { pid: 222, alive })).toThrow('changed while it was read');
    expect(owner(paths.lock).pass).toBe('pass-c');
});

test('an unreadable lock is refused and left for a person', () => {
    const paths = runnerRoot();
    acquirePassLock(paths, 'pass-a', { pid: 111, now }).release();
    writeFileSync(paths.lock, '{"pid":');
    expect(() => acquirePassLock(paths, 'pass-b', { pid: 222 })).toThrow('unreadable');
    expect(readFileSync(paths.lock, 'utf8')).toBe('{"pid":');
    expect(readPassOwner(paths)).toEqual({ unreadable: 'not a pass owner record' });
});

test('a guard left behind refuses every pass, with or without an owner file', () => {
    const paths = runnerRoot();
    acquirePassLock(paths, 'pass-a', { pid: 111, now }).release();
    writeFileSync(paths.guard, '');
    expect(() => acquirePassLock(paths, 'pass-b', { pid: 222 })).toThrow('left');
    expect(existsSync(paths.lock)).toBe(false);
    writeFileSync(paths.lock, JSON.stringify({ pid: 111, pass: 'pass-a', at: '2026-11-25T12:00:00.000Z' }));
    expect(() => acquirePassLock(paths, 'pass-b', { pid: 222, alive: () => false })).toThrow('left');
    expect(existsSync(paths.guard)).toBe(true);
});

test('release removes only its own lock and can be repeated', () => {
    const paths = runnerRoot(), first = acquirePassLock(paths, 'pass-a', { pid: 111, now });
    first.release();
    first.release();
    expect(existsSync(paths.lock)).toBe(false);
    const second = acquirePassLock(paths, 'pass-b', { pid: 222, now });
    first.release();
    expect(owner(paths.lock).pass).toBe('pass-b');
    writeFileSync(paths.lock, JSON.stringify({ pid: 333, pass: 'pass-c', at: '2026-11-25T12:01:00.000Z' }));
    second.release();
    expect(owner(paths.lock).pass).toBe('pass-c');
});
