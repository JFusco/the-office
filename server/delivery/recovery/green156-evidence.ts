import { GREEN156 } from './green156-authorization';
export { GREEN156 } from './green156-authorization';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { artifact, digest } from '../../store/readback-evidence';
import { completedExecution } from '../../workers/worker-completion';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

export function green156Subject(store: Store, job: TicketJob) {
    return store.project.id === GREEN156.project && store.project.repository === GREEN156.repository && job.id === GREEN156.job &&
        job.key === GREEN156.key && job.pr === GREEN156.pr && job.existingPR && job.stoppedBaseUpdate?.originalWorkId === GREEN156.original;
}
/** The negative audit is retained and verified as negative; this never asserts historical non-mutation. */
export function retainedGreen156Audit(store: Store, job: TicketJob) {
    const r = job.stoppedBaseUpdate, c = r?.audit.completion;
    if (!green156Subject(store, job) || !r || r.audit.state !== 'completed' || !c || c.resultSha256 !== GREEN156.audit) throw Error('Exact retained negative audit required');
    const workers = store.state.workLog?.filter(w => w.id === r.audit.workerId) || [], w = workers[0];
    if (workers.length !== 1 || w.requestId !== job.id || w.claimId !== r.audit.claimId || w.stage !== 'stopped-base-update-audit' ||
        w.status !== 'blocked' || w.sessionId !== c.sessionId || !completedExecution(store, w) ||
        c.resultPath !== resolve(store.dataRoot, 'sessions', w.id, 'result.json')) throw Error('Original completed negative reader required');
    const file = artifact(store, c.resultPath), result = JSON.parse(readFileSync(file.path, 'utf8')).result;
    if (file.sha256 !== GREEN156.audit || result.outcome !== 'blocked' || result.noRepositorySourceOrPublicationMutation !== false ||
        artifact(store, resolve(store.dataRoot, 'sessions', w.id, 'execution-completion.json')).sha256 !== c.executionCompletionSha256)
        throw Error('Retained negative audit changed');
}
export function green156Admitted(store: Store, job: TicketJob): boolean {
    const g = job.stoppedBaseUpdate?.greenMerge;
    if (!g || !green156Subject(store, job) || job.head !== GREEN156.head) return false;
    try {
        retainedGreen156Audit(store, job);
        const file = artifact(store, g.path), value = JSON.parse(readFileSync(file.path, 'utf8'));
        const requests = store.state.coordination?.requests?.filter(q => q.id === g.requestId) || [], request = requests[0];
        const row = store.db.prepare('SELECT body FROM work_claims WHERE id=?').get(g.claimId) as { body: string } | undefined;
        const claim = row && JSON.parse(row.body);
        return file.sha256 === g.sha256 && value.kind === 'joe-green-only-156' && value.jobId === job.id &&
            value.head === GREEN156.head && value.originalWorkId === GREEN156.original && value.auditSha256 === GREEN156.audit &&
            value.requestId === g.requestId && digest(value.preservedCandidate) === g.preservedCandidateSha256 &&
            requests.length === 1 && request.action === 'authorize-green-merge-156' && request.key === job.key && request.head === GREEN156.original &&
            claim?.work.projectId === store.project.id && claim.work.kind === 'reconciliation' && claim.work.id === request.id &&
            claim.stage === request.action && claim.lane === 'delivery';
    } catch { return false; }
}
