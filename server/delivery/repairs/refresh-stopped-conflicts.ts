import { isDeepStrictEqual } from 'node:util';
import { freezeReads } from '../../incidents/repair/freeze-reads';
import { repairFreeze } from '../../incidents/repair/repair-freeze';
import { assessDeliveryEligibility } from '../harness/delivery-authority';
import { metadataAppliesToHead } from '../publication/metadata-context';
import { assertAutomationEffects } from '../readiness/automation-effects';
import { refreshConflicted, refreshEligible, refreshSettled } from './refresh-conflicted';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';

const STOPPED = ['blocked', 'interrupted'];
/** Stops that must be reconciled on their own before any other work on the job. */
const OWN_RECONCILIATION = ['uncertain-effect', 'authority', 'source-closed'];

/**
 * The conflict the project refresh's cached row shows at this exact head and target, in the PR shape the refresh rules
 * read, or null; anything else costs no provider read. The cache holds no branch, so the job's own stands in until the
 * live read checks the actual one.
 */
function cachedConflict(delivery: GitHubDelivery, job: TicketJob) {
    const row = delivery.store.state.github?.prs.find(pr => pr.number === job.pr);
    if (!row || row.state !== 'open' || row.draft || row.head !== job.head || row.base !== delivery.store.project.target || row.mergeable !== false) return null;
    return { state: row.state, draft: row.draft, merged_at: null, mergeable: false, head: { sha: row.head, ref: job.branch }, base: { ref: row.base } };
}

/** Local state only: nothing but the conflict keeps this stopped readiness review from a refresh. */
function admissible(delivery: GitHubDelivery, job: TicketJob): boolean {
    const { store } = delivery, now = store.clock.now();
    if (job.stage !== 'lead-pr' || !STOPPED.includes(job.status) || !assessDeliveryEligibility(store, job).eligible) return false;
    if (store.activeClaims().some(claim => claim.work.id === `ticket:${job.key}`) ||
        store.state.coordination?.requests?.some(request => request.key === job.key && ['queued', 'working'].includes(request.status))) return false;
    if (job.parked || job.prerequisites?.length || metadataAppliesToHead(store, job) || job.ciRepairs?.some(repair => repair.phase !== 'done') ||
        job.stoppedBaseUpdate || OWN_RECONCILIATION.includes(job.stop?.kind || '')) return false;
    if (repairFreeze(store.state, { kind: 'delivery', id: job.id }, now, freezeReads(store, now))) return false;
    try { assertAutomationEffects(store, job); }
    catch { return false; }
    return true;
}

/**
 * A hands-off job whose readiness review stopped for another reason is refreshed when its PR later conflicts at the
 * job's own head: the cached row triggers one live read, and the job must be unchanged and still admissible after it.
 * The refresh is the existing one (`refreshConflicted`): its eligible heads, base-update budget and settlement apply.
 */
export async function refreshStoppedConflicts(delivery: GitHubDelivery): Promise<void> {
    for (const job of [...delivery.jobs]) {
        if (job.stage !== 'lead-pr' || !STOPPED.includes(job.status)) continue;
        const cached = cachedConflict(delivery, job);
        // A job the refresh rules refuse on local state alone (its budget, head proof or merge authority) is never read.
        if (!cached || !admissible(delivery, job) || !refreshSettled(delivery.store, job) || !refreshEligible(delivery.store, job, cached, false, true)) continue;
        const prior = structuredClone(job);
        let pr: any;
        try { pr = await delivery.verifyPR(job, true); }
        catch { continue; }
        if (delivery.jobs.find(j => j.id === prior.id) !== job || !isDeepStrictEqual(job, prior) || !admissible(delivery, job)) continue;
        try { refreshConflicted(delivery.store, job, pr, true); }
        catch { /* A refused save rolls the job back as it was; a later candidate still gets its turn. */ }
    }
}
