import { randomUUID } from 'node:crypto';
import { closeSync, linkSync, openSync, readFileSync, renameSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const deployLockPath = (dataRoot: string) => resolve(dataRoot, 'deploy.lock');

export interface DeployLockOwner { pid: number; operation: string; at: string }
export interface DeployLock {
    /** Removes only this owner's own lock; safe to repeat. */
    release: () => void;
    /** The dead owner whose lock this deployment took over, so its journal can be read before anything else. */
    reclaimed: DeployLockOwner | null;
}

function pidAlive(pid: number): boolean {
    try { process.kill(pid, 0); return true; }
    catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code === 'ESRCH') return false;
        if (code === 'EPERM') return true;
        throw error;
    }
}

// Undefined means the lock is absent. Null means its owner could not be read.
function readOwner(path: string): DeployLockOwner | null | undefined {
    try {
        const owner = JSON.parse(readFileSync(path, 'utf8')) as DeployLockOwner;
        return Number.isInteger(owner.pid) && owner.pid > 0 && typeof owner.operation === 'string' && typeof owner.at === 'string' ? owner : null;
    } catch (error) {
        return (error as NodeJS.ErrnoException).code === 'ENOENT' ? undefined : null;
    }
}

const exists = (error: unknown) => (error as NodeJS.ErrnoException).code === 'EEXIST';

/**
 * One deployment at a time per data root, which must already exist. Refused while the recorded owner's
 * process is alive, including when another process has since taken that PID. A dead owner's lock is
 * reclaimed under a second guard file, so two contenders cannot both take it. An unreadable lock or a
 * leftover guard is refused, never guessed at: remove it by hand once no deployment is running.
 */
export function acquireDeployLock(dataRoot: string, operation: string, options: { pid?: number; alive?: (pid: number) => boolean; now?: () => Date } = {}): DeployLock {
    const { pid = process.pid, alive = pidAlive, now = () => new Date() } = options;
    const path = deployLockPath(dataRoot), guard = `${path}.reclaim`;
    const deadOwner = (owner: ReturnType<typeof readOwner>) => {
        if (owner === undefined) throw new Error(`The deploy lock ${path} was released while this deployment checked it. Try again.`);
        if (!owner) throw new Error(`The deploy lock ${path} is unreadable; inspect and remove it by hand`);
        if (alive(owner.pid)) throw new Error(`Deployment ${owner.operation} (PID ${owner.pid}) holds the deploy lock. If that process is not a deployment, remove ${path} by hand`);
        return owner;
    };
    const seen = readOwner(path);
    if (seen !== undefined) deadOwner(seen);
    try { closeSync(openSync(guard, 'wx', 0o600)); }
    catch (error) {
        if (exists(error)) throw new Error(`Another deployment is acquiring the deploy lock, or left ${guard} behind; inspect and remove it by hand`);
        throw error;
    }
    try {
        const current = readOwner(path);
        let reclaimed: DeployLockOwner | null = null;
        if (seen !== undefined || current !== undefined) {
            reclaimed = deadOwner(current);
            if (reclaimed.pid !== seen?.pid || reclaimed.operation !== seen.operation || reclaimed.at !== seen.at)
                throw new Error(`Deployment ${reclaimed.operation} (PID ${reclaimed.pid}) took the deploy lock first`);
        }
        const own = { pid, operation, at: now().toISOString() } satisfies DeployLockOwner;
        const draft = `${path}.${pid}.${randomUUID()}`;
        writeFileSync(draft, JSON.stringify(own), { mode: 0o600, flag: 'wx' });
        try {
            // Publish a complete record, keeping the old one in place until takeover succeeds.
            if (reclaimed) renameSync(draft, path);
            else linkSync(draft, path);
        } finally { rmSync(draft, { force: true }); }
        let released = false;
        const release = () => {
            if (released) return;
            const owner = readOwner(path);
            if (owner?.pid !== pid || owner.operation !== operation || owner.at !== own.at) return;
            unlinkSync(path);
            released = true;
        };
        return { release, reclaimed };
    } finally { unlinkSync(guard); }
}
