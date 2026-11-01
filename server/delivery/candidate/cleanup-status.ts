import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';
import type { CandidateRemoval } from './remove-candidate';
/** Records the cleanup outcome on the job; a pending reason is reported once and retried by the poll. */
export function recordCandidateCleanup(store: Store, job: TicketJob, outcome: CandidateRemoval | Error) {
    const at = new Date().toISOString();
    if (!(outcome instanceof Error)) {
        const parts = [outcome.worktree && 'worktree', outcome.local && 'local branch', outcome.remote && 'remote branch'].filter(Boolean);
        job.candidateCleanup = { status: outcome.skipped ? 'skipped' : 'done', detail: outcome.skipped ? `Candidate not removed: ${outcome.skipped}.` : parts.length ? `Removed the candidate ${parts.join(', ')}.` : 'No candidate worktree or branch remained.', at };
        return;
    }
    const detail = String(outcome);
    if (job.candidateCleanup?.status === 'pending' && job.candidateCleanup.detail === detail)
        return;
    job.candidateCleanup = { status: 'pending', detail, at };
    store.emit('candidate-cleanup-pending', `${job.key}: candidate cleanup is pending: ${detail}`, 'pm', job.key);
}
