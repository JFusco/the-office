import { holdReason } from '../../office/project-holds';
import { requeuePRReview } from '../../scheduling/review-transitions';
import { activeMetadataPark } from './finish-metadata-park';
import { parkIntents, readParkWrite } from './park-writes';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

/** A stopped, unpublished harness-worded park nothing is working on, under controls that let a pass run, and not stopped on a known missing prerequisite. */
const idle = (store: Store, job: TicketJob) => job.status === 'blocked' && activeMetadataPark(store, job) && !job.parked!.stopped &&
    !store.state.paused && !store.state.draining && !holdReason(store.project, job.key) && !(job.pr && holdReason(store.project, `GH-${job.pr}`)) &&
    !store.activeClaims().some(claim => claim.work.kind === 'delivery' && claim.work.id === job.id) &&
    !store.state.workLog?.some(work => work.requestId === job.id && ['running', 'stopping'].includes(work.status));

/**
 * From the ordinary observation pass: a stopped, unpublished harness-worded park with writes it sent and never read
 * back, or with a verified comment whose publication save was interrupted, is read against those writes' original
 * intents. Provider reads only. When every one reads back now, the job, park, controls and the absence of a claim
 * are checked again and one ordinary claimed pass is queued through the review transition, which settles and
 * finishes the park. An inconclusive read leaves the job and its outbox item as they are; the same read-back state
 * is queued once, and a park stopped on a known missing prerequisite waits for `review-pr`.
 */
export async function observeMetadataParks(delivery: GitHubDelivery): Promise<void> {
    const { store, execute } = delivery;
    for (const job of delivery.jobs) {
        if (!idle(store, job)) continue;
        const parked = job.parked!, intents = parkIntents(store, job);
        const pending = intents.filter(intent => ['dispatching', 'uncertain'].includes(intent.status) || intent.operation === 'github-issue-comment' && intent.status === 'verified');
        const state = JSON.stringify(intents.map(intent => [intent.id, intent.status]).sort());
        if (!pending.length || parked.readBackQueued === state) continue;
        try { for (const intent of pending) if (await readParkWrite(store, execute, job, intent) === null) throw new Error('A write of the park is not observable yet'); }
        catch { continue; }
        if (job.parked !== parked || !idle(store, job)) continue;
        try { requeuePRReview(store, job); }
        catch { continue; }
        parked.readBackQueued = state;
        job.detail = 'Every write the unfinished park sent now reads back; one pass is queued to settle and finish it.';
        store.emit('metadata-park-readback', `${job.key}: ${job.detail}`, 'pm', job.key);
    }
}
