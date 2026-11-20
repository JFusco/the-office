import { afterEach, expect, test, vi } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { acquireDeployLock, deployLockPath } from '../../../server/release/deploy-lock';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
function root() { const path = mkdtempSync(resolve(tmpdir(), 'office-deploy-lock-')); roots.push(path); return path; }
const owner = (dir: string) => JSON.parse(readFileSync(deployLockPath(dir), 'utf8'));

test('a second deployment is refused while the owner is alive, and the lock is left as it was', () => {
    const dir = root();
    expect(acquireDeployLock(dir, 'deploy-aaaaaaaa', { pid: 111, alive: () => true }).reclaimed).toBeNull();
    const before = readFileSync(deployLockPath(dir), 'utf8');
    expect(() => acquireDeployLock(dir, 'deploy-bbbbbbbb', { pid: 222, alive: () => true })).toThrow('deploy-aaaaaaaa (PID 111) holds the deploy lock');
    expect(readFileSync(deployLockPath(dir), 'utf8')).toBe(before);
    expect(readdirSync(dir)).toEqual(['deploy.lock']);
});

test("a dead owner's lock is reclaimed, and the reclaim names the owner it replaced", () => {
    const dir = root();
    acquireDeployLock(dir, 'deploy-aaaaaaaa', { pid: 111 });
    const lock = acquireDeployLock(dir, 'deploy-bbbbbbbb', { pid: 222, alive: pid => pid !== 111 });
    expect(lock.reclaimed).toMatchObject({ pid: 111, operation: 'deploy-aaaaaaaa' });
    expect(owner(dir)).toMatchObject({ pid: 222, operation: 'deploy-bbbbbbbb' });
    expect(readdirSync(dir)).toEqual(['deploy.lock']);
});

test('liveness is read from the real process table by default', () => {
    const dir = root(), exited = spawnSync(process.execPath, ['-e', '']).pid!;
    acquireDeployLock(dir, 'deploy-aaaaaaaa');
    expect(() => acquireDeployLock(dir, 'deploy-bbbbbbbb', { pid: 222 })).toThrow(`PID ${process.pid}`);
    writeFileSync(deployLockPath(dir), JSON.stringify({ pid: exited, operation: 'deploy-cccccccc', at: '2026-11-20T00:00:00.000Z' }));
    expect(acquireDeployLock(dir, 'deploy-bbbbbbbb', { pid: 222 }).reclaimed?.operation).toBe('deploy-cccccccc');
});

test('two contenders for one dead lock cannot both take it', () => {
    const dir = root();
    acquireDeployLock(dir, 'deploy-aaaaaaaa', { pid: 111 });
    let raced = false, second: unknown;
    // The second contender judges the owner dead, then the first one reclaims before it acts.
    const alive = (pid: number) => {
        if (pid === 111 && !raced) { raced = true; acquireDeployLock(dir, 'deploy-bbbbbbbb', { pid: 222, alive: p => p !== 111 }); }
        return pid !== 111;
    };
    try { acquireDeployLock(dir, 'deploy-cccccccc', { pid: 333, alive }); } catch (error) { second = error; }
    expect(String(second)).toContain('deploy-bbbbbbbb (PID 222)');
    expect(owner(dir)).toMatchObject({ pid: 222, operation: 'deploy-bbbbbbbb' });
    expect(readdirSync(dir)).toEqual(['deploy.lock']);
});

test('a leftover reclaim guard is refused for a person and nothing is changed', () => {
    const dir = root();
    acquireDeployLock(dir, 'deploy-aaaaaaaa', { pid: 111 });
    writeFileSync(`${deployLockPath(dir)}.reclaim`, '');
    expect(() => acquireDeployLock(dir, 'deploy-bbbbbbbb', { pid: 222, alive: () => false })).toThrow('remove it by hand');
    expect(owner(dir).operation).toBe('deploy-aaaaaaaa');
    expect(existsSync(`${deployLockPath(dir)}.reclaim`)).toBe(true);
});

test('a guard alone blocks fresh acquisition and stays in place', () => {
    const dir = root(), path = deployLockPath(dir), guard = `${path}.reclaim`;
    writeFileSync(guard, 'leftover');
    expect(() => acquireDeployLock(dir, 'deploy-aaaaaaaa')).toThrow('remove it by hand');
    expect(existsSync(path)).toBe(false);
    expect(readFileSync(guard, 'utf8')).toBe('leftover');
});

