import { resolveLane } from '../board/move-lane';
import { effectiveParkPickup, REVIEWABLE } from './card-resume-route';
import { ParkNeedsRestore } from './metadata-park-freshness';
import { assertDeliveryMayMutate } from '../harness/guards';
import { readParkInventory } from './metadata-park-inventory';
import { commentAuthor, parkCommentBody, settleParkComment } from './park-comment';
import { lanePayload, parkIntents, parkUpdates, settleParkWrites, unconfirmedWrites, unreadStopWords } from './park-writes';
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
    const { store, execute } = delivery, parked = job.parked!, issue = Number(job.key.slice(3)), head = job.head;
    const stop = (fact: string) => { parked.stopped = `${HISTORY}: ${fact}.`; return new Error(`${parked.stopped} Reconcile it by hand; the original park is kept.`); };
    try {
        const guard = () => assertDeliveryMayMutate(store, delivery.jobs, job, head);
        guard();
        const unread = await settleParkWrites(store, execute, job);
        if (unread.length) throw new Error(unreadStopWords(unread));
        try {
            const comment = { issue, marker: parked.marker!, body: parkCommentBody(parked), author: await commentAuthor(store, execute) };
            await settleParkComment(store, execute, job, comment, { payload: { marker: parked.marker }, guard, post: false });
        }
        catch (error) {
            parked.commentReadError = String(error);
            throw error;
        }
        delete parked.commentReadError;
        const inventory = await readParkInventory(store, execute, job), block = resolveLane(inventory.field, 'Block'), updates = parkUpdates(job);
        if (!inventory.cards.some(card => card.kind === 'Issue')) throw stop('the issue has no card on the board');
        const laneIntents = parkIntents(store, job).filter(intent => intent.operation === 'github-project-status');
        const moves = laneIntents.map(intent => ({ lane: lanePayload(store, job, intent), status: intent.status }));
        const recorded = new Set([...moves.map(({ lane }) => lane.item), ...updates.map(update => update.item)]);
        if ([...recorded].some(item => !inventory.lanes.has(item))) throw stop('a card this park recorded is no longer on the board');
        const matchesBlock = (lane: { project: string; field: string; option: string }) =>
            lane.project === inventory.field.projectId && lane.field === inventory.field.fieldId && lane.option === block.id;
        const proved = new Set([
            ...moves.filter(({ lane, status }) => status === 'verified' && matchesBlock(lane)).map(({ lane }) => lane.item),
            ...updates.filter(update => update.status === 'verified' && matchesBlock(update)).map(update => update.item),
        ]);
        const outstanding = inventory.cards.filter(card => inventory.lanes.get(card.id) !== block.id || !proved.has(card.id));
        if (outstanding.length)
            throw stop(`${outstanding.length} of its cards ${outstanding.length > 1 ? 'are' : 'is'} not confirmed in ${block.name}, and it keeps no record of its review or route to send a move`);
        const pickup = effectiveParkPickup(store);
        const named = parked.instruction?.split('\n\n').at(-1)?.match(/move the issue card(?:, not the pull request's card,)? back to ([^.;\n]+)[.;]/i)?.[1];
        if (!pickup.enabled) throw stop('automatic pickup is turned off');
        if (!named || !REVIEWABLE.has(named.toLowerCase()) || pickup.status !== named ||
            inventory.field.options.filter(option => option.name === named).length !== 1)
            throw stop('the pickup lane named in its instruction is unavailable');
        publishMetadataPark(store, job, parked, head, named);
    }
    catch (error) {
        if (job.parked === parked) {
            if (error instanceof ParkNeedsRestore) stop(error.message);
            const unconfirmed = unconfirmedWrites(store, job);
            if (unconfirmed.length) parked.unconfirmed = unconfirmed; else delete parked.unconfirmed;
            store.save();
        }
        throw error;
    }
}
