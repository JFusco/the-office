import { holdReason } from '../../office/project-holds';
import { processGroupAlive } from '../../workers/process';
import { harnessDelivers } from '../harness/scope';
import { ATTEMPT_DELAYS_MS, nextAttemptAt } from './attempt-backoff';
import { subjectKey } from '../../../src/contracts/incidents';
import { workKey } from '../../../src/shared';
import type { Store } from '../../store/store';
import type { TicketJob, WorkTime } from '../../../src/shared';

/** Scope repair always carries a recovery record, which keeps its own handling. */
export const WRITER_STAGES: readonly string[] = ['implement', 'update-base'];

/** A run that stopped longer ago than this stays with its existing handling; nothing old restarts on a deploy. */
const MAX_STOPPED_MS = 6 * 60 * 60 * 1000;

/** A retry cannot fix a missing login, permission or owner. */
const NOT_RETRYABLE: readonly string[] = ['authentication', 'permission', 'ownership'];

/** A dead writer run and the accepted head a restart of it would start from. */
export interface StoppedWriter { work: WorkTime; accepted: string }

/** `released`: the attempt is past the ordinary allowance and funded by the job's repair release. */
export interface WriterRestartCandidate extends StoppedWriter { attempt: number; released: boolean }

/** Whether the harness already abandoned this run and restarted its stage. */
export function writerRestarted(job: Pick<TicketJob, 'writerRestarts'>, workId: string): boolean {
    return !!job.writerRestarts?.some(restart => restart.workId === workId);
}

/**
 * A hands-off writer stage whose last run died (interrupted or failed, never a returned verdict)
 * and that nothing else owns: everything a restart requires short of its allowance. Saved facts
 * only. Null means other handling owns the job.
 */
export function stoppedWriter(store: Store, job: TicketJob, alive: (pid: number) => boolean = processGroupAlive): StoppedWriter | null {
    const state = store.state, accepted = job.head || job.candidateBase;
    if (!harnessDelivers(store, job) || !WRITER_STAGES.includes(job.stage) || !['blocked', 'interrupted'].includes(job.status)) return null;
    if (state.paused || state.draining || holdReason(store.project, job.key) || job.pr && holdReason(store.project, `GH-${job.pr}`) || !job.worktree || !job.branch || !accepted) return null;
    // Work that already has its own recovery record keeps it.
    if (job.stoppedBaseUpdate || job.repairCycle || job.mergeAttempt || job.parked) return null;
    // A release-marker correction keeps its refused checkout and pending record for a person: never salvaged or reset.
    if (Object.values(job.releaseMarkerReturns ?? {}).some(item => item.status === 'pending')) return null;
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
    return { work, accepted };
}

/** Whether the job holds an unspent repair release for exactly this subject, run, stage and accepted head. */
export function releaseFunds(store: Pick<Store, 'project'>, job: TicketJob, workId: string, accepted: string): boolean {
    const grant = job.repairRelease;
    return !!grant && !grant.consumedAt && grant.subject === subjectKey({ projectId: store.project.id, kind: 'delivery', id: job.id })
        && grant.workId === workId && grant.stage === job.stage && grant.accepted === accepted;
}

/**
 * A stopped writer (see stoppedWriter) whose restart is due now. The ordinary allowance is three
 * restarts per stage and accepted head, each after its wait from the stop, within six hours of it;
 * an attempt it still holds is waited out. Once it is spent or the six hours have passed, only an
 * unspent repair release for this exact run, stage and accepted head grants one attempt more, the
 * last ordinary wait after the same stop. The caller still has to confirm the remote branch and PR
 * have not moved.
 */
export function writerRestartCandidate(store: Store, job: TicketJob, now: Date, alive: (pid: number) => boolean = processGroupAlive): WriterRestartCandidate | null {
    const stopped = stoppedWriter(store, job, alive);
    if (!stopped) return null;
    const { work, accepted } = stopped;
    const attempt = job.writerRestarts?.filter(restart => restart.stage === job.stage && restart.accepted === accepted).length || 0;
    const stoppedAt = Date.parse(work.endedAt || work.startedAt);
    if (!Number.isFinite(stoppedAt)) return null;
    const elapsed = now.getTime() - stoppedAt, due = nextAttemptAt(attempt, new Date(stoppedAt));
    if (due && elapsed <= MAX_STOPPED_MS) return now.getTime() < due.getTime() ? null : { work, accepted, attempt: attempt + 1, released: false };
    if (!releaseFunds(store, job, work.id, accepted) || elapsed < ATTEMPT_DELAYS_MS.at(-1)!) return null;
    return { work, accepted, attempt: attempt + 1, released: true };
}

/** The stopped run is the harness's to restart, now or after its wait; other recovery stays out. */
export function writerRestartPending(store: Store, job: TicketJob, alive: (pid: number) => boolean = processGroupAlive): boolean {
    const work = store.state.workLog?.filter(entry => entry.requestId === job.id && entry.stage === `github-${job.stage}`).at(-1);
    if (!work) return false;
    // Judged at the last moment a restart could still be due for this run.
    return !!writerRestartCandidate(store, job, new Date(Date.parse(work.endedAt || work.startedAt) + MAX_STOPPED_MS), alive);
}
