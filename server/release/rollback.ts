import { existsSync } from 'node:fs';
import type { DeployContext } from './deploy-context';
import { RollbackFacts, type DeployFacts } from './deploy-facts';
import { deployJournalPath, readDeployJournal, startDeployJournal, type DeployJournalView } from './deploy-journal';
import { operationPaths } from './deploy-paths';
import { endDeployment } from './end-deployment';
import { installPlist } from './install-plist';
import { rollbackOperation } from './rollback-operation';
import { runSteps, stepOf, type StepsOutcome } from './run-steps';
import { ServiceHealth } from './service-http';
import { storesChangedSince } from './snapshot-stores';
import { startService } from './start-service';
import { readStoppedService, stopService } from './stop-service';
import { verifyLoaded } from './verify-loaded';

export const ROLLBACK_STEPS = ['halt', 'eligibility', 'plist', 'start', 'verify', 'release'];

/** A linked rollback can explain a missing token only at its final release. */
export function rollbackReleasedFence(ctx: DeployContext, deployment: DeployJournalView): boolean {
    if (deployment.torn || !deployment.last || !['failed', 'uncertain'].includes(deployment.last.state)) return false;
    const operation = rollbackOperation(deployment.operation);
    try {
        const view = readDeployJournal(ctx.dataRoot, operation), facts = RollbackFacts.parse(view.facts);
        if (view.torn || facts.of !== deployment.operation || view.last?.step !== 'release' || view.steps.join() !== ROLLBACK_STEPS.join())
            return false;
        if (view.last.state === 'done') return view.receipts.release?.fence === 'open';
        if (view.last.state !== 'intended') return false;

        // The token can be deleted between the verified effect and the journal receipt.
        const intent = ctx.effects.readIntent(`${operation}:release`);
        return intent?.status === 'verified' && intent.payload?.deployment === deployment.operation &&
            intent.payload?.tokenDigest === deployment.facts.tokenDigest;
    } catch {
        return false;
    }
}

/**
 * Returns the service to the release it ran before a failed activation: code only. It stops whatever
 * the activation started, then goes on only when no work was admitted and every store holds exactly
 * what it held when the old service stopped. A complete snapshot and unchanged stores are the
 * proof that the previous release can still read its stores. Otherwise it ends failed with the
 * service stopped and the fence held, for a person. No step reads a backup.
 */
export async function rollback(ctx: DeployContext, deployment: string, facts: DeployFacts, reason: string): Promise<{ operation: string; outcome: StepsOutcome }> {
    const operation = rollbackOperation(deployment), deployed = readDeployJournal(ctx.dataRoot, deployment);
    if (!existsSync(deployJournalPath(ctx.dataRoot, operation))) {
        const reached = deployed.last ? deployed.steps.indexOf(deployed.last.step) : -1;
        startDeployJournal(ctx.dataRoot, operation, ROLLBACK_STEPS, RollbackFacts.parse({ kind: 'rollback', of: deployment, reason: reason.slice(0, 2000), started: reached >= deployed.steps.indexOf('start') }), ctx.now);
    }
    if (RollbackFacts.parse(readDeployJournal(ctx.dataRoot, operation).facts).of !== deployment)
        throw new Error(`Rollback ${operation} belongs to another deployment`);

    const requireUnchangedStores = async (halt: Record<string, unknown>) => {
        if (!await readStoppedService(ctx, typeof halt.pid === 'number' ? halt.pid : null))
            throw new Error('the service is no longer confirmed stopped for rollback');
        const changed = storesChangedSince(ctx, deployed.receipts.snapshot);
        if (changed.length)
            throw new Error(`the stores cannot be shown unchanged since the old service stopped: ${changed.join('; ')}`.slice(0, 2000));
    };
    const prior = { path: operationPaths(ctx.dataRoot, deployment).priorPlist, sha256: facts.plist.priorSha256 };
    const outcome = await runSteps(ctx, operation, {
        halt: async () => {
            // The failed instance's identity, when it answers, so the restarted previous release is told apart from it.
            const health = ServiceHealth.safeParse(await ctx.office.health().catch(() => null));
            const settled = await stopService(ctx, operation, 'halt', health.success ? health.data.pid : null);
            return settled.status === 'verified' ? { state: 'done', receipt: { ...settled.receipt, instance: health.success ? health.data.serviceInstanceId : null } } : stepOf(settled);
        },
        eligibility: async receipts => {
            try { await requireUnchangedStores(receipts.halt); }
            catch (error) { return { state: 'failed', reason: String(error).slice(0, 2000) }; }
            return { state: 'done', receipt: { basis: 'no admission and no store change since the old service stopped' } };
        },
        plist: async receipts => stepOf(await installPlist(ctx, operation, 'plist', prior, () => requireUnchangedStores(receipts.halt))),
        start: async receipts => stepOf(await startService(ctx, operation, 'start', prior.sha256, () => requireUnchangedStores(receipts.halt))),
        verify: async receipts => {
            const known = [facts.source.serviceInstanceId, receipts.halt?.instance].filter((id): id is string => typeof id === 'string');
            const loaded = await verifyLoaded(ctx, { hash: facts.source.loadedHash, knownInstances: known, tokenDigest: facts.tokenDigest });
            return loaded.ok ? { state: 'done', receipt: { ...loaded } } : { state: 'failed', reason: loaded.reason, receipt: { pid: loaded.pid } };
        },
        release: async () => stepOf(await endDeployment(ctx, operation, deployment)),
    });
    if (!outcome.completed && outcome.step === 'verify' && outcome.state === 'failed') {
        // The verification failure is already in the journal, so recovery resumes this halt by read-back.
        const pid = typeof outcome.receipt.pid === 'number' ? outcome.receipt.pid : null;
        let halt: string;
        try {
            const stopped = await stopService(ctx, operation, 'halt-unverified', pid);
            halt = stopped.status === 'verified' ? 'the unverified rollback instance was stopped' : `its halt could not be confirmed: ${stopped.reason}`;
        } catch (error) {
            halt = `its halt could not be confirmed: ${String(error).slice(0, 500)}`;
        }
        return { operation, outcome: { ...outcome, reason: `${outcome.reason}. ${halt}` } };
    }
    return { operation, outcome };
}
