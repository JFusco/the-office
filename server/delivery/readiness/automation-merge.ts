import { refusal as dependabotRefusal } from '../intake/dependabot/qualify';
import { pinCourier } from '../intake/dependency-bots/pin-courier';
import { wikiSync } from '../intake/dependency-bots/wiki-sync';
import { assertDeliveryMayMutate } from '../harness/guards';
import { green156Admitted } from '../recovery/green156-evidence';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';

/** Existing native bot qualification remains authoritative; titles alone never waive review. */
export async function automationMergePolicy(delivery: GitHubDelivery, job: TicketJob, pr: any): Promise<string | null> {
    const { store } = delivery;
    const records = store.state.coordination?.adoptions?.filter(a => a.pr === job.pr && `GH-${a.issue}` === job.key && a.status === 'adopted') || [];
    if (records.length !== 1 || !job.existingPR) return null;
    const bot = records[0].bot || 'dependabot';
    if (!['dependabot', 'pin-courier', 'wiki-sync'].includes(bot)) return null;
    if (job.stoppedBaseUpdate && !green156Admitted(store, job)) throw Error('Interrupted automation attempt requires its explicit disposition');
    if (pr.number !== job.pr || pr.head?.sha !== job.head || pr.base?.ref !== store.project.target || pr.base?.repo?.full_name !== store.project.repository)
        throw Error('Automation PR head or target changed');
    if (bot === 'dependabot' && pr.user?.login !== 'dependabot[bot]') throw Error('Dependabot author changed');
    const refusal = await (bot === 'dependabot' ? dependabotRefusal(store, delivery.execute, pr)
        : bot === 'pin-courier' ? pinCourier.refusal(store, delivery.execute, pr) : wikiSync.refusal(store, delivery.execute, pr));
    if (refusal) throw Error(`Automation merge is blocked: ${refusal}`);
    return bot;
}

/** Already implemented automation goes directly to the ordinary hosted-check merge gate. No model verdict is created. */
export async function routeAutomationMerge(delivery: GitHubDelivery, job: TicketJob) {
    if (job.stage !== 'lead-pr' || !job.existingPR) return false;
    const head = job.head, pr = await delivery.verifyPR(job, true);
    // A new published head is accepted only by the existing bot identity/commit qualification.
    const candidate = { ...job, head: pr.head.sha };
    const bot = await automationMergePolicy(delivery, candidate, pr);
    if (!bot) return false;
    assertDeliveryMayMutate(delivery.store, delivery.jobs, job, head);
    job.head = pr.head.sha; job.branch = pr.head.ref;
    delete job.reviewContext; delete job.reviewInputSha256;
    job.stage = 'merge'; job.status = 'queued';
    job.detail = `${bot} PR goes directly to required GitHub checks and merge rules; no additional review or local QA cycle.`;
    delivery.store.emit('automation-merge-queued', job.detail, 'pm', job.key);
    return true;
}
