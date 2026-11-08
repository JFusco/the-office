import { slackMessageUrl, type SlackDelivery, type TeamMessage } from '../shared';

/** Resolving a conversation warning must not mislabel an unknown original send as delivered. */
export function slackMessageStatus(message: TeamMessage, deliveries: SlackDelivery[]): 'confirmed' | 'superseded' | undefined {
    if (!message.error?.includes('Slack')) return;
    const ids = new Set([message.id, ...(message.actionId.startsWith('message:') ? [message.actionId.slice(8)] : [])]);
    const linked = deliveries.filter(delivery => ids.has(delivery.requestId));
    if (linked.some(delivery => delivery.supersession && slackMessageUrl(delivery.supersession.permalink, delivery.supersession.channelId, delivery.supersession.messageTs))) return 'superseded';
    if (linked.some(delivery => delivery.status === 'confirmed')) return 'confirmed';
}
