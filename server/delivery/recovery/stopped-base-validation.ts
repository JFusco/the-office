import { assertStoppedBaseApproach } from './stopped-base-gates';
export { assertStoppedBaseApproach, stoppedBaseNextStage } from './stopped-base-gates';
import { dirname } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { artifact, digest, rootArtifact } from '../../store/readback-evidence';
import { continuationWorkerProof, continuationNativeReview } from './implementation/continuation-evidence';
import { stoppedBasePackedCommands } from './stopped-base-packed';
import { currentAssignment } from '../../workers/assignment-context';
import type { Store } from '../../store/store';
import type { StageResult, TicketJob, WorkApproach } from '../../../src/shared';

/** Bind the real independent worker before the generic result path can route repairs. */
export function stoppedBaseStageProof(store: Store, job: TicketJob, result: StageResult, beforeWorkers: Set<string>) {
    if (!job.stoppedBaseUpdate || !['review','validate'].includes(job.stage)) return;
    const workers = (store.state.workLog || []).filter(w => !beforeWorkers.has(w.id) && w.requestId === job.id && w.stage === `github-${job.stage}`);
    const worker = workers[0];
    if (workers.length !== 1 || worker.role !== (job.stage === 'review' ? 'lead' : 'qa')) throw new Error('Actual independent stopped-base stage worker required');
    const proof = continuationWorkerProof(store, job, worker, job.stage === 'review', job.worktree);
    if (!isDeepStrictEqual(proof.result, result) || worker.claimId !== currentAssignment()?.claim.id)
        throw new Error('Stopped-base stage result or claim differs from native completion');
    const native = continuationNativeReview(store, worker, result);
    const ids = job.stoppedBaseUpdate.preservedCandidate?.repairCycle?.pendingFindingIds || [];
    if (ids.some(id => !result.findings.some(f => f.id === id))) throw new Error('Stopped-base stage omitted an original finding');
    if (result.outcome === 'passed') {
        if (result.commit !== job.head || result.worktree !== job.worktree || result.branch !== job.branch ||
            ids.some(id => !result.findings.some(f => f.id === id && (job.stage === 'validate' ? f.status === 'verified' : f.status !== 'open'))))
            throw new Error('Stopped-base independent current-head finding dispositions are incomplete');
        const files = result.evidence.filter(e => e.commit === job.head && e.kind === (job.stage === 'review' ? 'review' : 'checks')).map(e => artifact(store,e.path));
        if (!files.length) throw new Error('Actual independent stage evidence files required');
        if (job.stage === 'validate') stoppedBasePackedCommands(native,job.worktree);
        (job.stoppedBaseUpdate.acceptance ??= {})[job.stage as 'review'|'validate'] = { head:job.head,workerId:worker.id,resultSha256:digest(result),
            ...(job.stage === 'review' ? { reviewMode: result.approach?.review ?? job.approach?.review } : {}),
            nativePath:native.file.path,nativeSha256:native.file.sha256,artifacts:files.map(f=>({path:f.path,sha256:f.sha256})) };
        store.save();
    }
    return { workerId: worker.id, nativeResultSha256: digest(result) };
}

export function assertStoppedBaseValidation(store: Store, job: TicketJob, result: StageResult, workerId: string) {
    if (!job.stoppedBaseUpdate) return;
    const worker = store.state.workLog?.find(w => w.id === workerId);
    if (!worker || worker.role !== 'qa' || worker.stage !== 'github-validate' || result.outcome !== 'passed' || result.commit !== job.head)
        throw new Error('Actual current-head independent QA required');
    const ids=job.stoppedBaseUpdate.preservedCandidate?.repairCycle?.pendingFindingIds||[];
    if(ids.some(id=>!result.findings.some(f=>f.id===id&&f.status==='verified')))throw new Error('QA must verify every preserved stopped-base finding');
    const proof = continuationWorkerProof(store, job, worker, false, job.worktree);
    if (!isDeepStrictEqual(proof.result, result)) throw new Error('Saved QA result differs');
    const native = continuationNativeReview(store, worker, result);
    stoppedBasePackedCommands(native, job.worktree);
    assertAcceptedFiles(store,job,'validate',worker.id,result,native.file);
    const checks = result.evidence.filter(e => e.commit === job.head && e.kind === 'checks');
    if (!checks.length) throw new Error('Owned current-head QA check artifact required');
    checks.forEach(e => artifact(store, e.path));
}

/** Saved-review and approval fast paths still require actual fresh source/QA acceptance. */
export function assertStoppedBaseMergeReady(store: Store, job: TicketJob, head: string) {
    if (!job.stoppedBaseUpdate) return;
    assertStoppedBaseApproach(job, job.approach!);
    const review = job.steps.filter(s => s.stage === 'review').at(-1), qa = job.steps.filter(s => s.stage === 'validate').at(-1);
    if (head !== job.head || !review?.workerId || review.result.outcome !== 'passed' || review.result.commit !== head ||
        !qa?.workerId || qa.result.commit !== head) throw new Error('Stopped-base merge requires current-head independent source review and QA');
    const worker = store.state.workLog?.find(w => w.id === review.workerId);
    if (!worker || worker.role !== 'lead' || worker.stage !== 'github-review') throw new Error('Actual source reviewer required');
    const proof = continuationWorkerProof(store, job, worker, true, job.worktree);
    const source=proof.result as StageResult;
    if(source.outcome!=='passed'||source.commit!==head||source.worktree!==job.worktree||source.branch!==job.branch||
        (job.stoppedBaseUpdate.preservedCandidate?.repairCycle?.pendingFindingIds||[]).some(id=>!source.findings.some(f=>f.id===id&&f.status!=='open'))||
        job.approach?.review==='full'&&job.stoppedBaseUpdate.acceptance?.review?.reviewMode!=='full'||digest(proof.result) !== review.nativeResultSha256) throw new Error('Saved source review changed');
    const native=continuationNativeReview(store, worker, source);
    assertAcceptedFiles(store,job,'review',worker.id,source,native.file);
    assertStoppedBaseValidation(store, job, qa.result, qa.workerId);
}

function assertAcceptedFiles(store:Store,job:TicketJob,stage:'review'|'validate',workerId:string,result:StageResult,native:{path:string;sha256:string}){
    const saved=job.stoppedBaseUpdate?.acceptance?.[stage];
    if(!saved||saved.head!==job.head||saved.workerId!==workerId||saved.resultSha256!==digest(result)||saved.nativePath!==native.path||
        saved.nativeSha256!==native.sha256||!saved.artifacts.length||saved.artifacts.some(file=>artifact(store,file.path).sha256!==file.sha256))
        throw new Error('Stopped-base accepted worker, native execution or evidence artifact changed');
}
