import type { GitHubDelivery } from '../pipeline/github-delivery';

export async function approveMerge(this: GitHubDelivery, key: string, head: string) {
    const job = this.jobs.find(j => j.key === key && j.mergeApprovalRequired && j.stage === 'lead-pr' && j.status === 'watching');
    if (!job || !head || head !== job.head || job.reviewContext?.head !== head || job.steps.at(-1)?.result.outcome !== 'passed')
        throw new Error('A matching reviewed PR head is required for this approval');
    const p = await this.verifyPR(job, true), issue = await this.api(`issues/${Number(key.slice(3))}`);
    if (p.state !== 'open' || p.draft || p.head.sha !== head || p.updated_at !== job.reviewContext.prUpdatedAt || issue.updated_at !== job.reviewContext.issueUpdatedAt || p.base.sha !== job.reviewContext.baseSha)
        throw new Error('The PR or issue changed; review its current state before approving');
    job.mergeApprovalRequired = false;
    job.mergeAuthorization = { head, at: new Date().toISOString() };
    job.stage = 'merge';
    job.status = 'queued';
    job.detail = `Joe approved PR #${job.pr} at ${head}. Current-head requirements will be checked again before merge.`;
    this.store.emit('pr-merge-authorized', job.detail, 'lead', key);
}
