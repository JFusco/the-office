import { assertMayMutate } from '../harness/guards';
import { removeCandidate } from './remove-candidate';
import { recordCandidateCleanup } from './cleanup-status';
import type { command } from '../../workers/process';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

/** Retries a delivered job's pending candidate removal; closeout already finished and is never rerun. */
export async function retryCandidateCleanup(store: Store, execute: typeof command, jobs: TicketJob[]): Promise<void> {
    for (const job of jobs.filter(job => job.status === 'completed' && job.candidateCleanup?.status === 'pending')) {
        const head = job.head;
        recordCandidateCleanup(store, job, await removeCandidate(store, execute, job, () => assertMayMutate(store, jobs, job, head), head).catch(error => error instanceof Error ? error : new Error(String(error))));
    }
}
