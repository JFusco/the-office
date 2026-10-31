import { resolveProjectLabel } from '../store/migrations';
import { z } from 'zod';
import { sanitize } from '../office/security';
import { ROLE_NAMES, type Role, type TeamMessage } from '../../src/shared';
import { acceptedGoalReport } from '../leadership/goal-reporting';
import type { Conversations } from './conversations';
import { GoalChangeSchema, ReplySchema } from './conversations';

export function saveGoals(this: Conversations, changes: z.infer<typeof GoalChangeSchema>[], role: Role, requestId: string, routed = false) {
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

export function queueCTOHandoff(this: Conversations, human: TeamMessage, reply: z.infer<typeof ReplySchema>) {
    const id = `cto-handoff:${human.id}`;
    if (this.store.state.messages.some(m => m.id === id))
        return;
    const message: TeamMessage = { ...human, id, requestId: id, from: 'cto', to: 'pm', contextProject: this.store.project.id, body: `Avery's queued direction for ${this.store.project.name}: ${reply.reply}\nOriginal human request (context): ${human.body}`, ticket: '', actionId: '', status: 'queued', createdAt: new Date().toISOString(), sessionId: '', error: '', recipients: [], receipts: [], recheck: false };
    this.store.state.messages.push(message);
    this.store.emit('cto-handoff-queued', `Avery's direction is queued for Morgan in ${this.store.project.name}.`, 'pm');
}

export async function pumpCTO(this: Conversations) {
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
