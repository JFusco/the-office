import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { artifact, digest } from '../../store/readback-evidence';
import { stoppedBaseClaim } from './stopped-base-claim';
import { readStoppedBaseContext, assertStoppedBaseCurrent } from './stopped-base-context';
import { stoppedBaseAuditResponseSchema, assertStoppedBaseAudit, type StoppedBaseAuditInput } from './stopped-base-audit';
import { stoppedBaseAuditMarker } from './stopped-base-audit-native';
import { readStoppedBaseAuditCompletion } from './stopped-base-audit-completion';
import { saveStoppedBaseArtifact, stoppedBaseUpdateResolved } from './stopped-base-disposition';
import type { Store } from '../../store/store';
import type { HarnessRequest, TicketJob } from '../../../src/shared';
import type { GitHubDelivery } from '../pipeline/github-delivery';

/** Recognize an original stopped attempt even when a safety gate currently blocks it. */
export function stoppedBaseUpdateCandidate(store: Store, job: TicketJob) {
    if (store.project.id !== 'cms-field-vocabulary' || !job.existingPR || !job.pr) return;
    if (job.stoppedBaseUpdate) return { id: `stopped-base-update:${job.id}:${job.stoppedBaseUpdate.originalWorkId}`, head: job.stoppedBaseUpdate.originalWorkId };
    const workers = store.state.workLog?.filter(w => w.requestId === job.id && w.stage === 'github-update-base') || [];
    if (job.stage !== 'update-base' || !workers.some(w => w.status === 'interrupted' && !w.executionStatus)) return;
    if (workers.length !== 1) throw new Error('Morgan must reconcile duplicate original stopped-base workers');
    return { id: `stopped-base-update:${job.id}:${workers[0].id}`, head: workers[0].id };
}

/** Persist the real one-shot reader's completion before deciding whether it is safe. */
function captureAudit(delivery: GitHubDelivery, job: TicketJob, input: StoppedBaseAuditInput & { context: { candidate: { worktree: string } } }) {
    const { store } = delivery, r = job.stoppedBaseUpdate!;
    const workers = store.state.workLog?.filter(w => w.requestId === job.id && w.stage === 'stopped-base-update-audit') || [];
    if (workers.length !== 1 || r.audit.workerId && r.audit.workerId !== workers[0].id)
        throw new Error('Morgan must reconcile the one dispatched audit; no second reader is authorized');
    r.audit.workerId = workers[0].id; store.save();
    const completed = readStoppedBaseAuditCompletion(store, job, { workerId: workers[0].id, requestId: r.audit.requestId,
        claimId: r.audit.claimId, cwd: input.context.candidate.worktree }, input);
    const result = completed.proof.files.find(f => f.path.endsWith('/result.json'))!;
    const executionCompletion = completed.completionFiles.find(f => f.path.endsWith('/execution-completion.json'))!;
    r.audit.state = 'completed'; r.audit.completion = { sessionId: workers[0].sessionId, resultPath: result.path,
        resultSha256: result.sha256, executionCompletionSha256: executionCompletion.sha256,
        nativePath: completed.native.file.path, nativeSha256: completed.native.file.sha256,
        completedAt: workers[0].endedAt! }; store.save();
    return completed;
}

