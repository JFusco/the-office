import { isDeepStrictEqual } from 'node:util';
import { deliveryInputSha256 } from '../../github/github-context';
import { digest } from '../../store/readback-evidence';
import { assertDeliveryMayMutate } from '../harness/guards';
import { harnessDelivers } from '../harness/scope';
import { park } from './park';
import { cardResumeRoute } from './card-resume-route';
import { metadataParkWords, metadataStopWords } from './metadata-park-words';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { MetadataHumanEdit } from '../publication/metadata-admission';
import type { StageResult, TicketJob } from '../../../src/shared';

/**
 * Parks a hands-off job whose readiness review blocked on a pull request edit the harness may not make
 * (`metadata-admission.ts`): the cards go to Block and one decision comment, posted last, says what to edit and how
 * to resume (`park.ts`). Only the decision for the job's saved review step, result, head, pull request and the human
 * inputs that review read parks. Without a board route that can resume it (`card-resume-route.ts`) nothing is
 * written: the job stops with the edit, what to restore and the fresh-review route. After the route reads the linked
 * pull request is read again against the review, and the local decision and claim checked once more after the last
 * read: a decision known to be stale records no park and sends nothing.
 */
export async function parkUnadmittedMetadata(delivery: GitHubDelivery, job: TicketJob, result: StageResult, decision: MetadataHumanEdit): Promise<void> {
    const { store, execute } = delivery, name = `PR #${decision.pr.number}`;
    const saved = () => {
        if (!harnessDelivers(store, job) || job.stage !== 'lead-pr' || job.parked || job.steps.length - 1 !== decision.step || job.head !== decision.pr.head || job.branch !== decision.pr.branch ||
            job.pr !== decision.pr.number || job.prUrl !== decision.pr.url || !isDeepStrictEqual(job.steps.at(-1)?.result, result) || digest(result) !== decision.resultSha256)
            throw new Error('The PR metadata decision is no longer the saved review of this job; nothing was parked');
        if (deliveryInputSha256(store, job.key) !== decision.inputSha256)
            throw new Error(`New human input arrived after the review of ${name}; the decision is no longer current and nothing was parked. Ask for a fresh review with review-pr.`);
    };
    saved();
    const route = await cardResumeRoute(store, execute, job);
    if ('missing' in route) throw new Error(metadataStopWords(decision, route.missing, route.restore));
    const pr = await delivery.verifyPR(job, true);
    const changed = pr.number !== decision.pr.number || pr.html_url !== decision.pr.url || pr.state !== 'open' || pr.merged_at ? 'it is no longer open'
        : pr.head?.sha !== decision.pr.head || pr.head?.ref !== decision.pr.branch || pr.head?.repo?.full_name !== store.project.repository ? 'it has a new head'
        : pr.title !== decision.pr.title || pr.body !== decision.pr.body ? 'it was edited after the review' : '';
    if (changed) throw new Error(`${name} changed before the park was recorded (${changed}); the decision is no longer current and nothing was parked. Ask for a fresh review with review-pr.`);
    saved();
    assertDeliveryMayMutate(store, delivery.jobs, job, decision.pr.head);
    await park(delivery, job, result, { ...metadataParkWords(decision, route.pickup.name), metadata: {
        step: decision.step, resultSha256: decision.resultSha256, inputSha256: decision.inputSha256,
        pr: { number: decision.pr.number, url: decision.pr.url, head: decision.pr.head, branch: decision.pr.branch, contentSha256: digest({ title: decision.pr.title, body: decision.pr.body }) },
        route, boardStart: job.boardUpdates?.length ?? 0, observed: [] } });
}
