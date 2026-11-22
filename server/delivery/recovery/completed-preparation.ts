import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Store } from '../../store/store';
import type { TicketJob, WorkTime } from '../../../src/shared';
import { completedExecution } from '../../workers/worker-completion';
import { completedPRReview } from './completed-pr-review';

/**
 * One work-log entry of the job: a PR preparation that ran to its end. Preparation runs under a profile that may
 * write, so this proves only that the worker finished for this job and claim with its saved completion proof and no
 * error record. What it wrote, if anything, is judged by the job's step receipts and effects, not here.
 */
export function completedPreparation(store: Store, job: TicketJob, work: WorkTime): boolean {
    if (work.stage !== 'github-prepare-pr' || work.role !== 'lead' || work.status !== 'completed' || !work.claimId || !completedExecution(store, work))
        return false;
    try {
        const directory = resolve(store.dataRoot, 'sessions', work.id);
        const read = (name: string) => JSON.parse(readFileSync(resolve(directory, name), 'utf8'));
        const assignment = read('assignment.json'), provider = read('provider.json');
        return assignment.id === work.id && assignment.claimId === work.claimId &&
            assignment.work?.projectId === store.project.id && assignment.work?.kind === 'delivery' && assignment.work?.id === job.id &&
            assignment.stage === work.stage && assignment.role === work.role &&
            provider.project === store.project.id && provider.repository === store.project.repository && provider.role === 'lead';
    }
    catch { return false; }
}

/** Every worker the Office ran on a handoff its owner then merged has finished: read-only reviews and completed preparations. */
export function ownerMergedWorkFinished(store: Store, job: TicketJob): boolean {
    return (store.state.workLog || []).filter(work => work.requestId === job.id)
        .every(work => completedPRReview(store, job, work) || completedPreparation(store, job, work));
}
