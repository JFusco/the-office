import type { OfficeSnapshot } from '../../../src/shared';
import { capabilityBlockedReviews, latestReviews } from '../../conversations/capability-blocked';
import { stoppedRecord } from './stopped-record';

/**
 * Whether an outbox item's own records are already stopped-work subjects, given the subject keys stopped
 * work reports or keeps open this pass. An intake review's item is covered by that review; the capability
 * summary only once every review in it is; a ticket's item by the ticket itself or by a delivery request
 * its record says only mirrors its stop. Work the scheduler projects but stopped work does not record,
 * such as finished history or a review running again, covers nothing. Null for any other item, or when
 * the capability summary has no reviews to read.
 */
export function outboxCoverage(state: OfficeSnapshot, projectId: string, itemId: string, covered: ReadonlySet<string>): boolean | null {
    const [kind, ...rest] = itemId.split(':'), has = (kind: string, id: string) => covered.has(`${projectId}/${kind}/${id}`);
    if (kind === 'assignment') return has('intake', rest.join(':'));
    if (kind === 'ownership-capability') {
        // The collector reads the outbox as projected without a repair's reads: no review is hidden.
        const members = capabilityBlockedReviews(state, latestReviews(state), () => false);
        return members.length ? members.every(review => has('intake', review.id)) : null;
    }
    if (kind !== 'ticket') return null;
    const work = `ticket:${rest[0]}`;
    return has('delivery', work) || !!stoppedRecord(state, { projectId, kind: 'delivery', id: work }, '')?.covers.some(([kind, id]) => kind === 'delivery' && has('delivery', id));
}
