import { closeSync, openSync, unlinkSync } from 'node:fs';
import { z } from 'zod';
import { writeDurable, writeDurableIfAbsent } from '../release/durable-file';
import { readBoundedNoFollowSync } from '../store/owned-artifact';
import type { RunnerPaths } from './config';
import { ensurePrivateDirectory } from './runner-root';

const Owner = z.object({ pid: z.number().int().positive(), pass: z.string().min(1).max(100), at: z.iso.datetime() }).strict();
export type PassOwner = z.infer<typeof Owner>;

/** A pass that may not start. It changed nothing; the reason says what holds the runner. */
export class PassRefused extends Error {}

/** Whether a process is alive: `ESRCH` is dead, `EPERM` is alive, anything else is inconclusive and throws. */
export function pidAlive(pid: number): boolean {
    try { process.kill(pid, 0); return true; }
    catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code === 'ESRCH') return false;
        if (code === 'EPERM') return true;
        throw error;
    }
}

/** The recorded owner: absent, unreadable, or who it is. */
export function readPassOwner(paths: RunnerPaths): { owner: PassOwner } | { absent: true } | { unreadable: string } {
    const read = readBoundedNoFollowSync(paths.lock, 4096);
    if ('reason' in read) return read.reason === 'missing' ? { absent: true } : { unreadable: read.reason };
    try { return { owner: Owner.parse(JSON.parse(read.text)) }; }
    catch { return { unreadable: 'not a pass owner record' }; }
}

const same = (a: PassOwner, b: PassOwner) => a.pid === b.pid && a.pass === b.pass && a.at === b.at;

export interface PassLock {
    /** Removes the lock only while it still names this owner; safe to repeat. */
    release: () => void;
    /** The dead owner this pass took over from, if any. */
    reclaimed: PassOwner | null;
}

/**
 * One pass at a time per runner root, the ownership protocol of `server/release/deploy-lock.ts`
 * with the runner's own paths. Every acquisition, fresh or a takeover, first takes a
 * create-exclusive guard, so two contenders never interleave. Refused, changing nothing: a live
 * owner (including one whose PID another process has since taken), an owner whose liveness cannot
 * be told, an unreadable owner, an owner that changed while it was read, and a guard left behind
 * (remove it by hand once no pass runs).
 */
export function acquirePassLock(paths: RunnerPaths, pass: string, options: { pid?: number; alive?: (pid: number) => boolean; now?: () => Date } = {}): PassLock {
    const { pid = process.pid, alive = pidAlive, now = () => new Date() } = options;
    ensurePrivateDirectory(paths.control);
    try { closeSync(openSync(paths.guard, 'wx', 0o600)); }
    catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw new PassRefused(`Another pass is taking the lock, or one left ${paths.guard} behind; remove it by hand once no pass runs`);
        throw error;
    }
    try {
        const seen = readPassOwner(paths);
        if ('unreadable' in seen) throw new PassRefused(`The pass lock ${paths.lock} is unreadable (${seen.unreadable}); inspect and remove it by hand`);
        let reclaimed: PassOwner | null = null;
        if ('owner' in seen) {
            let live: boolean;
            try { live = alive(seen.owner.pid); }
            catch (error) { throw new PassRefused(`Cannot tell whether pass ${seen.owner.pass} (PID ${seen.owner.pid}) is alive: ${String(error instanceof Error ? error.message : error).slice(0, 200)}`); }
            if (live) throw new PassRefused(`Pass ${seen.owner.pass} (PID ${seen.owner.pid}) holds the runner. If that process is not a pass, remove ${paths.lock} by hand`);
            const again = readPassOwner(paths);
            if (!('owner' in again) || !same(again.owner, seen.owner)) throw new PassRefused(`The pass lock ${paths.lock} changed while it was read; try again`);
            reclaimed = seen.owner;
        }
        const own: PassOwner = { pid, pass, at: now().toISOString() }, text = JSON.stringify(own);
        if (reclaimed) writeDurable(paths.lock, text);
        else if (!writeDurableIfAbsent(paths.lock, text)) throw new PassRefused(`The pass lock ${paths.lock} appeared while it was taken; try again`);
        let released = false;
        const release = () => {
            if (released) return;
            const current = readPassOwner(paths);
            if (!('owner' in current) || !same(current.owner, own)) return;
            try { unlinkSync(paths.lock); }
            catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
            released = true;
        };
        return { release, reclaimed };
    } finally { unlinkSync(paths.guard); }
}
