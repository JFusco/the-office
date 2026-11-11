import { completedExecution } from '../workers/worker-completion';
import { stoppedBaseUpdateCandidate } from '../delivery/recovery/stopped-base-update';
import { stoppedBaseHandoffResolved, stoppedBaseReassessmentReady } from '../delivery/recovery/stopped-base-disposition';
import { assessDeliveryEligibility } from '../delivery/harness/delivery-authority';
import { enqueueRequest } from '../scheduling/requests';
import type { ITContext } from './context';

/** One stable original family; stopped/paused/evidence gaps never erase its budget. */
export async function recoverStoppedBaseUpdates(context: ITContext) {
    const { store, state, current, recover, it, followUps } = context;
    for (const job of state.coordination?.jobs || []) {
        let candidate;
        try { candidate = stoppedBaseUpdateCandidate(store, job); }
        catch (error) { followUps.push({ id: `stopped-base-update:${job.id}:unknown`, owner: 'Morgan', detail: String(error) }); continue; }
        if (!candidate) continue;
        if (stoppedBaseReassessmentReady(store, { key: job.key, head: candidate.head })) {
            const record = it.recoveries[candidate.id];
            if (record) { record.status = 'resolved'; record.nextAt = ''; if (job.stoppedBaseUpdate?.greenMerge) record.detail = 'Joe authorized green-check merge without extra review/QA. Original negative audit, abandoned candidate and consumed budgets retained.'; current.add(candidate.id); }
            const r=job.stoppedBaseUpdate!;
            const workers=state.workLog?.filter(w=>w.requestId===job.id&&w.stage==='stopped-base-update-handoff')||[];
            if(!state.paused&&!state.draining&&['blocked','interrupted'].includes(job.status)&&['lead','checkout'].includes(r.phase)&&workers.length===1&&completedExecution(store,workers[0]))
                await recover(`stopped-base-handoff:${job.id}:${workers[0].id}`,job.detail,async()=>enqueueRequest(store,'reconcile-review',job.key,workers[0].id),
                    'Morgan reads the one completed native handoff and retained partial prospective clone. No reader, original writer or clone dispatch is repeated.','Morgan');
            continue;
        }
        current.add(candidate.id);
        // Request-aware eligibility permits original readback, never a source replay.
        const request = { id: 'eligibility-only', action: 'reconcile-base-update', key: job.key, head: candidate.head };
        const pending = state.coordination?.requests?.find(r => r.action === request.action && r.key === request.key && r.head === request.head && ['queued','working'].includes(r.status));
        if (state.paused || state.draining || !state.coordination?.enabled || pending) {
            followUps.push({ id: candidate.id, owner: 'IT', detail: pending ? 'The original readback request is queued or working; it is not repeated.' : 'Original stopped-base readback waits for project controls; its budget and unknown effects remain retained.' });
            continue;
        }
        const eligibility = assessDeliveryEligibility(store, job, { request: pending });
        const blockers = eligibility.blockers.filter(b => b !== 'Original incomplete worker needs readback');
        if (blockers.length) {
            followUps.push({ id: candidate.id, owner: 'Morgan', detail: blockers.join('; ') }); continue;
        }
        await recover(candidate.id, job.detail, async () => enqueueRequest(store, 'reconcile-base-update', job.key, candidate!.head),
            'Morgan reconciles the exact interrupted original assignment, one audit reservation and real native completion. Unknown effects remain stopped; no original writer or read-only audit is replayed.', 'Morgan');
    }
}

/** Disappearance from the current candidate list is not a positive disposition. */
export function stoppedBaseUpdateUnresolved(store: ITContext['store'], id: string) {
    if (id.startsWith('stopped-base-handoff:')) {
        const [,jobId,workerId]=id.split(':'), job=store.state.coordination?.jobs?.find(j=>j.id===jobId);
        return !job||!stoppedBaseHandoffResolved(store,{key:job.key,head:workerId});
    }
    if (!id.startsWith('stopped-base-update:')) return false;
    const [, jobId, workerId] = id.split(':'), job = store.state.coordination?.jobs?.find(j => j.id === jobId);
    return !job || !stoppedBaseReassessmentReady(store, { key: job.key, head: workerId });
}
