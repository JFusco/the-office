import { activeEffectId } from '../harness/effect';
import { harnessStageResult, receipt } from '../harness/stage-result';
import { verifyRepairCandidate } from '../repairs/delivery-repairs';
import { cardStatus, projectCards, statusField } from '../board/project-graphql';
import { resolveLane } from '../board/move-lane';
import { metadataAppliesToHead } from './metadata-context';
import { readPublication } from './read-command';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { Store } from '../../store/store';
import type { StageResult, TicketJob } from '../../../src/shared';

/** A board recovery that cannot adopt what is there: shown to Joe with what was seen, and nothing written. */
export class BoardRecoveryConflict extends Error {
    constructor(what: string) { super(`Board recovery needs Joe: ${what}. Nothing was pushed, created, edited or moved.`); }
}

/** The pull request this draft's own create published at this head, when its Effect was verified with a number. */
export function savedPublication(store: Store, job: TicketJob): number {
    const intent = store.getEffect(activeEffectId(store, `harness:${job.id}:pr-create:${job.head}`));
    const number = intent?.status === 'verified' ? (intent.receipt as { number?: number } | null)?.number : undefined;
    return Number.isSafeInteger(number) && number! > 0 ? number! : 0;
}

/**
 * The draft of a board recovery, read-only for its whole life: after its saved card moves are verified it adopts
 * the publication that is already there, or stops for Joe. It verifies the candidate, the remote branch at the
 * exact head, the canonical open PR on its repository, branch and base, its draft state, its native link to this
 * issue and both cards in In review, through the read side of publication and the board readers only. A missing
 * branch or PR, another head or link, a moved card or an unmet metadata obligation is a conflict: zero pushes, PR
 * creates, metadata edits or card moves. A verified draft returns to normal acceptance (`accept-stage-result.ts`).
 */
export async function boardRecoveryDraft(delivery: GitHubDelivery, job: TicketJob, root: string): Promise<StageResult> {
    const { store, execute } = delivery, { repository, target } = store.project, issueNumber = Number(job.key.slice(3));
    const issueUrl = `https://github.com/${repository}/issues/${issueNumber}`;
    const number = job.pr || savedPublication(store, job);
    if (!number) throw new BoardRecoveryConflict('no saved pull request identity is bound to this draft');
    if (metadataAppliesToHead(store, job)) throw new BoardRecoveryConflict('an admitted metadata change for this head would need a write');
    await verifyRepairCandidate(store.project, job, execute);
    const line = (await execute('git', ['ls-remote', '--heads', 'origin', `refs/heads/${job.branch}`], { cwd: job.worktree, timeout: 60000, readOnly: true })).trim();
    const remote = line ? line.split(/\s+/)[0] : '';
    if (remote !== job.head) throw new BoardRecoveryConflict(remote ? `remote ${job.branch} is at ${remote.slice(0, 7)}, not ${job.head.slice(0, 7)}` : `remote branch ${job.branch} is missing`);
    const pr = await readPublication(store, execute, job, root, 'pull-request', number);
    if (!pr?.html_url?.startsWith(`https://github.com/${repository}/pull/`) || pr.number !== undefined && pr.number !== number) throw new BoardRecoveryConflict(`PR #${number} has no canonical identity in ${repository}`);
    if (pr.state !== 'open' || pr.merged_at) throw new BoardRecoveryConflict(`PR #${number} is not open`);
    if (pr.head?.sha !== job.head || pr.head?.ref !== job.branch || pr.head?.repo?.full_name && pr.head.repo.full_name !== repository)
        throw new BoardRecoveryConflict(`PR #${number} is not at ${job.head.slice(0, 7)} on ${repository}:${job.branch}`);
    if (pr.base?.ref !== target || pr.base?.repo?.full_name !== repository) throw new BoardRecoveryConflict(`PR #${number} does not target ${repository}:${target}`);
    if (!job.repairReason && pr.draft !== true) throw new BoardRecoveryConflict(`PR #${number} is no longer a draft`);
    const links = await readPublication(store, execute, job, root, 'issue-links', number);
    if (!links?.closingIssuesReferences?.some((item: any) => item.url === issueUrl)) throw new BoardRecoveryConflict(`PR #${number} is not natively linked to issue #${issueNumber}`);
    let lane = '';
    if (store.project.githubProject) {
        const field = await statusField(store, execute), option = resolveLane(field, 'In review');
        const cards = await projectCards(store, execute, field.projectId, [{ kind: 'Issue', number: issueNumber }, { kind: 'PullRequest', number }]);
        if (!cards.some(card => card.kind === 'Issue')) throw new BoardRecoveryConflict('the issue has no card on its board');
        for (const card of cards)
            if (await cardStatus(store, execute, card.id, field.fieldId) !== option.id)
                throw new BoardRecoveryConflict(`the ${card.kind === 'Issue' ? 'issue' : 'pull request'} card is no longer in ${option.name}`);
        lane = option.name;
    }
    const publication = { pr: number, url: pr.html_url as string, pushed: false, created: false };
    return harnessStageResult(job, root, {
        stage: 'draft', commit: job.head, prId: number,
        summary: `Adopted PR #${number} at ${job.head.slice(0, 7)} after its card moves were read back; nothing was resent.`,
        receipts: [receipt('draft-pr', 'github-pr-publish', publication.url, `PR #${number} head ${job.head} read back`), ...(lane ? [receipt('board-status', `board ${lane}`, store.project.githubProject?.url || '', `${lane} read back`)] : [])],
        evidence: { publication, lane, recovery: 'board' },
    });
}
