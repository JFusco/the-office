import { existsSync } from 'node:fs';
import type { DeployContext } from './deploy-context';
import type { DeployOutcome } from './deploy-facts';
import { deployJournalPath } from './deploy-journal';
import { acquireDeployLock } from './deploy-lock';
import { concludeOperation, readOutcome } from './deploy-outcome';
import { endDeployment } from './end-deployment';

/**
 * A person's decision: releases the fence `owner` holds and nothing else. It runs while a STOP
 * record stands, under the deploy lock, and leaves the record for the person to remove. A deployment
 * that had recorded no outcome is recorded `ended`, so it is neither resumed nor left blocking others.
 */
export async function endHeldDeployment(ctx: DeployContext, input: { operation: string; owner: string }): Promise<DeployOutcome> {
    const { operation, owner } = input, refused = (reason: string): DeployOutcome => ({ status: 'refused', operation, step: null, reason });
    let lock;
    try { lock = acquireDeployLock(ctx.dataRoot, operation, { now: ctx.now }); }
    catch (error) { return refused(String(error instanceof Error ? error.message : error)); }
    try {
        const settled = await endDeployment(ctx, operation, owner);
        if (settled.status !== 'verified') return refused(`the fence held by ${owner} was not released: ${settled.reason}`);
        const reason = `the fence held by ${owner} is released`;
        if (existsSync(deployJournalPath(ctx.dataRoot, owner)) && !readOutcome(ctx.dataRoot, owner)) concludeOperation(ctx, { status: 'ended', operation: owner, step: null, reason: `ended by a person through ${operation}` });
        return { status: 'ended', operation, step: null, reason };
    } catch (error) {
        return refused(String(error instanceof Error ? error.message : error).slice(0, 2000));
    } finally { lock.release(); }
}
