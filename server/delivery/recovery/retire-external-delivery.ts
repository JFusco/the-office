import { isDeepStrictEqual } from 'node:util';
import { workKey, type TicketJob } from '../../../src/shared';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import { completedPRReviews } from './completed-pr-review';

/** Only a read-only handoff of an existing PR can be retired by external completion. A park that never reached the board is not a human decision. */
function eligible(delivery: GitHubDelivery, job: TicketJob): boolean {
    const { store } = delivery;
    return !store.state.paused && !!job.existingPR && !!job.pr && !!job.head &&
        ['queued', 'blocked', 'interrupted'].includes(job.status) &&
        ['prepare-pr', 'lead-pr'].includes(job.stage) &&
        !job.worktree && !job.mergeAttempt && !job.mergeIntentId && !job.mergeCommit &&
        !job.boardUpdates?.some(update => update.status !== 'verified' || update.stage !== 'lead-pr' || update.head !== job.head || update.target !== 'In review') && !job.candidateRecovery && !job.candidateBase &&
        !job.implementationContinuation && !job.implementationRecovery && !job.discoveryRecovery &&
        !job.sourceAmendment && !job.repairCycle && !job.parked?.published && !job.candidateCleanup &&
        job.steps.every(step => ['prepare-pr', 'lead-pr'].includes(step.stage) &&
            step.result.receipts.every(receipt => receipt.verified && !receipt.uncertain && /^(?:get|read|query|inspect)\b/i.test(receipt.action))) &&
        completedPRReviews(store, job) &&
        !store.activeClaims().some(claim => claim.work.id === job.id) &&
        !store.db.prepare('SELECT id FROM effects WHERE work_key=? LIMIT 1').get(
            workKey({ projectId: store.project.id, kind: 'delivery', id: job.id }));
}

/**
 * Joe's rule: a PR he merged himself is settled. Parks, review bookkeeping, a moved head and verified
 * writes do not hold the handoff; owned or uncertain work (a worktree, an unfinished worker, an
 * unverified write or board move, a merge in flight, a repair cycle) still does.
 */
function ownerSettles(delivery: GitHubDelivery, job: TicketJob): boolean {
    const { store } = delivery;
    return !store.state.paused && !!job.existingPR && !!job.pr &&
        ['queued', 'blocked', 'interrupted', 'watching'].includes(job.status) &&
        !job.worktree && !job.mergeAttempt && !job.mergeIntentId && !job.mergeCommit &&
        !job.boardUpdates?.some(update => update.status !== 'verified') &&
        !job.candidateRecovery && !job.candidateBase && !job.implementationContinuation && !job.implementationRecovery &&
        !job.discoveryRecovery && !job.sourceAmendment && !job.repairCycle && !job.candidateCleanup &&
        job.steps.every(step => ['prepare-pr', 'lead-pr'].includes(step.stage) &&
            step.result.receipts.every(receipt => receipt.verified && !receipt.uncertain && /^(?:get|read|query|inspect)\b/i.test(receipt.action))) &&
        (store.state.workLog || []).filter(work => work.requestId === job.id).every(work => work.executionStatus === 'completed') &&
        !store.activeClaims().some(claim => claim.work.id === job.id) &&
        !store.db.prepare("SELECT id FROM effects WHERE work_key=? AND status!='verified' LIMIT 1").get(
            workKey({ projectId: store.project.id, kind: 'delivery', id: job.id }));
}

function mergedByOwner(delivery: GitHubDelivery, pull: any): boolean {
    const { store } = delivery, owner = store.project.githubProject?.owner || store.project.repository.split('/')[0];
    return !!pull.merged_at && pull.merged_by?.login === owner;
}

/** Retire the Office handoff, not its evidence; no completion, CI or publication claim. */
export async function retireExternalDeliveries(delivery: GitHubDelivery): Promise<void> {
    for (const job of delivery.jobs.filter(job => eligible(delivery, job) || ownerSettles(delivery, job))) {
        try {
            const prior = structuredClone(job), { store } = delivery;
            const issueUrl = `https://github.com/${store.project.repository}/issues/${Number(job.key.slice(3))}`;
            const issue = await delivery.api(`issues/${Number(job.key.slice(3))}`);
            if (issue.number !== Number(job.key.slice(3)) || issue.html_url !== issueUrl ||
                issue.pull_request || issue.state !== 'closed' || issue.state_reason !== 'completed') continue;
            const pull = await delivery.verifyPR(job, true);
            if (pull.number !== job.pr || pull.html_url !== job.prUrl || pull.state !== 'closed' ||
                !pull.merged_at || !/^[a-f0-9]{40}$/.test(pull.merge_commit_sha || '')) continue;
            const byOwner = mergedByOwner(delivery, pull);
            if (!byOwner && (pull.head.sha !== job.head || pull.head.ref !== job.branch)) continue;
            if (delivery.jobs.find(current => current.id === job.id) !== job ||
                !isDeepStrictEqual(job, prior) || !(eligible(delivery, job) || byOwner && ownerSettles(delivery, job))) continue;
            store.transaction(() => {
                job.status = 'cancelled';
                delete job.parked;
                job.updatedAt = store.clock.now().toISOString();
                job.detail = byOwner
                    ? `PR #${job.pr} was merged by ${pull.merged_by.login}; ${job.key} is settled. Retired the Office handoff; original history retained.`
                    : `PR #${job.pr} merged and ${job.key} closed outside this Office delivery. Retired the read-only handoff; original history retained. Office checks and closeout are not claimed.`;
                job.steps.push({ stage: 'external-delivery-readback', result: {
                    outcome: 'passed', summary: job.detail, commit: job.head, evidence: [], findings: [],
                    receipts: [{ id: `external-delivery:${job.id}`, action: 'external-delivery-readback',
                        target: issueUrl, verified: true, uncertain: false,
                        detail: JSON.stringify({ prior, issue, pull, observedAt: job.updatedAt }) }],
                    previewUrl: '', worktree: '', branch: job.branch, prId: job.pr, qaRunDir: '', paidRuns: 0, blocker: '',
                } });
                store.emit('github-delivery-retired', job.detail, 'pm', job.key);
            });
        }
        catch { /* Unavailable or incomplete evidence retains the original blocker for read-back. */ }
    }
}
