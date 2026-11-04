import { isDeepStrictEqual } from 'node:util';
import { workKey, type TicketJob } from '../../../src/shared';
import type { GitHubDelivery } from '../pipeline/github-delivery';

/** Only a read-only handoff of an existing PR can be retired by external completion. */
function eligible(delivery: GitHubDelivery, job: TicketJob): boolean {
    const { store } = delivery;
    return !store.state.paused && !!job.existingPR && !!job.pr && !!job.head &&
        ['queued', 'blocked', 'interrupted'].includes(job.status) &&
        ['prepare-pr', 'lead-pr'].includes(job.stage) &&
        !job.worktree && !job.mergeAttempt && !job.mergeIntentId && !job.mergeCommit &&
        !job.boardUpdates?.length && !job.candidateRecovery && !job.candidateBase &&
        !job.implementationContinuation && !job.implementationRecovery && !job.discoveryRecovery &&
        !job.sourceAmendment && !job.repairCycle && !job.parked && !job.candidateCleanup &&
        job.steps.every(step => ['prepare-pr', 'lead-pr'].includes(step.stage) &&
            step.result.receipts.every(receipt => receipt.verified && !receipt.uncertain && /^(?:get|read|query|inspect)\b/i.test(receipt.action))) &&
        !store.state.workLog?.some(work => work.requestId === job.id) &&
        !store.activeClaims().some(claim => claim.work.id === job.id) &&
        !store.db.prepare('SELECT id FROM effects WHERE work_key=? LIMIT 1').get(
            workKey({ projectId: store.project.id, kind: 'delivery', id: job.id }));
}

/** Retire the Office handoff, not its evidence; no completion, CI or publication claim. */
export async function retireExternalDeliveries(delivery: GitHubDelivery): Promise<void> {
    for (const job of delivery.jobs.filter(job => eligible(delivery, job))) {
        try {
            const prior = structuredClone(job), { store } = delivery;
            const issueUrl = `https://github.com/${store.project.repository}/issues/${Number(job.key.slice(3))}`;
            const issue = await delivery.api(`issues/${Number(job.key.slice(3))}`);
            if (issue.number !== Number(job.key.slice(3)) || issue.html_url !== issueUrl ||
                issue.pull_request || issue.state !== 'closed' || issue.state_reason !== 'completed') continue;
            const pull = await delivery.verifyPR(job, true);
            if (pull.number !== job.pr || pull.html_url !== job.prUrl || pull.state !== 'closed' ||
                !pull.merged_at || !/^[a-f0-9]{40}$/.test(pull.merge_commit_sha || '') ||
                pull.head.sha !== job.head || pull.head.ref !== job.branch) continue;
            if (delivery.jobs.find(current => current.id === job.id) !== job ||
                !isDeepStrictEqual(job, prior) || !eligible(delivery, job)) continue;
            store.transaction(() => {
                job.status = 'cancelled';
                job.updatedAt = store.clock.now().toISOString();
                job.detail = `PR #${job.pr} merged and ${job.key} closed outside this Office delivery. Retired the read-only handoff; original history retained. Office checks and closeout are not claimed.`;
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
