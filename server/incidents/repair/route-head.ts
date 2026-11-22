import { writerRestartPending } from '../../delivery/attempts/restart-writer';
import { boardPreflightCandidate } from '../../delivery/recovery/board-preflight';
import { closeoutRecoveryCandidate } from '../../delivery/recovery/closeout/closeout-recovery-evidence';
import { savedNegativeContinuationReview } from '../../delivery/recovery/implementation/continuation-review-readback';
import { implementationRecoveryCandidate } from '../../delivery/recovery/implementation/implementation-recovery';
import { hasSavedPrerequisiteResult, savedPrerequisiteOriginal } from '../../delivery/recovery/implementation/saved-prerequisite-handoff';
import { completedConflictDraftCandidate } from '../../delivery/recovery/preparation/post-conflict-preparation';
import { postConflictReadbackCandidate, preparationReadbackCandidate } from '../../delivery/recovery/preparation/preparation-readback';
import { publishedDraftConflictCandidate } from '../../delivery/recovery/preparation/published-draft-conflict';
import { scopeRepairResumeCandidate } from '../../delivery/recovery/scope-repair/scope-repair-resume';
import { stoppedBaseHandoffResolved } from '../../delivery/recovery/stopped-base-disposition';
import { stoppedBaseUpdateCandidate } from '../../delivery/recovery/stopped-base-update';
import { validationReadbackCandidate } from '../../delivery/recovery/validation/validation-readback';
import type { TicketJob, WorkTime } from '../../../src/shared';
import type { Store } from '../../store/store';
import { completedExecution } from '../../workers/worker-completion';
import { redactEvidence } from '../redact-evidence';

/** The one earlier run a handler's rule names for a job, or nothing. */
type Original = (store: Store, job: TicketJob) => { work: { id: string } } | undefined;
type Lease = (store: Store, job: TicketJob) => { head: string } | undefined;

/**
 * The handlers' own admission rules, each the function its handler calls when the scheduler runs
 * the request. They are asked here and never restated, so admission and execution cannot come to
 * disagree about which run a request may read.
 */
export interface HandlerRules {
    savedPrerequisite: (store: Store, job: TicketJob, head: string) => boolean;
    /** Throws unless `head` is the one completed writer the saved-prerequisite handoff reads. */
    savedPrerequisiteOriginal: (store: Store, job: TicketJob, head: string) => unknown;
    implementation: Original;
    validation: Original;
    scopeRepair: Original;
    publishedDraft: Original;
    completedDraft: Original;
    postConflictPreparation: Original;
    preparation: Original;
    boardPreflight: Lease;
    stoppedBaseUpdate: Lease;
    /** Whether the job's dead writer run qualifies for the harness's own restart, judged as that rule judges it, without its six-hour limit. While it does, the stopped-base rule names no run. */
    writerRestartPending: (store: Store, job: TicketJob) => boolean;
    closeout: Original;
    baseHandoffResolved: (store: Store, request: { key: string; head: string }) => boolean;
    /** Whether a run finished with its completion on record, as the handoff read-back requires of the run it reads. */
    completedRun: (store: Store, work: WorkTime) => boolean;
    continuationReview: (store: Store, job: TicketJob, head: string) => unknown;
}

export const HANDLER_RULES: HandlerRules = {
    savedPrerequisite: hasSavedPrerequisiteResult,
    savedPrerequisiteOriginal,
    implementation: implementationRecoveryCandidate,
    validation: validationReadbackCandidate,
    scopeRepair: scopeRepairResumeCandidate,
    publishedDraft: publishedDraftConflictCandidate,
    completedDraft: completedConflictDraftCandidate,
    postConflictPreparation: postConflictReadbackCandidate,
    preparation: preparationReadbackCandidate,
    boardPreflight: boardPreflightCandidate,
    stoppedBaseUpdate: stoppedBaseUpdateCandidate,
    writerRestartPending,
    closeout: closeoutRecoveryCandidate,
    baseHandoffResolved: stoppedBaseHandoffResolved,
    completedRun: completedExecution,
    continuationReview: savedNegativeContinuationReview,
};

const STOPPED: readonly string[] = ['blocked', 'interrupted'];

/**
 * The `head` each handler would take for this job as it stands: a run's ID, a commit, `''` for
 * its saved-result form, or null when it has nothing to read. Each follows its handler's own
 * branches in `executeRequest` (server/scheduling/requests.ts), in the handler's order.
 */
