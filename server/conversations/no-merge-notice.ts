import { createHash } from 'node:crypto';
import type { Store } from '../store/store';
import type { NoticePolicy, TicketJob } from '../../src/shared';

/** Every notice setting a merge decision is made under, direct and channel; any change gives a new fingerprint. */
export function noticePolicyFingerprint(policy: NoticePolicy): string {
    const { enabled, enabledAt, recipients, workspace, mappings, channel } = policy;
    return createHash('sha256').update(JSON.stringify({ direct: { enabled, enabledAt, recipients, workspace, mappings },
        channel: channel ? { enabled: channel.enabled, enabledAt: channel.enabledAt, channelId: channel.channelId, workspaceId: channel.workspaceId, version: channel.version } : null })).digest('hex');
}

/** True only when the merge predates the valid start of every enabled destination, so none of them would ever send. */
export function predatesEveryDestination(policy: NoticePolicy, mergedAt: string): boolean {
    const merged = Date.parse(mergedAt);
    const starts = [policy.enabled ? policy.enabledAt : undefined, policy.channel?.enabled ? policy.channel.enabledAt : undefined]
        .filter((at): at is string => at !== undefined).map(at => Date.parse(at));
    return Number.isFinite(merged) && starts.length > 0 && starts.every(start => Number.isFinite(start) && merged < start);
}

const issueOf = (job: TicketJob) => /^GH-[1-9]\d*$/.test(job.key) ? Number(job.key.slice(3)) : 0;
const SHA = /^[0-9a-f]{40}$/;

/**
 * The job's no-notice marker still holds: same repository, issue and PR, same settings, and the recorded merge still
 * predates every enabled destination. A marker that no longer holds is discarded, so the job is read again.
 */
export function settledWithoutNotice(store: Store, job: TicketJob, policy: NoticePolicy): boolean {
    const marker = job.noMergeNotice;
    if (!marker) return false;
    if (marker.repository === store.project.repository && marker.issue > 0 && marker.issue === issueOf(job) && marker.pr === job.pr &&
        SHA.test(marker.mergeCommit) && marker.policy === noticePolicyFingerprint(policy) && predatesEveryDestination(policy, marker.mergedAt))
        return true;
    delete job.noMergeNotice;
    return false;
}

/**
 * The one durable no-notice reason: a verified merge that queued nothing because it predates every enabled
 * destination. Recorded against what decided it; any other empty outcome (nobody to tell, no linkage) is not.
 */
export function recordNoMergeNotice(store: Store, job: TicketJob, pull: { number: number; merge_commit_sha: string; merged_at: string }, policy: NoticePolicy): boolean {
    const issue = issueOf(job);
    if (!issue || pull.number !== job.pr || !SHA.test(pull.merge_commit_sha) || !predatesEveryDestination(policy, pull.merged_at)) return false;
    job.noMergeNotice = { repository: store.project.repository, issue, pr: job.pr, mergeCommit: pull.merge_commit_sha, mergedAt: pull.merged_at, policy: noticePolicyFingerprint(policy), at: store.clock.now().toISOString() };
    return true;
}
