import { noticeState, queueMergeNotice } from './notifications';
import type { GitHubDelivery } from '../delivery/pipeline/github-delivery';

/** Completed native/external merges still produce notices even when their Office queue mirror never ran. */
export async function observeGitHubMergeNotices(delivery: GitHubDelivery): Promise<void> {
    const { store } = delivery, { policy, entries } = noticeState(store);
    // Direct messages and channel posts are independent; observe merges when either is on, from the earlier start.
    const starts = [policy.enabled ? policy.enabledAt : '', policy.channel?.enabled ? policy.channel.enabledAt : ''].filter(Boolean).map(at => Date.parse(at));
    if (!starts.length || store.state.paused) return;
    const since = Math.min(...starts);
    const candidates = delivery.jobs.filter(job => job.pr && job.prUrl &&
        Date.parse(job.requestedAt) >= since &&
        !entries.some(notice => notice.prUrl === job.prUrl)).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
    for (const job of candidates) {
        try {
            const pull = await delivery.verifyPR(job, true);
            if (!pull.merged_at || pull.state !== 'closed' || !pull.merge_commit_sha || pull.number !== job.pr) continue;
            const issue = await delivery.api(`issues/${Number(job.key.slice(3))}`);
            if (issue.number !== Number(job.key.slice(3)) || issue.pull_request ||
                issue.html_url !== `https://github.com/${store.project.repository}/issues/${issue.number}`) continue;
            queueMergeNotice(store, { key: job.key, prUrl: job.prUrl, mergeCommit: pull.merge_commit_sha,
                mergedAt: pull.merged_at, summary: 'GitHub Actions and issue acceptance are tracked separately by the Office.',
                pr: { title: pull.title, body: pull.body },
                assignees: (issue.assignees || []).map((user: any) => ({ id: user.login })),
                reporter: issue.user ? { id: issue.user.login } : undefined });
        } catch { /* Provider/linkage uncertainty never creates a notification or resends an attempted one. */ }
    }
}
