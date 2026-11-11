import { workKey, type TicketJob } from '../../../src/shared';
import type { Store } from '../../store/store';
import { packed165Admitted } from '../recovery/packed165-evidence';
import { PACKED165, packed165EffectId } from '../recovery/packed165-policy';
import { digest } from '../../store/readback-evidence';

/** Unknown external writes remain blockers. The current merge's own single Effect may be in preflight. */
export function assertAutomationEffects(store: Store, job: TicketJob, currentMerge = false) {
    const rows = store.db.prepare('SELECT body FROM effects WHERE work_key=?').all(workKey({ projectId: store.project.id, kind: 'delivery', id: job.id })) as { body: string }[];
    const admitted = packed165Admitted(store, job);
    if (rows.some(row => { const e = JSON.parse(row.body); return !(admitted && e.id === packed165EffectId() && digest(e) === PACKED165.effectSha256) && e.status !== 'verified' && !(e.status === 'rejected' && !e.dispatchedAt) &&
        !(currentMerge && !job.mergeAttempt && e.id === job.mergeIntentId && e.operation === 'github-merge' &&
            e.payload?.sha === job.head && !e.dispatchedAt && ['prepared', 'dispatching'].includes(e.status)); }) ||
        job.mergeAttempt && !job.mergeCommit || job.boardUpdates?.some(u => u.status !== 'verified') ||
        job.steps.some(s => s.result.receipts.some(r => r.uncertain || !r.verified))) throw Error('Unresolved external writes require readback; no replay is authorized');
}
