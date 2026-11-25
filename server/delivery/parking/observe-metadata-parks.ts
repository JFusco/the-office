import { isDeepStrictEqual } from 'node:util';
import { holdReason } from '../../office/project-holds';
import { requeuePRReview } from '../../scheduling/review-transitions';
import { resolveDeliveryWork } from '../harness/delivery-subject';
import { activeMetadataPark } from './finish-metadata-park';
import { parkIntents, readParkWrite, unconfirmedWrites } from './park-writes';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

export const METADATA_PARKS_PER_OBSERVATION = 4;

/** An unpublished park waiting for read-back, without a claim or a known missing prerequisite. */
const idle = (store: Store, job: TicketJob) => ['blocked', 'interrupted'].includes(job.status) && activeMetadataPark(store, job) && !job.parked!.stopped &&
    !store.state.paused && !store.state.draining && !holdReason(store.project, job.key) && !(job.pr && holdReason(store.project, `GH-${job.pr}`)) &&
    !store.activeClaims().some(claim => {
        const subject = resolveDeliveryWork(store, claim.work);
        return subject.kind === 'job' && subject.job === job;
    }) &&
    !store.state.workLog?.some(work => work.requestId === job.id && ['running', 'stopping'].includes(work.status));

const intentState = (intents: ReturnType<typeof parkIntents>) =>
    JSON.stringify(intents.map(intent => [intent.id, intent.status]).sort());

/** The writes the park has sent or verified. A row refused before dispatch, or a retry not yet sent, does not change it. */
const sentState = (intents: ReturnType<typeof parkIntents>) =>
    intentState(intents.filter(intent => intent.status === 'verified' || !!intent.dispatchedAt));

/**
 * Observe a bounded number of inactive parks in least-recently-checked order. A sent write reads against its
 * original intent. If all sent writes are observable, one ordinary claimed pass will settle and finish the park.
 */
export async function observeMetadataParks(delivery: GitHubDelivery): Promise<void> {
    const { store, execute, jobs } = delivery;
    let order = jobs.reduce((max, job) => Math.max(max, job.parked?.readBackChecked ?? 0), 0);
    const candidates = jobs.filter(job => idle(store, job))
        .sort((a, b) => (a.parked?.readBackChecked ?? 0) - (b.parked?.readBackChecked ?? 0));
    let checked = 0;
    for (const job of candidates) {
        if (checked === METADATA_PARKS_PER_OBSERVATION) break;
        if (!idle(store, job)) continue;
        const parked = job.parked!, intents = parkIntents(store, job), state = intentState(intents);
        const pending = intents.filter(intent => ['dispatching', 'uncertain'].includes(intent.status) || intent.operation === 'github-issue-comment' && intent.status === 'verified');
        const verifiedLanes = intents.some(intent => intent.operation === 'github-project-status' && intent.status === 'verified');
        // With nothing to read there is no new provider evidence, so such a continuation is queued once per sent-write state.
        const continuation = pending.length ? undefined : sentState(intents);
        if (!pending.length && !verifiedLanes || job.status === 'blocked' && parked.readBackQueued === state ||
            continuation !== undefined && parked.continuationQueued === continuation) continue;

        ++checked;
        parked.readBackChecked = ++order;
        const unconfirmed = unconfirmedWrites(store, job);
        if (!isDeepStrictEqual(parked.unconfirmed ?? [], unconfirmed)) {
            if (unconfirmed.length) parked.unconfirmed = unconfirmed;
            else delete parked.unconfirmed;
        }
        store.save();

        let complete = true;
        for (const intent of pending) {
            if (job.parked !== parked || !idle(store, job)) { complete = false; break; }
            try {
                if (await readParkWrite(store, execute, job, intent) === null)
                    throw new Error('The original write is no longer observable');
            }
            catch (error) {
                complete = false;
                if (intent.status === 'verified' && job.parked === parked && idle(store, job) && parked.commentReadError !== String(error)) {
                    parked.commentReadError = String(error);
                    store.save();
                }
            }
        }
        if (!complete || job.parked !== parked || !idle(store, job) || intentState(parkIntents(store, job)) !== state) continue;
        try { requeuePRReview(store, job); }
        catch { continue; }
        parked.readBackQueued = state;
        if (continuation !== undefined) parked.continuationQueued = continuation;
        job.detail = 'Every write the unfinished park sent now reads back; one pass is queued to settle and finish it.';
        store.emit('metadata-park-readback', `${job.key}: ${job.detail}`, 'pm', job.key);
    }
}
