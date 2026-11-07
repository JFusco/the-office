import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { resolve, sep } from 'node:path';

export type OwnedArtifact = { path: string; sha256: string; text: string } | { reason: 'missing' | 'symlink' | 'not-owned' | 'too-large' | 'unreadable' };

/**
 * Reads `<dataRoot>/sessions/<workId>/<name>` only when every path segment is a real, owned,
 * non-symlinked entry and the file is within `maxBytes`. Mirrors the proof reader used by time
 * classification; it returns a reason instead of throwing so callers can record coverage gaps.
 */
export function readOwnedSessionArtifact(dataRoot: string, workId: string, name: string, maxBytes: number): OwnedArtifact {
    if (!/^[\w-]{1,80}$/.test(workId) || !/^[\w.-]{1,80}$/.test(name)) return { reason: 'not-owned' };
    try {
        const root = realpathSync(dataRoot), path = resolve(root, 'sessions', workId, name);
        for (const item of [resolve(root, 'sessions'), resolve(root, 'sessions', workId), path])
            if (lstatSync(item).isSymbolicLink()) return { reason: 'symlink' };
        const info = lstatSync(path);
        if (!info.isFile() || !realpathSync(path).startsWith(root + sep)) return { reason: 'not-owned' };
        if (info.size > maxBytes) return { reason: 'too-large' };
        const bytes = readFileSync(path);
        return { path, sha256: createHash('sha256').update(bytes).digest('hex'), text: bytes.toString('utf8') };
    }
    catch (error) { return { reason: (error as NodeJS.ErrnoException)?.code === 'ENOENT' ? 'missing' : 'unreadable' }; }
}
