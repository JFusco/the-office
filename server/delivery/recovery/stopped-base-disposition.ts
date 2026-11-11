import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { artifact, digest, ownedPath } from '../../store/readback-evidence';
import { assertStoppedBaseAudit, type StoppedBaseAuditInput } from './stopped-base-audit';
import { completedExecution } from '../../workers/worker-completion';
import type { Store } from '../../store/store';
import type { HarnessRequest, TicketJob } from '../../../src/shared';

/** Save new private evidence once; an existing file never becomes a new attempt. */
export function saveStoppedBaseArtifact(store: Store, job: TicketJob, name: string, value: unknown, reuseIdentical = false) {
    const root = resolve(store.dataRoot, 'ticket-work', job.id);
    ownedPath({ dataRoot: store.dataRoot }, root);
    if (!/^[a-z0-9-]+\.json$/.test(name)) throw new Error('Bound stopped-base artifact name required');
    const path = resolve(root, name);
    if (reuseIdentical && existsSync(path)) {
        const file = artifact(store, path);
        if (file.sha256 !== digest(value)) throw new Error('Existing stopped-base immutable artifact differs');
        return file;
    }
    writeFileSync(path, JSON.stringify(value), { flag: 'wx', mode: 0o600 });
    return artifact(store, path);
}

/** Positive administrative disposition is separate from source acceptance. */
export function stoppedBaseUpdateResolved(store: Store, request: Pick<HarnessRequest, 'key' | 'head'>): boolean {
    const job = store.state.coordination?.jobs?.find(j => j.key === request.key), r = job?.stoppedBaseUpdate;
    if (!job || !r || request.head !== r.originalWorkId || r.phase === 'audit' || !r.preservedCandidate ||
        r.audit.state !== 'completed' || !r.audit.completion || !r.disposition) return false;
    try {
        const workers = store.state.workLog?.filter(work => work.id === r.audit.workerId) || [], worker = workers[0];
        if (workers.length !== 1 || worker.requestId !== job.id || worker.claimId !== r.audit.claimId ||
            worker.role !== 'lead' || worker.stage !== 'stopped-base-update-audit' || worker.provider !== 'codex' ||
            !['completed', 'blocked'].includes(worker.status) || worker.sessionId !== r.audit.completion.sessionId ||
            r.audit.completion.resultPath !== resolve(store.dataRoot, 'sessions', worker.id, 'result.json') ||
            !completedExecution(store, worker)) return false;
        const file = artifact(store, r.disposition.path), value = JSON.parse(readFileSync(file.path, 'utf8'));
        const inputFile = artifact(store, r.input.path), input = JSON.parse(readFileSync(inputFile.path, 'utf8')) as StoppedBaseAuditInput;
        const completion = artifact(store, r.audit.completion.resultPath), result = JSON.parse(readFileSync(completion.path, 'utf8')).result;
        const executionCompletion = artifact(store, resolve(store.dataRoot, 'sessions', worker.id, 'execution-completion.json'));
        assertStoppedBaseAudit(input, result);
        return file.sha256 === r.disposition.sha256 && inputFile.sha256 === r.input.sha256 && digest(input) === r.input.inputSha256 &&
            executionCompletion.sha256 === r.audit.completion.executionCompletionSha256 &&
            completion.sha256 === r.audit.completion.resultSha256 && value.jobId === job.id && value.originalWorkId === r.originalWorkId &&
            value.contextSha256 === r.contextSha256 && value.inputSha256 === r.input.inputSha256 &&
            value.auditWorkerId === r.audit.workerId && value.resultSha256 === completion.sha256 &&
            value.candidateSha256 === digest(r.preservedCandidate);
    } catch { return false; }
}

/** A lost handoff tail resolves only from the immutable prospective candidate binding. */
export function stoppedBaseHandoffResolved(store: Store, request: Pick<HarnessRequest,'key'|'head'>): boolean {
    const job=store.state.coordination?.jobs?.find(j=>j.key===request.key), r=job?.stoppedBaseUpdate;
    if(!job||!r||r.phase!=='review'||!r.handoff||!r.checkout||!r.candidateBinding||r.handoff.workerId!==request.head||
        job.head!==r.handoff.head||job.worktree!==r.checkout.worktree||job.branch!==r.checkout.branch||
        !stoppedBaseUpdateResolved(store,{key:job.key,head:r.originalWorkId}))return false;
    try{
        const workers=store.state.workLog?.filter(w=>w.requestId===job.id&&w.stage==='stopped-base-update-handoff')||[],worker=workers[0];
        if(workers.length!==1||worker.id!==r.handoff.workerId||!r.handoffStarted?.claimId||worker.claimId!==r.handoffStarted.claimId||
            worker.role!=='lead'||worker.provider!=='codex'||
            r.handoff.resultPath!==resolve(store.dataRoot,'sessions',worker.id,'result.json')||!completedExecution(store,worker))return false;
        const file=artifact(store,r.candidateBinding.path),value=JSON.parse(readFileSync(file.path,'utf8'));
        return file.sha256===r.candidateBinding.sha256&&value.originalWorkId===r.originalWorkId&&value.handoffWorkerId===r.handoff.workerId&&
            value.handoffResultSha256===r.handoff.resultSha256&&value.checkoutSha256===digest(r.checkout)&&
            artifact(store,r.handoff.resultPath).sha256===r.handoff.resultSha256&&
            artifact(store,resolve(store.dataRoot,'sessions',worker.id,'execution-completion.json')).sha256===r.handoff.executionCompletionSha256;
    }catch{return false;}
}
