import { resolveLane } from '../board/move-lane';
import { activeEffectId } from '../harness/effect';
import { assertDeliveryMayMutate } from '../harness/guards';
import { readParkInventory } from './metadata-park-inventory';
import { commentAuthor, parkCommentBody, settleParkComment } from './park-comment';
import { parkLaneOperation, parkUpdates, settleParkWrites, unconfirmedWrites, unreadStopWords } from './park-writes';
import { publishMetadataPark } from './publish-metadata-park';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';

const HISTORY = 'This park was saved before parks kept the review and route they were decided on, so the Office only reads back what it sent and sends nothing new for it';

/**
 * Finishes a harness-worded park saved before parks kept a binding: it posted its comment first, under a `{ marker }`
 * payload. Its comment is read back only under that original intent, Effect id and stored words, or adopted when
 * exactly that comment is on the issue; it is never posted again. The card moves it sent are settled by read-back.
 * With no retained review or route evidence, a card move it never sent is not sent now: that, or a comment that is
 * missing, edited, duplicated or by another author, stays a visible stop and the original record is kept. It
 * publishes once its exact comment is confirmed and every card of the issue and pull request reads in Block with a
 * verified move or note of this park.
 */
export async function advanceHistoricalPark(delivery: GitHubDelivery, job: TicketJob): Promise<void> {
    const { store, execute } = delivery, parked = job.parked!, issue = Number(job.key.slice(3));
    const stop = (fact: string) => { parked.stopped = `${HISTORY}: ${fact}.`; return new Error(`${parked.stopped} Reconcile it by hand; the original park is kept.`); };
    try {
        const guard = () => assertDeliveryMayMutate(store, delivery.jobs, job, job.head);
        guard();
        const unread = await settleParkWrites(store, execute, job);
        if (unread.length) throw new Error(unreadStopWords(unread));
        const comment = { issue, marker: parked.marker!, body: parkCommentBody(parked), author: await commentAuthor(store, execute) };
        try { await settleParkComment(store, execute, job, comment, { payload: { marker: parked.marker }, guard, post: false }); }
        catch (error) { throw stop(`its decision comment is not confirmed (${String(error).replace(/^Error: /, '')})`); }
        const inventory = await readParkInventory(store, execute, job), block = resolveLane(inventory.field, 'Block'), updates = parkUpdates(job);
        if (!inventory.cards.some(card => card.kind === 'Issue')) throw stop('the issue has no card on the board');
        const outstanding = inventory.cards.filter(card => {
            const intent = store.getEffect<Record<string, unknown>>(activeEffectId(store, `harness:${job.id}:${parkLaneOperation(job).id}:lane:${card.id}`));
            const moved = intent?.status === 'verified' && intent.payload.option === block.id && intent.payload.field === inventory.field.fieldId;
            const noted = updates.some(update => update.item === card.id && update.status === 'verified' && update.option === block.id && update.field === inventory.field.fieldId);
            return inventory.lanes.get(card.id) !== block.id || !moved && !noted;
        });
        if (outstanding.length)
            throw stop(`${outstanding.length} of its cards ${outstanding.length > 1 ? 'are' : 'is'} not confirmed in ${block.name}, and it keeps no record of its review or route to send a move`);
        publishMetadataPark(store, job, parked);
    }
    catch (error) {
        if (job.parked === parked) {
            const unconfirmed = unconfirmedWrites(store, job);
            if (unconfirmed.length) parked.unconfirmed = unconfirmed; else delete parked.unconfirmed;
            store.save();
        }
        throw error;
    }
}
