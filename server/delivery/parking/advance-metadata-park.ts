import { moveLane } from '../board/move-lane';
import { assertDeliveryMayMutate } from '../harness/guards';
import { REVIEWABLE } from './card-resume-route';
import { assertParkCurrent, assertParkRoute, ParkNeedsRestore, ParkSuperseded } from './metadata-park-freshness';
import { assertMovable, assertRecordedBoard, assertRecordedInBlock, assertStillInBlock, observeInBlock, readParkInventory, recordBlockCoverage } from './metadata-park-inventory';
import { commentAuthor, parkCommentBody, settleParkComment } from './park-comment';
import { parkIntents, parkLaneOperation, settleParkWrites, unconfirmedWrites, unreadStopWords } from './park-writes';
import { publishMetadataPark } from './publish-metadata-park';
import { releaseMetadataPark } from './release-metadata-park';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';

type Parked = NonNullable<TicketJob['parked']>;

/** Whether the park sent anything that could have reached GitHub: a write awaiting read-back, or its comment at all. */
const sentAnything = (delivery: GitHubDelivery, job: TicketJob) => parkIntents(delivery.store, job)
    .some(intent => ['dispatching', 'uncertain'].includes(intent.status) || intent.operation === 'github-issue-comment' && !!intent.dispatchedAt);

/** The release words: the superseding fact, the edit, `review-pr`, and which lane to return the issue card from first when a review cannot start where it is. */
async function releaseWords(delivery: GitHubDelivery, job: TicketJob, parked: Parked, fact: string): Promise<string> {
    const route = parked.metadata!.route;
    let lane: string | undefined;
    try {
        const inventory = await readParkInventory(delivery.store, delivery.execute, job);
        lane = inventory.field.options.find(option => option.id === inventory.lanes.get(route.issue))?.name;
    } catch { /* The lane could not be read; the words say what to check instead. */ }
    const first = lane === undefined ? ` If the issue card is in ${route.block.name} or another lane a review does not start from, move it back to ${route.pickup.name} first.`
        : REVIEWABLE.has(lane.toLowerCase()) ? '' : ` Move the issue card from ${lane} back to ${route.pickup.name} first; a review does not start from ${lane}.`;
    return `The park of PR #${parked.metadata!.pr.number} was released before its decision comment was sent: ${fact}. Nothing more was sent for it. ${parked.reason} Ask for a fresh review with review-pr.${first}`;
}

/**
 * One claimed pass of a harness-worded metadata park. Every write sent earlier is read back against its own intent
 * first, and one still unread stops the pass. A comment already verified publishes the park, once it reads again,
 * the route still resumes it and every card's Block lane was on record before it was sent; the cards stay where they
 * are. Otherwise the whole board inventory is read before any new move: an issue card this park had in Block that a
 * person took out, or a decision that no longer holds, releases the park; a changed route stops it, naming what to
 * restore. Then the cards go to Block (`moveLane` under the park's lane operation, one lane Effect per card), every
 * required card is read back in Block and that is saved, and only then is the comment posted. Every write not yet
 * sent is guarded by the live decision, route, Block lanes and claim.
 */
export async function advanceMetadataPark(delivery: GitHubDelivery, job: TicketJob): Promise<void> {
    const { store, execute } = delivery, parked = job.parked!, binding = parked.metadata!, route = binding.route, issue = Number(job.key.slice(3));
    try {
        assertDeliveryMayMutate(store, delivery.jobs, job, binding.pr.head);
        const unread = await settleParkWrites(store, execute, job);
        if (unread.length) throw new Error(unreadStopWords(unread));
        const body = parkCommentBody(parked), verified = parkIntents(store, job).find(intent => intent.operation === 'github-issue-comment' && intent.status === 'verified');
        if (verified) {
            const author = String(verified.payload?.author || '');
            await settleParkComment(store, execute, job, { issue, marker: parked.marker!, body, author }, { payload: { marker: parked.marker, issue, body, author }, guard: () => {}, post: false });
            const live = await assertParkRoute(delivery, job, parked);
            delete parked.stopped;
            if (!binding.verified || binding.verified.items.some(item => item !== live.issue && !live.prs.includes(item)))
                throw new Error('The decision comment is confirmed, but the Block lane of every card was not on record before it was sent; the park needs reconciliation');
            return publishMetadataPark(store, job, parked);
        }
        const inventory = await readParkInventory(store, execute, job);
        assertRecordedBoard(binding, inventory);
        assertRecordedInBlock(job, binding, inventory);
        observeInBlock(store, job, binding, inventory);
        const guard = () => assertParkCurrent(delivery, job, parked, () => assertStillInBlock(store, execute, job, binding));
        await guard();
        delete parked.stopped;
        assertMovable(binding, inventory);
        if (await moveLane(store, execute, job, 'Block', guard, job.pr, parkLaneOperation(job)) !== route.block.name)
            throw new ParkNeedsRestore('the configured board did not confirm the Block lane');
        await recordBlockCoverage(store, execute, job, binding);
        const author = await commentAuthor(store, execute);
        await settleParkComment(store, execute, job, { issue, marker: parked.marker!, body, author }, { payload: { marker: parked.marker, issue, body, author }, guard, post: true });
        publishMetadataPark(store, job, parked);
    }
    catch (error) {
        if (job.parked !== parked) throw error;
        if (error instanceof ParkSuperseded && !sentAnything(delivery, job)) releaseMetadataPark(store, job, parked, await releaseWords(delivery, job, parked, error.message));
        if (error instanceof ParkNeedsRestore) parked.stopped = `The park sends nothing more: ${error.message}. Restore it, then ask for review-pr to finish the park.`;
        const unconfirmed = unconfirmedWrites(store, job);
        if (unconfirmed.length) parked.unconfirmed = unconfirmed; else delete parked.unconfirmed;
        store.save();
        throw error;
    }
}
