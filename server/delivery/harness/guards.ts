import { HOLDS } from '../../office/config';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';
import { harnessDelivers } from './scope';
import { requireDeliveryAuthority } from './delivery-authority';
import { packed165Admitted } from '../recovery/packed165-evidence';

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
    if (job.packedPublicationRepair && !packed165Admitted(store, job))
        throw new Error('The exact approved #165 repair binding changed');
}

/** Scheduled ticket writes need their own claim. Polling/cleanup retain the guard above. */
export function assertDeliveryMayMutate(store: Store, jobs: TicketJob[], job: TicketJob, expectedHead: string): void {
    assertMayMutate(store, jobs, job, expectedHead);
    if (harnessDelivers(store, job)) requireDeliveryAuthority(store, job);
}
