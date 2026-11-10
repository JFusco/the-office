import { randomUUID } from 'node:crypto';
import { HOLDS } from '../../office/config';
import { deliveryInputSha256 } from '../../github/github-context';
import { digest } from '../../store/readback-evidence';
import { hasUncertainEffects, type GitHubDelivery } from '../pipeline/github-delivery';
import { harnessDelivers } from '../harness/scope';
import { currentAssignment } from '../../workers/assignment-context';
import type { TicketJob } from '../../../src/shared';
import type { PRMetadataRepair } from '../../../src/contracts/pr-metadata';

/** Completed metadata on an older source head remains history, never a new attempt or current handoff. */
export function metadataAppliesToHead(job: TicketJob): boolean {
    return !!job.prMetadataRepair && (job.prMetadataRepair.phase !== 'done' || job.prMetadataRepair.binding.head === job.head);
}

export function bindMetadata(delivery: GitHubDelivery, job: TicketJob, pr: any, findingIds: string[], origin: PRMetadataRepair['origin']): PRMetadataRepair {
    if (!harnessDelivers(delivery.store, job) || job.prMetadataRepair || !findingIds.length || new Set(findingIds).size !== findingIds.length ||
        pr.number !== job.pr || pr.html_url !== job.prUrl || pr.state !== 'open' || pr.merged_at || pr.head?.sha !== job.head || pr.head?.ref !== job.branch ||
        pr.head?.repo?.full_name !== delivery.store.project.repository || pr.base?.repo?.full_name !== delivery.store.project.repository ||
        pr.base?.ref !== delivery.store.project.target || typeof pr.title !== 'string' || typeof pr.body !== 'string')
        throw new Error('Exact ordinary published-PR metadata admission is required');
    const before = { title: pr.title, body: pr.body };
    const binding: PRMetadataRepair['binding'] = {
        projectId: delivery.store.project.id, repository: delivery.store.project.repository, jobId: job.id, key: job.key,
        pr: job.pr, url: job.prUrl, head: job.head, branch: job.branch, base: pr.base.ref, worktree: job.worktree,
        inputSha256: deliveryInputSha256(delivery.store, job.key), findingIds: [...findingIds], before, beforeSha256: digest(before),
    };
    return { id: randomUUID(), origin, phase: 'assessment', binding, bindingSha256: digest(binding) };
}

export function assertMetadataBinding(delivery: GitHubDelivery, job: TicketJob, repair = job.prMetadataRepair, mode: 'retained' | 'admission' = 'retained'): asserts repair is PRMetadataRepair {
    const { store } = delivery, b = repair?.binding;
    const claim = currentAssignment()?.claim, claimId = claim?.id;
    const mergeIntent = job.mergeIntentId ? store.getEffect<Record<string, unknown>>(job.mergeIntentId) : undefined;
    const ownPreparedMerge = repair?.phase === 'done' && job.stage === 'merge' && claim?.work.kind === 'delivery' && claim.work.id === job.id && claim.stage === 'merge' &&
        !!mergeIntent && ['prepared', 'rejected'].includes(mergeIntent.status) && mergeIntent.operation === 'github-merge' && mergeIntent.work.projectId === store.project.id && mergeIntent.work.kind === 'delivery' && mergeIntent.work.id === job.id && mergeIntent.payload.sha === job.head && !mergeIntent.dispatchedAt;
    const admitting = mode === 'admission';
    if (!repair || !b || (admitting ? !!job.prMetadataRepair || repair.origin !== 'lead-pr' || repair.phase !== 'assessment' || !!repair.assessmentStartedAt || job.stage !== 'lead-pr' : job.prMetadataRepair !== repair) ||
        delivery.jobs.filter(j => j.id === job.id).length !== 1 || delivery.jobs.find(j => j.id === job.id) !== job ||
        !harnessDelivers(store, job) || digest(b) !== repair.bindingSha256 || b.projectId !== store.project.id || b.repository !== store.project.repository || b.jobId !== job.id || b.key !== job.key ||
        b.pr !== job.pr || b.url !== job.prUrl || b.head !== job.head || b.branch !== job.branch || b.base !== store.project.target || b.worktree !== job.worktree ||
        !/^[a-f0-9]{40}$/.test(b.head) || b.url !== `https://github.com/${b.repository}/pull/${b.pr}` || digest(b.before) !== b.beforeSha256 ||
        deliveryInputSha256(store, job.key) !== b.inputSha256 || store.state.paused || store.state.draining || !store.state.coordination?.enabled ||
        HOLDS[job.key] || HOLDS[`GH-${job.pr}`] || job.prerequisites?.length || job.mergeAttempt || job.mergeCommit || job.mergeIntentId && !ownPreparedMerge || job.mergeApprovalRequired ||
        job.boardUpdates?.some(u => u.status !== 'verified') || job.steps.some(s => hasUncertainEffects(s.stage, s.result)) ||
        store.activeClaims().some(c => c.work.kind === 'delivery' && c.work.id === job.id && c.id !== claimId) ||
        store.state.workLog?.some(w => w.requestId === job.id && ['running', 'stopping'].includes(w.status) &&
            !(w.stage === 'github-pr-metadata-assessment' && w.claimId === claimId)))
        throw new Error('Bound PR metadata identity, source gates, inputs or controls changed');
}

