import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { backupStores, INVENTORY_FILE } from './backup-stores';
import type { DeployContext } from './deploy-context';
import { DEPLOY_STEPS, DeployFacts, type DeployOutcome } from './deploy-facts';
import { deployJournalPath, readDeployJournal, startDeployJournal } from './deploy-journal';
import { exclusively } from './deploy-exclusion';
import { concludeOperation, readOutcome } from './deploy-outcome';
import { operationPaths } from './deploy-paths';
import { planDeployment } from './deploy-plan';
import { removeDeployToken } from './deploy-token';
import { endDeployment } from './end-deployment';
import { holdFence } from './hold-fence';
import { installPlist } from './install-plist';
import { recordActive } from './record-active';
import { fileDigest, MANIFEST_FILE, verifyRelease } from './release-manifest';
import { releasePaths } from './release-paths';
import { rollback, rollbackReleasedFence } from './rollback';
import { runSteps, stepOf, type StepResult } from './run-steps';
import { ServiceHealth } from './service-http';
import { snapshotGaps, snapshotStores } from './snapshot-stores';
import { startService } from './start-service';
import { readStoppedService, stopService } from './stop-service';
import { requireVerifiedInstance, verifyLoaded } from './verify-loaded';
import { waitIdle } from './wait-idle';

export { DEPLOY_STEPS };

/** Steps after which the service is stopped or replaced, so a failure is undone by the rollback operation. */
const ROLLED_BACK = new Set(['backup', 'snapshot', 'plist', 'start', 'verify']);

/** Releases this deployment's fence after a refusal that left the service untouched, and says whether that is confirmed. */
async function abandon(ctx: DeployContext, operation: string, reason: string): Promise<StepResult> {
    const released = await endDeployment(ctx, operation, operation, 'abort-release').then(settled => settled.status === 'verified', () => false);
    return { state: 'failed', reason, receipt: { fenceReleased: released } };
}

/** Runs the deployment from wherever its journal stands and says how it ended; a failed activation is rolled back here. */
export async function advance(ctx: DeployContext, operation: string): Promise<DeployOutcome> {
    const facts = DeployFacts.parse(readDeployJournal(ctx.dataRoot, operation).facts);
    const target = { path: operationPaths(ctx.dataRoot, operation).targetPlist, sha256: facts.plist.targetSha256 };
    const requireStopped = async () => {
        if (!await readStoppedService(ctx, facts.source.pid))
            throw new Error('the service is no longer confirmed stopped for store backup or snapshot');
    };
    const requireFrozenTarget = async () => {
        const verification = verifyRelease(facts.target.directory, facts.target.commit);
        if (verification.status !== 'verified' || verification.manifest.hash !== facts.target.hash ||
            fileDigest(resolve(facts.target.directory, MANIFEST_FILE)) !== facts.target.manifestDigest)
            throw new Error(`release ${facts.target.commit} no longer matches the manifest this deployment froze`);
    };
    const requireTargetHealth = (verification: Record<string, unknown>) => () => requireVerifiedInstance(ctx, {
        hash: facts.target.hash, serviceInstanceId: String(verification.serviceInstanceId), tokenDigest: facts.tokenDigest, operation,
    });
    const result = await runSteps(ctx, operation, {
        fence: async () => stepOf(await holdFence(ctx, operation, operation)),
        idle: async () => {
            const idle = await waitIdle({ observe: () => ctx.office.health(), serviceInstanceId: facts.source.serviceInstanceId, tokenDigest: facts.tokenDigest, deadlineMs: ctx.timings.idleDeadlineMs, intervalMs: ctx.timings.idleIntervalMs, sleep: ctx.sleep, now: ctx.now });
            return idle.status === 'idle' ? { state: 'done', receipt: { observations: idle.observations } } : abandon(ctx, operation, `the service did not become idle (${idle.status}): ${idle.reason}`);
        },
        stop: async () => {
            const settled = await stopService(ctx, operation, 'stop', facts.source.pid, async () => {
                const health = ServiceHealth.parse(await ctx.office.health());
                if (health.serviceInstanceId !== facts.source.serviceInstanceId || health.busy || health.fence.status !== 'held' || health.fence.tokenDigest !== facts.tokenDigest)
                    throw new Error('the service is no longer the idle, fenced instance this deployment observed');
            });
            return settled.status === 'rejected' ? abandon(ctx, operation, `the service was not stopped: ${settled.reason}`) : stepOf(settled);
        },
        backup: async () => {
            await requireStopped();
            const directory = resolve(releasePaths(ctx.dataRoot).backups, operation), inventory = resolve(directory, INVENTORY_FILE);
            try {
                // A backup this operation already completed is kept; it is never taken twice or overwritten.
                const saved = existsSync(inventory) ? JSON.parse(readFileSync(inventory, 'utf8')) : (await backupStores({ dataRoot: ctx.dataRoot, operation, databases: ctx.databases, archives: ctx.archives, mayBeMissing: ctx.projects.map(project => project.name), now: ctx.now })).inventory;
                return { state: 'done', receipt: { directory, databases: saved.databases.length } };
            } catch (error) { return { state: 'failed', reason: `the stores were not backed up: ${String(error).slice(0, 500)}` }; }
        },
        snapshot: async () => {
            await requireStopped();
            const snapshot = snapshotStores(ctx), gaps = snapshotGaps(snapshot);
            return gaps.length ? { state: 'failed', reason: `the stores cannot be read for a later comparison: ${gaps.join('; ')}`.slice(0, 2000) } : { state: 'done', receipt: { ...snapshot } };
        },
        plist: async () => stepOf(await installPlist(ctx, operation, 'plist', target, requireFrozenTarget)),
        start: async () => stepOf(await startService(ctx, operation, 'start', target.sha256, requireFrozenTarget)),
        verify: async () => {
            const loaded = await verifyLoaded(ctx, { hash: facts.target.hash, knownInstances: [facts.source.serviceInstanceId], tokenDigest: facts.tokenDigest });
            return loaded.ok ? { state: 'done', receipt: { ...loaded } } : { state: 'failed', reason: loaded.reason };
        },
        record: async receipts => stepOf(await recordActive(ctx, operation, {
            version: 1, commit: facts.target.commit, hash: facts.target.hash, manifestDigest: facts.target.manifestDigest, previous: facts.source.commit,
            operation, serviceInstanceId: String(receipts.verify.serviceInstanceId), activatedAt: String(receipts.verify.observedAt),
        }, requireTargetHealth(receipts.verify))),
        release: async receipts => stepOf(await endDeployment(ctx, operation, operation, 'release', requireTargetHealth(receipts.verify))),
    });
    if (result.completed) return { status: 'deployed', operation, step: null, reason: `release ${facts.target.commit} serves, verified by /api/health` };
    const { step, state, reason } = result, base = { operation, step, reason };
    // A journal whose last line was cut short does not say which step was reached, so nothing is undone on its word.
    if (readDeployJournal(ctx.dataRoot, operation).torn) return { ...base, status: 'stopped' };
    const lostStop = state === 'uncertain' && (step === 'backup' || step === 'snapshot');
    if (ROLLED_BACK.has(step) && !lostStop) {
        const undone = await rollback(ctx, operation, facts, reason);
        if (undone.outcome.completed) return { ...base, status: 'rolled-back', rollback: undone.operation };
        return { status: 'stopped', operation, step: `${undone.operation}:${undone.outcome.step}`, reason: `${reason}. Rollback did not complete: ${undone.outcome.reason}`, rollback: undone.operation };
    }
    if (state === 'failed' && step === 'fence') { removeDeployToken(ctx.dataRoot, operation); return { ...base, status: 'refused' }; }
    if (state === 'failed' && (step === 'idle' || step === 'stop') && result.receipt.fenceReleased === true) return { ...base, status: 'aborted' };
    return { ...base, status: 'stopped' };
}