const ACCEPTS: Record<string, (store: Store, job: TicketJob, head: string, rules: HandlerRules) => string | null> = {
    'reconcile-implementation': (store, job, head, rules) => {
        // A saved prerequisite result sends the request to the handoff, which reads the latest completed writer and throws for any other.
        if (!rules.savedPrerequisite(store, job, head)) return rules.implementation(store, job)?.work.id ?? null;
        rules.savedPrerequisiteOriginal(store, job, head);
        return head;
    },
    'reconcile-validation': (store, job, _head, rules) => rules.validation(store, job)?.work.id ?? null,
    'reconcile-scope-repair': (store, job, _head, rules) => rules.scopeRepair(store, job)?.work.id ?? null,
    'reconcile-preparation': (store, job, head, rules) => {
        const published = rules.publishedDraft(store, job), completed = rules.completedDraft(store, job), readback = rules.postConflictPreparation(store, job) || rules.preparation(store, job);
        // The saved-result form reads a finished blocked preparation, and only when no exact original stands.
        if (!head && !published && !completed && !readback) return job.stage === 'prepare-pr' && job.status === 'blocked' ? '' : null;
        return (job.stage === 'draft' ? published ?? completed : readback)?.work.id ?? null;
    },
    'reconcile-base-update': (store, job, _head, rules) => {
        const lease = rules.boardPreflight(store, job) ?? rules.stoppedBaseUpdate(store, job);
        if (lease) return lease.head;
        // A dead writer run that qualifies for the harness's own restart is hidden from the stopped-base rule. A queued request ends that, and the handler then reads the run, not the saved result.
        if (rules.writerRestartPending(store, job)) return null;
        return job.stage === 'update-base' && STOPPED.includes(job.status) ? '' : null;
    },
    'reconcile-closeout': (store, job, _head, rules) => {
        // A pending cleanup anywhere under this key sends a request with a head to the cleanup, which reads this job's own.
        if (jobsOf(store, job.key).some(other => other.closeoutRecovery?.status === 'cleanup-pending'))
            return job.closeoutRecovery?.status === 'cleanup-pending' ? job.closeoutRecovery.originalWorkId : null;
        const original = rules.closeout(store, job);
        if (original) return original.work.id;
        // The saved closeout is found by key and stage alone, cancelled jobs included: the first such job is the one read.
        return jobsOf(store, job.key).find(other => other.stage === 'closeout') === job ? '' : null;
    },
    'reconcile-review': (store, job, head, rules) => {
        // The stopped base handoff is looked up by key alone and comes first; it reads the one run it started.
        const first = jobsOf(store, job.key)[0], recovery = first?.stoppedBaseUpdate;
        if (recovery?.handoffStarted) {
            const runs = (store.state.workLog ?? []).filter(work => work.requestId === first.id && work.stage === 'stopped-base-update-handoff');
            const exact = first === job && runs.length === 1 && runs[0].id === head && runs[0].claimId === recovery.handoffStarted.claimId;
            if (rules.baseHandoffResolved(store, { key: job.key, head })) return exact ? head : null;
            // An unresolved handoff is read from that run's own completion, at the PR review; without either there is nothing to read yet.
            if (['lead', 'checkout'].includes(recovery.phase) && runs.some(run => run.id === head)) return exact && STOPPED.includes(job.status) && job.stage === 'lead-pr' && rules.completedRun(store, runs[0]) ? head : null;
        }
        if (jobsOf(store, job.key).some(other => other.implementationContinuation && other.stage !== 'lead-pr')) return rules.continuationReview(store, job, head) ? head : null;
        // Anything else is read as the saved review, which takes no head.
        return '';
    },
};

const jobsOf = (store: Store, key: string): TicketJob[] => (store.state.coordination?.jobs ?? []).filter(job => job.key === key);

/**
 * Why the handler of `action` would not take this `head` for this job now, or null. A resume is
 * one request per subject and fix, and a handler refuses any run but the one its own rule names;
 * a request it refuses ends blocked, with the resume spent. So the head a fix bound is put to that
 * rule before anything is queued. Synchronous; it reads the job, its runs and their saved
 * evidence, and writes nothing. The saved-review form of `reconcile-review` has no head and is
 * not checked here. A rule that cannot be read is a fault, not a failure of the caller.
 */
export function routeHeadFault(store: Store, job: TicketJob, action: string, head: string, rules: HandlerRules = HANDLER_RULES): string | null {
    if (action === 'reconcile-review' && !head) return null;
    const accepts = Object.hasOwn(ACCEPTS, action) ? ACCEPTS[action] : undefined;
    if (!accepts) return `${action} has no rule for the run it reads.`;
    // Every handler finds its job by key among those not cancelled.
    if (jobsOf(store, job.key).some(other => other !== job && other.status !== 'cancelled')) return `${job.key} has another job that is not cancelled; ${action} finds its job by key.`;
    let expected: string | null;
    try { expected = accepts(store, job, head, rules); }
    catch (error) { return `What ${action} reads for ${job.key} could not be established: ${redactEvidence(String(error)).slice(0, 200)}`; }
    if (expected === head) return null;
    if (expected === null) return `${action} has nothing to read for ${job.key} ${head ? `under ${head}` : 'without a head'} as the job stands.`;
    return `${action} for ${job.key} reads ${expected ? expected : 'its saved result, with no head'}; the route names ${head || 'no head'}.`;
}
