import type { DeliveryRepairCycle, KnowledgeState, RetrospectiveSubjectKind, RetrospectiveTrigger, Ticket, TicketJob } from '../../src/shared';
import type { CIRepair } from '../../src/contracts/ci-repair';

type JobRef = Pick<TicketJob, 'id' | 'steps'>;

/**
 * Stable trigger identities. A subject id is a GitHub job UUID or a CEC run id (`cec-12-<uuid>`);
 * neither contains a colon, so the subject id is always the text before the first colon.
 */
export const completedId = (job: Pick<TicketJob, 'id'>) => `${job.id}:completed`;
export const retiredId = (job: Pick<TicketJob, 'id'>) => `${job.id}:retired`;
export const parkedId = (job: JobRef) => `${job.id}:parked:${job.steps.length}`;
export const ticketCompletedId = (ticket: Pick<Ticket, 'runId'>) => `${ticket.runId}:completed`;
export const ticketParkedId = (ticket: Pick<Ticket, 'runId'> & { parked?: { marker: string } }) => `${ticket.runId}:parked:${ticket.parked?.marker || ''}`;
export const repairBudgetId = (job: Pick<TicketJob, 'id'>, cycle: DeliveryRepairCycle) => `${job.id}:repair-budget:${cycle.diagnosisRequestId}:${cycle.approachRevision ?? 0}`;
export const ciBudgetId = (job: Pick<TicketJob, 'id'>, repair: Pick<CIRepair, 'id'>) => `${job.id}:repair-budget:ci:${repair.id}`;
export const triggerJobId = (id: string) => id.split(':')[0];

/** Every trigger a GitHub job's current state already represents. Used only to baseline, so over-inclusion is harmless. */
export function visibleTriggerIds(jobs: TicketJob[]): string[] {
    return jobs.flatMap(job => [
        job.status === 'completed' ? completedId(job) : '',
        job.status === 'cancelled' ? retiredId(job) : '',
        job.parked?.published ? parkedId(job) : '',
        job.repairCycle?.phase === 'diagnosis' && job.repairCycle.diagnosisRequestId ? repairBudgetId(job, job.repairCycle) : '',
        ...(job.ciRepairs || []).map(repair => ciBudgetId(job, repair)),
    ].filter(Boolean));
}

/** The CEC equivalent: completed pilot runs, published Jira Blocked parks and exhausted repair windows. */
export function visibleTicketTriggerIds(tickets: Ticket[]): string[] {
    return tickets.filter(ticket => ticket.runId).flatMap(ticket => [
        ticket.pilot && ticket.stage === 'complete' ? ticketCompletedId(ticket) : '',
        ticket.parked?.published ? ticketParkedId(ticket) : '',
        ticket.repairCycle?.phase === 'diagnosis' && ticket.repairCycle.diagnosisRequestId ? repairBudgetId({ id: ticket.runId }, ticket.repairCycle) : '',
    ].filter(Boolean));
}

export interface TerminalCandidate { id: string; trigger: RetrospectiveTrigger; subject: RetrospectiveSubjectKind; subjectId: string; key: string; stage: string; head: string; steps: number; reason: string; at: string }

/** Stable terminal states are derived rather than hooked: completed or cancelled jobs, completed CEC runs. */
export function terminalCandidates(knowledge: KnowledgeState, jobs: TicketJob[], tickets: Ticket[] = []): TerminalCandidate[] {
    const known = new Set([...knowledge.consumed, ...knowledge.pending.map(entry => entry.id)]);
    const fromJobs = jobs.flatMap(job => {
        const signal = job.status === 'completed' ? { id: completedId(job), trigger: 'completed' as const } : job.status === 'cancelled' ? { id: retiredId(job), trigger: 'retired' as const } : null;
        return signal && !known.has(signal.id) ? [{ ...signal, subject: 'job' as const, subjectId: job.id, key: job.key, stage: job.stage, head: job.mergeCommit || job.head || '', steps: job.steps?.length || 0, reason: (job.detail || '').slice(0, 500), at: job.updatedAt || job.requestedAt || '' }] : [];
    });
    const fromTickets = tickets.flatMap(ticket => {
        const id = ticketCompletedId(ticket);
        return ticket.runId && ticket.pilot && ticket.stage === 'complete' && !known.has(id) ? [{ id, trigger: 'completed' as const, subject: 'ticket' as const, subjectId: ticket.runId, key: ticket.key, stage: ticket.stage, head: ticket.commit || '', steps: Object.keys(ticket.results || {}).length, reason: 'Deployed change verified in staging.', at: ticket.updated || ticket.observedAt }] : [];
    });
    return [...fromJobs, ...fromTickets];
}
