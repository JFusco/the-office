import type { ReleaseMarkerReturn } from '../../../src/contracts/release-marker';
import type { Evidence, StageResult, TicketJob } from '../../../src/shared';
import { digest } from '../../store/readback-evidence';
import type { Store } from '../../store/store';
import { ReleaseMarkerCorrectionResultSchema } from '../../workers/agents';
import { currentAssignment } from '../../workers/assignment-context';
import { STAGE_STALL_LIMIT_MS } from '../../workers/stall-limit';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import { correctionChecks } from './correction-checks';
import { interruptedCorrection } from './marker-interruption';
import { applyCorrection } from './marker-correction';
import type { Execute } from './original-git';
import { correctionIdentity, pendingReturn } from './release-marker-returns';
import { indeterminate, ReleaseMarkerRefusal } from './release-marker-stop';
import { samePublication, unpublishedCandidate } from './unpublished-candidate';

/**
 * Bind a queued return to its correction claim in the same transition that makes the implement job working. A
 * correction already dispatched under an earlier claim is never redispatched: it stops as interrupted.
 */
export function bindCorrectionClaim(store: Pick<Store, 'clock'>, job: TicketJob): void {
    if (job.stage !== 'implement') return;
    const pending = pendingReturn(job), claim = currentAssignment()?.claim;
    if (!pending) return;
    if (pending.correction?.dispatchedAt) throw interruptedCorrection(pending);
    if (!claim) throw indeterminate('a pending release-marker correction needs its scheduler claim');
    pending.correction = { claimId: claim.id, at: store.clock.now().toISOString() };
}

/**
 * A delivery step's working transition: the job working, a pending correction bound to this claim, and the stage
 * event, committed in one transaction, so the first saved working record already names its claim. A binding refusal
 * binds nothing; the transition and event still commit, and the refusal is returned for the step's own stop.
 */
export function startWorking(store: Store, job: TicketJob, event: () => void): ReleaseMarkerRefusal | undefined {
    const working = (bind: boolean) => store.transaction(() => { job.status = 'working'; delete job.stop; if (bind) bindCorrectionClaim(store, job); event(); });
    try { working(true); }
    catch (error) {
        if (!(error instanceof ReleaseMarkerRefusal)) throw error;
        working(false);
        return error;
    }
}

/** The saved refused checkout and its unpublished state, before candidate reuse, a lane move and dispatch. */
export async function assertCorrectionCheckout(delivery: GitHubDelivery, job: TicketJob): Promise<void> {
    const pending = job.stage === 'implement' ? pendingReturn(job) : undefined;
    if (!pending) return;
    if (job.worktree !== pending.worktree || job.branch !== pending.branch) throw indeterminate('the refused checkout moved: the job no longer names the returned worktree and branch');
    const observed = await unpublishedCandidate(delivery.store, delivery.execute, job, { head: pending.refusedHead, branch: pending.branch, worktree: pending.worktree });
    samePublication(pending.publication, observed, 'since the return, before the correction was dispatched');
}

/** The messages-only task. The harness owns every Git history command. */
export function correctionInstruction(pending: ReleaseMarkerReturn): string {
    const commits = pending.offending.map(commit => ({ sha: commit.sha, shippedPaths: [...new Set([...commit.paths, ...commit.inventoryPaths])], message: commit.message }));
    return `RELEASE-MARKER MESSAGE CORRECTION (read only). The harness refused publication because these commits carry "[skip release]" in their message while they change files the npm package ships; this project's release analysis drops every marked commit, so the change would never be released. You are read-only: do not edit files, run Git history commands (commit, amend, rebase, reset, cherry-pick, update-ref, hash-object), push, or change the worktree ${pending.worktree}; the harness applies your messages itself. For each commit below, propose its complete replacement message: normally the same message with "[skip release]" removed, keeping the conventional subject, body and trailers otherwise intact and within the repository's commit rules. Return outcome="passed" with messages=[{sha, message}] naming ONLY these SHAs, each at most once, every message non-empty: ${JSON.stringify(commits)}. Set commit="${pending.refusedHead}", worktree="${pending.worktree}", branch="${pending.branch}", prId=0, prerequisites=[], approach=null, no receipts and no new evidence. If the change should genuinely not be released, return outcome="blocked" with messages=[] and a blocker explaining why; a person decides.`;
}

