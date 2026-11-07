import { createHash } from 'node:crypto';
import { closeSync, constants, fstatSync, lstatSync, openSync, readSync, realpathSync } from 'node:fs';
import { open } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

export type BoundedRead = { path: string; sha256: string; text: string } | { reason: 'missing' | 'symlink' | 'not-owned' | 'too-large' | 'unreadable' };
const FLAGS = constants.O_RDONLY | constants.O_NOFOLLOW;
const reasonOf = (error: unknown): 'missing' | 'symlink' | 'unreadable' => {
    const code = (error as NodeJS.ErrnoException)?.code;
    return code === 'ENOENT' ? 'missing' : code === 'ELOOP' ? 'symlink' : 'unreadable';
};
const done = (path: string, bytes: Buffer): BoundedRead => ({ path, sha256: createHash('sha256').update(bytes).digest('hex'), text: bytes.toString('utf8') });

/**
 * Reads a regular file through one descriptor opened with O_NOFOLLOW, so the checks and the
 * read see the same file (no swap to a symlink in between). At most `maxBytes` are read; a file
 * that is, or grows, larger is refused rather than read partially.
 */
export function readBoundedNoFollowSync(path: string, maxBytes: number): BoundedRead {
    let fd: number;
    try { fd = openSync(path, FLAGS); } catch (error) { return { reason: reasonOf(error) }; }
    try {
        if (!fstatSync(fd).isFile()) return { reason: 'not-owned' };
        const bytes = Buffer.alloc(maxBytes + 1);
        let total = 0, read: number;
        while (total <= maxBytes && (read = readSync(fd, bytes, total, maxBytes + 1 - total, total)) > 0) total += read;
        return total > maxBytes ? { reason: 'too-large' } : done(path, bytes.subarray(0, total));
    }
    catch (error) { return { reason: reasonOf(error) }; }
    finally { closeSync(fd); }
}

/** Async twin of readBoundedNoFollowSync for large files read off the event loop's critical path. */
export async function readBoundedNoFollow(path: string, maxBytes: number): Promise<BoundedRead> {
    let handle;
    try { handle = await open(path, FLAGS); } catch (error) { return { reason: reasonOf(error) }; }
    try {
        const stat = await handle.stat();
        if (!stat.isFile()) return { reason: 'not-owned' };
        if (stat.size > maxBytes) return { reason: 'too-large' };
        const bytes = Buffer.alloc(maxBytes + 1);
        let total = 0;
        for (;;) {
            const { bytesRead } = await handle.read(bytes, total, maxBytes + 1 - total, total);
            if (!bytesRead) break;
            total += bytesRead;
            if (total > maxBytes) return { reason: 'too-large' };
        }
        return done(path, bytes.subarray(0, total));
    }
    catch (error) { return { reason: reasonOf(error) }; }
    finally { await handle.close(); }
}

/**
 * Reads `<dataRoot>/sessions/<workId>/<name>` only when the session directories are real, owned,
 * non-symlinked entries; the file itself is read through readBoundedNoFollowSync. Returns a
 * reason instead of throwing so callers can record coverage gaps.
 */
export function readOwnedSessionArtifact(dataRoot: string, workId: string, name: string, maxBytes: number): BoundedRead {
    if (!/^[\w-]{1,80}$/.test(workId) || !/^[\w.-]{1,80}$/.test(name)) return { reason: 'not-owned' };
    try {
        const root = realpathSync(dataRoot);
        for (const dir of [resolve(root, 'sessions'), resolve(root, 'sessions', workId)]) {
            if (lstatSync(dir).isSymbolicLink()) return { reason: 'symlink' };
            if (!realpathSync(dir).startsWith(root + sep)) return { reason: 'not-owned' };
        }
    }
    catch (error) { return { reason: reasonOf(error) }; }
    return readBoundedNoFollowSync(resolve(dataRoot, 'sessions', workId, name), maxBytes);
}
