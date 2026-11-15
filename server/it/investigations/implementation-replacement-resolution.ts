import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { rootArtifact } from '../../store/readback-evidence';
import { completedExecution } from '../../workers/worker-completion';
import type { Store } from '../../store/store';
import type { ITInvestigation } from '../../../src/contracts/it-investigations';

/** Actual accepted forward source supersedes the warning, never the original writer's uncertainty. */
export function implementationReplacementResolution(store: Store, entry: ITInvestigation) {
    if (entry.source.kind !== 'worker' || entry.source.failureKind !== 'uncertain-effect') return;
    const ticket = store.state.tickets.find(t => t.key === entry.source.ticket), binding = ticket?.implementationContinuation;
    if (!ticket || !binding || binding.originalWorkerId !== entry.source.id) return;
    const request = store.state.deliveryQueue?.find(r => r.id === binding.requestId && r.key === ticket.key && r.action === 'continue-saved-implementation');
    const approved = request?.implementationContinuation;
    if (request?.status !== 'completed' || !approved?.consumedAt || !approved.acknowledgeUncertainHistory || approved.proof.runId !== ticket.runId ||
        approved.proof.workerId !== entry.source.id || approved.proof.originalDigest !== binding.originalDigest) return;
    const effect = store.getEffect(binding.copyEffectId);
    if (effect?.status !== 'verified' || effect.operation !== 'cec-copy-preserved-implementation' || effect.target !== ticket.key ||
        effect.work.projectId !== store.project.id || effect.work.kind !== 'delivery' || effect.work.id !== `ticket:${ticket.key}` ||
        effect.authorization !== request.id || effect.attemptId !== request.id) return;
    const expected = effect.expectedState as {worktree?:unknown;branch?:unknown}|null;
    if (!expected || typeof expected.worktree !== 'string' || typeof expected.branch !== 'string') return;
    const workers = store.state.workLog?.filter(w => w.originalId === entry.source.id && w.requestId === request.id && w.ticket === ticket.key &&
        w.role === 'developer' && w.stage === 'implement' && w.status === 'completed' && !w.failure && completedExecution(store,w)) || [];
    if (workers.length !== 1) return;
    const worker = workers[0];
    const original = store.state.workLog?.find(w => w.id === entry.source.id && w.requestId === entry.source.requestId &&
        w.ticket === ticket.key && w.role === 'developer' && w.stage === 'implement' && w.status === 'failed' && w.failure?.category === 'uncertain-effect');
    if (!original) return;
    try {
        if (rootArtifact(store.dataRoot,binding.proofPath).sha256 !== binding.proofSha256) return;
        const proof = JSON.parse(readFileSync(binding.proofPath,'utf8'));
        if (proof.original?.runId !== ticket.runId || proof.original?.workerId !== entry.source.id || proof.original?.originalDigest !== binding.originalDigest ||
            proof.original?.patchSha256 !== binding.patchSha256 || proof.worktree !== expected.worktree || proof.branch !== expected.branch) return;
        for (const key of ['id','ticket','stage','role','provider','sessionId','claimId','processId','startedAt','endedAt','status','failure'] as const)
            if (!isDeepStrictEqual(proof.originalWorker?.[key], original[key])) return;
        if (!Array.isArray(proof.artifacts) || proof.artifacts.length !== 5) return;
        for (const name of ['assignment.json','provider.json','error.json','process-lifecycle.json','capabilities.json']) {
            const path = resolve(store.dataRoot,'sessions',original.id,name), saved = proof.artifacts.filter((a:{path:string}) => a.path === path);
            if (saved.length !== 1 || rootArtifact(store.dataRoot,path).sha256 !== saved[0].sha256) return;
        }
        const path = resolve(store.dataRoot,'sessions',worker.id,'result.json'); rootArtifact(store.dataRoot,path);
        const saved = JSON.parse(readFileSync(path,'utf8')).result, accepted = ticket.results.implement;
        if (saved?.outcome !== 'passed' || accepted?.outcome !== 'passed' || accepted.commit !== saved.commit || !/^[a-f0-9]{40}$/.test(saved.commit) ||
            saved.worktree !== proof.worktree || saved.branch !== proof.branch || saved.receipts.some((r:{verified:boolean;uncertain:boolean}) => !r.verified || r.uncertain)) return;
        const assignmentPath = resolve(store.dataRoot,'sessions',worker.id,'assignment.json'); rootArtifact(store.dataRoot,assignmentPath);
        const assignment = JSON.parse(readFileSync(assignmentPath,'utf8'));
        if (assignment.id !== worker.id || assignment.claimId !== worker.claimId || assignment.work?.projectId !== store.project.id ||
            assignment.work?.kind !== 'delivery' || assignment.work?.id !== `ticket:${ticket.key}` || assignment.stage !== 'implement' ||
            assignment.role !== 'developer' || assignment.scope?.worktree !== proof.worktree) return;
    } catch { return; }
    return {kind:'superseded' as const,sourceId:worker.id,receipt:`sessions/${worker.id}/execution-completion.json`};
}
