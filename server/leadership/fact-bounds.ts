import type { AssignmentReview, GoalEvidenceRef, MaintenanceRun, ProjectGoal, TicketJob, TimeEntry } from '../../src/shared';

/**
 * The daily CTO review sees live work in full, every item a saved goal already cites, and a fixed
 * window of the most recently finished work, so its input stops growing with history.
 */
export const RECENT_FINISHED = 10;
export const RECENT_MAINTENANCE = 5;
export const TIME_WINDOW_DAYS = 14;
const TEXT_LIMIT = 1500, LEDGER_LIMIT = 4000;

const LIVE_INTAKE = new Set(['queued', 'working', 'held', 'blocked', 'interrupted', 'owned']);
const FINISHED_JOB = new Set(['completed', 'cancelled']);
const clip = (text: string | undefined, limit: number) => !text || text.length <= limit ? text || '' : `${text.slice(0, limit)}… [${text.length - limit} more characters]`;

/** Keeps live and pinned items plus the `recent` most recently finished (by `finishedAt`), in original order. */
function liveAndRecent<T>(items: T[], live: (item: T) => boolean, finishedAt: (item: T) => string, recent: number, pinned: (item: T) => boolean = () => false): T[] {
    const finished = items.filter(item => !live(item)).sort((a, b) => finishedAt(a).localeCompare(finishedAt(b)));
    const keep = new Set([...items.filter(item => live(item) || pinned(item)), ...finished.slice(-recent)]);
    return items.filter(item => keep.has(item));
}

/** Work references that saved goals already cite; they stay visible so goals can still be completed or unblocked. */
export function goalReferences(goals: ProjectGoal[], projectId: string): GoalEvidenceRef[] {
    return goals.flatMap(goal => [...goal.progress?.linkedWork || [], ...goal.progress?.evidence || []]).filter(ref => ref.projectId === projectId);
}

export function boundedIntake(reviews: AssignmentReview[]) {
    return liveAndRecent(reviews, review => LIVE_INTAKE.has(review.status), review => review.endedAt || review.queuedAt || '', RECENT_FINISHED)
        .map(({ id, key, status, detail, owner, prerequisites }) => ({ id, key, status, detail: clip(detail, TEXT_LIMIT), owner, prerequisites }));
}

export function boundedJobs(jobs: TicketJob[], refs: GoalEvidenceRef[] = []) {
    const cited = (job: TicketJob) => refs.some(ref => ref.id === job.id || ref.id === job.key || ref.kind === 'pr' && ref.id === String(job.pr));
    return liveAndRecent(jobs, job => !FINISHED_JOB.has(job.status), job => job.updatedAt || job.requestedAt || '', RECENT_FINISHED, cited)
        .map(({ id, key, status, stage, updatedAt, head, mergeCommit, pr, prUrl, detail, steps }) => ({ id, key, status, stage, version: updatedAt, head: mergeCommit || head, pr, prUrl, detail: clip(detail, TEXT_LIMIT), acceptance: status === 'completed' ? steps.filter(step => step.stage === 'closeout') : [] }));
}

/** The latest runs, plus the latest completed run and any run a goal cites. */
export function boundedMaintenance(runs: MaintenanceRun[], refs: GoalEvidenceRef[] = []) {
    const latestCompleted = runs.filter(run => run.status === 'completed').at(-1)?.id;
    const recent = new Set(runs.slice(-RECENT_MAINTENANCE));
    return runs.filter(run => recent.has(run) || run.id === latestCompleted || refs.some(ref => ref.kind === 'maintenance' && ref.id === run.id)).map(({ id, status, stage, startedAt, endedAt, error, steps }) => {
        const latest = steps.at(-1)?.result || null;
        return { id, status, stage, version: endedAt || startedAt, error: clip(error, TEXT_LIMIT), latestResult: latest && { ...latest, ledger: clip(latest.ledger, LEDGER_LIMIT) } };
    });
}

export function boundedTime(entries: TimeEntry[], collectedAt: string) {
    const since = new Date(Date.parse(collectedAt) - TIME_WINDOW_DAYS * 86400000).toISOString().slice(0, 10);
    return entries.filter(entry => entry.date >= since);
}
