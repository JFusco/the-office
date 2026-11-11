import { digest } from '../../store/readback-evidence';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';
import { PACKED165, type Packed165Policy } from './packed165-policy';

/** Current absence is a forward-publication fence, never a claim about historical mutation. */
export async function readPacked165Provider(delivery: GitHubDelivery, job: TicketJob, nextBranch: string, p: Packed165Policy = PACKED165) {
    const { store, execute } = delivery, number = Number(p.key.slice(3));
    const issue = await delivery.api(`issues/${number}`), main = await delivery.api(`git/ref/heads/${store.project.target}`);
    if (issue.number !== number || issue.state !== 'open' || issue.pull_request || !issue.assignees?.some((a: any) => a.login === 'JFusco') ||
        !/^[a-f0-9]{40}$/.test(main.object?.sha || '') || main.object.sha !== job.candidateBase)
        throw new Error('Current #165 assignment or approved baseline changed');
    const board = await delivery.engine.github.board(), items = board?.items.filter(item => item.repository === p.repository && item.number === number);
    if (!board || board.error || items?.length !== 1 || !/^(ready|in progress|in review)$/i.test(items[0].status || ''))
        throw new Error('Current #165 board lane is held, deferred or unavailable');
    for (const branch of [p.branch, nextBranch]) {
        const remote = await execute('git', ['ls-remote', '--heads', 'origin', `refs/heads/${branch}`], { cwd: job.worktree, readOnly: true, timeout: 60000 });
        const pages = JSON.parse(await execute('gh', ['api', `repos/${p.repository}/pulls?state=all&head=${encodeURIComponent('JFusco:' + branch)}&per_page=100`, '--paginate', '--slurp'], { cwd: store.project.repo, readOnly: true, timeout: 60000 }));
        if (remote.trim() || !Array.isArray(pages) || !pages.length || pages.some(page => !Array.isArray(page)) || pages.flat().length)
            throw new Error('Existing original or forward #165 publication requires reconciliation');
    }
    return { issue: { id: issue.id, updatedAt: issue.updated_at, body: issue.body, labels: issue.labels, assignees: issue.assignees },
        main: main.object.sha, board: items[0], fingerprint: digest([issue.id, issue.updated_at, issue.body, issue.labels, issue.assignees, main.object.sha, items[0]]) };
}