export interface CorrectionStep {
    store: Store;
    root: string;
    inputSha256: string;
    beforeWorkers: Set<string>;
    /** The ordinary delivery task framing around these instructions. */
    task: (instructions: string) => string;
}

/** What step() hands acceptStageResult: the derived implement result and the proof its transaction repeats. */
export interface CorrectionAcceptance { refusedWorkId: string; correctionWorkId: string; pendingSha256: string; inputSha256: string; claimId: string }

export type CorrectionRun = { kind: 'settled' } | { kind: 'adopted'; result: StageResult; acceptance: CorrectionAcceptance };

/**
 * Run a pending correction at the developer's usual stage, `github-implement`, read-only and on the delivery claim, with
 * its own messages-only schema; then apply it. Returns undefined when the job has no pending correction.
 */
export async function runMarkerCorrection(delivery: GitHubDelivery, job: TicketJob, step: CorrectionStep): Promise<CorrectionRun | undefined> {
    const pending = job.stage === 'implement' ? pendingReturn(job) : undefined;
    if (!pending) return undefined;
    const { store } = delivery, claim = currentAssignment()?.claim;
    if (!claim || pending.correction?.claimId !== claim.id) throw indeterminate('the pending correction is not bound to this claim');
    await assertCorrectionCheckout(delivery, job);
    if (pending.correction.dispatchedAt) throw interruptedCorrection(pending);
    pending.correction.dispatchedAt = store.clock.now().toISOString();
    store.save();
    const native = await delivery.engine.agents.run('developer', step.task(correctionInstruction(pending)), ReleaseMarkerCorrectionResultSchema, {
        artifactsRoot: step.root, cwd: pending.worktree, readOnly: true, ticket: job.key, stage: 'github-implement', requestId: job.id, enqueuedAt: job.requestedAt,
        timeout: 60 * 60 * 1000, inactivityTimeout: STAGE_STALL_LIMIT_MS });
    const outcome = await applyCorrection({ delivery, job, pending, native, root: step.root, inputSha256: step.inputSha256, beforeWorkers: step.beforeWorkers });
    if (outcome.kind === 'returned') return { kind: 'settled' };
    // The verified return as applyCorrection left it; a change during the checks below fails acceptance.
    const pendingSha256 = digest(pending);
    const checks: Evidence = await correctionChecks(store, delivery.execute, step.root, pending, outcome.original, outcome.mapping, { allowed: outcome.allowed }, job.approach);
    // The accepted implement result is the retained passing implementation at the SHA the harness created.
    const result: StageResult = { ...structuredClone(outcome.original), commit: outcome.mapping.newHead, evidence: [...outcome.original.evidence, checks] };
    return { kind: 'adopted', result, acceptance: { refusedWorkId: pending.workId, correctionWorkId: outcome.work.id, pendingSha256, inputSha256: step.inputSha256, claimId: claim.id } };
}

/**
 * The actual checkout, read last before a correction is accepted: the mapped HEAD on the refused branch, in its
 * worktree. A different branch at the same SHA is not the corrected candidate; it is a typed stop that keeps the return.
 */
export async function assertMappedCheckout(execute: Execute, job: TicketJob, result: StageResult, acceptance: CorrectionAcceptance): Promise<void> {
    const pending = job.releaseMarkerReturns?.[acceptance.refusedWorkId];
    const read = async (...args: string[]) => (await execute('git', args, { cwd: result.worktree, timeout: 10000, readOnly: true })).trim();
    const head = await read('rev-parse', 'HEAD'), branch = await read('branch', '--show-current');
    if (!pending || head !== result.commit || branch !== pending.branch || result.branch !== pending.branch || result.worktree !== pending.worktree)
        throw indeterminate(`the corrected checkout moved: ${result.worktree} is on ${branch || '(detached)'} at ${head}, not ${pending?.branch ?? result.branch} at ${result.commit}`, result.commit,
            pending ? { correction: correctionIdentity(pending) } : {});
}
