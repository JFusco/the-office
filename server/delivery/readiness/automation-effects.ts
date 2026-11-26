import { workKey, type TicketJob } from '../../../src/shared';
import { redoEffects, settledRequest } from '../repairs/bot-redo/ledger';
import type { Store } from '../../store/store';

/**
 * Unknown external writes remain blockers, for this job and for every bot redo request on its PR whichever job made
 * it. The current merge's own single Effect may be in preflight, and `activeEffectId` names the one unsent
 * preparation now being guarded. An attempted redo request is history only once a qualified replacement settled it.
 */
export function assertAutomationEffects(store: Store, job: TicketJob, currentMerge = false, activeEffectId?: string) {
    const own = (store.db.prepare('SELECT body FROM effects WHERE work_key=?').all(workKey({ projectId: store.project.id, kind: 'delivery', id: job.id })) as { body: string }[]).map(row => JSON.parse(row.body));
    const rows = new Map([...own, ...(job.pr ? redoEffects(store, job.pr) : [])].map(e => [e.id, e]));
    if ([...rows.values()].some(e => e.status !== 'verified' && !(e.status === 'rejected' && !e.dispatchedAt) &&
        !(currentMerge && !job.mergeAttempt && e.id === job.mergeIntentId && e.operation === 'github-merge' &&
            e.payload?.sha === job.head && !e.dispatchedAt && ['prepared', 'dispatching'].includes(e.status)) &&
        !(activeEffectId && e.id === activeEffectId && e.status === 'prepared' && !e.dispatchedAt) && !settledRequest(store, e)) ||
        job.mergeAttempt && !job.mergeCommit || job.boardUpdates?.some(u => u.status !== 'verified') ||
        job.steps.some(s => s.result.receipts.some(r => r.uncertain || !r.verified))) throw Error('Unresolved external writes require readback; no replay is authorized');
}
