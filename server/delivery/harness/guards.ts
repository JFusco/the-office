import { HOLDS } from '../../config';
import type { Store } from '../../store';
import type { TicketJob } from '../../../src/shared';

/** Checked before a harness stage starts and again immediately before every external write. */
export function assertMayMutate(store: Store, jobs: TicketJob[], job: TicketJob, expectedHead: string): void {
    if (store.state.paused)
        throw new Error('Office paused before a harness write');
    if (HOLDS[job.key])
        throw new Error(`${job.key} is held: ${HOLDS[job.key]}`);
    if (jobs.find(candidate => candidate.id === job.id) !== job)
        throw new Error('Delivery job identity changed before a harness write');
    if (expectedHead && job.head !== expectedHead)
        throw new Error('Candidate head changed before a harness write');
}
