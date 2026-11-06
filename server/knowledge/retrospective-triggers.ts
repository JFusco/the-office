import type { DeliveryRepairCycle, KnowledgeState, RetrospectiveTrigger, TicketJob } from '../../src/shared';
import type { CIRepair } from '../../src/contracts/ci-repair';

type JobRef = Pick<TicketJob, 'id' | 'steps'>;

/** Stable trigger identities. Job ids are UUIDs, so the job id is always the text before the first colon. */
export const completedId = (job: Pick<TicketJob, 'id'>) => `${job.id}:completed`;
export const retiredId = (job: Pick<TicketJob, 'id'>) => `${job.id}:retired`;
export const parkedId = (job: JobRef) => `${job.id}:parked:${job.steps.length}`;
export const repairBudgetId = (job: Pick<TicketJob, 'id'>, cycle: DeliveryRepairCycle) => `${job.id}:repair-budget:${cycle.diagnosisRequestId}:${cycle.approachRevision ?? 0}`;
export const ciBudgetId = (job: Pick<TicketJob, 'id'>, repair: Pick<CIRepair, 'id'>) => `${job.id}:repair-budget:ci:${repair.id}`;
export const triggerJobId = (id: string) => id.split(':')[0];

/** Every trigger a job's current state already represents. Used only to baseline, so over-inclusion is harmless. */
export function visibleTriggerIds(jobs: TicketJob[]): string[] {
    return jobs.flatMap(job => [
        job.status === 'completed' ? completedId(job) : '',
        job.status === 'cancelled' ? retiredId(job) : '',
        job.parked?.published ? parkedId(job) : '',
        job.repairCycle?.phase === 'diagnosis' && job.repairCycle.diagnosisRequestId ? repairBudgetId(job, job.repairCycle) : '',
        ...(job.ciRepairs || []).map(repair => ciBudgetId(job, repair)),
    ].filter(Boolean));
}

/** Completed and cancelled are stable terminal states, so they are derived rather than hooked. */
export function terminalCandidates(knowledge: KnowledgeState, jobs: TicketJob[]): { id: string; job: TicketJob; trigger: RetrospectiveTrigger }[] {
    const known = new Set([...knowledge.consumed, ...knowledge.pending.map(entry => entry.id)]);
    return jobs.flatMap(job => {
        const signal = job.status === 'completed' ? { id: completedId(job), trigger: 'completed' as const } : job.status === 'cancelled' ? { id: retiredId(job), trigger: 'retired' as const } : null;
        return signal && !known.has(signal.id) ? [{ ...signal, job }] : [];
    });
}
