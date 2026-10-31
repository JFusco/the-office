import { projectOutbox } from './outbox';
import { PickupSchema } from '../delivery/intake/pickup';
import { z } from 'zod';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DATA } from '../office/config';
import { validTicket } from '../office/projects';
import { sanitize, sanitizeObject } from '../office/security';
import { ROLE_NAMES, type Role, type TeamMessage } from '../../src/shared';
import type { Engine } from '../scheduling/engine';
import type { Store } from '../store/store';
import { SlackRequestSchema } from './slack';
import { GoalReportSchema } from '../leadership/goal-reporting';
import { saveGoals, queueCTOHandoff, pumpCTO } from './cto-conversations';
import { queuedITMessage, pumpIT } from './it-conversations';
import { pump } from './team-conversation-pump';
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
    saveGoals(changes: z.infer<typeof GoalChangeSchema>[], role: Role, requestId: string, routed = false) { return saveGoals.call(this, changes, role, requestId, routed); }
    queueCTOHandoff(human: TeamMessage, reply: z.infer<typeof ReplySchema>) { return queueCTOHandoff.call(this, human, reply); }
    async pumpCTO() { return pumpCTO.call(this); }
    queuedITMessage(message: TeamMessage) { return queuedITMessage.call(this, message); }
    async pumpIT() { return pumpIT.call(this); }
    async pump(id?: string) { return pump.call(this, id); }
}
