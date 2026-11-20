import { existsSync, readFileSync } from 'node:fs';
import { z } from 'zod';
import { settle, type Settled } from './settle-mutation';
import type { DeployContext } from './deploy-context';
import { writeDurable } from './durable-file';
import { releasePaths } from './release-paths';

/** The receipt of a verified activation: which release serves, proven by which deployment. */
export const ActiveRelease = z.object({
    version: z.literal(1),
    commit: z.string().regex(/^[0-9a-f]{40}$/), hash: z.string().regex(/^[0-9a-f]{64}$/),
    /** Digest of the release's `release.json` as it was frozen before activation. */
    manifestDigest: z.string().regex(/^[0-9a-f]{64}$/),
    previous: z.string().regex(/^[0-9a-f]{40}$/),
    operation: z.string().min(1), serviceInstanceId: z.string().min(1), activatedAt: z.iso.datetime(),
}).strict();
export type ActiveRelease = z.infer<typeof ActiveRelease>;

/** The saved record when it has this shape; a record written by hand before deployments existed is null. */
export function readActiveRelease(dataRoot: string): ActiveRelease | null {
    const path = releasePaths(dataRoot).active;
    if (!existsSync(path)) return null;
    try { return ActiveRelease.parse(JSON.parse(readFileSync(path, 'utf8'))); } catch { return null; }
}

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