test('a contender during guarded takeover sees the old operation and cannot acquire', () => {
    const dir = root();
    acquireDeployLock(dir, 'deploy-aaaaaaaa', { pid: 111 });
    const lock = acquireDeployLock(dir, 'deploy-bbbbbbbb', {
        pid: 222,
        alive: () => false,
        now: () => {
            expect(owner(dir).operation).toBe('deploy-aaaaaaaa');
            expect(() => acquireDeployLock(dir, 'deploy-cccccccc', { pid: 333, alive: () => false })).toThrow('remove it by hand');
            return new Date();
        },
    });
    expect(lock.reclaimed?.operation).toBe('deploy-aaaaaaaa');
    expect(owner(dir).operation).toBe('deploy-bbbbbbbb');
});

test('a lock released during the first liveness check asks the contender to retry', () => {
    const dir = root();
    const first = acquireDeployLock(dir, 'deploy-aaaaaaaa', { pid: 111 });
    expect(() => acquireDeployLock(dir, 'deploy-bbbbbbbb', {
        pid: 222,
        alive: () => { first.release(); return false; },
    })).toThrow(/was released .* Try again/);
    expect(readdirSync(dir)).toEqual([]);
});

test.each(['EINVAL', 'EPERM', 'ESRCH'])('a PID probe returning %s follows the liveness policy', code => {
    const dir = root(), path = deployLockPath(dir);
    acquireDeployLock(dir, 'deploy-aaaaaaaa', { pid: 111 });
    const before = readFileSync(path, 'utf8');
    const probe = Object.assign(new Error('signal-zero probe failed'), { code });
    const kill = vi.spyOn(process, 'kill').mockImplementation(() => { throw probe; });
    try {
        const acquire = () => acquireDeployLock(dir, 'deploy-bbbbbbbb', { pid: 222 });
        if (code === 'ESRCH') {
            expect(acquire().reclaimed?.operation).toBe('deploy-aaaaaaaa');
            expect(owner(dir).operation).toBe('deploy-bbbbbbbb');
        } else {
            expect(acquire).toThrow(code === 'EPERM' ? 'holds the deploy lock' : probe);
            expect(readFileSync(path, 'utf8')).toBe(before);
        }
        expect(kill).toHaveBeenCalledWith(111, 0);
    } finally { kill.mockRestore(); }
});

test("release removes only the owner's own lock and is safe to repeat", () => {
    const dir = root();
    const first = acquireDeployLock(dir, 'deploy-aaaaaaaa', { pid: 111 });
    const second = acquireDeployLock(dir, 'deploy-bbbbbbbb', { pid: 222, alive: () => false });
    first.release();
    expect(owner(dir).operation).toBe('deploy-bbbbbbbb');
    second.release();
    expect(existsSync(deployLockPath(dir))).toBe(false);
    second.release();
});

test('an old release handle cannot remove a reacquired lock for the same operation and PID', () => {
    const dir = root(), options = { pid: 111, now: () => new Date('2026-11-20T00:00:00.000Z') };
    const first = acquireDeployLock(dir, 'deploy-aaaaaaaa', options);
    first.release();
    const second = acquireDeployLock(dir, 'deploy-aaaaaaaa', options);
    first.release();
    expect(owner(dir)).toMatchObject({ pid: 111, operation: 'deploy-aaaaaaaa' });
    expect(() => acquireDeployLock(dir, 'deploy-bbbbbbbb', { pid: 222, alive: () => true })).toThrow('holds the deploy lock');
    second.release();
    expect(existsSync(deployLockPath(dir))).toBe(false);
});

test('an unreadable or empty lock is refused rather than reclaimed', () => {
    for (const content of ['not json', '']) {
        const dir = root();
        writeFileSync(deployLockPath(dir), content);
        expect(() => acquireDeployLock(dir, 'deploy-aaaaaaaa', { alive: () => false })).toThrow('is unreadable');
        expect(readFileSync(deployLockPath(dir), 'utf8')).toBe(content);
    }
});

test('a data root that does not exist is refused, not created', () => {
    const missing = resolve(root(), 'mistyped');
    expect(() => acquireDeployLock(missing, 'deploy-aaaaaaaa')).toThrow();
    expect(existsSync(missing)).toBe(false);
});
