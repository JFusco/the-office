import { command } from '../workers/process';
import { z } from 'zod';
import type { Store } from '../store/store';
import type { Engine } from '../scheduling/engine';
import { SlackMessages } from './slack';
import type { MergeNotice } from '../../src/shared';
export const NoticeSettings = z.object({ enabled: z.boolean(), recipients: z.enum(['assignee', 'reporter', 'both']), workspace: z.string().trim().min(1).max(100), mappings: z.string().max(6000) }).strict();
const Identity = z.object({ found: z.boolean(), targetId: z.string(), targetName: z.string(), workspaceId: z.string(), evidence: z.array(z.string()), blocker: z.string() }).strict();
export function noticeState(store: Store) { return store.state.coordination!.notices ??= { policy: { enabled: false, recipients: 'both', workspace: 'Verndale', mappings: '', enabledAt: '' }, entries: [] }; }
export function configureNotices(store: Store, input: unknown) { const state = noticeState(store), settings = NoticeSettings.parse(input); state.policy = { ...settings, enabledAt: settings.enabled ? (state.policy.enabled ? state.policy.enabledAt : new Date().toISOString()) : '' }; store.emit('merge-notices-configured', `${store.project.name} merge Slack notices ${settings.enabled ? 'enabled' : 'disabled'}.`, 'pm'); }
export function queueMergeNotice(store: Store, input: {
    key: string;
    prUrl: string;
    mergeCommit: string;
    mergedAt: string;
    summary: string;
    assignees: {
        id: string;
        email?: string;
    }[];
    reporter?: {
        id: string;
        email?: string;
    };
}) {
    const { policy, entries } = noticeState(store);
    if (!policy.enabled || !policy.enabledAt || !Number.isFinite(Date.parse(input.mergedAt)) || Date.parse(input.mergedAt) < Date.parse(policy.enabledAt))
        return;
    const recipients = policy.recipients === 'assignee' ? input.assignees : policy.recipients === 'reporter' ? [input.reporter] : [...input.assignees, input.reporter];
    for (const person of recipients) {
        if (!person?.id)
            continue;
        const event = `${store.project.repository}:${input.prUrl}:${input.mergeCommit}:${person.id}`;
        if (entries.some(e => e.event === event))
            continue;
        entries.push({ id: crypto.randomUUID(), event, key: input.key, prUrl: input.prUrl, mergeCommit: input.mergeCommit, identity: person.id, email: person.email || '', text: `${store.project.name} · ${input.key}: PR merged.\n${input.prUrl}\n${input.summary}\nMerge commit: ${input.mergeCommit}\nThis confirms the merge; deployment and issue acceptance are separate.`, createdAt: new Date().toISOString(), status: 'queued', detail: 'Waiting for Morgan to verify the Slack recipient.' });
    }
    store.save();
}
export function retryRecipientLookup(store: Store, key: string) {
    const notice = noticeState(store).entries.find(n => n.key === key && n.status === 'blocked');
    if (!notice || store.state.slackDeliveries?.some(d => d.requestId === notice.id))
        throw new Error('Only an interrupted recipient lookup with no Slack delivery attempt can be retried');
    const work = (store.state.workLog || []).filter(w => w.requestId === notice.id).at(-1);
    if (!work || work.stage !== 'slack-recipient' || !['interrupted', 'completed', 'blocked'].includes(work.status))
        throw new Error('Interrupted read-only recipient lookup evidence is required');
    notice.status = 'queued';
    notice.detail = 'Read-only recipient lookup requeued after verifying no Slack send was attempted.';
    store.emit('notice-recipient-recheck', notice.detail, 'pm', key);
}
export class MergeNotifications {
    constructor(private store: Store, private engine: Engine, private execute: typeof command = command) { }
    async pump(id?: string) {
        const { policy, entries } = noticeState(this.store), notice = entries.find(n => n.status === 'queued' && (!id || n.id === id));
        if (!notice)
            return;
        if (!policy.enabled) {
            notice.status = 'cancelled';
            notice.detail = 'Notifications disabled before delivery.';
            this.store.save();
            return;
        }
        const policyVersion = JSON.stringify(policy);
        notice.status = 'working';
        this.store.save();
        try {
            if (this.store.project.provider === 'github' && !notice.email) {
                const user = JSON.parse(await this.execute('gh', ['api', `users/${encodeURIComponent(notice.identity)}`], { cwd: this.store.project.repo, timeout: 60000 }));
                if (user.login?.toLowerCase() !== notice.identity.toLowerCase())
                    throw new Error('GitHub recipient identity changed');
                if (typeof user.email === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(user.email)) {
                    notice.email = user.email;
                    this.store.save();
                }
            }
            const explicit = policy.mappings.split('\n').map(line => line.split('=').map(x => x.trim())).find(parts => parts.length === 2 && parts[0] === notice.identity)?.[1];
            const target = await this.engine.agents.run('pm', `Resolve a merge-notice Slack recipient. READ ONLY; never send. Project ${this.store.project.name}; provider identity ${JSON.stringify(notice.identity)}; independently supplied provider email ${JSON.stringify(notice.email)}. Workspace must be ${JSON.stringify(policy.workspace)}. ${explicit ? `Joe explicitly mapped this provider identity to Slack person ${JSON.stringify(explicit)}. Resolve that exact unique person and verify active membership/profile in the named workspace.` : 'There is no explicit mapping. Match only a verified identical provider email and Slack profile email; do not infer identity from a similar display name or GitHub login. An absent email or ambiguous match is blocked and needs a mapping in project settings.'} Read live native Slack contracts/profile/search. Verify target U user ID and exact workspace T ID against the current native profile. Historical independently confirmed Office DM bindings: ${JSON.stringify(this.engine.slackIdentityContext())}. These bindings may establish the workspace ID for the SAME user only after a current native profile independently matches the exact provider email and named organization. A profile naming the requested organization plus that same-user confirmed workspace binding is sufficient; do not demand an unavailable raw active-membership flag. Reject any exposed deleted, bot, restricted, or conflicting workspace identity. A binding alone never proves a person match. No Slack Connect/external/shared channel, other workspace, guessed identity, filesystem writes or sends. Return found=false and a precise blocker if unavailable/ambiguous. Record actual identity evidence.`, Identity, { readOnly: true, stage: 'slack-recipient', ticket: notice.key, requestId: notice.id, timeout: 10 * 60 * 1000 });
            if (!target.found || !/^U[A-Z0-9]+$/.test(target.targetId) || !/^T[A-Z0-9]+$/.test(target.workspaceId) || !target.evidence.length)
                throw new Error(target.blocker || 'Verified Slack identity is missing; add an explicit project mapping');
            // Deduplicate assignee/reporter identities that resolve to the same person.
            if (entries.some(other => other.id !== notice.id && other.prUrl === notice.prUrl && other.mergeCommit === notice.mergeCommit && other.resolved?.targetId === target.targetId && other.resolved.workspaceId === target.workspaceId && ['sent', 'working', 'uncertain'].includes(other.status))) {
                notice.status = 'cancelled';
                notice.detail = 'Same Slack person already covered by this merge notice.';
                return;
            }
            notice.resolved = { targetId: target.targetId, targetName: target.targetName, workspaceId: target.workspaceId };
            this.store.save();
            if (!noticeState(this.store).policy.enabled || JSON.stringify(noticeState(this.store).policy) !== policyVersion) {
                notice.status = 'cancelled';
                notice.detail = 'Notification settings changed during identity resolution.';
                return;
            }
            const delivery = await new SlackMessages(this.store, this.engine.agents).sendNotification(notice.id, { ...notice.resolved, targetType: 'person', text: notice.text });
            notice.status = 'sent';
            notice.detail = delivery.permalink;
        }
        catch (error) {
            notice.status = this.store.state.slackDeliveries?.some(d => d.requestId === notice.id) ? 'uncertain' : 'blocked';
            notice.detail = String(error);
        }
        finally {
            this.store.save();
        }
    }
}
export function reconcileNoticeConfirmations(store: Store) {
    let changed = false;
    for (const notice of store.state.coordination?.notices?.entries || []) {
        if (!['uncertain', 'working', 'blocked'].includes(notice.status))
            continue;
        const delivery = store.state.slackDeliveries?.find(delivery => delivery.requestId === notice.id && delivery.status === 'confirmed');
        if (delivery) {
            notice.status = 'sent';
            notice.detail = delivery.permalink;
            changed = true;
        }
    }
    if (changed)
        store.emit('notices-reconciled', 'Merge notification delivery verified; no message resent.', 'pm');
}
