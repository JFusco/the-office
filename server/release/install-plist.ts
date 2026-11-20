import { copyFileSync, existsSync, renameSync } from 'node:fs';
import { settle, type Settled } from './settle-mutation';
import type { DeployContext } from './deploy-context';
import { fileDigest } from './release-manifest';

/**
 * Puts a prepared plist file in place of the service's, by copy and rename, so launchd never reads a
 * partial file. Confirmed by the installed file's digest. Used for the target plist and, on a
 * rollback, for the saved previous one.
 */
export async function installPlist(ctx: DeployContext, operation: string, step: string, source: { path: string; sha256: string }, ready?: () => Promise<void>): Promise<Settled> {
    return settle({
        effects: ctx.effects, operation, step, payload: { plist: ctx.plistPath, sha256: source.sha256 },
        preflight: async () => {
            await ready?.();
            if (!existsSync(source.path) || fileDigest(source.path) !== source.sha256) throw new Error(`The prepared plist ${source.path} is missing or no longer matches ${source.sha256}`);
        },
        dispatch: async () => {
            // Not a `.plist` name, so launchd ignores the draft.
            const draft = `${ctx.plistPath}.${operation}.tmp`;
            copyFileSync(source.path, draft);
            renameSync(draft, ctx.plistPath);
        },
        confirm: async () => existsSync(ctx.plistPath) && fileDigest(ctx.plistPath) === source.sha256 ? { sha256: source.sha256 } : null,
    });
}
