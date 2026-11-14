import { constants, type Stats } from 'node:fs';
import { mkdtemp, open, rm, unlink, type FileHandle } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ContextReadChanged, sameContextFile } from './session-context-lines';
import { captureSessionContextClone } from './session-context-clone';

/** Capture one coherent file version before the JSON fold. Portable copies still require stability. */
export async function withSessionContextSnapshot<T>(file: string, version: Stats, deadline: number,
    read: (file: FileHandle, version: Stats) => Promise<T>): Promise<T> {
    const directory = await mkdtemp(join(tmpdir(), 'office-session-snapshot-'));
    try {
        const source = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
        try {
            const opened = await source.stat();
            if (opened.ino !== version.ino || opened.dev !== version.dev || !opened.isFile())
                throw new ContextReadChanged('Session context file identity changed before capture');
            const path = join(directory, 'context.jsonl'), target = await open(path, 'wx+', 0o600);
            try {
                // The descriptor owns the temporary bytes. Even a process crash
                // cannot leave a named transcript behind after this unlink.
                await unlink(path);
                // The clone uses the already verified descriptor, not a pathname
                // reopened by a child. Later appends cannot change its captured bytes.
                if (await captureSessionContextClone(source, target, join(directory, 'clone'), deadline))
                    return await read(target, await target.stat());
                if (!sameContextFile(version, await source.stat())) throw new ContextReadChanged('Session context file changed before capture');
                const buffer = Buffer.alloc(1024 * 1024);
                let offset = 0;
                while (offset < version.size) {
                    if (performance.now() > deadline) throw new Error('Session context scan exceeded its read deadline');
                    const { bytesRead } = await source.read(buffer, 0, Math.min(buffer.length, version.size - offset), offset);
                    if (!bytesRead) throw new ContextReadChanged('Session context file ended during capture');
                    await target.writeFile(buffer.subarray(0, bytesRead));
                    offset += bytesRead;
                }
                if (!sameContextFile(version, await source.stat())) throw new ContextReadChanged('Session context file changed during capture');
                return await read(target, await target.stat());
            } finally { await target.close(); }
        } finally { await source.close(); }
    } finally { await rm(directory, { recursive: true, force: true }); }
}
