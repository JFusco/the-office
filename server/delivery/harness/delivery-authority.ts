import { isDeepStrictEqual } from 'node:util';
import { HOLDS } from '../../office/config';
import { currentAssignment } from '../../workers/assignment-context';
import { type HarnessRequest, type TicketJob } from '../../../src/shared';
import type { Store } from '../../store/store';
import { deliveryAdmission } from './delivery-admission';
import { resolveDeliveryWork } from './delivery-subject';
import { harnessDelivers } from './scope';
export { resolveDeliveryWork } from './delivery-subject';

export interface DeliveryAuthorityInput {
    request?: HarnessRequest;
    context?: { project: string; key: string; complete: boolean; fresh: boolean; ownership?: { status: string }; [key: string]: unknown };
}

/** Eligibility is a queue decision only. It never grants an IT/observer a mutation. */
export function assessDeliveryEligibility(store: Store, job: TicketJob, input: DeliveryAuthorityInput = {}) {
    const assignment = currentAssignment(), blockers: string[] = [], conflicts: string[] = [];
    const admission = deliveryAdmission(store, job), request = input.request;
    if (!harnessDelivers(store, job)) blockers.push('This workflow retains its existing native ownership checks');
    if (!admission) blockers.push('No registered delivery admission');
    if (store.state.coordination?.jobs?.filter(j => j.id === job.id).length !== 1 || !store.state.coordination.jobs.includes(job)) blockers.push('Delivery job identity changed');
    if (store.state.paused) blockers.push('Project is paused');
    if (store.state.draining) blockers.push('Office is draining');
    if (HOLDS[job.key] || job.pr && HOLDS[`GH-${job.pr}`]) blockers.push('Explicit human hold');
    if (input.context && (input.context.project !== store.project.id || input.context.key !== job.key)) blockers.push('Context subject does not match delivery');
    for (const claim of store.activeClaims()) {
        const subject = resolveDeliveryWork(store, claim.work);
        if (subject.kind === 'unrelated') continue;
        if (subject.kind === 'unresolved') { conflicts.push(`${claim.id}: ${subject.reason}`); continue; }
        if (subject.job !== job || assignment?.claim.id === claim.id) continue;
        conflicts.push(`${claim.id}: ${claim.status} ${claim.stage}`);
    }
    for (const worker of store.state.workLog || []) {
        if (worker.requestId !== job.id || !['running', 'stopping'].includes(worker.status) || worker.claimId === assignment?.claim.id) continue;
        conflicts.push(`${worker.id}: original worker ${worker.status}`);
    }
    // Existing stage/recovery handlers and Effects own original-effect reconciliation.
    // Ownership is not another effect state machine: its guard also runs inside a
    // handler's dispatched readback, where a blanket uncertain-effect rule deadlocks.
    const recovery = request && resolveDeliveryWork(store, { projectId: store.project.id, kind: 'reconciliation', id: request.id });
    if (!recovery || recovery.kind !== 'job' || recovery.job !== job) {
        if (store.state.workLog?.some(w => w.requestId === job.id && ['github-implement', 'github-update-base', 'github-scope-repair'].includes(w.stage) &&
            ['interrupted', 'failed'].includes(w.status) && w.failure?.dispatched !== false && !job.steps.some(s => s.workerId === w.id))) blockers.push('Original incomplete worker needs readback');
    }
    if (job.steps.at(-1)?.stage === 'superseded-stage-result') blockers.push('Superseded stage result needs reconciliation');
    blockers.push(...conflicts);
    return { policy: 'registered-delivery-v1' as const, projectId: store.project.id, jobId: job.id, key: job.key, admission,
        observedAt: store.clock.now().toISOString(), eligible: blockers.length === 0, blockers, conflicts,
        // Keep capability measurements, not another copy of conversation bodies/commands.
        context: input.context ? { project: input.context.project, key: input.context.key, complete: input.context.complete, fresh: input.context.fresh,
            ownership: { status: input.context.ownership?.status },
            ...(typeof input.context.observedAt === 'string' ? { observedAt: input.context.observedAt } : {}),
            ...(typeof input.context.expiresAt === 'string' ? { expiresAt: input.context.expiresAt } : {}) } : null };
}

/** Only the exact persisted running scheduler assignment may execute delivery work. */
export function assessDeliveryAuthority(store: Store, job: TicketJob, input: DeliveryAuthorityInput = {}) {
    const assignment = currentAssignment(), request = input.request || (assignment?.claim.work.kind === 'reconciliation'
        ? store.state.coordination?.requests?.find(r => r.id === assignment.claim.work.id) : undefined);
    const result = assessDeliveryEligibility(store, job, { ...input, request });
    // Drain prevents admission but intentionally lets an already claimed stage finish.
    const blockers = result.blockers.filter(b => b !== 'Office is draining');
    const claim = assignment?.claim, subject = claim && resolveDeliveryWork(store, claim.work);
    if (!claim || assignment.lane !== 'delivery' || (claim.lane || 'delivery') !== 'delivery' || claim.status !== 'running' ||
        !store.activeClaims().some(saved => isDeepStrictEqual(saved, claim)) || subject?.kind !== 'job' || subject.job !== job)
        blockers.push('Exact running delivery scheduler claim is required');
    else if (claim.work.kind === 'delivery') {
        if (job.status !== 'working' || claim.stage !== job.stage || request) blockers.push('Scheduled delivery stage changed');
    } else if (!request || subject.request !== request || request.status !== 'working' || request.lane !== 'delivery' || request.action !== claim.stage)
        blockers.push('Exact working original recovery request is required');
    else if (request.action !== 'reconcile-pr-metadata') blockers.push('This recovery retains its existing native ownership checks');
    return { ...result, claim: claim ? structuredClone(claim) : null, request: request ? structuredClone(request) : null,
        stage: claim?.stage || '', authorized: blockers.length === 0, blockers };
}

export function requireDeliveryAuthority(store: Store, job: TicketJob, input: DeliveryAuthorityInput = {}) {
    const result = assessDeliveryAuthority(store, job, input);
    if (!result.authorized) throw new Error(`Delivery authority unavailable: ${result.blockers.join('; ')}`);
    return result;
}
