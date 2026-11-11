import { stoppedBaseHandoffResolved } from './stopped-base-disposition';
import { resolve } from 'node:path';
import { currentAssignment } from '../../workers/assignment-context';
import { ResultSchema } from '../../workers/agents';
import { completedExecution } from '../../workers/worker-completion';
import { artifact } from '../../store/readback-evidence';
import { continuationWorkerProof, continuationNativeReview } from './implementation/continuation-evidence';
import { stoppedBaseReviewContext } from './stopped-base-review-context';
import { stoppedBaseCheckout } from './stopped-base-checkout';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob, HarnessRequest } from '../../../src/shared';

/** Handoff-only assessment never enters the ordinary merge-ready result history. */
export async function runStoppedBaseReview(delivery: GitHubDelivery, job: TicketJob): Promise<boolean> {
    const r = job.stoppedBaseUpdate;
    if (!r || !['lead','checkout'].includes(r.phase)) return false;
    if (job.stage !== 'lead-pr') throw new Error('Stopped-base handoff stage changed');
    const { store } = delivery, current = await stoppedBaseReviewContext(delivery, job);
    const cwd = r.preservedCandidate!.worktree, head = current.provider.pr.head;
    if (!r.handoffStarted) {
        const claim = currentAssignment()?.claim;
        if (!claim) throw new Error('Exact delivery handoff claim is required');
        r.handoffStarted = { claimId: claim.id, head, providerVersion: current.provider.version, at: store.clock.now().toISOString() }; store.save();
        await delivery.engine.agents.run('lead', `READ ONLY stopped-base handoff assessment, not merge readiness or source acceptance. Do not edit, checkout, run package checks, send, publish, move cards or merge. Inspect the prospective GitHub head ${head} on the original PR using existing native read-only tools. The retained CWD ${cwd} is the OLD candidate at ${r.preservedCandidate!.head}; it does not prove the prospective source. Assess full current diff and every retained pending finding ${JSON.stringify(r.preservedCandidate!.repairCycle?.pendingFindingIds || [])}. Return explicit findings with those same IDs, plus actual supporting evidence. A passed handoff requires every prior finding disposed as fixed/verified. Independent source review and independent QA on a new private exact-head candidate remain mandatory. Return worktree=${cwd}, branch=${current.provider.pr.branch}, commit=${head}, prId=${job.pr}, paidRuns=0. No source/merge approval may be inferred from the old audit. Bound current context ${JSON.stringify(current.provider)}. Retained steps ${JSON.stringify(job.steps)}.`,
            ResultSchema, { readOnly: true, stage: 'stopped-base-update-handoff', requestId: job.id, ticket: job.key, cwd,
                artifactsRoot: resolve(store.dataRoot, 'ticket-work', job.id), timeout: 20 * 60000 });
    }
    const workers = store.state.workLog?.filter(w => w.requestId === job.id && w.stage === 'stopped-base-update-handoff') || [];
    const worker = workers[0];
    if (workers.length !== 1 || worker.claimId !== r.handoffStarted.claimId || !completedExecution(store, worker))
        throw new Error('Reconcile the single started handoff from its real native completion; no second reader');
    const proof = continuationWorkerProof(store, job, worker, true, cwd), result = ResultSchema.parse(proof.result);
    const native = continuationNativeReview(store, worker, result), resultFile = artifact(store, resolve(store.dataRoot, 'sessions', worker.id, 'result.json'));
    r.handoff = { head: result.commit, providerVersion: r.handoffStarted.providerVersion, workerId: worker.id,
        resultPath: resultFile.path, resultSha256: resultFile.sha256, nativePath: native.file.path, nativeSha256: native.file.sha256 }; store.save();
    if (r.handoffStarted.head !== head || r.handoffStarted.providerVersion !== current.provider.version || result.outcome !== 'passed' ||
        result.commit !== head || result.prId !== job.pr || result.worktree !== cwd || result.branch !== current.provider.pr.branch || result.paidRuns !== 0 ||
        result.receipts.some(receipt => !receipt.verified || receipt.uncertain) || !result.evidence.length ||
        (r.preservedCandidate!.repairCycle?.pendingFindingIds || []).some(id => !result.findings.some(f => f.id === id && f.status !== 'open')))
        throw new Error('Current-head stopped-base handoff lacks a positive disposition of every retained finding');
    await stoppedBaseReviewContext(delivery, job);
    r.phase = 'checkout'; store.save();
    await stoppedBaseCheckout(delivery, job);
    return true;
}

/** Existing native review readback resumes only the already-started handoff, never another model. */
export async function reconcileStoppedBaseHandoff(delivery: GitHubDelivery, request: HarnessRequest): Promise<boolean> {
    const job = delivery.jobs.find(j => j.key === request.key), r = job?.stoppedBaseUpdate;
    if (!job || !r || request.action !== 'reconcile-review' || !r.handoffStarted) return false;
    const workers = delivery.store.state.workLog?.filter(w => w.requestId === job.id && w.stage === 'stopped-base-update-handoff') || [];
    const exactWorker = workers.length === 1 && workers[0].id === request.head && workers[0].claimId === r.handoffStarted.claimId;
    if (stoppedBaseHandoffResolved(delivery.store,request)) {
        if (!exactWorker) throw new Error('Exact original started stopped-base handoff readback is required');
        return true;
    }
    if (!['lead','checkout'].includes(r.phase) || !workers.some(w => w.id === request.head)) return false;
    if (!exactWorker)
        throw new Error('Exact original started stopped-base handoff readback is required');
    if (!['blocked','interrupted'].includes(job.status)) throw new Error('Original stopped-base handoff is not awaiting readback');
    await runStoppedBaseReview(delivery, job);
    return true;
}
