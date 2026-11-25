import { defaultPickupStatus } from '../intake/default-pickup';
import { BLOCK } from '../board/harness-parked-card';
import { projectCards, statusField, type Execute } from '../board/project-graphql';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';
import type { MetadataParkRoute } from '../../../src/contracts/metadata-park';

/** The account whose open issues the assignment poll reads (`server/scheduling/assignment-poll.ts`). */
export const PICKUP_ASSIGNEE = 'JFusco';
/** Lanes a fresh review starts from (`ProjectProgress.reviewStarted`), compared lowercased and untrimmed as it does. */
export const REVIEWABLE = new Set(['ready', 'in progress', 'in review']);

export const effectiveParkPickup = (store: Store) =>
    store.state.coordination?.pickup ?? { enabled: true, status: defaultPickupStatus(store.project) };

/**
 * The board route a park of this job resumes along, or why moving a card cannot resume it. `restore` names what
 * Joe must put back before `review-pr` can start a fresh review at all.
 */
export type CardResumeRoute = MetadataParkRoute | { missing: string; restore?: string };

/**
 * Whether returning the issue card can resume a park of this job (`resume.ts`), and the exact route it takes: the
 * open issue assigned to the account the poll reads, a configured board, pickup turned on with a lane a fresh
 * review starts from, exactly one lane named as the pickup status, one Block lane and one In review lane, one card
 * for the issue, and every card of the linked pull request. Read-only; a read that fails or comes back incomplete
 * is an error, not a missing route.
 */
export async function cardResumeRoute(store: Store, execute: Execute, job: Pick<TicketJob, 'key' | 'pr'>): Promise<CardResumeRoute> {
    if (!store.project.githubProject) return { missing: 'this project has no configured board' };
    const pickup = effectiveParkPickup(store);
    if (!pickup.enabled) return { missing: 'automatic pickup is turned off' };
    if (!REVIEWABLE.has(pickup.status.toLowerCase())) return { missing: `the pickup lane "${pickup.status}" is not one a fresh review starts from` };
    const repository = store.project.repository, number = Number(job.key.slice(3));
    const issue = JSON.parse(await execute('gh', ['api', `repos/${repository}/issues/${number}`], { cwd: store.project.repo, timeout: 60000, readOnly: true }));
    if (issue?.number !== number || issue.html_url !== `https://github.com/${repository}/issues/${number}` || issue.pull_request || !Array.isArray(issue.assignees))
        throw new Error('Canonical issue identity is unavailable for the park route');
    if (issue.state !== 'open' && issue.state !== 'closed') throw new Error('Issue state is unavailable for the park route');
    if (issue.state === 'closed') return { missing: 'the issue is closed' };
    if (!issue.assignees.some((user: any) => user?.login === PICKUP_ASSIGNEE)) return { missing: `the issue is not assigned to ${PICKUP_ASSIGNEE}, so the assignment poll does not read its card` };
    const field = await statusField(store, execute);
    const reviews = field.options.filter(option => option.name.toLowerCase() === 'in review');
    if (reviews.length !== 1) return { missing: `the board has ${reviews.length} In review lanes, not one`, restore: 'leave exactly one In review lane on the board' };
    // `resumeParked` compares the card's lane with the pickup status exactly.
    const lanes = field.options.filter(option => option.name === pickup.status);
    if (lanes.length !== 1) return { missing: `the board has ${lanes.length} "${pickup.status}" lanes, not one` };
    const blocks = field.options.filter(option => BLOCK.test(option.name.trim()));
    if (blocks.length !== 1) return { missing: `the board has ${blocks.length} Block lanes, not one` };
    const cards = await projectCards(store, execute, field.projectId, [{ kind: 'Issue', number }, ...(job.pr ? [{ kind: 'PullRequest' as const, number: job.pr }] : [])]);
    const issues = cards.filter(card => card.kind === 'Issue');
    if (!issues.length) return { missing: 'the issue has no card on the board', restore: 'put the issue card back on the board' };
    if (issues.length > 1) return { missing: 'the issue has more than one card on the board' };
    return { project: field.projectId, field: field.fieldId, pickup: { name: lanes[0].name, option: lanes[0].id }, block: { id: blocks[0].id, name: blocks[0].name },
        review: { id: reviews[0].id, name: reviews[0].name }, issue: issues[0].id, prs: cards.filter(card => card.kind === 'PullRequest').map(card => card.id), assignee: PICKUP_ASSIGNEE };
}
