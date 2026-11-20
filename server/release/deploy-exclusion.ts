import { existsSync, readdirSync } from 'node:fs';
import type { DeployContext } from './deploy-context';
import type { DeployOutcome } from './deploy-facts';
import { readDeployJournal } from './deploy-journal';
import { acquireDeployLock } from './deploy-lock';
import { readOutcome } from './deploy-outcome';
import { deployPaths } from './deploy-paths';
import { standingStop } from './deploy-stop';

/**
 * Deployments that journaled a plan and never recorded an outcome: their controller died, or is
 * still running. Read from the journals, so the answer does not depend on who last held the lock.
 * A journal that cannot be read counts: its deployment cannot be shown finished.
 */
export function unfinishedDeployments(dataRoot: string): string[] {
    const { directory } = deployPaths(dataRoot);
    if (!existsSync(directory)) return [];
    return readdirSync(directory).filter(name => name.endsWith('.jsonl')).map(name => name.slice(0, -'.jsonl'.length)).filter(operation => {
        try { return readDeployJournal(dataRoot, operation).facts.kind === 'deploy' && !readOutcome(dataRoot, operation); }
        catch { return true; }
    }).sort();
}

/**
 * Runs one deployment at a time: refused under a STOP record, while another deployment holds the
 * lock, and while any other deployment is unfinished. An unfinished deployment is resumed, or ended
 * by a person; it is never stepped over.
 */
export async function exclusively(ctx: Pick<DeployContext, 'dataRoot' | 'now'>, operation: string, run: () => Promise<DeployOutcome>): Promise<DeployOutcome> {
    const refused = (reason: string): DeployOutcome => ({ status: 'refused', operation, step: null, reason });
    const stop = standingStop(ctx.dataRoot);
    if (stop) return refused(stop);
    let lock;
    try { lock = acquireDeployLock(ctx.dataRoot, operation, { now: ctx.now }); }
    catch (error) { return refused(String(error instanceof Error ? error.message : error)); }
    try {
        const stop = standingStop(ctx.dataRoot);
        if (stop) return refused(stop);
        const [interrupted] = unfinishedDeployments(ctx.dataRoot).filter(other => other !== operation);
        if (interrupted) return refused(`Deployment ${interrupted} was interrupted and recorded no outcome; resume it with pnpm office deploy resume ${interrupted}, or end it with pnpm office deploy end ${interrupted}`);
        return await run();
    } finally { lock.release(); }
}
