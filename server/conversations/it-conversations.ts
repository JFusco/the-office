import { sanitize } from '../office/security';
import { type TeamMessage } from '../../src/shared';
import type { Conversations } from './conversations';

export function queuedITMessage(this: Conversations, message: TeamMessage) {
    return message.to === 'it' && message.status === 'queued' && (message.from === 'human' || message.from === 'pm' &&
        [...(this.store.state.coordination?.jobs || []), ...this.store.state.tickets].some(job => job.repairCycle?.diagnosisRequestId === message.id));
}

export async function pumpIT(this: Conversations) {
    const agents = this.engine.itAgents;
    if (this.runningIT || agents.active.size || this.store.state.paused)
        return;
    const message = this.store.state.messages.find(m => this.queuedITMessage(m));
    if (!message || !this.store.claim(this.itOwner, Date.now(), 'it-chat'))
        return;
    this.runningIT = true;
    const heartbeat = setInterval(() => this.store.claim(this.itOwner, Date.now(), 'it-chat'), 20000);
    message.status = 'working';
    this.store.emit('message-started', 'Ellis is checking your operational question.', 'it', message.ticket);
    try {
        if (message.recheck)
            await this.checkIT?.();
        const reply = await agents.followup('it', message);
        if (reply.notifyRoles.some(r => r !== 'pm') || reply.goalChanges.length || reply.slackRequests.length || reply.notes.length || reply.pickupChange || reply.receipts.some(r => r.uncertain || !r.verified))
            throw new Error('IT chat may report verified operational findings to Morgan, but cannot change delivery, goals, logins or external services');
        this.record({ ...message, id: crypto.randomUUID(), from: 'it', body: reply.reply, status: 'answered', createdAt: new Date().toISOString(), sessionId: this.store.state.agents.find(a => a.id === 'it')?.sessionId || '', recipients: reply.notifyRoles, receipts: reply.receipts, recheck: false, error: '', question: reply.question });
        if (reply.notifyRoles.includes('pm'))
            this.store.state.messages.push({ ...message, id: `it-report:${message.id}`, requestId: `it-report:${message.id}`, from: 'it', to: 'pm', body: `Ellis's verified operational report: ${reply.reply}\nJoe's request: ${message.body}`, status: 'queued', createdAt: new Date().toISOString(), ticket: message.ticket, actionId: '', recheck: false, recipients: [], receipts: [] });
        message.status = 'answered';
        message.sessionId = this.store.state.agents.find(a => a.id === 'it')?.sessionId || '';
        this.store.emit('message-answered', 'Ellis replied; any Morgan follow-up is queued separately.', 'it', message.ticket);
    }
    catch (error) {
        message.status = 'failed';
        message.error = sanitize(String(error));
        this.store.emit('message-failed', message.error, 'it', message.ticket);
    }
    finally {
        clearInterval(heartbeat);
        this.store.release(this.itOwner);
        this.runningIT = false;
        this.archive(message.id);
        this.store.save();
    }
}
