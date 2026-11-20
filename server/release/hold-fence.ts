import { fenceTokenDigest } from '../office/deployment-fence';
import { settle, type Settled } from './settle-mutation';
import type { DeployContext } from './deploy-context';
import { readDeployToken } from './deploy-token';

/**
 * Acquires the deployment fence for `owner` with its saved token. Refused before dispatch when the
 * fence is held by anything else, so a plain "someone else is deploying" is never an uncertain effect.
 */
export async function holdFence(ctx: DeployContext, operation: string, owner: string): Promise<Settled> {
    const token = readDeployToken(ctx.dataRoot, owner), tokenDigest = fenceTokenDigest(token);
    return settle({
        effects: ctx.effects, operation, step: 'fence', payload: { tokenDigest, deployment: owner },
        preflight: async () => {
            const fence = await ctx.office.fence();
            if (fence.status !== 'open') throw new Error(fence.status === 'held' ? `The deployment fence is held by ${fence.deployment}` : `The deployment fence is unreadable: ${fence.reason}`);
        },
        dispatch: async () => { await ctx.office.acquireFence(token, owner); },
        confirm: async () => {
            const fence = await ctx.office.fence();
            return fence.status === 'held' && fence.tokenDigest === tokenDigest ? { tokenDigest, acquiredAt: fence.acquiredAt } : null;
        },
    });
}
