import { HOLDS } from '../../office/config';
import { processGroupAlive } from '../../workers/process';
import { harnessDelivers } from '../harness/scope';
import { nextAttemptAt } from './attempt-backoff';
import { workKey } from '../../../src/shared';
import type { Store } from '../../store/store';
import type { TicketJob, WorkTime } from '../../../src/shared';

/** Scope repair always carries a recovery record, which keeps its own handling. */
export const WRITER_STAGES: readonly string[] = ['implement', 'update-base'];

/** A run that stopped longer ago than this stays with its existing handling; nothing old restarts on a deploy. */
const MAX_STOPPED_MS = 6 * 60 * 60 * 1000;

/** A retry cannot fix a missing login, permission or owner. */
const NOT_RETRYABLE: readonly string[] = ['authentication', 'permission', 'ownership'];

export interface WriterRestartCandidate { work: WorkTime; accepted: string; attempt: number }

/** Whether the harness already abandoned this run and restarted its stage. */
export function writerRestarted(job: Pick<TicketJob, 'writerRestarts'>, workId: string): boolean {
    return !!job.writerRestarts?.some(restart => restart.workId === workId);
}

/**
 * A hands-off writer stage whose last run died (interrupted or failed, never a returned verdict)
 * and may be re-run from the accepted head. Saved facts only; the caller still has to confirm the
 * remote branch and PR have not moved. Null means other handling owns the job.
 */
export function writerRestartCandidate(store: Store, job: TicketJob, now: Date, alive: (pid: number) => boolean = processGroupAlive): WriterRestartCandidate | null {
    const state = store.state, accepted = job.head || job.candidateBase;
    if (!harnessDelivers(store, job) || !WRITER_STAGES.includes(job.stage) || !['blocked', 'interrupted'].includes(job.status)) return null;
    if (state.paused || state.draining || HOLDS[job.key] || job.pr && HOLDS[`GH-${job.pr}`] || !job.worktree || !job.branch || !accepted) return null;
    // Work that already has its own recovery record keeps it.
    if (job.stoppedBaseUpdate || job.repairCycle || job.mergeAttempt || job.parked) return null;
    const work = state.workLog?.filter(entry => entry.requestId === job.id && entry.stage === `github-${job.stage}`).at(-1);
    // A run that completed and returned its own verdict (including `failed`) is a decision, not a death.
    if (!work || work.executionStatus || !['interrupted', 'failed'].includes(work.status) || work.failure && NOT_RETRYABLE.includes(work.failure.category)) return null;
    if (job.steps.some(step => step.workerId === work.id) || writerRestarted(job, work.id) || job.writerRestartDeclined?.workId === work.id) return null;
    // Only a process group the operating system reports gone is finished; a run that never started has none.
    if (work.failure?.dispatched !== false && (!work.processId || alive(work.processId))) return null;
    if (store.activeClaims().some(claim => claim.work.kind === 'delivery' && claim.work.id === job.id)) return null;
    if (state.workLog?.some(entry => entry.requestId === job.id && ['running', 'stopping'].includes(entry.status))) return null;
    // A recovery request already aimed at this run owns it, whatever state that request is in.
    if (state.coordination?.requests?.some(request => request.key === job.key && (['queued', 'working'].includes(request.status) || request.head === work.id))) return null;
    const effects = store.db.prepare('SELECT body FROM effects WHERE work_key=?').all(workKey({ projectId: store.project.id, kind: 'delivery', id: job.id })) as { body: string }[];
    if (effects.some(row => ['dispatching', 'uncertain'].includes(JSON.parse(row.body).status))) return null;
    const attempt = job.writerRestarts?.filter(restart => restart.stage === job.stage && restart.accepted === accepted).length || 0;
    const stoppedAt = new Date(work.endedAt || work.startedAt), due = nextAttemptAt(attempt, stoppedAt);
    if (!due || now.getTime() < due.getTime() || now.getTime() - stoppedAt.getTime() > MAX_STOPPED_MS) return null;
    return { work, accepted, attempt: attempt + 1 };
}

/** The stopped run is the harness's to restart, now or after its wait; other recovery stays out. */
export function writerRestartPending(store: Store, job: TicketJob, alive: (pid: number) => boolean = processGroupAlive): boolean {
    const work = store.state.workLog?.filter(entry => entry.requestId === job.id && entry.stage === `github-${job.stage}`).at(-1);
    if (!work) return false;
    // Judged at the last moment a restart could still be due for this run.
    return !!writerRestartCandidate(store, job, new Date(Date.parse(work.endedAt || work.startedAt) + MAX_STOPPED_MS), alive);
}
