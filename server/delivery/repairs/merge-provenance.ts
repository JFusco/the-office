import { Effects } from '../../store/effects';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';

/** A new operational retry belongs only to this job's attempted, verified Office merge. */
export async function officeMergeProvenance(delivery: GitHubDelivery, job: TicketJob) {
    const { store } = delivery, head = job.head, merged = job.mergeCommit, number = job.pr, url = job.prUrl;
    const id = job.mergeIntentId || `merge:${job.id}:${head}`;
    const unchanged = () => delivery.jobs.find(j => j.id === job.id) === job && job.head === head && job.mergeCommit === merged && job.pr === number && job.prUrl === url;
    const effect = store.getEffect<{ sha: string; method: string }>(id);
    if (!job.mergeAttempt || job.mergeAttempt.head !== head || !merged || !effect?.dispatchedAt ||
        effect.operation !== 'github-merge' || effect.target !== url || effect.attemptId !== job.id ||
        effect.work.projectId !== store.project.id || effect.work.kind !== 'delivery' || effect.work.id !== job.id ||
        effect.payload.sha !== head || !['merge', 'squash', 'rebase'].includes(effect.payload.method) ||
        (effect.expectedState as any)?.head !== head || (effect.expectedState as any)?.base !== store.project.target) return false;
    const readBack = async () => {
        const pr = await delivery.verifyPR(job, true);
        return unchanged() && pr.number === number && pr.html_url === url && pr.head.sha === head && !!pr.merged_at && pr.merge_commit_sha === merged;
    };
    if (['dispatching', 'uncertain'].includes(effect.status)) {
        if (!await new Effects(store).reconcile(id, async () => ({ verified: await readBack(), receipt: { merged: true, sha: merged } }))) return false;
    }
    const verified = store.getEffect(id), receipt = verified?.receipt as any;
    return verified?.status === 'verified' && receipt?.merged === true && receipt.sha === merged && await readBack();
}
