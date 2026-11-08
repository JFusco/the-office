import { createHash } from 'node:crypto';
import { slackMessageUrl, type OfficeSnapshot, type SlackDelivery } from '../../../src/shared';

export const slackFingerprint = (delivery: SlackDelivery) => createHash('sha256').update(JSON.stringify([delivery.id, delivery.requestId, delivery.targetType, delivery.targetId, delivery.workspaceId, delivery.text, delivery.createdAt, delivery.channelId, delivery.messageTs, delivery.permalink])).digest('hex');

/** Proves the replacement was verified for the same recipient and explicitly linked work. */
export function replacementContext(state: OfficeSnapshot, original: SlackDelivery, replacement: SlackDelivery): string | undefined {
    if (original.id === replacement.id || original.requestId === replacement.requestId || original.status !== 'uncertain' || replacement.status !== 'confirmed' || replacement.supersededBy || original.targetType !== replacement.targetType || original.targetId !== replacement.targetId || original.workspaceId !== replacement.workspaceId || !slackMessageUrl(replacement.permalink, replacement.channelId, replacement.messageTs)) return;
    if (!/^T[A-Z0-9]+$/.test(replacement.workspaceId) || !(replacement.targetType === 'person' ? /^U[A-Z0-9]+$/ : /^[CG][A-Z0-9]+$/).test(replacement.targetId) || replacement.targetType === 'channel' && replacement.channelId !== replacement.targetId) return;
    const sourceTime = Date.parse(original.createdAt), replacementTime = Date.parse(replacement.createdAt), sentTime = Number(replacement.messageTs) * 1000;
    if (![sourceTime, replacementTime, sentTime].every(Number.isFinite) || replacementTime < sourceTime || sentTime < replacementTime - 5000) return;
    const human = state.messages.filter(message => message.id === replacement.requestId && message.from === 'human' && message.to === 'pm');
    if (human.length !== 1) return;
    const notices = state.coordination?.notices?.entries.filter(notice => notice.id === original.requestId) || [];
    if (notices.length > 1) return;
    const source = state.messages.find(message => message.id === original.requestId && message.from === 'human');
    const ticket = notices[0]?.key || source?.ticket || '';
    const linked = ticket ? human[0].ticket === ticket : human[0].body.includes(original.requestId) || human[0].body.includes(original.id);
    if (!linked || notices[0]?.prUrl && !replacement.text.includes(notices[0].prUrl)) return;
    return createHash('sha256').update(JSON.stringify([state.project?.id, ticket, notices[0]?.prUrl || '', notices[0]?.mergeCommit || '', human[0].id, human[0].ticket, human[0].body])).digest('hex');
}

/** A stale metadata flag cannot hide an uncertain delivery after its evidence changes. */
export function supersedingDelivery(state: OfficeSnapshot, original: SlackDelivery): SlackDelivery | undefined {
    const proof = original.supersededBy;
    if (!proof || !proof.projectId || proof.projectId !== state.project?.id || typeof proof.reason !== 'string' || !proof.reason.trim() || !Number.isFinite(Date.parse(proof.at))) return;
    const originals = state.slackDeliveries?.filter(delivery => delivery.id === original.id) || [];
    const replacements = state.slackDeliveries?.filter(delivery => delivery.id === proof.replacementDeliveryId) || [];
    if (originals.length !== 1 || replacements.length !== 1) return;
    const replacement = replacements[0];
    if (Date.parse(proof.at) < Date.parse(replacement.createdAt) || Number(replacement.messageTs) * 1000 > Date.parse(proof.at) + 5000) return;
    const context = replacementContext(state, original, replacement);
    return context && context === proof.contextFingerprint && proof.originalFingerprint === slackFingerprint(original) && proof.replacementFingerprint === slackFingerprint(replacement) ? replacement : undefined;
}

export function slackRequestSettled(state: OfficeSnapshot, requestId: string): boolean {
    return !!state.slackDeliveries?.some(delivery => delivery.requestId === requestId && (delivery.status === 'confirmed' || supersedingDelivery(state, delivery)));
}
