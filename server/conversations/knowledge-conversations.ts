import { sanitize } from '../office/security';
import type { TeamMessage } from '../../src/shared';
import type { Conversations } from './conversations';

export const queuedKnowledgeMessage = (message: TeamMessage) => message.to === 'knowledge' && message.status === 'queued' && message.from === 'human';

/** Harper's read-only chat on the knowledge lane; mirrors Ellis's chat contract. */
export async function pumpKnowledge(this: Conversations) {
    const agents = this.engine.knowledgeAgents;
    if (this.runningKnowledge || agents.active.size || this.store.state.paused)
        return;
    const message = this.store.state.messages.find(queuedKnowledgeMessage);
    if (!message || !this.store.claim(this.knowledgeOwner, Date.now(), 'knowledge-chat'))
        return;
    this.runningKnowledge = true;
    const heartbeat = setInterval(() => this.store.claim(this.knowledgeOwner, Date.now(), 'knowledge-chat'), 20000);
    message.status = 'working';
    this.store.emit('message-started', 'Harper is looking into your question.', 'knowledge', message.ticket);
    try {
        const reply = await agents.followup('knowledge', message);
        if (reply.notifyRoles.some(role => role !== 'pm') || reply.goalChanges.length || reply.slackRequests.length || reply.notes.length || reply.pickupChange || reply.receipts.length)
            throw new Error('Harper chat may hand a request to Morgan, but cannot change lessons, delivery, goals or external services');
        const sessionId = this.store.state.agents.find(agent => agent.id === 'knowledge')?.sessionId || '';
        this.record({ ...message, id: crypto.randomUUID(), from: 'knowledge', body: reply.reply, status: 'answered', createdAt: new Date().toISOString(), sessionId, recipients: reply.notifyRoles, receipts: [], recheck: false, error: '', question: reply.question });
        if (reply.notifyRoles.includes('pm'))
            this.store.state.messages.push({ ...message, id: `knowledge-report:${message.id}`, requestId: `knowledge-report:${message.id}`, from: 'knowledge', to: 'pm', body: `Harper's note for the team: ${reply.reply}\nJoe's request: ${message.body}`, status: 'queued', createdAt: new Date().toISOString(), ticket: message.ticket, actionId: '', recheck: false, recipients: [], receipts: [] });
        message.status = 'answered';
        message.sessionId = sessionId;
        this.store.emit('message-answered', 'Harper replied; any Morgan follow-up is queued separately.', 'knowledge', message.ticket);
    }
    catch (error) {
        message.status = 'failed';
        message.error = sanitize(String(error));
        this.store.emit('message-failed', message.error, 'knowledge', message.ticket);
    }
    finally {
        clearInterval(heartbeat);
        this.store.release(this.knowledgeOwner);
        this.runningKnowledge = false;
        this.archive(message.id);
        this.store.save();
    }
}
