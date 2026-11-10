import { assertMetadataBinding } from './metadata-context';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';
import { currentAssignment } from '../../workers/assignment-context';
import { digest } from '../../store/readback-evidence';

/** Current human/provider context is preserved separately from the PR body being repaired. */
export async function metadataScope(delivery: GitHubDelivery, job: TicketJob) {
    const repository = delivery.store.project.repository, number = Number(job.key.slice(3));
    const issue = await delivery.api(`issues/${number}`), pr = await delivery.api(`pulls/${job.pr}`);
    const comments = async (id: number) => {
        const pages = JSON.parse(await delivery.execute('gh', ['api', `repos/${repository}/issues/${id}/comments?per_page=100`, '--paginate', '--slurp'], { cwd: delivery.store.project.repo, timeout: 60000, readOnly: true }));
        if (!Array.isArray(pages) || !pages.length || pages.length > 100 || pages.some(p => !Array.isArray(p) || p.length > 100)) throw new Error('Complete bounded metadata comment scope is required');
        return pages.flat();
    };
    const context = { issue: { number: issue.number, title: issue.title, body: issue.body || '', labels: issue.labels || [], assignees: issue.assignees || [] },
        prLabels: pr.labels || [], issueComments: await comments(number), prComments: await comments(job.pr) };
    assertMetadataBinding(delivery, job);
    return context;
}

export async function metadataProvider(delivery: GitHubDelivery, job: TicketJob): Promise<any> {
    assertMetadataBinding(delivery, job);
    const b = job.prMetadataRepair!.binding, p = await delivery.verifyPR(job, true), issue = await delivery.api(`issues/${Number(job.key.slice(3))}`);
    assertMetadataBinding(delivery, job);
    if (p.number !== b.pr || p.html_url !== b.url || p.state !== 'open' || p.merged_at || p.head?.sha !== b.head || p.head?.ref !== b.branch ||
        p.head?.repo?.full_name !== b.repository || p.base?.ref !== b.base || issue.number !== Number(b.key.slice(3)) || issue.pull_request ||
        issue.state !== 'open' || issue.html_url !== `https://github.com/${b.repository}/issues/${issue.number}` || !issue.assignees?.some((u: any) => u.login === 'JFusco'))
        throw new Error('Original native metadata PR or issue changed');
    return p;
}

export async function metadataOwnership(delivery: GitHubDelivery, job: TicketJob, checkScope = true): Promise<void> {
    assertMetadataBinding(delivery, job);
    const owner = JSON.parse(await delivery.execute('curl', ['--fail', '--silent', '--show-error',
        `http://127.0.0.1:${process.env.OFFICE_PORT || 4318}/api/sessions?project=${encodeURIComponent(delivery.store.project.id)}&ticket=${encodeURIComponent(job.key)}&requestId=${encodeURIComponent(currentAssignment()?.claim.work.id || job.id)}`],
        { cwd: delivery.store.project.repo, timeout: 60000, readOnly: true }));
    assertMetadataBinding(delivery, job);
    if (!owner.complete || !owner.fresh || owner.project !== delivery.store.project.id || owner.key !== job.key || owner.ownership?.status !== 'clear')
        throw new Error('Fresh complete clear metadata ownership is required');
    if (checkScope && job.prMetadataRepair!.scopeSha256 && digest(await metadataScope(delivery, job)) !== job.prMetadataRepair!.scopeSha256)
        throw new Error('Current metadata scope, labels or comments changed; fresh human/provider review is required');
}
