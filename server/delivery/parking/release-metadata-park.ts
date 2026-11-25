import { sanitize } from '../../office/security';
import { assertParkAuthority } from './metadata-park-freshness';
import { boundParkComment, lanePayload, parkIntents } from './park-writes';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

/**
 * Releases an unpublished harness-worded park whose decision comment was never sent, for a fresh review: its
 * decision no longer holds, or a person took the issue card out of Block. Every attempted write must be accounted
 * for first. In one store transaction the park's intents still `prepared` with no dispatch time are closed as
 * rejected before dispatch; one that changed meanwhile is read again, and one that was dispatched refuses the
 * release and rolls it back. The park is kept on `releasedParks` with its reason and the active park cleared; the
 * review step, the Effects and the board updates stay. Throws `words`, which the pass stops with.
 */
export function releaseMetadataPark(store: Store, job: TicketJob, parked: NonNullable<TicketJob['parked']>, words: string): never {
    store.transaction(() => {
        if (job.parked !== parked || parked.published) throw new Error('The park changed before it was released');
        assertParkAuthority(store, job, parked.metadata!.pr.head);
        const intents = parkIntents(store, job);
        if (intents.some(intent => ['dispatching', 'uncertain'].includes(intent.status) || intent.operation === 'github-issue-comment' && intent.dispatchedAt))
            throw new Error('The park has a write that was sent; it is read back, not released');
        for (const intent of intents.filter(intent => intent.status === 'prepared' && !intent.dispatchedAt)) {
            if (intent.operation === 'github-issue-comment') boundParkComment(store, job, intent);
            else lanePayload(store, job, intent);
            if (store.updateEffect(intent.id, 'prepared', current => { current.status = 'rejected'; current.error = sanitize('Retired before dispatch: the park was released for a fresh review'); })) continue;
            const current = store.getEffect(intent.id);
            if (current?.status !== 'rejected' || current.dispatchedAt)
                throw new Error(`The park's write ${intent.id} was dispatched while the park was being released; it is read back, not released`);
        }
        (job.releasedParks ??= []).push({ ...structuredClone(parked), releasedAt: store.clock.now().toISOString(), releaseReason: words });
        delete job.parked;
        job.status = 'blocked';
        job.detail = words;
        store.emit('delivery-park-released', `${job.key}: ${words}`, 'pm', job.key);
    });
    throw new Error(words);
}
