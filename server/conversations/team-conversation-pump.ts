import { assertConversationReadback } from './conversation-recovery';
import { enqueueRequest } from '../scheduling/requests';
import { deferredPickup } from '../../src/work/pickup-state';
import { savePickup } from '../delivery/intake/pickup';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { sanitize } from '../office/security';
import { ROLE_NAMES, type TeamMessage } from '../../src/shared';
import { SlackMessages } from './slack';
import { acceptedGoalReport, permitsGoalEvidenceReturn, queueCompletedGoalEvidenceReport } from '../leadership/goal-reporting';
import type { Conversations } from './conversations';

export async function pump(this: Conversations, id?: string) {
    if (!id && this.store.state.messages.some(m => this.queuedITMessage(m)))
        return this.pumpIT();
    if (!id && !this.runningCTO && !this.engine.ctoAgents.active.size && this.store.state.messages.some(m => ['human', 'pm'].includes(m.from) && m.to === 'cto' && m.status === 'queued'))
        return this.pumpCTO();
    if (this.running || this.engine.busy || this.engine.agents.active.size || this.store.state.paused || this.store.state.intake.status === 'working' || this.store.state.nightlyDispatching)
        return;
    const message = this.store.state.messages.find(m => (m.from === 'human' || m.from === 'cto' || m.from === 'it') && !['cto', 'it'].includes(m.to) && m.status === 'queued' && (!id || m.id === id));
    if (!message || !this.store.claim(this.owner))
        return;
    this.running = true;
    this.engine.busy = true;
    const heartbeat = setInterval(() => this.store.claim(this.owner), 20000);
    message.status = 'working';
    this.store.emit('message-started', `${ROLE_NAMES[message.to]} is reading your message.`, message.to, message.ticket);
    let shouldRecheck = false;
    try {
        const slack = new SlackMessages(this.store, this.engine.agents);
        const originalId = message.actionId.startsWith('message:') ? message.actionId.slice(8) : '';
        const unresolved = (this.store.state.slackDeliveries || []).filter(d => d.requestId === originalId && d.status === 'uncertain');
        // Outbox replies reconcile the original effect; they never enter the send path.
        if (unresolved.length) {
            for (const delivery of unresolved)
                await slack.verify(delivery);
            message.sessionId = this.store.state.agents.find(a => a.id === 'pm')?.sessionId || '';
            this.record({ ...message, id: crypto.randomUUID(), from: 'pm', body: 'I read back the original Slack delivery. It is confirmed; no additional message was sent.', status: 'answered', recheck: false, receipts: [{ id: crypto.randomUUID(), action: 'conversation-readback', target: originalId, verified: true, uncertain: false, detail: 'Original Slack message independently read back.' }, ...unresolved.map(d => ({ id: d.id, action: 'slack-send', target: d.permalink, verified: true, uncertain: false, detail: `Verified Slack delivery to ${d.targetName}` }))] });
            message.status = 'answered';
            this.store.emit('message-answered', 'Morgan confirmed the original Slack delivery.', 'pm');
            return;
        }
        if (deferredPickup(this.store.state, message.ticket) && /^(assignment:|question:)/.test(message.actionId)) {
            this.record({ ...message, id: crypto.randomUUID(), from: 'pm', to: 'pm', body: `${message.ticket}'s earlier intake follow-up is deferred. No approval or new team work is due. It will wait for the configured pickup status or an explicit Start.`, status: 'answered', createdAt: new Date().toISOString(), recipients: [], receipts: [], recheck: false, error: '', question: '' });
            message.status = 'answered';
            this.store.emit('message-deferred', `${message.ticket}: stale intake follow-up closed; backlog remains deferred.`, 'pm', message.ticket);
            return;
        }
        if (message.to === 'pm' && message.recheck && message.actionId.startsWith('maintenance:')) {
            // The read-back is the requested work. Do not spend a separate model
            // turn discussing it before dispatching the same reconciliation.
            const run = await this.engine.maintenance.reconcile(message.actionId.slice(12));
            const result = run.steps.at(-1)?.result;
            this.record({ ...message, id: crypto.randomUUID(), from: 'pm', to: 'pm', body: run.status === 'reconciled' ? `Original maintenance effects reconciled. ${result?.summary || ''} Unfinished work remains in the ledger; this does not claim checkpoint completion.` : `Maintenance still needs follow-up. ${run.error}`, status: 'answered', createdAt: new Date().toISOString(), recipients: [], receipts: result?.receipts || [], recheck: false, error: '', question: '' });
            message.status = 'answered';
            this.store.emit('message-answered', 'Morgan read back the original maintenance run.', 'pm');
            return;
        }
        if (message.to === 'it' && message.recheck)
            await this.checkIT?.();
        const reply = await this.engine.agents.followup(message.to, message);
        assertConversationReadback(message, reply);
        if (message.to === 'it' && (reply.notifyRoles.some(r => r !== 'pm') || reply.goalChanges.length || reply.slackRequests.length || reply.notes.length || reply.pickupChange))
            throw new Error('IT chat may report operational findings to Morgan, but cannot change delivery, goals, logins or external services');
        message.sessionId = this.store.state.agents.find(a => a.id === message.to)?.sessionId || '';
        const goalReport = message.to === 'pm' ? acceptedGoalReport(this.store, reply.goalReport) : null;
        const evidenceReply = message.to === 'pm' && message.from === 'cto' && message.goalEvidenceRequest?.projectId === this.store.project.id;
        const goalReturn = message.to === 'pm' && !!goalReport && permitsGoalEvidenceReturn(this.store, message);
        if (evidenceReply && (reply.goalChanges.length || reply.pickupChange || reply.slackRequests.length || reply.notifyRoles.some(role => role !== 'cto') || !goalReport || goalReport.goalIds.length !== message.goalEvidenceRequest!.goalIds.length || goalReport.goalIds.some(id => !message.goalEvidenceRequest!.goalIds.includes(id)))) throw new Error('Goal evidence follow-up requires an owning-project report and cannot change goals, delivery or providers');
        const answer: TeamMessage = { ...message, id: crypto.randomUUID(), from: message.to, to: message.to, body: reply.reply, status: 'answered', createdAt: new Date().toISOString(), recipients: goalReturn ? ['cto'] : message.from === 'human' ? [...new Set(reply.notifyRoles)].filter(r => r !== message.to) : [], receipts: reply.receipts, recheck: false, error: '', question: reply.question };
        if (message.to === 'pm' && !goalReport) answer.recipients = answer.recipients.filter(role => role !== 'cto');
        if (goalReport) answer.goalReport = goalReport;
        this.record(answer);
        if (message.to === 'cto' && answer.recipients.some(r => r !== 'pm'))
            throw new Error('CTO Office direction must go through Morgan');
        if (reply.receipts.some(r => !r.verified || r.uncertain))
            throw new Error('A ticket update could not be verified. Read back the saved session before another instruction; the update will not be replayed.');
        this.saveGoals(reply.goalChanges, message.to, message.id);
        if (reply.pickupChange) {
            if (message.to !== 'pm')
                throw new Error('Pickup configuration belongs to Morgan');
            savePickup(this.store, reply.pickupChange);
        }
        if (reply.slackRequests.length) {
            if (message.to !== 'pm' || reply.question)
                throw new Error('Only Morgan can deliver a fully resolved Slack request');
            const delivery = await slack.send(message.id, reply.slackRequests[0]);
            this.record({ ...answer, id: crypto.randomUUID(), body: `Sent to ${delivery.targetName} on Slack. I read the message back to verify delivery.`, recipients: [], receipts: [{ id: delivery.id, action: 'slack-send', target: delivery.permalink, verified: true, uncertain: false, detail: `Verified Slack delivery to ${delivery.targetName}` }], sessionId: this.store.state.agents.find(a => a.id === 'pm')?.sessionId || '' });
        }
        if (message.to === 'pm' && reply.notes.length) {
            for (const note of reply.notes)
                this.store.state.projectNotes.push({ id: crypto.randomUUID(), ticket: message.ticket, ...note, requestId: message.id, createdAt: new Date().toISOString() });
            const path = resolve(this.artifactsRoot, 'project-notes.md');
            writeFileSync(path, '# Office project notes\n\n' + this.store.state.projectNotes.map(n => `## ${n.summary}\n\n${n.detail}\n\n${n.ticket || 'Office'} · ${n.createdAt} · Request ${n.requestId}\n`).join('\n'), { mode: 0o600 });
            answer.receipts.push({ id: crypto.randomUUID(), action: 'project-note', target: path, verified: true, uncertain: false, detail: `Saved ${reply.notes.length} project note${reply.notes.length === 1 ? '' : 's'}` });
            this.store.emit('project-notes-updated', 'Morgan updated the project notes.', 'pm', message.ticket);
        }
        if (['pm', 'cto', 'it'].includes(message.to))
            for (const role of answer.recipients) {
                if (this.store.state.paused)
                    throw new Error('Office paused during the handoff. Read the saved conversation before continuing.');
                this.store.state.lastHandoff = { at: new Date().toISOString(), from: message.to, to: role, ticket: message.ticket || 'Team message' };
                if (message.to === 'pm' && role === 'cto') {
                    this.store.state.leadershipReports ??= [];
                    this.store.state.leadershipReports.push({ id: crypto.randomUUID(), requestId: message.id, summary: reply.reply, ticket: message.ticket, createdAt: new Date().toISOString() });
                }
                this.store.emit('message-handoff', `${ROLE_NAMES[message.to]} passed your message to ${ROLE_NAMES[role]}.`, role, message.ticket);
                if (role === 'cto') {
                    if (goalReturn) continue; // Queue only after this original PM request is durably complete.
                    const id = `pm-report:${message.id}`;
                    if (!this.store.state.messages.some(m => m.id === id))
                        this.store.state.messages.push({ ...message, id, requestId: id, to: 'cto', ticket: '', from: 'pm', contextProject: this.store.project.id, goalReport: goalReport!, actionId: '', recheck: false, recipients: [], receipts: [], sessionId: '', error: '', body: `Goal update for ${this.store.project.name}: ${goalReport!.summary}\nOwning project: ${this.store.project.id}. Goal IDs: ${goalReport!.goalIds.join(', ')}. Use only this project's delivery and PR evidence to assess these goals.\nJoe's request (context): ${message.body}`, status: 'queued', createdAt: new Date().toISOString() });
                    continue;
                }
                const response = await this.engine.agents.followup(role, message, reply.reply);
                this.saveGoals(response.goalChanges, role, message.id);
                this.record({ ...answer, id: crypto.randomUUID(), from: role, to: 'pm', body: response.reply, recipients: [], receipts: response.receipts, question: response.question, sessionId: this.store.state.agents.find(a => a.id === role)?.sessionId || '', createdAt: new Date().toISOString() });
            }
        message.status = 'answered';
        if (goalReturn && answer.recipients.includes('cto')) queueCompletedGoalEvidenceReport(this.store, message.id);
        shouldRecheck = message.recheck && message.to !== 'it';
        this.store.emit('message-answered', `${ROLE_NAMES[message.to]} handled your message${answer.recipients.length ? ' and informed the team' : ''}.`, message.to, message.ticket);
    }
    catch (e) {
        message.status = 'failed';
        message.error = sanitize(String(e));
        message.sessionId = this.store.state.agents.find(a => a.id === message.to)?.sessionId || '';
        this.store.emit('message-failed', message.error, message.to, message.ticket);
    }
    finally {
        clearInterval(heartbeat);
        this.store.release(this.owner);
        this.engine.busy = false;
        this.running = false;
        this.archive(message.requestId);
        this.store.save();
    }
    if (shouldRecheck && !this.store.state.paused) {
        if (message.ticket && this.store.state.tickets.find(t => t.key === message.ticket && t.pilot && t.activity === 'blocked'))
            this.engine.requestDelivery(message.ticket, 'resume-ticket');
        else if (message.actionId.startsWith('maintenance:'))
            enqueueRequest(this.store, 'reconcile-maintenance', message.actionId.slice(12));
        else if (message.actionId === 'intake')
            this.engine.requestMail();
        else
            enqueueRequest(this.store, 'refresh');
    }
}
