import { spawn } from 'node:child_process';
import { constants } from 'node:fs';
import { open, unlink, type FileHandle } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/**
 * Optional public OS snapshot: a clone of the already verified descriptor, opened and then left without a name.
 * The clone shares the log's blocks, so capture does not grow with the log's size, and later appends cannot
 * change it. `path` must be inside a directory only the service can read: between the clone and the unlink the
 * clone has that name. Null on hosts without the primitive, which keep the strict portable copy.
 */
export async function captureSessionContextClone(source: FileHandle, path: string, deadline: number): Promise<FileHandle | null> {
    if (process.platform !== 'darwin') return null;
    const timeout = Math.ceil(deadline - performance.now());
    if (timeout <= 0) throw new Error('Session context scan exceeded its read deadline');
    const helper = fileURLToPath(new URL('../../scripts/capture-session-clone.py', import.meta.url));
    let result: { code: number | null; signal: NodeJS.Signals | null };
    try {
        result = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve, reject) => {
            const child = spawn('/usr/bin/python3', ['-I', '-S', helper, path], {
                stdio: ['ignore', 'ignore', 'ignore', source.fd],
                env: { PATH: '/usr/bin:/bin', LANG: 'C' }, timeout, killSignal: 'SIGKILL',
            });
            child.once('error', reject);
            child.once('close', (code, signal) => resolve({ code, signal }));
        });
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
        throw error;
    }
    if (result.code === 66 && !result.signal) return null;
    if (result.code !== 0 || result.signal) {
        // A helper stopped after cloning may have left the name behind.
        await unlink(path).catch(() => undefined);
        if (performance.now() > deadline) throw new Error('Session context scan exceeded its read deadline');
        throw new Error('Session context native snapshot could not complete');
    }
    let clone: FileHandle;
    try { clone = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW); }
    finally { await unlink(path).catch(() => undefined); }
    try {
        // The descriptor now owns the captured bytes: nothing with a name remains.
        if (!(await clone.stat()).isFile()) throw new Error('Session context native snapshot could not complete');
        await clone.chmod(0o600);
        if (performance.now() > deadline) throw new Error('Session context scan exceeded its read deadline');
        return clone;
    } catch (error) { await clone.close(); throw error; }
}
