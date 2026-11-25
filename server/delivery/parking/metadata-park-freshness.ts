import { deliveryInputSha256 } from '../../github/github-context';
import { digest } from '../../store/readback-evidence';
import { assertDeliveryMayMutate, assertMayMutate } from '../harness/guards';
import { requireDeliveryAuthority } from '../harness/delivery-authority';
import { harnessDelivers } from '../harness/scope';
import { cardResumeRoute, effectiveParkPickup } from './card-resume-route';
import { decisionMarker } from './decision-marker';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';
import type { MetadataParkRoute } from '../../../src/contracts/metadata-park';

type Parked = NonNullable<TicketJob['parked']>;

/** The park's decision no longer holds, or a person took the issue card out of Block before its comment was sent: the park is released for a fresh review, never finished. */
export class ParkSuperseded extends Error {
    constructor(message: string, readonly freshReview = true) { super(message); }
}
/** Something the park's route needs changed: the park sends nothing more until Joe restores it. */
export class ParkNeedsRestore extends Error {}

export function assertParkAuthority(store: GitHubDelivery['store'], job: TicketJob, expectedHead: string): void {
    assertMayMutate(store, store.state.coordination?.jobs ?? [], job, expectedHead);
    requireDeliveryAuthority(store, job);
}

export const parkRestoreWords = (fact: string) =>
    `The park sends nothing more: ${fact}. Restore it, then ask for review-pr to finish the park.`;

export function assertParkPickup(store: GitHubDelivery['store'], name: string): void {
    const pickup = effectiveParkPickup(store);
    if (!pickup.enabled) throw new ParkNeedsRestore('automatic pickup is turned off');
    if (pickup.status !== name) throw new ParkNeedsRestore(`the pickup lane changed from ${name} to ${pickup.status}`);
}

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
    const { store } = delivery, binding = parked.metadata!, name = `PR #${binding.pr.number}`;
    const repository = store.project.repository;
    await delivery.verifyPR(job, true, async kind => {
        if (kind === 'issue-links') {
            return JSON.parse(await delivery.execute('gh', ['pr', 'view', String(job.pr), '--repo', repository, '--json', 'closingIssuesReferences'],
                { cwd: store.project.repo, timeout: 60000, readOnly: true }));
        }
        const pr = await delivery.api(`pulls/${binding.pr.number}`);
        if (pr?.number !== binding.pr.number || pr.html_url !== binding.pr.url || pr.state !== 'open' && pr.state !== 'closed')
            throw new Error(`Canonical identity or state of ${name} is unavailable for the park`);
        if (pr.merged_at) throw new ParkSuperseded(`${name} is no longer open because it was merged`, false);
        if (pr.state === 'closed') throw new ParkSuperseded(`${name} is no longer open`, false);
        if (!pr.base?.repo?.full_name || !pr.base.ref || !pr.head?.sha || !pr.head.ref || !pr.head.repo?.full_name ||
            typeof pr.title !== 'string' || pr.body !== null && typeof pr.body !== 'string')
            throw new Error(`Canonical identity or content of ${name} is unavailable for the park`);
        if (pr.base.repo.full_name !== repository || pr.base.ref !== store.project.target)
            throw new ParkSuperseded(`${name} was retargeted after the review`);
        if (pr.head.sha !== binding.pr.head || pr.head.ref !== binding.pr.branch || pr.head.repo.full_name !== repository)
            throw new ParkSuperseded(`${name} has a new head`);
        if (digest({ title: pr.title, body: pr.body }) !== binding.pr.contentSha256)
            throw new ParkSuperseded(`${name} was edited after the review`);
        return pr;
    });
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
export async function assertParkCurrent(delivery: GitHubDelivery, job: TicketJob, parked: Parked, alsoCheck?: (live: MetadataParkRoute) => Promise<void>): Promise<void> {
    assertParkLocal(delivery, job, parked);
    await assertParkDecision(delivery, job, parked);
    const live = await assertParkRoute(delivery, job, parked);
    await alsoCheck?.(live);
    assertParkLocal(delivery, job, parked);
    assertParkPickup(delivery.store, parked.metadata!.route.pickup.name);
}
