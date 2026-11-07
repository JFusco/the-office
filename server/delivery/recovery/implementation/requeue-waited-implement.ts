import { HOLDS } from '../../../office/config';
import { needsDecision } from '../../parking/needs-decision';
import { hasUncertainEffects } from '../../pipeline/github-delivery';
import { recordJobApproach } from '../../pipeline/approach';
import { handsOff, harnessDelivers } from '../../harness/scope';
import type { Store } from '../../../store/store';
import type { TicketJob } from '../../../../src/shared';

export const APPROACH_GUARD_REJECTION = 'Reconcile failed work, findings and uncertain effects before reducing review or verification';

/** Same rule as acceptance: a failed, interrupted or blocked worker counts until a later worker of its stage completes. */
function failedWorker(store: Store, job: TicketJob) {
    const work = (store.state.workLog || []).filter(w => w.requestId === job.id);
    return work.some(w => ['failed', 'interrupted', 'blocked'].includes(w.status) && !work.some(later => later.stage === w.stage && later.startedAt > w.startedAt && later.status === 'completed'));
}

/** A passed implement that the approach guard rejected right after a structured wait or decision re-runs once
 * on the same candidate, only when the current guard would accept it. Both earlier results stay in history. */
export function requeueWaitedImplement(store: Store, key: string): TicketJob {
    const job = (store.state.coordination?.jobs || []).find(j => j.key === key && j.status !== 'cancelled');
    if (!job || job.stage !== 'implement' || job.status !== 'blocked' || job.parked || !job.detail.includes(APPROACH_GUARD_REJECTION))
        throw new Error('Only an implement blocked by the approach guard can be requeued');
    if (!harnessDelivers(store, job))
        throw new Error('Legacy recovery jobs keep their own reconciliation contracts');
    const [waited, rejected] = job.steps.filter(s => s.stage === 'implement').map(s => s.result).slice(-2);
    if (!waited || !rejected || !needsDecision(waited) || rejected.outcome !== 'passed' || !rejected.approach || job.steps.at(-1)?.result !== rejected)
        throw new Error('The rejected implement must directly follow a structured wait or decision');
    if (job.pr || HOLDS[key])
        throw new Error(`${key} has a PR or a hold; reconcile it through its own gate`);
    if (job.steps.some(s => hasUncertainEffects(s.stage, s.result)))
        throw new Error('Original effects must be reconciled before implement re-runs');
    if (store.state.workLog?.some(w => w.requestId === job.id && ['running', 'stopping'].includes(w.status)) || store.activeClaims().some(c => c.work.id === job.id))
        throw new Error('A worker is still active for this delivery');
    // Dry run on a copy: re-running is only worth a paid worker if the current guard accepts this result.
    const before = structuredClone({ ...job, steps: job.steps.slice(0, -1) });
    recordJobApproach(before, rejected.approach, 'developer', failedWorker(store, job), handsOff(store), rejected);
    job.status = 'queued';
    job.detail = `Implement requeued on the same candidate after the ${waited.resolution!.kind} result; the earlier and rejected results are retained.`;
    store.emit('implement-requeued', `${key}: ${job.detail}`, 'pm', key);
    return job;
}
