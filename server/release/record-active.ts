import { ActiveRelease, readActiveRelease } from './active-release';
import { settle, type Settled } from './settle-mutation';
import type { DeployContext } from './deploy-context';
import { writeDurable } from './durable-file';
import { releasePaths } from './release-paths';

// The receipt's shape and its reader live in active-release.ts, so the service can read it without loading the controller.
export { ActiveRelease, readActiveRelease };

/** Writes the active-release record after the loaded release was verified. The plist stays the source of truth for what runs. */
export async function recordActive(ctx: DeployContext, operation: string, record: ActiveRelease, ready?: () => Promise<void>): Promise<Settled> {
    const body = ActiveRelease.parse(record);
    return settle({
        effects: ctx.effects, operation, step: 'record', payload: body,
        preflight: ready,
        dispatch: async () => writeDurable(releasePaths(ctx.dataRoot).active, `${JSON.stringify(body, null, 2)}\n`),
        confirm: async () => JSON.stringify(readActiveRelease(ctx.dataRoot)) === JSON.stringify(body) ? { commit: body.commit } : null,
    });
}
