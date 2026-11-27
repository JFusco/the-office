import { readSavedCard } from '../publication/card-read';
import { NOT_AT_TARGET } from '../attempts/draft-retry';
import type { command } from '../../workers/process';
import type { Store } from '../../store/store';
import type { DeliveryRetryBinding, TicketJob } from '../../../src/shared';

/**
 * A board recovery's only automatic action: read each saved, unsettled card move of the draft back on its original
 * item and field, with the recorded card read, under the current claim. A match is saved as verified. A complete
 * read of another option keeps the update as saved, adds a typed `not-at-target` observation, saves the definitive
 * stop and sends nothing: a person resolves it. A missing field, another item, an incomplete page, a provider error
 * or a lost claim leaves the update unresolved. Nothing here writes to the board. Returns how many cards it read.
 */
export async function readBackSavedDraftUpdates(store: Store, execute: typeof command, job: TicketJob, root: string, binding: DeliveryRetryBinding, guard: () => void, pr = job.pr): Promise<number> {
    let reads = 0;
    for (const update of job.boardUpdates || []) {
        if (update.status === 'verified') continue;
        if (!binding.updates?.some(saved => saved.item === update.item && saved.field === update.field && saved.option === update.option && saved.at === update.at))
            throw new Error('A card move outside the saved recovery is open; it is not read back automatically');
        guard();
        reads++;
        const observed = await readSavedCard(store, execute, job, root, update, pr);
        // Nothing is saved for a read that finished after the claim was lost.
        guard();
        if (observed === undefined) throw new Error('Board status read-back found no value for the saved field; the move stays unresolved');
        if (observed === update.option) {
            update.status = 'verified';
            update.detail = 'Original board transition verified by read-back; no mutation repeated.';
            store.save();
            continue;
        }
        update.readBack = { outcome: 'not-at-target', observed, at: store.clock.now().toISOString() };
        store.save();
        throw new Error(`Board recovery: the ${update.target} move of card ${update.item} was ${NOT_AT_TARGET}`);
    }
    return reads;
}
