import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

/** New admissions are saved by existing pickup/Start/verified-link producers. Old jobs
 * require a positively bound review or original scheduled worker, not job existence. */
export function deliveryAdmission(store: Store, job: TicketJob): string | undefined {
    const a = job.admission;
    if (a && ['pickup', 'manual', 'linked-pr', 'repair-followup'].includes(a.kind) && a.projectId === store.project.id && a.jobId === job.id && a.key === job.key && a.reference && Number.isFinite(Date.parse(a.at)))
        return `${a.kind}:${a.reference}`;
    const requested = Date.parse(job.requestedAt);
    const review = store.state.coordination?.listener.reviews
        .filter(r => r.key === job.key && Date.parse(r.queuedAt) <= requested)
        .sort((a, b) => Date.parse(a.queuedAt) - Date.parse(b.queuedAt)).at(-1);
    if (review) {
        const reviewed = Date.parse(review.queuedAt);
        const interveningJob = store.state.coordination?.jobs?.some(other =>
            other.id !== job.id && other.key === job.key && Date.parse(other.requestedAt) >= reviewed && Date.parse(other.requestedAt) <= requested);
        const readyForJob = review.status === 'ready' && review.workRequested && !interveningJob;
        const linkedPR = job.pr > 0 && review.prNumber === job.pr && (!review.owner || review.owner === job.id);
        if (review.owner === job.id || linkedPR || readyForJob) return `historical-review:${review.id}`;
    }
    // Existing original execution binding supplies recovery provenance; it does not accept
    // its source/result or permit replay of an interrupted worker.
    const work = store.state.workLog?.find(w => {
        if (w.requestId !== job.id || w.ticket !== job.key || !w.claimId) return false;
        const row = store.db.prepare('SELECT body FROM work_claims WHERE id=?').get(w.claimId) as { body: string } | undefined;
        if (!row) return false;
        const claim = JSON.parse(row.body);
        return claim.id === w.claimId && claim.work.projectId === store.project.id && claim.work.kind === 'delivery' && claim.work.id === job.id;
    });
    return work ? `historical-assignment:${work.id}` : undefined;
}
