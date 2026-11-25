import { recordParked } from '../../knowledge/record-trigger';
import { assertParkAuthority, assertParkPickup } from './metadata-park-freshness';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

/**
 * Publishes a harness-worded park whose comment and cards are confirmed: `published`, the blocked status and the
 * decision detail are saved together, with the existing parked event and retrospective trigger. The cards stay
 * where they were read, so an issue card Joe already returned to the pickup lane is left for `resume.ts`.
 */
export function publishMetadataPark(store: Store, job: TicketJob, parked: NonNullable<TicketJob['parked']>, expectedHead: string, pickup: string): void {
    store.transaction(() => {
        if (job.parked !== parked || parked.published) throw new Error('The park changed before it was published');
        assertParkAuthority(store, job, expectedHead);
        assertParkPickup(store, pickup);
        parked.published = true;
        delete parked.unconfirmed; delete parked.stopped; delete parked.readBackQueued; delete parked.commentReadError; delete parked.readBackChecked; delete parked.continuationQueued;
        job.status = 'blocked';
        job.detail = `Decision needed: ${parked.reason}`;
        recordParked(store, job, parked.reason);
        store.emit('delivery-parked', `${job.key}: decision needed — ${parked.reason}`, 'pm', job.key);
    });
}
