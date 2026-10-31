import { harnessStageResult, receipt } from '../harness/stage-result';
import { promoteReady } from './ready-pr';
import type { GitHubDelivery } from '../../github-delivery';
import type { StageResult, TicketJob } from '../../../src/shared';

/**
 * Model-free `prepare-pr` for an open PR on the target branch with no dependent PRs.
 * Returns null for stacked/retarget/reopen cases, which keep the guarded metadata worker.
 */
export async function harnessPrepare(delivery: GitHubDelivery, job: TicketJob, root: string, readyChecks: boolean): Promise<StageResult | null> {
    const { store, execute } = delivery;
    const p = await delivery.api(`pulls/${job.pr}`);
    if (p.state !== 'open' || p.base?.ref !== store.project.target)
        return null;
    const pages = JSON.parse(await execute('gh', ['api', `repos/${store.project.repository}/pulls?state=open&base=${encodeURIComponent(p.head.ref)}&per_page=100`, '--paginate', '--slurp'], { cwd: store.project.repo, timeout: 60000, readOnly: true }));
    if (!Array.isArray(pages) || pages.some(page => !Array.isArray(page)))
        throw new Error('Dependent PR coverage is incomplete');
    if (pages.flat().length)
        return null;
    if (p.head?.sha !== job.head)
        throw new Error('PR head changed during preparation');
    const action = !p.draft ? 'already-ready' : readyChecks ? await promoteReady(store, execute, delivery.jobs, job) : 'left-draft';
    const summary = action === 'promoted' ? `PR #${job.pr} marked ready for review.` : action === 'already-ready' ? `PR #${job.pr} already ready; no write.` : `PR #${job.pr} left as draft until current-head review and checks are recorded.`;
    return harnessStageResult(job, root, {
        stage: 'prepare-pr', commit: job.head, summary,
        receipts: action === 'promoted' ? [receipt('pr-ready', 'github-pr-ready', p.html_url, 'Ready state read back')] : [],
        evidence: { pr: job.pr, action, base: p.base.ref, dependents: 0 },
    });
}
