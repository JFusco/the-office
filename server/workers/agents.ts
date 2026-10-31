import { REPAIR_DIAGNOSIS } from '../delivery/repairs/delivery-repairs';
import { slackSendPrompt, slackVerifyPrompt } from '../conversations/prompts/slack';
import { itChatPrompt, ctoChatPrompt, cecChatPrompt } from '../conversations/prompts/conversations';
import { cecIntakePrompt, cecReadbackPrompt, cecTransitionPrompt, cecReconcilePrompt } from '../cec/prompts/cec-reads';
import { PrerequisitesSchema } from '../delivery/pipeline/dependencies';
import { cecPrompt } from '../cec/prompts/cec';
export { stageInstructions } from '../cec/prompts/cec';
import { WorkerRuntime } from './worker-runtime';
import { deferredPickup } from '../../src/pickup-state';
import { shortSummary } from '../../src/work-summary';
import { PICKUP_CHAT } from '../delivery/intake/pickup';
import { assertStrictOutputSchema, completedOutput } from './structured-output';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { z } from 'zod';
import { command } from './process';
import { DATA, ROOT, CEC, SKILLS } from '../office/config';
import { sanitize, sanitizeObject } from '../office/security';
import type { Store } from '../store/store';
import { ReplySchema, ConversationResultSchema } from '../conversations/conversations';
import { GOAL_REPORT_GUIDANCE, goalReportContext } from '../leadership/goal-reporting';
import { SlackResultSchema, SlackVerificationSchema } from '../conversations/slack';
import { claudeArguments, ClaudeStream, DEVELOPER_MODEL, DEVELOPER_EFFORT } from './claude';
import type { Role, Stage, Ticket, TeamMessage, SlackDelivery, StageResult } from '../../src/shared';
import { timeReport } from '../../src/timing';
import { ApproachSchema, APPROACH_GUIDANCE, reviewInstructions } from '../delivery/pipeline/approach';
import { contextPacket, PROJECTS, type OfficeCapacity } from '../office/projects';
import { githubFollowupPrompt, canFileGithubIssue, GITHUB_ISSUE_SKILL } from '../github/github-context';
import { workerActivity, toolActivity } from './activity';
const EvidenceSchema = z.object({ id: z.string(), kind: z.enum(['screenshot', 'browser', 'checks', 'review', 'provider', 'deployment', 'jira', 'pr']), summary: z.string(), path: z.string(), commit: z.string(), environment: z.string(), url: z.string(), observedAt: z.string() }).strict();
const ReceiptSchema = z.object({ id: z.string(), action: z.string(), target: z.string(), verified: z.boolean(), uncertain: z.boolean(), detail: z.string() }).strict();
export const LegacyResultSchema = z.object({ outcome: z.enum(['passed', 'failed', 'blocked', 'reroute']), prerequisites: PrerequisitesSchema, approach: ApproachSchema.nullable(), summary: z.string(), commit: z.string(), evidence: z.array(EvidenceSchema), findings: z.array(z.object({ id: z.string(), summary: z.string(), expected: z.string(), actual: z.string(), status: z.enum(['open', 'fixed', 'verified']), attempts: z.number().int().min(0) }).strict()), receipts: z.array(ReceiptSchema), previewUrl: z.string(), worktree: z.string(), branch: z.string(), prId: z.number().int(), qaRunDir: z.string(), paidRuns: z.number().int().min(0).nullable(), blocker: z.string() }).strict();
export const ResolutionSchema = z.object({ kind: z.enum(['source-repair', 'conflict-repair', 'provider-wait', 'permission', 'scope', 'human-hold', 'uncertain-effect']), findingIds: z.array(z.string()).max(32), evidenceIds: z.array(z.string()).min(1).max(16) }).strict();
export const FreshResultSchema = LegacyResultSchema.extend({ resolution: ResolutionSchema.nullable() }).strict();
// Historical provider bytes remain historical: parsing never inserts a resolution field.
export const ResultSchema = z.union([FreshResultSchema, LegacyResultSchema]);
const RESOLUTION_GUIDANCE = `RESOLUTION CLASSIFICATION: Return resolution=null on success or when you cannot establish a precise classification. For a recoverable scoped source/check/review defect, return kind=source-repair with EVERY unresolved finding ID and saved diagnostic evidence IDs. For a published lead-pr assessment whose EVERY open finding is only integration conflict with the target branch, use kind=conflict-repair with every open finding ID and saved diagnostic evidence IDs. Any unrelated source defect, permission, service, uncertain effect, hold or acceptance question forbids conflict-repair; mixed technical findings remain source-repair. This proposes a repair; the harness owns dispatch and budgets. Actual permission denials, unavailable services, unresolved scope/acceptance decisions, explicit human holds and uncertain writes must use their corresponding kind; never label them source-repair. Preserve original findings and receipts. A failed read is evidence, never an uncertain mutation. Do not repeatedly ask Joe for ordinary code repairs already within this ticket's scope.`;
const IntakeSchema = z.object({ tickets: z.array(z.object({ key: z.string(), summary: z.string(), type: z.string(), status: z.string(), statusId: z.string(), assignee: z.string(), subtask: z.boolean(), boardMember: z.boolean(), url: z.string(), updated: z.string() }).strict()), summary: z.string(), complete: z.boolean(), blocker: z.string() }).strict();
const ReadbackSchema = z.object({ key: z.string(), assignee: z.string(), subtask: z.boolean(), boardMember: z.boolean(), status: z.string(), statusId: z.string(), updated: z.string(), existingPrId: z.number().int(), existingOwner: z.string(), blocker: z.string() }).strict();
export class Agents extends WorkerRuntime {
    override async run<T>(role: Role, task: string, schema: z.ZodType<T>, opts: Parameters<WorkerRuntime['run']>[3] = {}): Promise<T> {
        // Native workers receive one strict object schema; legacy parsing is only for saved results.
        return super.run(role, Object.is(schema, ResultSchema) ? `${task}\n${RESOLUTION_GUIDANCE}` : task,
            Object.is(schema, ResultSchema) ? FreshResultSchema as unknown as z.ZodType<T> : schema, opts);
    }
    ctoContext: () => unknown = () => ({ projects: [{ project: this.store.project, goals: this.store.state.goals, notes: this.store.state.projectNotes }] });
    async sendSlack(delivery: SlackDelivery, human: Pick<TeamMessage, 'body' | 'ticket' | 'requestId'>) {
        return this.run('pm', slackSendPrompt(this.store, delivery, human), SlackResultSchema, { readOnly: true, slackSend: true, ticket: human.ticket, stage: 'slack-send', requestId: human.requestId, timeout: 10 * 60 * 1000 });
    }
    async verifySlack(delivery: SlackDelivery) {
        return this.run('pm', slackVerifyPrompt(this.store, delivery), SlackVerificationSchema, { readOnly: true, stage: 'slack-verify', requestId: delivery.requestId, ticket: this.store.state.messages.find(m => m.id === delivery.requestId)?.ticket || '', timeout: 10 * 60 * 1000 });
    }
    async followup(role: Role, message: TeamMessage, brief = '') {
        const guidance = `\n${GOAL_REPORT_GUIDANCE}`;
        if (role === 'it')
            return this.run('it', itChatPrompt(this.store, message, brief) + guidance, ConversationResultSchema, { readOnly: true, ticket: message.ticket, stage: 'conversation', requestId: message.requestId, enqueuedAt: brief ? undefined : message.createdAt, timeout: 15 * 60 * 1000 });
        if (role === 'cto')
            return this.run('cto', ctoChatPrompt(this.store, message, goalReportContext(this.ctoContext(), message, this.store.project.id), brief) + guidance, ConversationResultSchema, { cwd: message.from === 'pm' ? this.store.project.repo : ROOT, readOnly: true, crossProjectRead: message.from !== 'pm', ticket: message.ticket, stage: 'conversation', requestId: message.requestId, enqueuedAt: brief ? undefined : message.createdAt, timeout: 15 * 60 * 1000 });
        if (this.store.project.provider === 'github')
            return this.run(role, githubFollowupPrompt(this.store, role, message, brief) + guidance, ConversationResultSchema, { cwd: this.store.project.repo, ticket: message.ticket, stage: deferredPickup(this.store.state, message.ticket) ? 'deferred-conversation' : message.actionId ? 'conversation-readback' : 'conversation', requestId: message.requestId, enqueuedAt: brief ? undefined : message.createdAt, readOnly: !canFileGithubIssue(role, message, brief), effortKind: canFileGithubIssue(role, message, brief) || message.actionId.startsWith('message:') ? 'administrative' : undefined, timeout: 15 * 60 * 1000 });
        const ticket = message.ticket ? this.store.ticket(message.ticket) : null;
        const history = this.store.state.messages.filter(m => m.id !== message.id && (message.ticket ? m.ticket === message.ticket : !m.ticket)).slice(-24);
        return this.run(role, cecChatPrompt(this.store, role, message, brief, ticket, history) + guidance, ConversationResultSchema, { ticket: message.ticket, stage: 'conversation', requestId: message.requestId, enqueuedAt: brief ? undefined : message.createdAt, readOnly: role !== 'pm' || !ticket, timeout: 15 * 60 * 1000 });
    }
    async intake() {
        return this.run('pm', cecIntakePrompt(this.store), IntakeSchema, { readOnly: true, stage: 'intake', timeout: 15 * 60 * 1000 });
    }
    async readback(key: string) {
        return this.run('pm', cecReadbackPrompt(this.store, key), ReadbackSchema, { readOnly: true, stage: 'readback', timeout: 15 * 60 * 1000, ticket: key });
    }
    async stage(ticket: Ticket, stage: Stage, role: Role): Promise<StageResult> {
        const artifactRoot = resolve(DATA, 'runs', ticket.runId);
        mkdirSync(artifactRoot, { recursive: true, mode: 0o700 });
        const prompt = cecPrompt(this.store, ticket, stage, role, artifactRoot) + (ticket.repairCycle?.phase === 'diagnosis' && stage === 'code-review' ? `\n${REPAIR_DIAGNOSIS}` : '');
        const artifactOnly = ['plan', 'plan-review', 'code-review', 'repair-review', 'ci-diagnose'].includes(stage);
        return this.run(role, prompt, ResultSchema, { ticket: ticket.key, stage, artifactsRoot: artifactRoot, cwd: artifactOnly ? artifactRoot : ticket.worktree || ROOT });
    }
    async transition(ticket: Ticket, target: string): Promise<StageResult> {
        return this.run('pm', cecTransitionPrompt(this.store, ticket, target), ResultSchema, { ticket: ticket.key, stage: 'transition' });
    }
    async reconcile(ticket: Ticket): Promise<StageResult> {
        return this.run('pm', cecReconcilePrompt(this.store, ticket), ResultSchema, { ticket: ticket.key, stage: 'reconcile', readOnly: true });
    }
}
