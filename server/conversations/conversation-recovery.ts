import type { z } from 'zod';
import type { ReplySchema } from './conversations';
import type { Store } from '../store/store';
import type { TeamMessage } from '../../src/shared';
import { canFileGithubIssue } from '../github/github-context';
import { processGroupAlive } from '../workers/process';
import { projectOutbox } from './outbox';
import { executing, harperRequest } from '../knowledge/handoff-admission';
import { supersededHandoff } from '../operations/stale-records';

/** Only stopped, uncertain issue-creation conversations qualify; the writer never reruns. */
export function uncertainConversations(store: Store): TeamMessage[] {
    if (store.project.provider !== 'github') return [];
    const open = new Set(projectOutbox(store.state).filter(item => item.status === 'open').map(item => item.id));
    return store.state.messages.filter(message => {
        if (!canFileGithubIssue(message.to, message, '') || !['failed', 'interrupted'].includes(message.status) ||
            !/effects require reconciliation|uncertain|could not be verified|timed? out|cancelled|interrupted/i.test(message.error) ||
            !open.has(`message:${message.id}`) || store.state.slackDeliveries?.some(delivery => delivery.requestId === message.id)) return false;
        return true;
    });
}
export function conversationReadbackReady(store: Store, original: TeamMessage, alive = processGroupAlive): boolean {
    if (store.state.paused || store.state.draining) return false;
    const workers = store.state.workLog?.filter(work => work.requestId === original.id) || [];
    return !!workers.length && workers.every(worker => !!worker.processId &&
        ['failed', 'interrupted', 'completed', 'blocked'].includes(worker.status) && !alive(worker.processId));
}
/** Harper's follow-up about this failed human message. */
const followupOf = (store: Store, original: TeamMessage) => store.state.knowledge?.followups?.find(item => item.source.kind === 'message' && item.source.id === original.id);
/**
 * The queued or working read-back of exactly this original: the follow-up's pinned survivor first, then the first in
 * message order. A person's or IT's request always counts; one Harper sent counts only when it is bound to this
 * original's follow-up.
 */
export function pendingReadback(store: Store, original: TeamMessage): TeamMessage | undefined {
    const actionId = `message:${original.id}`, item = followupOf(store, original);
    const pending = store.state.messages.filter(message => message.actionId === actionId && ['queued', 'working'].includes(message.status) && (message.from !== 'knowledge' || !!item && harperRequest(item, message)));
    return pending.find(message => message.id === item?.handoffId) ?? pending[0];
}
/** A read-back of exactly this original, sent by Harper and bound to its follow-up, whose worker or claim is still running or stopping. */
export function readbackEnding(store: Store, original: TeamMessage): boolean {
    const actionId = `message:${original.id}`, item = followupOf(store, original);
    if (!item) return false;
    const evidence = { projectId: store.project.id, claims: store.activeClaims(), workLog: store.state.workLog || [] };
    return store.state.messages.some(message => message.actionId === actionId && harperRequest(item, message) && executing(message, evidence));
}
/**
 * IT's remembered read-back for a conversation recovery was a Harper request settled unstarted in favour of another:
 * the live read-back of the same original that replaced it, when one is queued or working.
 */
export function replacedReadback(store: Store, recoveryId: string, requestId?: string): TeamMessage | undefined {
    const prefix = 'conversation:';
    if (!recoveryId.startsWith(prefix) || !requestId) return undefined;
    const original = store.state.messages.find(message => message.id === recoveryId.slice(prefix.length));
    const remembered = original && store.state.messages.find(message => message.id === requestId);
    if (!original || !remembered || !supersededHandoff(remembered) || remembered.actionId !== `message:${original.id}`) return undefined;
    return pendingReadback(store, original);
}
export function queueConversationReadback(store: Store, original: TeamMessage): TeamMessage {
    if (!conversationReadbackReady(store, original)) throw new Error('Original conversation processes are not confirmed stopped or dispatch is paused');
    const actionId = `message:${original.id}`;
    const pending = pendingReadback(store, original);
    if (pending) return pending;
    // Both producers wait before calling this; a caller that did not is refused rather than queueing a second reader.
    if (readbackEnding(store, original)) throw new Error('An earlier read-back of this conversation is still stopping');
    const id = crypto.randomUUID();
    const message: TeamMessage = { id, requestId: id, from: 'it', to: 'pm', ticket: original.ticket, actionId,
        body: `Ellis requests READ ONLY reconciliation of uncertain issue-creation conversation ${original.id}, native session ${original.sessionId}. Read its original saved worker commands, completed-output checkpoint and current exact provider records. Prove the identity/disposition of EVERY attempted effect; a negative search cannot establish non-execution. Never repeat the create, assign, edit, send, close or other write. Preserve the original failure. Return a verified conversation-readback receipt with target ${original.id} only when all original effects are accounted for; otherwise leave unresolved. Return no goals, pickup changes, Slack requests, notes, handoffs or notifications. Original request: ${original.body}`,
        status: 'queued', createdAt: store.clock.now().toISOString(), sessionId: '', recheck: false, error: '', recipients: [], receipts: [] };
    store.transaction(() => {
        store.state.messages.push(message);
        store.emit('conversation-readback-queued', 'Ellis queued a read-only conversation reconciliation; no writer was retried.', 'pm', original.ticket);
    });
    return message;
}
export function assertConversationReadback(message: TeamMessage, reply: z.infer<typeof ReplySchema>): void {
    if (message.from !== 'it' || !message.actionId.startsWith('message:')) return;
    const originalId = message.actionId.slice(8);
    if (reply.goalChanges.length || reply.slackRequests.length || reply.notes.length || reply.notifyRoles.length ||
        reply.pickupChange || reply.handoffProject || reply.question ||
        reply.receipts.some(receipt => !receipt.verified || receipt.uncertain) ||
        !reply.receipts.some(receipt => receipt.action === 'conversation-readback' && receipt.target === originalId && receipt.verified && !receipt.uncertain))
        throw new Error('Automatic conversation read-back lacks complete verified evidence or proposed an unauthorized change');
}
