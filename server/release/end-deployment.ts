import { existsSync } from 'node:fs';
import { fenceTokenDigest } from '../office/deployment-fence';
import { settle, type Settled } from './settle-mutation';
import type { DeployContext } from './deploy-context';
import { operationPaths } from './deploy-paths';
import { readDeployToken, removeDeployToken } from './deploy-token';

/**
 * Ends a deployment's hold on the Office: releases the fence its own token holds, and nothing else.
 * It never resumes a project, changes a pause or clears a drain, and it refuses a fence another
 * token holds. The token file is removed only after the fence reads open.
 */
export async function endDeployment(ctx: DeployContext, operation: string, owner: string, step = 'release', ready?: () => Promise<void>): Promise<Settled> {
    // The token is removed only after its fence read open, so a missing token with an open fence is an ended deployment.
    if (!existsSync(operationPaths(ctx.dataRoot, owner).token) && (await ctx.office.fence()).status === 'open') return { status: 'verified', receipt: { fence: 'open' } };
    const token = readDeployToken(ctx.dataRoot, owner), tokenDigest = fenceTokenDigest(token);
    const settled = await settle({
        effects: ctx.effects, operation, step, payload: { tokenDigest, deployment: owner },
        preflight: async () => {
            const fence = await ctx.office.fence();
            if (fence.status === 'invalid') throw new Error(`The deployment fence is unreadable: ${fence.reason}`);
            if (fence.status === 'held' && fence.tokenDigest !== tokenDigest) throw new Error(`The deployment fence is held by ${fence.deployment}, not ${owner}`);
            await ready?.();
        },
        dispatch: async () => { await ctx.office.releaseFence(token); },
        confirm: async () => (await ctx.office.fence()).status === 'open' ? { fence: 'open' } : null,
    });
    if (settled.status === 'verified') removeDeployToken(ctx.dataRoot, owner);
    return settled;
}
