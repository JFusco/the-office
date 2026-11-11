import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { artifact, ownedPath } from '../../store/readback-evidence';
import { completedExecution } from '../../workers/worker-completion';
import { currentAssignment } from '../../workers/assignment-context';
import { continuationWorkerProof } from './implementation/continuation-evidence';
import { readStoppedBaseAuditNative } from './stopped-base-audit-native';
import type { StoppedBaseAuditInput } from './stopped-base-audit';
import type { Store } from '../../store/store';
import type { TicketJob, WorkClaim } from '../../../src/shared';

export interface StoppedBaseAuditReader {
    requestId: string;
    claimId: string;
    workerId: string;
    cwd: string;
}

/** Read only the one reserved reader's real completion. Negative results remain
 * negative, and a later reconciliation never acquires the original assignment. */
export function readStoppedBaseAuditCompletion(store: Store, job: TicketJob, binding: StoppedBaseAuditReader,
    input: StoppedBaseAuditInput, codexRoot?: string) {
    const workers = store.state.workLog?.filter(work => work.id === binding.workerId) || [];
    const work = workers[0];
    if (workers.length !== 1 || !work || !['completed', 'blocked'].includes(work.status) ||
        work.requestId !== job.id || work.claimId !== binding.claimId || work.role !== 'lead' ||
        work.stage !== 'stopped-base-update-audit' || work.provider !== 'codex' || !completedExecution(store, work) ||
        store.state.workLog?.some(other => other.id !== work.id && other.requestId === job.id && other.stage === work.stage))
        throw new Error('One reserved stopped-base audit reader with actual completion is required');
    ownedPath({ dataRoot: resolve(store.dataRoot, 'ticket-work', job.id) }, binding.cwd);
    const proof = continuationWorkerProof(store, job, work, true, binding.cwd, 'reconciliation');
    const requests = store.state.coordination?.requests?.filter(request => request.id === binding.requestId) || [];
    const request = requests[0];
    if (requests.length !== 1 || !request || request.action !== 'reconcile-base-update' || request.key !== job.key ||
        request.head !== input.originalWorkId || request.lane !== 'delivery' ||
        proof.assignment.work.id !== request.id || proof.assignment.claimId !== binding.claimId)
        throw new Error('Original stopped-base audit request binding differs');
    const rows = store.db.prepare('SELECT body FROM work_claims WHERE id=?').all(binding.claimId) as { body: string }[];
    if (rows.length !== 1) throw new Error('One original audit scheduler claim is required');
    const claim: WorkClaim = JSON.parse(rows[0].body);
    if (claim.id !== binding.claimId || claim.work.kind !== 'reconciliation' || claim.work.id !== request.id ||
        claim.work.projectId !== store.project.id || claim.lane !== 'delivery' || claim.stage !== request.action ||
        !Number.isFinite(Date.parse(claim.claimedAt)) || Date.parse(claim.claimedAt) > Date.parse(work.startedAt))
        throw new Error('Original stopped-base audit scheduler assignment differs');
    if (claim.status === 'running') {
        if (request.status !== 'working' || !isDeepStrictEqual(currentAssignment()?.claim, claim) ||
            !store.activeClaims().some(saved => isDeepStrictEqual(saved, claim)))
            throw new Error('Running audit completion requires its exact current scheduler claim');
    } else if (!['completed', 'interrupted'].includes(claim.status) || !claim.endedAt ||
        !Number.isFinite(Date.parse(claim.endedAt)) || Date.parse(claim.endedAt) < Date.parse(work.endedAt!) ||
        !['completed', 'blocked', 'interrupted'].includes(request.status))
        throw new Error('Lost audit return requires its terminal original request and claim');
    const completionFiles = ['execution-completion.json', 'result.json']
        .map(name => artifact(store, resolve(store.dataRoot, 'sessions', work.id, name)));
    const native = readStoppedBaseAuditNative(work, binding.cwd, input, proof.result, codexRoot);
    if (!completedExecution(store, work) || completionFiles.some(file => !isDeepStrictEqual(artifact(store, file.path), file)))
        throw new Error('Stopped-base audit completion changed during readback');
    return { proof, native, completionFiles, requestId: request.id, claimId: claim.id };
}
