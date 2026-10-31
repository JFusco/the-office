import { assertConversationReadback } from './conversation-recovery';
import { projectOutbox } from './outbox';
import { resolveProjectLabel } from './migrations';
import { enqueueRequest } from './requests';
import { deferredPickup } from '../src/pickup-state';
import { PickupSchema, savePickup } from './pickup';
import { z } from 'zod';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DATA } from './config';
import { validTicket } from './projects';
import { sanitize, sanitizeObject } from './security';
import { ROLE_NAMES, type Role, type TeamMessage } from '../src/shared';
import type { Engine } from './engine';
import type { Store } from './store';
import { SlackMessages, SlackRequestSchema } from './slack';
import { GoalReportSchema, acceptedGoalReport, permitsGoalEvidenceReturn, queueCompletedGoalEvidenceReport } from './goal-reporting';
export const MessageInput = z.object({ id: z.string().uuid(), role: z.enum(['pm', 'developer', 'lead', 'qa', 'cto', 'it']).default('pm'), ticket: z.string().regex(/^((CEC|GH)-\d+)?$/).default(''), actionId: z.string().max(200).default(''), body: z.string().trim().min(1).max(6000), recheck: z.boolean().default(false) }).strict();
export const GoalChangeSchema = z.object({ id: z.string(), expectedUpdatedAt: z.string(), project: z.string().min(1).max(80), title: z.string().min(1).max(200), detail: z.string().max(6000), priority: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]), status: z.enum(['idea', 'planned', 'active', 'blocked', 'done']) }).strict();
export const ReplySchema = z.object({ handoffProject: z.string(), pickupChange: PickupSchema.nullable(), reply: z.string().min(1), notifyRoles: z.array(z.enum(['pm', 'developer', 'lead', 'qa', 'cto', 'it'])).max(4), question: z.string(), goalChanges: z.array(GoalChangeSchema).max(12), slackRequests: z.array(SlackRequestSchema).max(1), notes: z.array(z.object({ summary: z.string().min(1), detail: z.string().min(1) }).strict()).max(8), receipts: z.array(z.object({ id: z.string(), action: z.string(), target: z.string(), verified: z.boolean(), uncertain: z.boolean(), detail: z.string() }).strict()) }).strict();
// Fresh workers require the nullable field; historic replies retain their original shape.
export const ConversationResultSchema: z.ZodType<z.infer<typeof ReplySchema> & { goalReport?: z.infer<typeof GoalReportSchema> | null }> = ReplySchema.extend({ goalReport: GoalReportSchema.nullable() });
export class Conversations {
    runningIT = false;
    itOwner = `it-chat-${crypto.randomUUID()}`;
    runningCTO = false;
    ctoOwner = `cto-chat-${crypto.randomUUID()}`;
    projectOffice?: (name: string) => Conversations;
    goalOffice?: (goalId: string) => Conversations;
    checkIT?: () => Promise<void>;
    running = false;
    owner = `conversation-${crypto.randomUUID()}`;
    constructor(public store: Store, public engine: Engine, public artifactsRoot = DATA) { }
    enqueue(input: unknown) {
        const data = MessageInput.parse(input), old = this.store.state.messages.find(m => m.id === data.id);
        if (old) {
            if (old.from !== 'human' || old.body !== sanitize(data.body) || old.to !== data.role || old.ticket !== data.ticket || old.actionId !== data.actionId || old.recheck !== data.recheck)
                throw new Error('Message ID already belongs to a different request');
            return old;
        }
        if (data.ticket) {
            if (!validTicket(this.store.project, data.ticket))
                throw new Error('Ticket belongs to another project');
            this.store.ticket(data.ticket);
        }
        if (data.actionId) {
            const action = projectOutbox(this.store.state).find(a => a.id === data.actionId);
            if (!action || action.ticket !== data.ticket)
                throw new Error('Outbox item does not match this conversation');
            if (action.status !== 'open')
                throw new Error('This outbox item is already resolved. Refresh the outbox before replying.');
        }
        if (this.store.state.messages.filter(m => m.status === 'queued' && m.from === 'human').length >= 20)
            throw new Error('There are already 20 messages waiting for the team');
        const m: TeamMessage = { id: data.id, requestId: data.id, from: 'human', to: data.role, ticket: data.ticket, actionId: data.actionId, body: sanitize(data.body), status: 'queued', createdAt: new Date().toISOString(), sessionId: '', recheck: data.recheck, error: '', recipients: [], receipts: [] };
        this.store.state.messages.push(m);
        this.store.emit('message-queued', `Your message is waiting for ${ROLE_NAMES[m.to]}.`, m.to, m.ticket);
        return m;
    }
    record(message: TeamMessage) {
        this.store.state.messages.push(message);
        this.store.emit('team-reply', `${ROLE_NAMES[message.from as Role]} replied${message.ticket ? ` about ${message.ticket}` : ''}.`, message.from as Role, message.ticket);
    }
    archive(requestId: string) {
        const dir = resolve(this.artifactsRoot, 'conversations');
        mkdirSync(dir, { recursive: true, mode: 0o700 });
        writeFileSync(resolve(dir, `${requestId}.json`), JSON.stringify(sanitizeObject(this.store.state.messages.filter(m => m.requestId === requestId)), null, 2), { mode: 0o600 });
    }
    saveGoals(changes: z.infer<typeof GoalChangeSchema>[], role: Role, requestId: string, routed = false) {
        if (!routed && role === 'cto' && this.projectOffice) {
            const groups = new Map<Conversations, typeof changes>();
            for (const change of changes) {
                const office = change.id && this.goalOffice ? this.goalOffice(change.id) : this.projectOffice(change.project);
                if (!office)
                    throw new Error('Goal project is not configured');
                groups.set(office, [...(groups.get(office) || []), change]);
            }
            // Validate all versions before saving any project's goals.
            for (const [office, items] of groups)
                for (const change of items)
                    if (change.id) {
                        const goal = office.store.state.goals?.find(g => g.id === change.id);
                        if (!goal || goal.updatedAt !== change.expectedUpdatedAt)
                            throw new Error('Goal changed or no longer exists; read it back before editing');
                    }
            for (const [office, items] of groups)
                office.saveGoals(items, role, requestId, true);
            return;
        }
        if (!changes.length)
            return;
        if (!['pm', 'cto'].includes(role))
            throw new Error('Goal changes belong to the PM or CTO Office');
        const goals = this.store.state.goals ??= [];
        for (const change of changes) {
            if (resolveProjectLabel(change.project)?.id !== this.store.project.id)
                throw new Error('Goal project label does not match its owning store');
            const goal = change.id ? goals.find(g => g.id === change.id) : undefined;
            if (change.id && (!goal || goal.updatedAt !== change.expectedUpdatedAt))
                throw new Error('Goal changed or no longer exists; read it back before editing');
        }
        for (const change of changes) {
            const goal = change.id ? goals.find(g => g.id === change.id) : undefined;
            const { expectedUpdatedAt, ...fields } = change;
            const next = { ...fields, projectId: this.store.project.id, mapping: 'mapped' as const, id: goal?.id || crypto.randomUUID(), updatedAt: new Date(Math.max(Date.now(), goal ? Date.parse(goal.updatedAt) + 1 : 0)).toISOString(), requestId };
            if (goal)
                Object.assign(goal, next);
            else
                goals.push(next);
        }
        this.store.emit('goals-updated', `${ROLE_NAMES[role]} updated ${changes.length} project goal${changes.length === 1 ? '' : 's'}.`, role);
    }
    queueCTOHandoff(human: TeamMessage, reply: z.infer<typeof ReplySchema>) {
        const id = `cto-handoff:${human.id}`;
        if (this.store.state.messages.some(m => m.id === id))
            return;
        const message: TeamMessage = { ...human, id, requestId: id, from: 'cto', to: 'pm', contextProject: this.store.project.id, body: `Avery's queued direction for ${this.store.project.name}: ${reply.reply}\nOriginal human request (context): ${human.body}`, ticket: '', actionId: '', status: 'queued', createdAt: new Date().toISOString(), sessionId: '', error: '', recipients: [], receipts: [], recheck: false };
        this.store.state.messages.push(message);
        this.store.emit('cto-handoff-queued', `Avery's direction is queued for Morgan in ${this.store.project.name}.`, 'pm');
    }
    async pumpCTO() {
        const agents = this.engine.ctoAgents;
        if (this.runningCTO || agents.active.size || this.store.state.paused)
            return;
        const message = this.store.state.messages.find(m => ['human', 'pm'].includes(m.from) && m.to === 'cto' && m.status === 'queued');
        if (!message || !this.store.claim(this.ctoOwner, Date.now(), 'cto-chat'))
            return;
        this.runningCTO = true;
        const heartbeat = setInterval(() => this.store.claim(this.ctoOwner, Date.now(), 'cto-chat'), 20000);
        message.status = 'working';
        this.store.emit('message-started', 'Avery is reading your message.', 'cto', message.ticket);
        try {
            if (message.from === 'pm' && !acceptedGoalReport(this.store, message.goalReport)) {
                message.status = 'answered';
                this.store.emit('cto-report-skipped', 'Routine delivery report retained in history; no mapped goal update was supplied.', 'pm', message.ticket);
                return;
            }
            const reply = await agents.followup('cto', message);
            if (reply.receipts.some(r => r.uncertain || !r.verified) || reply.slackRequests.length || reply.pickupChange)
                throw new Error('CTO chat cannot perform external actions or change PM pickup settings');
            if (reply.notifyRoles.some(r => r !== 'pm'))
                throw new Error('CTO direction must go through Morgan');
            if (message.goalEvidenceRequest || message.goalEvidenceReturn) {
                if (reply.goalChanges.length) throw new Error('Evidence follow-up cannot change human goals');
                reply.notifyRoles = []; // The requested PM answer ends this evidence exchange.
            }
            this.saveGoals(reply.goalChanges, 'cto', message.id);
            if (reply.notifyRoles.includes('pm')) {
                const target = this.projectOffice ? this.projectOffice(reply.handoffProject) : this;
                if (!target || !reply.handoffProject && this.projectOffice)
                    throw new Error('Morgan handoff needs a configured project');
                target.queueCTOHandoff(message, reply);
            }
            const saved = reply.goalChanges.length ? `\n\nSaved ${reply.goalChanges.length} item${reply.goalChanges.length === 1 ? '' : 's'} in Goals & Ideas: ${[...new Set(reply.goalChanges.map(g => g.project))].join(', ')}.` : '';
            this.record({ ...message, id: crypto.randomUUID(), from: 'cto', body: reply.reply + saved, status: 'answered', createdAt: new Date().toISOString(), sessionId: this.store.state.agents.find(a => a.id === 'cto')?.sessionId || '', recipients: reply.notifyRoles, receipts: reply.receipts, error: '', question: reply.question });
            message.status = 'answered';
            message.sessionId = this.store.state.agents.find(a => a.id === 'cto')?.sessionId || '';
            this.store.emit('message-answered', 'Avery replied.', 'cto', message.ticket);
        }
        catch (error) {
            message.status = 'failed';
            message.error = sanitize(String(error));
            this.store.emit('message-failed', message.error, 'cto', message.ticket);
        }
        finally {
            clearInterval(heartbeat);
            this.store.release(this.ctoOwner);
            this.runningCTO = false;
            this.archive(message.id);
            this.store.save();
        }
    }
    private queuedITMessage(message: TeamMessage) {
        return message.to === 'it' && message.status === 'queued' && (message.from === 'human' || message.from === 'pm' &&
            [...(this.store.state.coordination?.jobs || []), ...this.store.state.tickets].some(job => job.repairCycle?.diagnosisRequestId === message.id));
    }
    async pumpIT() {
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
    async pump(id?: string) {
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
}
