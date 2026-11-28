import { harnessDelivers } from '../harness/scope';
import { latestProposalGroup, settledDraftStep, versionedGroup, versionedGroupRecord } from '../../maintenance/proposal-group';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

/**
 * True when, on a project whose harness delivers this job, a completed maintenance run built this exact
 * head for this issue and then published it as a draft pull request. The head is the one the run's
 * `proposal` step produced, which is the head its selected review and verification ran on; the run
 * re-verifies that head before each step and checks the draft against it after the `draft-pr` step, so
 * a run that completed is the record that the published head is the verified one. A run still in flight
 * is not: it re-reads the draft on every step, and a pull request marked ready under it would stop it.
 * A delivery job that adopts the pull request holds no review or validation step of its own; without
 * this it would leave the draft and wait for a person.
 */
export function maintenanceVerifiedDraft(store: Pick<Store, 'project' | 'state'>, job: TicketJob): boolean {
    const issue = /^GH-\d+$/.test(job.key) ? Number(job.key.slice(3)) : 0;
    if (!issue || !job.head || !harnessDelivers(store, job)) return false;
    return (store.state.maintenance?.runs || []).some(run => {
        if (run.status !== 'completed') return false;
        const group = latestProposalGroup(run, issue);
        if (!group || run.steps[group.proposal].result.candidates[0].head !== job.head) return false;
        // A versioned group needs its complete record for this head and the job's own recorded pull request; an empty
        // receipt list, or a job that has not recorded its pull request, proves nothing.
        if (versionedGroup(run, group)) {
            const record = versionedGroupRecord(run, group, store.project.repository);
            return !!record && record.head === job.head && !!job.pr && record.pr === job.pr;
        }
        return run.steps.slice(group.proposal + 1, group.end).some(settledDraftStep);
    });
}

/**
 * Sends a job waiting at the readiness review on such a draft back to the prepare stage, which marks the
 * pull request ready. Once per head: a pull request that is a draft again after that is a person's
 * decision, and a prepare stage that left it a draft is not asked twice. Returns true when it did.
 */
export function returnDraftToPromotion(store: Pick<Store, 'project' | 'state'>, job: TicketJob, pr: { draft?: boolean; head?: { sha?: string } }): boolean {
    if (job.stage !== 'lead-pr' || !pr.draft || pr.head?.sha !== job.head || job.draftPromotionHead === job.head || !maintenanceVerifiedDraft(store, job)) return false;
    job.draftPromotionHead = job.head;
    job.stage = 'prepare-pr';
    job.status = 'queued';
    job.detail = `A completed maintenance run published this head after the verification it selected; the harness marks PR #${job.pr} ready for review.`;
    delete job.stop;
    return true;
}
