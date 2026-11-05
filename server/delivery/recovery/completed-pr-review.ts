import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

/** A completed reader is historical review evidence, not an unfinished delivery writer. */
export function completedPRReviews(store: Store, job: TicketJob): boolean {
    return (store.state.workLog || []).filter(work => work.requestId === job.id).every(work => {
        if (work.stage !== 'github-lead-pr' || work.role !== 'lead' ||
            !['completed', 'blocked', 'failed'].includes(work.status) ||
            work.executionStatus !== 'completed' || !work.endedAt || !work.claimId)
            return false;
        try {
            const directory = resolve(store.dataRoot, 'sessions', work.id);
            const read = (name: string) => JSON.parse(readFileSync(resolve(directory, name), 'utf8'));
            const assignment = read('assignment.json'), provider = read('provider.json'), capabilities = read('capabilities.json');
            return assignment.id === work.id && assignment.claimId === work.claimId &&
                assignment.work?.projectId === store.project.id && assignment.work?.kind === 'delivery' && assignment.work?.id === job.id &&
                assignment.stage === work.stage && assignment.role === work.role && assignment.profile === 'reader' &&
                provider.project === store.project.id && provider.repository === store.project.repository && provider.role === 'lead' && provider.readOnly === true &&
                capabilities.name === 'reader' && capabilities.readOnly === true;
        }
        catch { return false; }
    });
}
