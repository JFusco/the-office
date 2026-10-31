import { openSync, closeSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Single-owner PID lock for the Office state directory; returns the release function. */
export function acquireServiceLock(dataRoot: string): () => void {
    const lockPath = resolve(dataRoot, 'service.pid');
    try {
        const fd = openSync(lockPath, 'wx', 0o600);
        writeFileSync(fd, String(process.pid));
        closeSync(fd);
    }
    catch {
        const pid = Number(readFileSync(lockPath, 'utf8'));
        let alive = false;
        try {
            process.kill(pid, 0);
            alive = true;
        }
        catch (error) {
            alive = (error as NodeJS.ErrnoException).code === 'EPERM';
        }
        if (alive)
            throw new Error(`Office service already owns this state (PID ${pid}). Stop that service before starting another Office.`);
        unlinkSync(lockPath);
        writeFileSync(lockPath, String(process.pid), { mode: 0o600, flag: 'wx' });
    }
    function releaseLock() {
        try {
            if (Number(readFileSync(lockPath, 'utf8')) === process.pid)
                unlinkSync(lockPath);
        }
        catch { }
    }
    return releaseLock;
}
