import { isDeepStrictEqual } from 'node:util';
import { workKey, type EffectIntent, type TicketJob } from '../../../src/shared';
import { notOwned } from '../candidate/remove-candidate';
import { assessDeliveryEligibility } from '../harness/delivery-authority';
import { harnessDelivers } from '../harness/scope';
import { dependencyEligibility, validatePrerequisites, type DependencyStores } from './dependencies';
import { mergedByOwner } from './merged-by-owner';
import { hasUncertainEffects } from './uncertain-effects';
import type { GitHubDelivery } from './github-delivery';

const STOPPED = ['blocked', 'interrupted'], STAGES = ['lead-pr', 'prepare-pr'];

/**
 * Every prerequisite the job retains holds now, by the check the scheduler applies before the job's next stage
 * (`scheduled-work.ts`). The stores are read on each call, so a target or project that changed since counts.
 */
function prerequisitesMet({ store }: GitHubDelivery, job: TicketJob, stores: () => DependencyStores): boolean {
    if (!job.prerequisites?.length) return true;
    const current = stores();
    return !validatePrerequisites(job.prerequisites, { projectId: store.project.id, kind: 'delivery', id: job.id }, current) &&
        !dependencyEligibility(job.prerequisites, current, store.clock.now());
}

/** A passed harness `draft` step that published exactly this head of this branch and worktree to this PR. */
function officePublished(job: TicketJob): boolean {
    return job.steps.some(({ stage, result }) => stage === 'draft' && result.outcome === 'passed' && result.commit === job.head &&
        result.branch === job.branch && result.worktree === job.worktree && result.prId === job.pr &&
        result.evidence.some(item => item.environment === 'Office harness' && item.commit === job.head) &&
        result.receipts.some(receipt => receipt.id === 'draft-pr' && receipt.action === 'github-pr-publish' && receipt.target === job.prUrl &&
            receipt.verified && !receipt.uncertain && receipt.detail === `PR #${job.pr} head ${job.head} read back`));
}

/** Every Effect of the job is settled: verified, refused before dispatch, or read back as never landed. No merge was ever sent. */
function effectsSettled({ store }: GitHubDelivery, job: TicketJob): boolean {
    const effects = (store.db.prepare('SELECT body FROM effects WHERE work_key=?')
        .all(workKey({ projectId: store.project.id, kind: 'delivery', id: job.id })) as { body: string }[]).map(row => JSON.parse(row.body) as EffectIntent);
    return effects.every(effect => (effect.status === 'verified' || effect.status === 'rejected' && (!effect.dispatchedAt || !!effect.notLandedAt)) &&
        !(effect.operation === 'github-merge' && effect.dispatchedAt));
}

/**
 * The local conditions, all required: a stopped review or preparation of a candidate the harness created and
 * published at its current head, with nothing else of the job open. A finished blocking review is history, not work.
 * `assessDeliveryEligibility` covers the registered job and its admission, pause, drain, holds on the issue and
 * the PR, competing claims and running workers. Prerequisites are checked in `settle`, next to the provider reads.
 */
function eligible(delivery: GitHubDelivery, job: TicketJob): boolean {
    const { store } = delivery, repository = store.project.repository;
    return STOPPED.includes(job.status) && STAGES.includes(job.stage) && !!job.pr && /^[a-f0-9]{40}$/.test(job.head) &&
        job.prUrl === `https://github.com/${repository}/pull/${job.pr}` &&
        harnessDelivers(store, job) && !notOwned(store, job) && officePublished(job) &&
        assessDeliveryEligibility(store, job).eligible &&
        !store.activeClaims().some(claim => claim.work.id === job.id || claim.work.id === `ticket:${job.key}`) &&
        !store.state.coordination?.requests?.some(request => request.key === job.key && ['queued', 'working'].includes(request.status)) &&
        // Every worker of the job ran to its end: a crashed writer can leave PR writes no receipt records.
        // A finished review that returned a blocking verdict ended normally too. The harness's own records (local
        // validation, no provider write) carry no execution marker; their lifecycle shows that they ended.
        !store.state.workLog?.some(work => work.requestId === job.id && (!work.endedAt || (work.provider === 'harness'
            ? ['running', 'stopping', 'interrupted'].includes(work.status) : work.executionStatus !== 'completed'))) &&
        !job.parked && !job.mergeIntentId && !job.mergeAttempt && !job.mergeCommit && !job.mergeApprovalRequired && !job.dependsOnPR &&
        !(job.prMetadataRepair && !['done', 'blocked'].includes(job.prMetadataRepair.phase)) &&
        !job.ciRepairs?.some(repair => !['done', 'blocked'].includes(repair.phase)) &&
        !(job.repairCycle && (job.repairCycle.pendingFindingIds.length || job.repairCycle.phase === 'repair')) && !job.stoppedBaseUpdate &&
        !job.boardUpdates?.some(update => update.status !== 'verified') &&
        !job.steps.some(step => hasUncertainEffects(step.stage, step.result)) &&
        effectsSettled(delivery, job);
}

