import { currentOutbox } from '../conversations/current-outbox';
import { holdAssessmentIntake } from '../features/handoff/intake-routing';
import { handsOff } from '../delivery/harness/scope';
import { requeueParkedCardRefusals } from '../delivery/recovery/parked-card-refusal';
import { requeueUndispatchedAssessments } from '../delivery/recovery/undispatched-assessment';
import { requeueRefusedQAResults } from '../delivery/recovery/refused-qa-result';
import { retryCandidateCleanup } from '../delivery/candidate/retry-candidate-cleanup';
import { adoptDependabot } from '../delivery/intake/dependabot/adopt';
import { trackDependabotAlerts } from '../delivery/intake/dependabot/track-alerts';
import { adoptDependencyBot } from '../delivery/intake/dependency-bots/adopt';
import { pinCourier } from '../delivery/intake/dependency-bots/pin-courier';
import { wikiSync } from '../delivery/intake/dependency-bots/wiki-sync';
import { intakeUnderWay } from '../delivery/intake/intake-under-way';
import { sharedPullInventory } from '../delivery/intake/shared-pr-inventory';
import { unparkReleasedWaits } from '../delivery/parking/release-unpark';
import { unparkSignedIn } from '../delivery/parking/sign-in-unpark';
import { GitHubDelivery } from '../delivery/pipeline/github-delivery';
import { withGitHubSource } from '../github/call-scope';
import type { QuotaHold } from '../github/quota-governor';
import type { Coordinator } from './coordination';

/**
 * A GitHub project's assignment poll while a GitHub quota hold defers its background reads. Nothing new is read:
 * no assignments, no bot or alert scan for new intake, no discovery, poll-only dependency refresh or merge notices,
 * and nothing that consumes the assignments read (assessments, review settlement, intake, parked resumes, Backlog
 * retirement, card admission). Protected work keeps its tick: adoption and alert work already under way, through
 * its own path with the live reads its reconciliation needs, parked waits, pending cleanup and the PR observation
 * of live jobs. The last assignments, their time and any error stand; only when observation resumes is recorded.
 */
export async function pollWhileHeld(coordinator: Coordinator, held: QuotaHold, now: Date): Promise<void> {
    const { store, execute, state, pickup } = coordinator, jobs = state.jobs ??= [];
    const delivery = new GitHubDelivery(store, coordinator.engine, execute), inventory = sharedPullInventory(delivery);
    const underWay = intakeUnderWay(store, jobs);
    await withGitHubSource('bot-adoption', async () => {
        if (underWay.bot('dependabot')) await adoptDependabot(store, execute, jobs, pickup, inventory, underWay.adoption);
        if (underWay.bot('pin-courier')) await adoptDependencyBot(store, execute, jobs, pickup, pinCourier, inventory, underWay.adoption);
        if (underWay.bot('wiki-sync')) await adoptDependencyBot(store, execute, jobs, pickup, wikiSync, inventory, underWay.adoption);
    });
    if (underWay.alerts()) await withGitHubSource('alerts', () => trackDependabotAlerts(store, execute, jobs, pickup, undefined, inventory, underWay.alert));
    if (handsOff(store)) {
        await unparkReleasedWaits(store, execute, jobs, pickup, now);
        await unparkSignedIn(store, execute, jobs, pickup);
        requeueParkedCardRefusals(store, jobs);
        requeueUndispatchedAssessments(store, jobs);
        requeueRefusedQAResults(store, jobs);
        await retryCandidateCleanup(store, execute, jobs);
    }
    await withGitHubSource('pr-observation', () => delivery.observe(() => coordinator.dependencyStores()));
    for (const review of state.listener.reviews) if (review.status === 'queued') holdAssessmentIntake(store, review);
    state.listener.deferredUntil = held.until;
    store.state.outbox = currentOutbox(store);
}
