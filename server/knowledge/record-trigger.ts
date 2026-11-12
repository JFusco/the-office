import type { PendingRetrospective, RetrospectiveSubjectKind, RetrospectiveTrigger, Ticket, TicketJob } from '../../src/shared';
import type { Store } from '../store/store';
import { ciBudgetId, parkedId, repairBudgetId, ticketParkedId } from './retrospective-triggers';
import { isBlocking } from './blocking-trigger';

const clip = (text: string, limit = 500) => text.length <= limit ? text : `${text.slice(0, limit)}…`;

/**
 * Local, idempotent bookkeeping for a retrospective trigger. No provider calls and no delivery state;
 * the caller's existing save persists it.
 */
export function recordTrigger(store: Store, entry: { id: string; jobId: string; key: string; trigger: RetrospectiveTrigger; at?: string; subject?: RetrospectiveSubjectKind; event: PendingRetrospective['event'] }): void {
    const knowledge = store.state.knowledge;
    if (!knowledge) return;
    if (knowledge.consumed.includes(entry.id) || knowledge.pending.some(pending => pending.id === entry.id)) return;
    const subject = { kind: entry.subject || 'job' as const, id: entry.jobId };
    if (['job', 'ticket'].includes(subject.kind)) {
        const events = knowledge.deliveryEvents ??= [];
        const source = subject.kind === 'job' ? store.state.coordination?.jobs?.find(job => job.id === subject.id) : store.state.tickets.find(ticket => ticket.runId === subject.id);
        const job = subject.kind === 'job' ? store.state.coordination?.jobs?.find(job => job.id === subject.id) : undefined;
        const delivery = source ? { repairAttempts: source.repairCycle?.attempts || 0, reroutes: job ? job.steps.filter(step => step.result.outcome === 'reroute').length : (source as Ticket).routeChanges || 0, ciRepairs: job?.ciRepairs?.length || 0, timing: structuredClone(source.timing || []) } : undefined;
        if (!events.some(event => event.id === entry.id)) events.push({ ...entry, delivery, source: subject, subject: subject.kind, eventAt: entry.at || store.clock.now().toISOString(), attemptId: '', summary: entry.event.reason, lessonIds: [], at: store.clock.now().toISOString() });
    }
    if (!knowledge.enabled) { knowledge.consumed.push(entry.id); return; }
    const batch = knowledge.pending.find(item => item.trigger === 'learning' && !item.frozen && item.source?.kind === subject.kind && item.source.id === subject.id);
    if (batch) {
        batch.eventIds!.push(entry.id); batch.nextAt = '';
        if (isBlocking(entry.trigger)) batch.blockedBy = entry.trigger;
        batch.event = { ...entry.event, reason: clip(entry.event.reason) };
        knowledge.consumed.push(entry.id);
        return;
    }
    knowledge.pending.push({ ...entry, subject: entry.subject || 'job', event: { ...entry.event, reason: clip(entry.event.reason) }, createdAt: entry.at || store.clock.now().toISOString(), attempts: 0, nextAt: '', lastError: '' });
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
