import { digest } from '../../store/readback-evidence';
import { deliveryInputSha256 } from '../../github/github-context';
import { workKey, type EffectIntent, type HarnessRequest, type TicketJob } from '../../../src/shared';
import { readStoppedBaseOriginal } from './stopped-base-original';
import { readStoppedClaudeNative } from './stopped-base-native';
import { readStoppedBaseProviderContext } from './stopped-base-provider';
import { stoppedBaseAuditInput } from './stopped-base-audit';
import { stoppedBaseClaim } from './stopped-base-claim';
import { verifyRepairCandidate } from '../repairs/delivery-repairs';
import type { GitHubDelivery } from '../pipeline/github-delivery';

function originalVersion(original: ReturnType<typeof readStoppedBaseOriginal>) {
    const { observedAt: _observedAt, ...termination } = original.termination;
    const w = original.worker;
    const worker = { id: w.id, requestId: w.requestId, ticket: w.ticket, claimId: w.claimId, lane: w.lane,
        role: w.role, provider: w.provider, stage: w.stage, status: w.status, executionStatus: w.executionStatus,
        sessionId: w.sessionId, processId: w.processId, startedAt: w.startedAt, lastHeartbeatAt: w.lastHeartbeatAt,
        endedAt: w.endedAt, elapsedMs: w.elapsedMs, durationUncertain: w.durationUncertain };
    return digest({ ...original, worker, termination });
}

function retainedJob(job: TicketJob) {
    return { id: job.id, key: job.key, head: job.head, branch: job.branch, worktree: job.worktree,
        pr: job.pr, prUrl: job.prUrl, existingPR: job.existingPR, status: job.status, stage: job.stage,
        steps: job.steps, repairCycle: job.repairCycle, approach: job.approach, decisions: job.decisions,
        adoptedRepairCheckout: job.adoptedRepairCheckout, ciRepairs: job.ciRepairs, repairReason: job.repairReason,
        candidateRecovery: job.candidateRecovery, candidateBase: job.candidateBase, boardUpdates: job.boardUpdates,
        prerequisites: job.prerequisites, reviewContext: job.reviewContext, reviewInputSha256: job.reviewInputSha256,
        lastPRFingerprint: job.lastPRFingerprint, mergeAuthorization: job.mergeAuthorization,
        mergeApprovalRequired: job.mergeApprovalRequired };
}

/** Read the full original and current provider facts without dispatching an audit.
 * Reservation fields and this reader's work-log accounting are expected bookkeeping. */
export async function readStoppedBaseContext(delivery: GitHubDelivery, job: TicketJob, request: HarnessRequest) {
    const { store } = delivery, claim = stoppedBaseClaim(store, job, request);
    const original = readStoppedBaseOriginal(store, job, request.head);
    const native = readStoppedClaudeNative(original.worker, original.candidate.path, undefined, undefined, store.project.repo);
    const effects = (store.db.prepare('SELECT body FROM effects WHERE work_key=?')
        .all(workKey({ projectId: store.project.id, kind: 'delivery', id: job.id })) as { body: string }[])
        .map(row => JSON.parse(row.body) as EffectIntent).sort((a, b) => a.id.localeCompare(b.id));
    const semantic = stoppedBaseAuditInput(original, native, effects);
    const provider = await readStoppedBaseProviderContext(delivery, job);
    await verifyRepairCandidate(store.project, { head: job.head, branch: job.branch, worktree: job.worktree }, delivery.execute);
    stoppedBaseClaim(store, job, request);
    const currentOriginal = readStoppedBaseOriginal(store, job, request.head);
    const currentNative = readStoppedClaudeNative(currentOriginal.worker, currentOriginal.candidate.path, undefined, undefined, store.project.repo);
    if (originalVersion(original) !== originalVersion(currentOriginal) || digest(native.file) !== digest(currentNative.file))
        throw new Error('Original stopped-base identities or native evidence changed during context readback');
    const { observedAt: _observedAt, ...issue } = provider.issue;
    const input = { ...semantic, context: { originalVersion: originalVersion(original), nativeFile: native.file, originalCandidate: original.candidate,
        provider: { ...provider, issue }, scopeSha256: deliveryInputSha256(store, job.key),
        candidate: { head: job.head, branch: job.branch, worktree: job.worktree },
        pendingFindingIds: job.repairCycle?.pendingFindingIds || [] } };
    if (Buffer.byteLength(JSON.stringify(input)) > 2 * 1024 * 1024) throw new Error('Complete stopped-base audit context exceeds its bound');
    const auditClaimId = job.stoppedBaseUpdate?.audit.claimId || claim.id;
    const otherWorkers = (store.state.workLog || []).filter(work => work.requestId === job.id &&
        !(work.stage === 'stopped-base-update-audit' && work.claimId === auditClaimId))
        .map(work => ({ id: work.id, requestId: work.requestId, claimId: work.claimId, stage: work.stage,
            role: work.role, provider: work.provider, sessionId: work.sessionId, status: work.status,
            executionStatus: work.executionStatus, startedAt: work.startedAt, endedAt: work.endedAt }));
    const materialSha256 = digest({ project: store.project, original: originalVersion(original), native: native.file,
        job: retainedJob(job), otherWorkers, effects, provider: provider.version, inputSha256: digest(input) });
    return { original, native, provider, input, inputSha256: digest(input), materialSha256 };
}

export async function assertStoppedBaseCurrent(delivery: GitHubDelivery, job: TicketJob, request: HarnessRequest,
    expected: Pick<Awaited<ReturnType<typeof readStoppedBaseContext>>, 'materialSha256'>) {
    const current = await readStoppedBaseContext(delivery, job, request);
    if (current.materialSha256 !== expected.materialSha256)
        throw new Error('Stopped-base audit inputs changed; preserve the original reservation and any completed assessment');
    return current;
}
