import { noticeState, queueMergeNotice } from './notifications';
import { noticePolicyFingerprint, recordNoMergeNotice, settledWithoutNotice } from './no-merge-notice';
import { clearCooldown, coolDown, coolingDown } from './merge-notice-cooldown';
import type { GitHubDelivery } from '../delivery/pipeline/github-delivery';
import type { PullInventory } from '../delivery/intake/shared-pr-inventory';

/**
 * Completed native/external merges still produce notices even when their Office queue mirror never ran. A PR in the
 * poll's complete open inventory is not read. A closed unmerged PR, or a merge with nobody to tell yet, is read again
 * after a cooldown; a merge older than every enabled destination is settled by a marker on its job.
 */
export async function observeGitHubMergeNotices(delivery: GitHubDelivery, inventory?: PullInventory): Promise<void> {
    const { store } = delivery, { policy, entries } = noticeState(store);
    // Direct messages and channel posts are independent; observe merges when either is on, from the earlier start.
    const starts = [policy.enabled ? policy.enabledAt : '', policy.channel?.enabled ? policy.channel.enabledAt : ''].filter(Boolean).map(at => Date.parse(at));
    if (!starts.length || store.state.paused) return;
    const since = Math.min(...starts);
    const candidates = delivery.jobs.filter(job => job.pr && job.prUrl &&
        Date.parse(job.requestedAt) >= since &&
        !entries.some(notice => notice.prUrl === job.prUrl) && !settledWithoutNotice(store, job, policy)).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
    if (!candidates.length) return;
    // Only a complete list shows a PR still open; without one every candidate takes its live read.
    const open = inventory && await inventory.read().then(rows => new Set(rows.map(p => p.number)), () => undefined);
    const settings = () => noticePolicyFingerprint(noticeState(store).policy);
    for (const job of candidates) {
        if (open?.has(job.pr)) { clearCooldown(store, job.pr); continue; }
        if (coolingDown(store, job.pr, settings())) continue;
        try {
            const pull = await delivery.verifyPR(job, true);
            if (pull.number === job.pr && pull.state === 'closed' && !pull.merged_at) { coolDown(store, job.pr, settings()); continue; }
            if (!pull.merged_at || pull.state !== 'closed' || !pull.merge_commit_sha || pull.number !== job.pr) continue;
            const issue = await delivery.api(`issues/${Number(job.key.slice(3))}`);
            if (issue.number !== Number(job.key.slice(3)) || issue.pull_request ||
                issue.html_url !== `https://github.com/${store.project.repository}/issues/${issue.number}`) continue;
            queueMergeNotice(store, { key: job.key, prUrl: job.prUrl, mergeCommit: pull.merge_commit_sha,
                mergedAt: pull.merged_at, summary: 'GitHub Actions and issue acceptance are tracked separately by the Office.',
                pr: { title: pull.title, body: pull.body },
                assignees: (issue.assignees || []).map((user: any) => ({ id: user.login })),
                reporter: issue.user ? { id: issue.user.login } : undefined });
            const current = noticeState(store);
            if (current.entries.some(notice => notice.prUrl === job.prUrl)) continue;
            // Nothing queued: a merge older than every enabled destination never will be; one with nobody to tell yet is read again later.
            if (!recordNoMergeNotice(store, job, pull, current.policy)) coolDown(store, job.pr, settings());
        } catch { /* Provider/linkage uncertainty never creates a notification or resends an attempted one. */ }
    }
}
