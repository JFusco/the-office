import { dispatchLeadAssessment } from '../pipeline/dispatch-lead-assessment';
import { redispatchableAssessment } from './undispatched-assessment';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';

const READS = 3;

/**
 * Acts on the saved conflict assessment of a job the harness queued again for that
 * (`undispatched-assessment.ts`), in place of another review. Once per queueing, and only while the
 * assessment still qualifies and the pull request reads back open, on the same head and still
 * conflicting. GitHub works out mergeability after it is first asked, so an unknown answer is read again
 * a few times. False when any of that does not hold: the ordinary review then runs. A read or a guard
 * that throws stops the job as any stage error does. The one attempt is spent only when the dispatch
 * starts, so a read that failed leaves it for the retry of that read.
 */
export async function redispatchSavedAssessment(delivery: GitHubDelivery, job: TicketJob, root: string, pause = 2000): Promise<boolean> {
    const { store } = delivery, mark = job.assessmentRedispatch;
    if (!mark || mark.dispatchedAt || mark.step !== job.steps.length - 1) return false;
    const saved = redispatchableAssessment(store, job);
    if (!saved) return false;
    let current = await delivery.verifyPR(job, true);
    for (let read = 1; read < READS && current.state === 'open' && !current.merged_at && current.mergeable === null; read++) {
        await new Promise(done => setTimeout(done, pause));
        current = await delivery.verifyPR(job, true);
    }
    if (current.state !== 'open' || current.merged_at || current.draft || current.head.sha !== job.head || current.head.ref !== job.branch || current.mergeable !== false) return false;
    mark.dispatchedAt = store.clock.now().toISOString();
    await dispatchLeadAssessment(delivery, job, saved, root);
    store.emit('pr-review-reused', `${job.key}: saved conflict assessment acted on for the unchanged pull request head; current GitHub state reverified. No model rerun.`, 'lead', job.key);
    return true;
}
