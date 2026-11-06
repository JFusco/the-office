import type { PendingRetrospective, RetrospectiveTrigger, TicketJob } from '../../src/shared';
import type { Store } from '../store/store';
import { ciBudgetId, parkedId, repairBudgetId } from './retrospective-triggers';

const clip = (text: string, limit = 500) => text.length <= limit ? text : `${text.slice(0, limit)}…`;

/**
 * Local, idempotent bookkeeping for a retrospective trigger. No provider calls and no delivery state;
 * the caller's existing save persists it. Non-GitHub projects are out of scope for this slice.
 */
export function recordTrigger(store: Store, entry: { id: string; jobId: string; key: string; trigger: RetrospectiveTrigger; event: PendingRetrospective['event'] }): void {
    const knowledge = store.state.knowledge;
    if (store.project.provider !== 'github' || !knowledge) return;
    if (knowledge.consumed.includes(entry.id) || knowledge.pending.some(pending => pending.id === entry.id)) return;
    if (!knowledge.enabled) { knowledge.consumed.push(entry.id); return; }
    knowledge.pending.push({ ...entry, event: { ...entry.event, reason: clip(entry.event.reason) }, createdAt: store.clock.now().toISOString(), attempts: 0, nextAt: '', lastError: '' });
}

type JobLike = Pick<TicketJob, 'id' | 'key' | 'head' | 'steps'> & Partial<Pick<TicketJob, 'stage' | 'repairCycle' | 'ciRepairs'>>;

export function recordParked(store: Store, job: JobLike, reason: string): void {
    recordTrigger(store, { id: parkedId(job), jobId: job.id, key: job.key, trigger: 'parked', event: { stage: job.stage || '', head: job.head, steps: job.steps.length, reason } });
}

export function recordRepairBudget(store: Store, job: JobLike): void {
    const cycle = job.repairCycle;
    if (!cycle?.diagnosisRequestId) return;
    recordTrigger(store, { id: repairBudgetId(job, cycle), jobId: job.id, key: job.key, trigger: 'repair-budget', event: { stage: cycle.sourceStage, head: cycle.sourceHead, steps: job.steps.length, reason: `Source repair window exhausted (attempts ${cycle.attempts}, approach revision ${cycle.approachRevision ?? 0}); findings ${cycle.pendingFindingIds.join(', ')}` } });
}

export function recordCIBudget(store: Store, job: JobLike): void {
    const last = job.ciRepairs?.at(-1);
    if (!last) return;
    recordTrigger(store, { id: ciBudgetId(job, last), jobId: job.id, key: job.key, trigger: 'repair-budget', event: { stage: job.stage || 'ci-recovery', head: job.head, steps: job.steps.length, reason: `CI repair budget exhausted after ${job.ciRepairs!.length} attempts` } });
}
