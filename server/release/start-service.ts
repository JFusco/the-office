import { existsSync } from 'node:fs';
import { settle, type Settled } from './settle-mutation';
import type { DeployContext } from './deploy-context';
import { bootstrap, serviceLoaded } from './launchctl';
import { fileDigest } from './release-manifest';

/** Loads the installed plist into launchd. Refused unless the installed file is the one this operation expects. */
export async function startService(ctx: DeployContext, operation: string, step: string, plistSha256: string, ready?: () => Promise<void>): Promise<Settled> {
    return settle({
        effects: ctx.effects, operation, step, payload: { plist: ctx.plistPath, sha256: plistSha256 },
        preflight: async () => {
            await ready?.();
            if (!existsSync(ctx.plistPath) || fileDigest(ctx.plistPath) !== plistSha256) throw new Error(`The service plist ${ctx.plistPath} is not the one this deployment installed`);
        },
        dispatch: async () => { await bootstrap(ctx.execute, ctx.domain, ctx.plistPath); },
        confirm: async () => await serviceLoaded(ctx.execute, ctx.domain) ? { loaded: true } : null,
    });
}
