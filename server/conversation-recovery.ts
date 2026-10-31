import type { z } from 'zod';
import type { ReplySchema } from './conversations';
import type { Store } from './store';
import type { TeamMessage } from '../src/shared';
import { canFileGithubIssue } from './github-context';
import { processGroupAlive } from './process';
import { projectOutbox } from './outbox';

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
export function queueConversationReadback(store: Store, original: TeamMessage): TeamMessage {
    if (!conversationReadbackReady(store, original)) throw new Error('Original conversation processes are not confirmed stopped or dispatch is paused');
    const actionId = `message:${original.id}`;
    const pending = store.state.messages.find(message => message.actionId === actionId && ['queued', 'working'].includes(message.status));
    if (pending) return pending;
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
