import { spawn } from 'node:child_process';
import type { FileHandle } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/** Optional public OS snapshot; unsupported hosts retain the strict portable copy. */
export async function captureSessionContextClone(source: FileHandle, target: FileHandle, path: string, deadline: number): Promise<boolean> {
    if (process.platform !== 'darwin') return false;
    const timeout = Math.ceil(deadline - performance.now());
    if (timeout <= 0) throw new Error('Session context scan exceeded its read deadline');
    const helper = fileURLToPath(new URL('../../scripts/capture-session-clone.py', import.meta.url));
    let result: { code: number | null; signal: NodeJS.Signals | null };
    try {
        result = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve, reject) => {
            const child = spawn('/usr/bin/python3', ['-I', '-S', helper, path], {
                stdio: ['ignore', 'ignore', 'ignore', source.fd, target.fd],
                env: { PATH: '/usr/bin:/bin', LANG: 'C' }, timeout, killSignal: 'SIGKILL',
            });
            child.once('error', reject);
            child.once('close', (code, signal) => resolve({ code, signal }));
        });
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
        throw error;
    }
    if (performance.now() > deadline) throw new Error('Session context scan exceeded its read deadline');
    if (result.code === 66 && !result.signal && (await target.stat()).size === 0) return false;
    if (result.code !== 0 || result.signal) throw new Error('Session context native snapshot could not complete');
    return true;
}
