import { reconcileNoticeConfirmations } from './notifications';
import { z } from 'zod';
import { slackMessageUrl, type SlackDelivery } from '../../src/shared';
import type { Store } from '../store/store';
import type { Agents } from '../workers/agents';
import { sanitize } from '../office/security';
import { CommandFailure } from '../workers/process';
export const SlackRequestSchema = z.object({ targetType: z.enum(['person', 'channel']), targetId: z.string().regex(/^[UCG][A-Z0-9]+$/), targetName: z.string().min(1), workspaceId: z.string().regex(/^T[A-Z0-9]+$/), text: z.string().min(1).max(5000) }).strict();
export const SlackResultSchema = z.object({ channelId: z.string(), messageTs: z.string(), permalink: z.string(), detail: z.string() }).strict();
export const SlackVerificationSchema = z.object({ found: z.boolean(), channelId: z.string(), messageTs: z.string(), permalink: z.string(), targetId: z.string(), workspaceId: z.string(), text: z.string(), detail: z.string() }).strict();
// The connector expands mentions on read and adds this app attribution on send.
// Normalize only those observed transport changes; never discard arbitrary text.
export function comparableSlackText(text: string) {
    return text.replace(/\r\n/g, '\n').replace(/&(?:amp|lt|gt);/g, s => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>' })[s]!)
        .replace(/<@([UW][A-Z0-9]+)\|[^>]+>/g, '<@$1>').replace(/<#([CG][A-Z0-9]+)\|[^>]+>/g, '<#$1>')
        .replace(/<(https?:\/\/[^>|]+)(?:\|([^>]+))?>/g, (_all, url: string, label: string | undefined) => !label || label === url || label === url.replace(/^https?:\/\//, '') ? url : `[${label}](${url})`)
        .replace(/\n\*Sent using\* <@U0A3Q4JJX17>\s*$/, '').trim();
}
export class SlackMessages {
    constructor(private store: Store, private agents: Agents) { }
    async send(requestId: string, input: z.infer<typeof SlackRequestSchema>) {
        const request = SlackRequestSchema.parse(input), human = this.store.state.messages.find(m => m.id === requestId && m.from === 'human' && m.to === 'pm');
        if (!human || human.status !== 'working')
            throw new Error('Slack requires a current human request to Morgan');
        return this.deliver(requestId, request, human);
    }
    async sendNotification(requestId: string, input: z.infer<typeof SlackRequestSchema>) {
        const request = SlackRequestSchema.parse(input), state = this.store.state.coordination?.notices, notice = state?.entries.find(n => n.id === requestId);
        if (!state?.policy.enabled || !notice || notice.status !== 'working' || !notice.resolved || notice.text !== request.text || notice.resolved.targetId !== request.targetId || notice.resolved.workspaceId !== request.workspaceId || request.targetType !== 'person')
            throw new Error('Merge notice lacks current project and recipient authorization');
        return this.deliver(requestId, request, { body: 'Joe enabled this project’s verified merge notifications. Send only the saved message to the independently resolved recipient.', ticket: notice.key, requestId });
    }
    private async deliver(requestId: string, request: z.infer<typeof SlackRequestSchema>, human: {
        body: string;
        ticket: string;
        requestId: string;
    }) {
        if (this.store.state.paused)
            throw new Error('Office paused before Slack delivery');
        this.store.state.slackDeliveries ??= [];
        if (this.store.state.slackDeliveries.some(d => d.requestId === requestId))
            throw new Error('This request already has a Slack delivery; read it back instead of resending');
        if ((request.targetType === 'person') !== request.targetId.startsWith('U'))
            throw new Error('Slack recipient type does not match its ID');
        const now = new Date().toISOString();
        const delivery: SlackDelivery = { ...request, id: crypto.randomUUID(), requestId, status: 'sending', channelId: '', messageTs: '', permalink: '', sessionId: '', createdAt: now, updatedAt: now, error: '' };
        this.store.state.slackDeliveries.push(delivery);
        this.store.emit('slack-sending', `Morgan is sending a Slack message to ${delivery.targetName}.`, 'pm', human.ticket);
        try {
            const result = await this.agents.sendSlack(delivery, human);
            Object.assign(delivery, result, { sessionId: this.store.state.agents.find(a => a.id === 'pm')?.sessionId || '', status: 'verifying', updatedAt: new Date().toISOString() });
            this.store.emit('slack-verifying', 'Morgan is checking the sent message in Slack.', 'pm', human.ticket);
            await this.verify(delivery);
        }
        catch (e) {
            delivery.error = sanitize(String(e));
            delivery.sessionId ||= this.store.state.agents.find(a => a.id === 'pm')?.sessionId || '';
            // A send that ended uncertain (for example, helpers outlived the sender)
            // gets one independent read-back. It is never resent.
            // A pause or shutdown cancels the send; it does not start a new worker.
            if (delivery.status === 'sending' && !this.store.state.paused && !(e instanceof CommandFailure && e.category === 'cancelled')) {
                Object.assign(delivery, { status: 'verifying', updatedAt: new Date().toISOString() });
                this.store.emit('slack-verifying', 'Morgan is checking Slack for the uncertain send.', 'pm', human.ticket);
                try {
                    return await this.verify(delivery);
                }
                catch (readback) {
                    delivery.error = sanitize(`${String(e)} Automatic read-back: ${String(readback)}`); // The send error stays first for the outbox.
                }
            }
            delivery.status = 'uncertain';
            delivery.updatedAt = new Date().toISOString();
            this.store.emit('slack-uncertain', `Slack delivery needs read-back: ${delivery.error}`, 'pm', human.ticket);
            throw new Error('Slack delivery could not be confirmed. It will not be resent. Ask Morgan to read back this delivery from your outbox.');
        }
        return delivery;
    }
    async verify(delivery: SlackDelivery) {
        const result = await this.agents.verifySlack(delivery);
        if (!result.found || result.targetId !== delivery.targetId || result.workspaceId !== delivery.workspaceId || comparableSlackText(result.text) !== comparableSlackText(delivery.text) || !slackMessageUrl(result.permalink, result.channelId, result.messageTs) || (delivery.channelId && result.channelId !== delivery.channelId) || (delivery.messageTs && result.messageTs !== delivery.messageTs) || (delivery.targetType === 'channel' && result.channelId !== delivery.targetId) || Number(result.messageTs) * 1000 < Date.parse(delivery.createdAt) - 5000)
            throw new Error('Slack read-back did not match the saved recipient, text, time, and message link');
        Object.assign(delivery, { channelId: result.channelId, messageTs: result.messageTs, permalink: result.permalink, status: 'confirmed', error: '', updatedAt: new Date().toISOString() });
        reconcileNoticeConfirmations(this.store);
        this.store.emit('slack-confirmed', `Sent to ${delivery.targetName} on Slack. Verified by reading the message back.`, 'pm');
        return delivery;
    }
}
