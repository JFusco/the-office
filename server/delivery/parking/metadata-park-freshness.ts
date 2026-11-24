import { deliveryInputSha256 } from '../../github/github-context';
import { digest } from '../../store/readback-evidence';
import { assertDeliveryMayMutate } from '../harness/guards';
import { harnessDelivers } from '../harness/scope';
import { cardResumeRoute } from './card-resume-route';
import { decisionMarker } from './decision-marker';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';
import type { MetadataParkRoute } from '../../../src/contracts/metadata-park';

type Parked = NonNullable<TicketJob['parked']>;

/** The park's decision no longer holds, or a person took the issue card out of Block before its comment was sent: the park is released for a fresh review, never finished. */
export class ParkSuperseded extends Error {}
/** Something the park's route needs changed: the park sends nothing more until Joe restores it. */
export class ParkNeedsRestore extends Error {}

/**
 * Throws unless the pass still holds the job's delivery claim and the saved review step, its result, the human
 * inputs and the pull request identity are the ones the park was decided on. Local only.
 */
export function assertParkLocal(delivery: GitHubDelivery, job: TicketJob, parked: Parked): void {
    const { store } = delivery, binding = parked.metadata!, step = job.steps[binding.step];
    assertDeliveryMayMutate(store, delivery.jobs, job, binding.pr.head);
    if (job.parked !== parked || parked.published || !harnessDelivers(store, job) || job.stage !== 'lead-pr' || job.steps.length !== binding.step + 1 || step?.stage !== 'lead-pr' ||
        digest(step.result) !== binding.resultSha256 || job.pr !== binding.pr.number || job.prUrl !== binding.pr.url || job.branch !== binding.pr.branch || parked.marker !== decisionMarker(job))
        throw new ParkSuperseded('the saved review of this job changed');
    if (deliveryInputSha256(store, job.key) !== binding.inputSha256) throw new ParkSuperseded('new human input arrived after the review');
}

/** Throws unless the live pull request is the open, unmerged one the review read, at its head and with the title and body it read. */
export async function assertParkDecision(delivery: GitHubDelivery, job: TicketJob, parked: Parked): Promise<void> {
    const { store } = delivery, binding = parked.metadata!, pr = await delivery.verifyPR(job, true), name = `PR #${binding.pr.number}`;
    if (pr.number !== binding.pr.number || pr.html_url !== binding.pr.url || pr.state !== 'open' || pr.merged_at) throw new ParkSuperseded(`${name} is no longer open`);
    if (pr.head?.sha !== binding.pr.head || pr.head?.ref !== binding.pr.branch || pr.head?.repo?.full_name !== store.project.repository) throw new ParkSuperseded(`${name} has a new head`);
    if (digest({ title: pr.title, body: pr.body }) !== binding.pr.contentSha256) throw new ParkSuperseded(`${name} was edited after the review`);
}

/**
 * The live route, which must be the one the park recorded: the same pickup lane by name and option, assignment,
 * project, Status field, Block and In review lanes and issue card, with every pull request card it recorded still on
 * the board. A new pull request card is returned for the caller to cover. Anything else names what to restore.
 */
export async function assertParkRoute(delivery: GitHubDelivery, job: TicketJob, parked: Parked): Promise<MetadataParkRoute> {
    const recorded = parked.metadata!.route, live = await cardResumeRoute(delivery.store, delivery.execute, job);
    if ('missing' in live) throw new ParkNeedsRestore(live.missing);
    const changed = live.project !== recorded.project || live.field !== recorded.field ? 'the board or its Status field'
        : live.pickup.name !== recorded.pickup.name || live.pickup.option !== recorded.pickup.option ? `the pickup lane, which was ${recorded.pickup.name},`
        : live.block.id !== recorded.block.id ? `the ${recorded.block.name} lane` : live.review.id !== recorded.review.id ? `the ${recorded.review.name} lane`
        : live.issue !== recorded.issue ? 'the issue card' : recorded.prs.some(item => !live.prs.includes(item)) ? "the pull request's card"
        : live.assignee !== recorded.assignee ? 'the assignment' : '';
    if (changed) throw new ParkNeedsRestore(`${changed} changed after the park was recorded`);
    return live;
}

/**
 * The guard of a write the park has not sent: the local state, then the live pull request and route, then the local
 * state again, since the reads await. `alsoCheck` runs after the reads, before the last local check.
 */
export async function assertParkCurrent(delivery: GitHubDelivery, job: TicketJob, parked: Parked, alsoCheck?: () => Promise<void>): Promise<void> {
    assertParkLocal(delivery, job, parked);
    await assertParkDecision(delivery, job, parked);
    await assertParkRoute(delivery, job, parked);
    await alsoCheck?.();
    assertParkLocal(delivery, job, parked);
}