/** GitHub's own record that the owner merged exactly this Office-published head into the project target. */
function ownerMerged(delivery: GitHubDelivery, job: TicketJob, pull: any): boolean {
    const { store } = delivery, repository = store.project.repository;
    return pull.number === job.pr && pull.html_url === job.prUrl &&
        pull.base?.repo?.full_name === repository && pull.head?.repo?.full_name === repository &&
        pull.base.ref === store.project.target && pull.head.ref === job.branch && pull.head.sha === job.head &&
        pull.state === 'closed' && pull.merged === true && !!pull.merged_at && /^[a-f0-9]{40}$/.test(pull.merge_commit_sha || '') &&
        mergedByOwner(delivery, pull);
}

/** The job's own issue, open or closed as completed by the merge, and one the ordinary closeout stage accepts. */
function closeableIssue(delivery: GitHubDelivery, job: TicketJob, issue: any): boolean {
    const number = Number(job.key.slice(3));
    return issue.number === number && issue.html_url === `https://github.com/${delivery.store.project.repository}/issues/${number}` && !issue.pull_request &&
        (issue.state === 'open' || issue.state === 'closed' && issue.state_reason === 'completed') &&
        // The same source gate `GitHubDelivery.step` applies before closeout.
        (!!job.existingPR || !!issue.assignees?.some((assignee: any) => assignee.login === 'JFusco'));
}

async function settle(delivery: GitHubDelivery, job: TicketJob, stores: () => DependencyStores): Promise<void> {
    const { store } = delivery, prior = structuredClone(job);
    // Prerequisites at this job's turn, before any read for it: an unmet one costs no provider call.
    if (!prerequisitesMet(delivery, job, stores)) return;
    // The PR alone first: an open PR needs no further read on every poll.
    if (!(await delivery.api(`pulls/${job.pr}`))?.merged_at) return;
    const pull = await delivery.verifyPR(job, true);
    if (!ownerMerged(delivery, job, pull)) return;
    const issue = await delivery.api(`issues/${Number(job.key.slice(3))}`);
    if (!closeableIssue(delivery, job, issue)) return;
    // A claim, hold, worker, prerequisite or any change to the job taken during the reads stops the settlement.
    if (delivery.jobs.find(current => current.id === job.id) !== job || !isDeepStrictEqual(job, prior) || !eligible(delivery, job) ||
        !prerequisitesMet(delivery, job, stores)) return;
    store.transaction(() => {
        const stage = job.stage;
        delete job.stop;
        job.mergeCommit = pull.merge_commit_sha;
        job.status = 'watching';
        job.updatedAt = store.clock.now().toISOString();
        job.detail = `PR #${job.pr} was merged by its owner ${pull.merged_by.login}: head ${job.head}, merge commit ${pull.merge_commit_sha}. The stopped ${stage} delivery now waits for the merge commit's Actions before the ordinary closeout; its review history is kept.`;
        store.emit('github-delivery-owner-merged', `${job.key}: ${job.detail}`, 'pm', job.key);
    });
}

/**
 * Recognises the owner's merge of a pull request the harness published whose delivery stopped at review or
 * preparation, and hands the job to the ordinary merged-PR observation (`observe-prs.ts`), which watches the
 * merge commit's Actions and queues closeout. Reads only; it sends no merge, starts no worker and writes
 * nothing to a provider. An unavailable or partial read is not evidence and leaves the stop as it is.
 * `stores` supplies the office's dependency stores (`Coordinator.dependencyStores`); without it only this
 * project's prerequisites can be met.
 */
export async function settleOwnerMergedStopped(delivery: GitHubDelivery,
    stores: () => DependencyStores = () => new Map([[delivery.store.project.id, delivery.store]])): Promise<void> {
    for (const job of delivery.jobs.filter(job => eligible(delivery, job))) {
        try { await settle(delivery, job, stores); }
        catch { /* The stop stays for read-back. */ }
    }
}
