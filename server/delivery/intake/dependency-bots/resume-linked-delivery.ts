import { hasUncertainEffects } from '../../pipeline/github-delivery';
import type { Store } from '../../../store/store';
import { workKey, type TicketJob } from '../../../../src/shared';

export const MISSING_NATIVE_LINK = 'Error: PR is not natively linked to this exact project issue';

/** Only the exact lost-link preflight is resumed, at its original stage. No repair budget or review is reset. */
export function resumeLinkedDelivery(store: Store, job: TicketJob, head: string): void {
    if (job.status !== 'blocked' || job.detail !== MISSING_NATIVE_LINK || job.head !== head ||
        !['lead-pr', 'draft', 'update-base'].includes(job.stage) || job.mergeAttempt || job.mergeCommit || job.mergeIntentId || job.mergeApprovalRequired ||
        job.prerequisites?.length || job.boardUpdates?.some(u => u.status !== 'verified') || job.steps.some(s => hasUncertainEffects(s.stage, s.result))) return;
    // A source worker may have left a candidate or uncertain local effects. Never restart one here.
    if (job.stage === 'update-base' && (job.steps.some(s => s.stage === 'update-base') ||
        store.state.workLog?.some(w => w.requestId === job.id && w.stage === 'github-update-base'))) return;
    const effects = (store.db.prepare('SELECT body FROM effects WHERE work_key=?')
        .all(workKey({ projectId: store.project.id, kind: 'delivery', id: job.id })) as { body: string }[]).map(row => JSON.parse(row.body));
    if (effects.some(e => e.status !== 'verified' && !(e.status === 'rejected' && !e.dispatchedAt))) return;
    job.status = 'queued';
    job.detail = `Original native issue link restored and read back at ${head}; continuing the saved ${job.stage} stage. Prior failures, reviews, effects and repair budgets retained.`;
    store.emit('dependency-link-restored', `${job.key}: ${job.detail}`, 'pm', job.key);
}
