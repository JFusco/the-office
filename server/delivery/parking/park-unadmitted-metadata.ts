import { isDeepStrictEqual } from 'node:util';
import { harnessDelivers } from '../harness/scope';
import { park } from './park';
import { cardResumeRoute } from './card-resume-route';
import { metadataParkWords, metadataStopWords } from './metadata-park-words';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { MetadataHumanEdit } from '../publication/metadata-admission';
import type { StageResult, TicketJob } from '../../../src/shared';

/**
 * Parks a hands-off job whose readiness review blocked on a pull request edit the harness may not make
 * (`metadata-admission.ts`), with one decision comment that says what to edit and how to resume, and the
 * cards in Block (`park.ts`). Only the decision for the job's saved review step, head and pull request
 * parks. Without a board route that can resume it (`card-resume-route.ts`) nothing is written: the job
 * stops with the edit and the fresh-review route in its reason.
 */
export async function parkUnadmittedMetadata(delivery: GitHubDelivery, job: TicketJob, result: StageResult, decision: MetadataHumanEdit): Promise<void> {
    const { store, execute } = delivery;
    if (!harnessDelivers(store, job) || job.stage !== 'lead-pr' || job.parked || job.steps.length - 1 !== decision.step || job.head !== decision.pr.head ||
        job.pr !== decision.pr.number || job.prUrl !== decision.pr.url || !isDeepStrictEqual(job.steps.at(-1)?.result, result))
        throw new Error('The PR metadata decision is no longer the saved review of this job; nothing was parked');
    const route = await cardResumeRoute(store, execute, job);
    if ('missing' in route) throw new Error(metadataStopWords(decision, route.missing));
    await park(delivery, job, result, metadataParkWords(decision, route.pickup));
}
