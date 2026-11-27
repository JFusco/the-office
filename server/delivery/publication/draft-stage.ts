import { moveLane } from '../board/move-lane';
import { harnessStageResult, receipt } from '../harness/stage-result';
import { assertDeliveryMayMutate } from '../harness/guards';
import { publishCandidate } from './publish-pr';
import { readPublication } from './read-command';
import { appSelected } from '../../github/identity/office-authors';
import { activeRetry } from '../attempts/retry-binding';
import { boardRecoveryDraft } from './board-recovery-draft';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { StageResult, TicketJob } from '../../../src/shared';

/** The start-of-draft provenance read: the operator's viewer, or a repository read an installation token can answer. */
export const draftProvenanceRead = (delivery: GitHubDelivery, job: TicketJob, root: string) =>
    readPublication(delivery.store, delivery.execute, job, root, appSelected(delivery.store, 'git-push') ? 'repository' : 'viewer');

/**
 * Model-free `draft`: publish the verified candidate and move its cards to In review, each card move one Effect bound
 * to this stage, head and lane. An automatic retry entered its claim with the provenance read already made; a
 * board recovery only reads its publication and cards back (`board-recovery-draft.ts`).
 */
export async function harnessDraft(delivery: GitHubDelivery, job: TicketJob, root: string): Promise<StageResult> {
    const { store, execute } = delivery, retry = activeRetry(job);
    if (retry?.mode === 'board') return boardRecoveryDraft(delivery, job, root);
    if (retry?.mode !== 'draft') await draftProvenanceRead(delivery, job, root);
    const publication = await publishCandidate(store, execute, delivery.jobs, job, root, delivery);
    const head = job.head;
    const lane = await moveLane(store, execute, job, 'In review', () => assertDeliveryMayMutate(store, delivery.jobs, job, head), publication.pr, { id: `draft:${head}:in-review` });
    const boardUrl = store.project.githubProject?.url || '';
    return harnessStageResult(job, root, {
        stage: 'draft', commit: job.head, prId: publication.pr,
        summary: `${publication.created ? 'Opened draft' : 'Updated'} PR #${publication.pr} at ${job.head.slice(0, 7)}${publication.pushed ? ' after one push' : ''}; card ${lane || 'unchanged'}.`,
        receipts: [receipt('draft-pr', 'github-pr-publish', publication.url, `PR #${publication.pr} head ${job.head} read back`), ...(lane ? [receipt('board-status', `board ${lane}`, boardUrl, `${lane} read back`)] : [])],
        evidence: { publication, lane },
    });
}
