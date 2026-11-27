import { chmodSync, closeSync, constants, fstatSync, mkdirSync, openSync, readSync, renameSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, vi } from 'vitest';
import { isStopped, provesOwnership, readStatus, statusPath, stopGeneration, updateStatus, StatusRefused, type PassProof } from '../../../../server/overseer/provider-auth/profile-status';
import { enrolledRunner } from './provider-world';

const A = 'a'.repeat(64), B = 'b'.repeat(64);

test('an absent record is empty, and an unreadable one is refused rather than taken as clear', () => {
    const world = enrolledRunner();
    try {
        expect(readStatus(world.paths)).toEqual({ ok: true, status: { version: 1, stops: { claude: [], codex: [] }, active: null } });
        writeFileSync(statusPath(world.paths), '{"version":1,"stops":{}}');
        expect(readStatus(world.paths).ok).toBe(false);
        expect(() => stopGeneration(world.paths, world.proof, 'claude', A, 'sign-in-rejected')).toThrow(StatusRefused);
    } finally { world.lock.release(); }
});

test('only the current holder of the pass lock, by its own record, may change the status', () => {
    const world = enrolledRunner();
    try {
        expect(provesOwnership(world.paths, world.proof)).toBe(true);
        const forged: PassProof[] = [
            { ...world.proof, owner: { ...world.proof.owner, pass: 'another-pass' } },
            { ...world.proof, owner: { ...world.proof.owner, at: '2026-01-01T00:00:00.000Z' } },
            { ...world.proof, owner: { ...world.proof.owner, pid: world.proof.owner.pid + 1 } },
            { ...world.proof, root: '/somewhere/else' },
        ];
        for (const proof of forged) expect(() => updateStatus(world.paths, proof, () => {})).toThrow(StatusRefused);
        world.lock.release();
        expect(provesOwnership(world.paths, world.proof)).toBe(false);
    } finally { world.lock.release(); }
});

test('a stop is kept per generation: a late failure of an older generation never stops a newer one, and nothing else is lost', () => {
    const world = enrolledRunner();
    try {
        stopGeneration(world.paths, world.proof, 'codex', B, 'refresh-rejected');
        updateStatus(world.paths, world.proof, status => { status.active = { provider: 'codex', owner: world.proof.owner, run: '3f2a9c4e-1b7d-4e8a-9c0f-5d6e7a8b9c01', generation: B, sourceDigest: A, copiedDigest: A, phase: 'staged', group: null }; });
        stopGeneration(world.paths, world.proof, 'claude', A, 'sign-in-rejected');
        stopGeneration(world.paths, world.proof, 'codex', A, 'rotation-unverified');
        stopGeneration(world.paths, world.proof, 'codex', A, 'rotation-unverified');
        const read = readStatus(world.paths);
        if (!read.ok) throw new Error(read.reason);
        expect(read.status.stops.codex.map(stop => [stop.generation, stop.reason])).toEqual([[B, 'refresh-rejected'], [A, 'rotation-unverified']]);
        expect(read.status.active).toMatchObject({ generation: B });
        expect(isStopped(read.status, 'claude', A)).toBe(true);
        expect(isStopped(read.status, 'claude', B)).toBe(false);
        expect(isStopped(read.status, 'codex', 'c'.repeat(64))).toBe(false);
    } finally { world.lock.release(); }
});

test('provider status verifies its directory and opens its private single-link regular file without blocking', () => {
    const world = enrolledRunner(), file = statusPath(world.paths);
    const open = vi.fn(openSync), files = { open, fstat: fstatSync, read: readSync, close: closeSync };
    try {
        expect(readStatus(world.paths, { files })).toMatchObject({ ok: true, status: { active: null } });
        expect(open).toHaveBeenCalledWith(file, constants.O_RDONLY | constants.O_NONBLOCK | constants.O_NOFOLLOW);
        updateStatus(world.paths, world.proof, () => {});
        expect(readStatus(world.paths, { files }).ok).toBe(true);
        chmodSync(file, 0o644);
        expect(readStatus(world.paths, { files }).ok).toBe(false);
        renameSync(file, file + '.saved');
        mkdirSync(file);
        expect(readStatus(world.paths, { files }).ok).toBe(false);
        renameSync(world.paths.state, world.paths.state + '-saved');
        symlinkSync(world.paths.state + '-saved', world.paths.state);
        open.mockClear();
        expect(readStatus(world.paths, { files }).ok).toBe(false);
        expect(open).not.toHaveBeenCalled();
    } finally { world.lock.release(); }
});

test('a status record outside the root\'s own state folder is refused', () => {
    const world = enrolledRunner(), elsewhere = { ...world.paths, state: join(world.paths.root, 'elsewhere') };
    try {
        mkdirSync(elsewhere.state, { mode: 0o700 });
        writeFileSync(statusPath(elsewhere), '{"version":1,"stops":{"claude":[],"codex":[]},"active":null}\n', { mode: 0o600 });
        expect(readStatus(elsewhere)).toEqual({ ok: false, reason: 'The state directory is outside its expected location' });
        expect(readStatus(world.paths).ok).toBe(true);
    } finally { world.lock.release(); }
});
