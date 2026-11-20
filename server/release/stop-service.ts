import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { settle, type Settled } from './settle-mutation';
import type { DeployContext } from './deploy-context';
import { until } from './poll-until';
import { bootout, serviceLoaded } from './launchctl';
import { SERVICE_LABEL } from './service-plist';

/** Stopped means launchd no longer has the service and neither the known process nor the lock's owner is alive. */
export async function readStoppedService(ctx: DeployContext, pid: number | null): Promise<Record<string, unknown> | null> {
    if (await serviceLoaded(ctx.execute, ctx.domain)) return null;
    if (pid && ctx.alive(pid)) return null;
    const lock = resolve(ctx.dataRoot, 'service.pid');
    const owner = existsSync(lock) ? Number(readFileSync(lock, 'utf8').trim()) : 0;
    if (Number.isInteger(owner) && owner > 0 && ctx.alive(owner)) return null;
    return { loaded: false, pid };
}

/**
 * Stops the service by removing it from launchd, then waits for its process to be gone. A service
 * already stopped is confirmed, not stopped again. `ready` runs before the stop is dispatched. The
 * process ID only guides the read-back; the effect's identity does not depend on it.
 */
export async function stopService(ctx: DeployContext, operation: string, step: string, pid: number | null, ready?: () => Promise<void>): Promise<Settled> {
    let waited = false;
    return settle({
        effects: ctx.effects, operation, step, payload: { service: SERVICE_LABEL },
        preflight: ready,
        dispatch: async () => { await bootout(ctx.execute, ctx.domain); },
        // The first read answers at once; after a dispatch the process is given time to exit.
        confirm: async () => {
            if (!waited) { waited = true; return readStoppedService(ctx, pid); }
            return until(ctx, ctx.timings.stopDeadlineMs, () => readStoppedService(ctx, pid), Boolean);
        },
    });
}
