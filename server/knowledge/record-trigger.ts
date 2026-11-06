import type { PendingRetrospective, RetrospectiveSubjectKind, RetrospectiveTrigger, Ticket, TicketJob } from '../../src/shared';
import type { Store } from '../store/store';
import { ciBudgetId, parkedId, repairBudgetId, ticketParkedId } from './retrospective-triggers';

const clip = (text: string, limit = 500) => text.length <= limit ? text : `${text.slice(0, limit)}…`;

/**
 * Local, idempotent bookkeeping for a retrospective trigger. No provider calls and no delivery state;
 * the caller's existing save persists it.
 */
export function recordTrigger(store: Store, entry: { id: string; jobId: string; key: string; trigger: RetrospectiveTrigger; subject?: RetrospectiveSubjectKind; event: PendingRetrospective['event'] }): void {
    const knowledge = store.state.knowledge;
    if (!knowledge) return;
    if (knowledge.consumed.includes(entry.id) || knowledge.pending.some(pending => pending.id === entry.id)) return;
    if (!knowledge.enabled) { knowledge.consumed.push(entry.id); return; }
    knowledge.pending.push({ ...entry, subject: entry.subject || 'job', event: { ...entry.event, reason: clip(entry.event.reason) }, createdAt: store.clock.now().toISOString(), attempts: 0, nextAt: '', lastError: '' });
}

type JobLike = Pick<TicketJob, 'id' | 'key' | 'head' | 'steps'> & Partial<Pick<TicketJob, 'stage' | 'repairCycle' | 'ciRepairs'>>;
/** CEC calls the shared repair helpers with `id: runId`; a GitHub job id is a bare UUID. */
const subjectOf = (store: Store, id: string): RetrospectiveSubjectKind => store.state.tickets.some(ticket => ticket.runId === id) ? 'ticket' : 'job';

export function recordParked(store: Store, job: JobLike, reason: string): void {
    recordTrigger(store, { id: parkedId(job), jobId: job.id, key: job.key, trigger: 'parked', event: { stage: job.stage || '', head: job.head, steps: job.steps.length, reason } });
}

/** CEC: the ticket moved to Jira Blocked for a decision. */
export function recordTicketParked(store: Store, ticket: Ticket): void {
    if (!ticket.runId || !ticket.parked) return;
    recordTrigger(store, { id: ticketParkedId(ticket), jobId: ticket.runId, key: ticket.key, trigger: 'parked', subject: 'ticket', event: { stage: ticket.parked.stage, head: ticket.commit, steps: Object.keys(ticket.results).length, reason: ticket.parked.reason } });
}

export function recordRepairBudget(store: Store, job: JobLike): void {
    const cycle = job.repairCycle;
    if (!cycle?.diagnosisRequestId) return;
    recordTrigger(store, { id: repairBudgetId(job, cycle), jobId: job.id, key: job.key, trigger: 'repair-budget', subject: subjectOf(store, job.id), event: { stage: cycle.sourceStage, head: cycle.sourceHead, steps: job.steps.length, reason: `Source repair window exhausted (attempts ${cycle.attempts}, approach revision ${cycle.approachRevision ?? 0}); findings ${cycle.pendingFindingIds.join(', ')}` } });
}

export function recordCIBudget(store: Store, job: JobLike): void {
    const last = job.ciRepairs?.at(-1);
    if (!last) return;
    recordTrigger(store, { id: ciBudgetId(job, last), jobId: job.id, key: job.key, trigger: 'repair-budget', event: { stage: job.stage || 'ci-recovery', head: job.head, steps: job.steps.length, reason: `CI repair budget exhausted after ${job.ciRepairs!.length} attempts` } });
}

/** Brain continuation: the bounded technical repair rounds ran out. */
export function recordTechnicalBudget(store: Store, job: TicketJob): void {
    const continuation = job.implementationContinuation;
    if (!continuation) return;
    recordTrigger(store, { id: `${job.id}:repair-budget:technical:${continuation.scopeSha256}:${continuation.round}`, jobId: job.id, key: job.key, trigger: 'repair-budget', event: { stage: job.stage, head: job.head, steps: job.steps.length, reason: `Technical repair budget exhausted after ${continuation.round} of ${continuation.maxRounds} rounds` } });
}

/** Brain continuation: the bounded offline source-configuration proposals ran out. */
export function recordSourceConfigBudget(store: Store, job: TicketJob): void {
    const config = job.implementationContinuation?.sourceConfig;
    if (!config) return;
    recordTrigger(store, { id: `${job.id}:repair-budget:source-config:${config.originalWorkId}:${config.sourceId}`, jobId: job.id, key: job.key, trigger: 'repair-budget', event: { stage: job.stage, head: job.head, steps: job.steps.length, reason: `Source-configuration budget exhausted for ${config.sourceId} after ${config.attempts} of ${config.maxAttempts} proposals` } });
}
