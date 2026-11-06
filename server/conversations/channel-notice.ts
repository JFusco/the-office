import { z } from 'zod';
import type { MergeNotice } from '../../src/shared';
import type { Store } from '../store/store';

/** A channel post for every merge, mentioning a fixed set of people. IDs come from Slack, never a lookup. */
export const ChannelSettings = z.object({
    enabled: z.boolean(),
    channelId: z.string().trim().regex(/^[CG][A-Z0-9]+$/, 'Slack channel IDs start with C or G'),
    channelName: z.string().trim().min(1, 'Channel name is required').max(100),
    workspaceId: z.string().trim().regex(/^T[A-Z0-9]+$/, 'Slack workspace IDs start with T'),
    mentionIds: z.array(z.string().trim().regex(/^[UW][A-Z0-9]+$/, 'Slack member IDs start with U or W')).max(20, 'Tag at most 20 people'),
}).strict();

function notices(store: Store) {
    return store.state.coordination!.notices ??= { policy: { enabled: false, recipients: 'both', workspace: 'Verndale', mappings: '', enabledAt: '' }, entries: [] };
}

export function configureChannelNotices(store: Store, input: unknown) {
    const parsed = ChannelSettings.safeParse(input);
    if (!parsed.success) throw new Error(`Invalid merge channel: ${parsed.error.issues.map(issue => issue.message).join('; ')}`);
    const settings = parsed.data, state = notices(store), old = state.policy.channel;
    const mentionIds = [...new Set(settings.mentionIds)];
    if (old && old.enabled === settings.enabled && old.channelId === settings.channelId && old.channelName === settings.channelName && old.workspaceId === settings.workspaceId && JSON.stringify(old.mentionIds) === JSON.stringify(mentionIds)) return;
    state.policy.channel = { ...settings, mentionIds, enabledAt: settings.enabled ? (old?.enabled ? old.enabledAt : store.clock.now().toISOString()) : '', version: crypto.randomUUID() };
    for (const notice of state.entries) if (notice.channel && notice.status === 'queued') {
        notice.status = 'cancelled'; notice.detail = 'Channel notification settings changed before sending.';
    }
    store.emit('channel-notices-configured', `${store.project.name} merge posts ${settings.enabled ? `enabled for #${settings.channelName}` : 'disabled'}.`, 'pm');
}

/** One post per merge; queued beside the person notices in the same saved change. */
export function queueChannelNotice(store: Store, input: { key: string; prUrl: string; mergeCommit: string; mergedAt: string; text: string }) {
    const state = notices(store), channel = state.policy.channel;
    if (!channel?.enabled || !channel.enabledAt || !Number.isFinite(Date.parse(input.mergedAt)) || Date.parse(input.mergedAt) < Date.parse(channel.enabledAt)) return;
    const event = `${store.project.repository}:${input.prUrl}:${input.mergeCommit}:channel:${channel.channelId}`;
    if (state.entries.some(notice => notice.event === event)) return;
    const mentions = channel.mentionIds.map(id => `<@${id}>`).join(' ');
    state.entries.push({ id: crypto.randomUUID(), event, key: input.key, prUrl: input.prUrl, mergeCommit: input.mergeCommit, channel: true, channelVersion: channel.version,
        identity: channel.channelId, email: '', resolved: { targetId: channel.channelId, targetName: channel.channelName, workspaceId: channel.workspaceId },
        text: mentions ? `${mentions}\n${input.text}` : input.text, createdAt: store.clock.now().toISOString(), status: 'queued', detail: `Merge post queued for #${channel.channelName}.` });
}

export function channelNoticeAuthorized(store: Store, notice: MergeNotice): boolean {
    const channel = store.state.coordination?.notices?.policy.channel;
    return notice.kind !== 'goal' && !!notice.channel && !!channel?.enabled && channel.version === notice.channelVersion &&
        notice.resolved?.targetId === channel.channelId && notice.resolved.workspaceId === channel.workspaceId;
}