/**
 * Replaces the running release with `target` under the deployment fence, verifies what loaded and
 * records it active; a failed activation is rolled back when that is provably safe. Every refusal
 * before the first journaled step leaves the service, its plist and the fence untouched.
 */
export function deploy(ctx: DeployContext, input: { operation: string; target: string; controller: string }): Promise<DeployOutcome> {
    const { operation } = input;
    return exclusively(ctx, operation, async () => {
        if (existsSync(deployJournalPath(ctx.dataRoot, operation))) return { status: 'refused', operation, step: null, reason: `Deployment ${operation} already has a journal; resume it instead` };
        let facts: DeployFacts;
        try { facts = await planDeployment(ctx, operation, input.target, input.controller); }
        catch (error) { return concludeOperation(ctx, { status: 'refused', operation, step: null, reason: String(error instanceof Error ? error.message : error).slice(0, 2000) }); }
        startDeployJournal(ctx.dataRoot, operation, DEPLOY_STEPS, facts, ctx.now);
        return concludeOperation(ctx, await advance(ctx, operation));
    });
}

/**
 * Continues an interrupted deployment from its journal, under the facts it fixed when it began. A
 * deployment that already ended, or whose fence a person ended, is not continued: its service may be
 * serving unfenced, and nothing here stops a service that was not observed idle under the fence.
 */
export function resumeDeploy(ctx: DeployContext, operation: string): Promise<DeployOutcome> {
    return exclusively(ctx, operation, async () => {
        const refused = (reason: string): DeployOutcome => ({ status: 'refused', operation, step: null, reason });
        const view = readDeployJournal(ctx.dataRoot, operation), saved = readOutcome(ctx.dataRoot, operation);
        if (view.facts.kind !== 'deploy') return refused(`${operation} is not a deployment; resume the deployment it belongs to (${String(view.facts.of ?? 'unknown')})`);
        if (saved) return { ...refused(`Deployment ${operation} already ended ${saved.status}`), step: saved.step };
        // A missing token can also be explained by the linked rollback's final release.
        if (view.receipts.fence && !['idle', 'stop', 'release'].includes(view.last?.step ?? '') &&
            !existsSync(operationPaths(ctx.dataRoot, operation).token) && !rollbackReleasedFence(ctx, view))
            return refused(`The fence of deployment ${operation} was released outside its own steps; it cannot be resumed. Settle the service by hand`);
        return concludeOperation(ctx, await advance(ctx, operation));
    });
}