/** Existing request/claim, one audit dispatch, then immutable administrative reassessment. */
export async function reconcileStoppedBaseUpdate(delivery: GitHubDelivery, request: HarnessRequest): Promise<boolean> {
    const { store } = delivery, job = delivery.jobs.find(j => j.key === request.key && j.status !== 'cancelled');
    if (!job) return false;
    const candidate = stoppedBaseUpdateCandidate(store, job);
    if (!candidate) return false;
    if (candidate.head !== request.head) throw new Error('Morgan requires the exact original stopped worker ID');
    if (stoppedBaseUpdateResolved(store, request)) return true;
    if (request.action !== 'reconcile-base-update' || request.status !== 'working' ||
        store.state.coordination?.requests?.find(q => q.id === request.id) !== request) throw new Error('Original registered readback request required');
    let r = job.stoppedBaseUpdate;
    // Reconcile a lost return from saved issued input before any freshness refusal.
    if (r?.audit.state === 'dispatched') {
        const file = artifact(store, r.input.path), input = JSON.parse(readFileSync(file.path, 'utf8'));
        if (file.sha256 !== r.input.sha256 || digest(input) !== r.input.inputSha256) throw new Error('Original audit input changed');
        captureAudit(delivery, job, input);
    }
    const claim = stoppedBaseClaim(store, job, request);
    const current = await readStoppedBaseContext(delivery, job, request);
    if (!r) {
        const file = saveStoppedBaseArtifact(store, job, `stopped-base-input-${request.head}.json`, current.input);
        const worker = current.original.worker;
        r = job.stoppedBaseUpdate = { originalWorkId: worker.id, originalSessionId: worker.sessionId,
            originalClaimId: current.original.claim.id, nativePath: current.native.file.path, nativeSha256: current.native.file.sha256,
            contextSha256: current.materialSha256, providerVersion: current.provider.version,
            input: { path: file.path, sha256: file.sha256, inputSha256: current.inputSha256 }, phase: 'audit',
            audit: { key: digest([job.id, worker.id, current.native.file.sha256]), state: 'reserved', requestId: request.id,
                claimId: claim.id, reservedAt: store.clock.now().toISOString() } }; store.save();
    }
    if (r.originalWorkId !== current.original.worker.id || r.originalSessionId !== current.original.worker.sessionId ||
        r.originalClaimId !== current.original.claim.id || r.nativePath !== current.native.file.path ||
        r.nativeSha256 !== current.native.file.sha256 || r.contextSha256 !== current.materialSha256 ||
        r.input.inputSha256 !== current.inputSha256 || artifact(store, r.input.path).sha256 !== r.input.sha256)
        throw new Error('Stopped-base reservation material changed; Morgan must inspect it without a new audit');
    if (r.audit.state === 'reserved') {
        stoppedBaseClaim(store, job, request);
        if (r.audit.requestId !== request.id || r.audit.claimId !== claim.id)
            throw new Error('Original reserved claim ended before dispatch; Morgan must inspect it');
        await assertStoppedBaseCurrent(delivery, job, request, current);
        r.audit.state = 'dispatched'; r.audit.dispatchedAt = store.clock.now().toISOString(); store.save();
        await delivery.engine.agents.run('lead', `READ ONLY original stopped-base effects audit. Never edit source, execute package scripts, retry commands, send messages, publish, move cards or approve source/merge. Assess every original invocation and available/missing result including script and subprocess semantics, all recorded CWDs and durable effects. A missing result is not a passed command. Unknown source/external effects block. Only positively bounded local uncertainty with evidence that no continuation gate can be affected may pass. If redaction hides semantics, block. This grants later administrative reassessment only. Return the exact row IDs/hashes once each, classification, supporting evidence and explicit uncertainty.\n${stoppedBaseAuditMarker}${JSON.stringify(current.input)}`,
            stoppedBaseAuditResponseSchema(current.input), { readOnly: true, effortKind: 'administrative', stage: 'stopped-base-update-audit',
                requestId: job.id, ticket: job.key, cwd: job.worktree, artifactsRoot: resolve(store.dataRoot, 'ticket-work', job.id), timeout: 20 * 60000 });
    }
    const completed = captureAudit(delivery, job, current.input);
    assertStoppedBaseAudit(current.input, completed.native.result);
    await assertStoppedBaseCurrent(delivery, job, request, current);
    const preserved = structuredClone({ head: job.head, branch: job.branch, worktree: job.worktree, adoptedRepairCheckout: job.adoptedRepairCheckout,
        repairCycle: job.repairCycle, approach: job.approach, decisions: job.decisions, reviewContext: job.reviewContext,
        reviewInputSha256: job.reviewInputSha256, lastPRFingerprint: job.lastPRFingerprint });
    const value = { jobId: job.id, originalWorkId: r.originalWorkId, contextSha256: r.contextSha256, inputSha256: r.input.inputSha256,
        auditWorkerId: r.audit.workerId, resultSha256: r.audit.completion!.resultSha256, candidateSha256: digest(preserved) };
    const file = saveStoppedBaseArtifact(store, job, `stopped-base-disposition-${request.head}.json`, value, true);
    store.transition('stopped-base-reassess', `${job.key}: original effects audit permits fresh Lead reassessment; no source accepted.`, () => {
        stoppedBaseClaim(store, job, request);
        r.preservedCandidate = preserved; r.disposition = { path: file.path, sha256: file.sha256, at: store.clock.now().toISOString() }; r.phase = 'lead';
        job.worktree = ''; delete job.adoptedRepairCheckout; delete job.reviewContext; delete job.reviewInputSha256; delete job.lastPRFingerprint;
        job.stage = 'lead-pr'; job.status = 'queued';
        job.detail = 'Original effects audit completed. Fresh exact-head handoff, private candidate, independent source review and QA remain mandatory. Original candidate and repair budgets retained.';
    }, 'pm', job.key);
    return true;
}
