import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Store } from '../../store/store';
import type { StageResult, TicketJob, WorkTime } from '../../../src/shared';
import { artifact } from '../../store/readback-evidence';
import { completedExecution } from '../../workers/worker-completion';
import { processGroupAlive } from '../../workers/process';

/** A receipt that only read: the same rule the owner settlement applies to a job's step receipts. */
const READ = /^(?:get|read|query|inspect)\b/i;

/**
 * One work-log entry of the job: a PR preparation that ran to its end and, by its own saved result, wrote nothing.
 * Preparation runs under a profile that may write, so the result the worker saved is read here itself and not only
 * through the job's steps: acceptance can refuse a result before it records the step. The result is the one the
 * execution-completion proof names by hash; it must have passed at the job's head and pull request with every
 * receipt a verified read. The worker's process group must be gone, and its session, assignment and claim records
 * must be this job's.
 */
export function completedPreparation(store: Store, job: TicketJob, work: WorkTime, alive = processGroupAlive): boolean {
    if (work.stage !== 'github-prepare-pr' || work.role !== 'lead' || work.status !== 'completed' || work.ticket !== job.key || !work.claimId ||
        !work.processId || !Number.isSafeInteger(work.processId) || work.processId < 1 || !/^[a-zA-Z0-9-]+$/.test(work.id) ||
        store.state.workLog?.some(other => other.id !== work.id && other.sessionId === work.sessionId) ||
        !completedExecution(store, work) || alive(work.processId))
        return false;
    try {
        const directory = resolve(store.dataRoot, 'sessions', work.id);
        const read = (name: string) => JSON.parse(readFileSync(artifact(store, resolve(directory, name)).path, 'utf8'));
        const assignment = read('assignment.json'), provider = read('provider.json'), identity = read('assignment-identity.json'), capabilities = read('capabilities.json');
        const result = read('result.json').result as StageResult;
        const rows = store.db.prepare('SELECT body FROM work_claims WHERE id=?').all(work.claimId) as { body: string }[], claim = rows.length === 1 ? JSON.parse(rows[0].body) : null;
        return assignment.id === work.id && assignment.claimId === work.claimId && assignment.lane === 'delivery' &&
            assignment.work?.projectId === store.project.id && assignment.work?.kind === 'delivery' && assignment.work?.id === job.id &&
            assignment.stage === work.stage && assignment.role === work.role && assignment.scope?.repository === store.project.repository && assignment.scope?.artifacts === directory &&
            assignment.profile === capabilities.name && capabilities.name === 'github-native' &&
            provider.project === store.project.id && provider.repository === store.project.repository && provider.role === 'lead' && provider.provider === work.provider &&
            identity.attemptId === work.id && identity.requestId === job.id && identity.projectId === store.project.id && identity.repository === store.project.repository &&
            identity.role === 'lead' && identity.threadId === work.sessionId &&
            !!claim && claim.id === work.claimId && claim.status === 'completed' && claim.lane === 'delivery' && claim.stage === 'prepare-pr' &&
            claim.work?.projectId === store.project.id && claim.work?.kind === 'delivery' && claim.work?.id === job.id && !!claim.endedAt &&
            result.outcome === 'passed' && result.commit === job.head && result.prId === job.pr && Array.isArray(result.receipts) &&
            result.receipts.every(receipt => receipt.verified === true && !receipt.uncertain && READ.test(receipt.action));
    }
    catch { return false; }
}
