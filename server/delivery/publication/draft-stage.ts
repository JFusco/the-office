import { moveLane } from '../board/move-lane';
import { harnessStageResult, receipt } from '../harness/stage-result';
import { assertMayMutate } from '../harness/guards';
import { publishCandidate } from './publish-pr';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { StageResult, TicketJob } from '../../../src/shared';

/** Model-free `draft`: publish the verified candidate and move its cards to In review. */
export async function harnessDraft(delivery: GitHubDelivery, job: TicketJob, root: string): Promise<StageResult> {
    const { store, execute } = delivery;
    const publication = await publishCandidate(store, execute, delivery.jobs, job, root);
    const head = job.head;
    const lane = await moveLane(store, execute, job, 'In review', () => assertMayMutate(store, delivery.jobs, job, head), publication.pr);
    const boardUrl = store.project.githubProject?.url || '';
    return harnessStageResult(job, root, {
        stage: 'draft', commit: job.head, prId: publication.pr,
        summary: `${publication.created ? 'Opened draft' : 'Updated'} PR #${publication.pr} at ${job.head.slice(0, 7)}${publication.pushed ? ' after one push' : ''}; card ${lane || 'unchanged'}.`,
        receipts: [receipt('draft-pr', 'github-pr-publish', publication.url, `PR #${publication.pr} head ${job.head} read back`), ...(lane ? [receipt('board-status', `board ${lane}`, boardUrl, `${lane} read back`)] : [])],
        evidence: { publication, lane },
    });
}
