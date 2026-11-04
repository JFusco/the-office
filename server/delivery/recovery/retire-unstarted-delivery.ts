import { isDeepStrictEqual } from 'node:util';
import { workKey, type TicketJob } from '../../../src/shared';
import type { Store } from '../../store/store';
import type { GitHubDelivery } from '../pipeline/github-delivery';

/** A source lifecycle change can retire an empty queue record, never attempted work. */
export function unstartedDelivery(store: Store, job: TicketJob): boolean {
    return ['queued', 'working', 'blocked', 'interrupted'].includes(job.status) &&
        ['implement', 'prepare-pr'].includes(job.stage) &&
        !job.head && !job.worktree && !job.steps.length && !job.mergeAttempt && !job.mergeIntentId && !job.mergeCommit &&
        !job.boardUpdates?.length && !job.candidateRecovery && !job.candidateBase &&
        !job.implementationContinuation && !job.implementationRecovery && !job.discoveryRecovery &&
        !job.sourceAmendment && !job.repairCycle && !job.parked &&
        !store.state.workLog?.some(work => work.requestId === job.id) &&
        !store.db.prepare('SELECT id FROM effects WHERE work_key=? LIMIT 1').get(
            workKey({ projectId: store.project.id, kind: 'delivery', id: job.id }));
}

/** Reads only GitHub; cancelling the duplicate record does not claim Office completion. */
export async function retireUnstartedDelivery(delivery: GitHubDelivery, job: TicketJob, issue?: any): Promise<boolean> {
    const { store } = delivery;
    if (store.state.paused || !unstartedDelivery(store, job)) return false;
    const prior = structuredClone(job);
    issue ??= await delivery.api(`issues/${Number(job.key.slice(3))}`);
    if (issue.state !== 'closed' && !(job.existingPR && job.pr)) return false;
    const issueUrl = `https://github.com/${store.project.repository}/issues/${Number(job.key.slice(3))}`;
    if (issue.number !== Number(job.key.slice(3)) || issue.html_url !== issueUrl || issue.pull_request)
        throw new Error('Canonical issue identity is unavailable for delivery retirement');
    let reason = issue.state === 'closed' ? 'GitHub issue is closed' : '';
    let pull: unknown;
    if (!reason && job.existingPR && job.pr) {
        const current = await delivery.verifyPR(job, true);
        pull = current;
        if (current.number === job.pr && current.state === 'closed' && current.merged_at && current.merge_commit_sha)
            reason = `Linked PR #${job.pr} is merged`;
    }
    if (!reason || delivery.jobs.find(current => current.id === job.id) !== job ||
        !isDeepStrictEqual(job, prior) || !unstartedDelivery(store, job) || store.state.paused ||
        prior.status !== 'working' && store.activeClaims().some(claim => claim.work.id === job.id))
        return false;
    store.transaction(() => {
        job.status = 'cancelled';
        job.updatedAt = store.clock.now().toISOString();
        job.detail = `${reason}; retired the unstarted Office queue record. No Office delivery work or external action was replayed.`;
        job.steps.push({ stage: 'source-lifecycle-readback', result: {
            outcome: 'passed', summary: job.detail, commit: '', evidence: [], findings: [],
            receipts: [{ id: `source-lifecycle:${job.id}`, action: 'source-lifecycle-readback',
                target: issueUrl, verified: true, uncertain: false,
                detail: JSON.stringify({ prior, issue, pull, observedAt: job.updatedAt }) }],
            previewUrl: '', worktree: '', branch: '', prId: job.pr, qaRunDir: '', paidRuns: 0, blocker: '',
        } });
        store.emit('github-delivery-retired', job.detail, 'pm', job.key);
    });
    return true;
}

export async function retireInactiveDeliveries(delivery: GitHubDelivery): Promise<void> {
    for (const job of delivery.jobs.filter(job => ['queued', 'blocked', 'interrupted'].includes(job.status))) {
        if (!unstartedDelivery(delivery.store, job) || delivery.store.activeClaims().some(claim => claim.work.id === job.id)) continue;
        try { await retireUnstartedDelivery(delivery, job); }
        catch { /* An unavailable or unverified source retains the original record and blocker. */ }
    }
}
