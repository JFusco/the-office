import type { ITInvestigation } from '../../../src/contracts/it-investigations';
import type { Store } from '../../store/store';

/**
 * A failed worker whose work has since finished: the delivery it ran for is completed or cancelled,
 * or its Jira/Azure ticket is complete. A diagnosis could no longer change anything there, so the
 * investigation is kept as history instead of waiting on a person. Undefined while the work is
 * still open, or when the worker belongs to nothing that can be read as finished.
 */
export function finishedSubjectResolution(store: Store, entry: ITInvestigation) {
    if (entry.source.kind !== 'worker') return;
    // A proposed Office fix is Morgan's to review whatever happened to the ticket.
    if (entry.report?.officeFix?.status === 'proposed') return;
    // A leftover-helper failure is a harness defect worth one look: it closes with its subject only after Ellis has diagnosed it.
    if (entry.source.failureKind === 'surviving-subprocesses' && !['diagnosed', 'blocked'].includes(entry.status)) return;
    const state = store.state, jobs = state.coordination?.jobs || [];
    const job = entry.source.requestId ? jobs.find(item => item.id === entry.source.requestId) : undefined;
    if (job) return ['completed', 'cancelled'].includes(job.status) ? { kind: 'superseded' as const, sourceId: job.id, receipt: `job:${job.id}:${job.status}` } : undefined;
    if (!entry.source.ticket) return;
    const ticket = state.tickets.find(item => item.key === entry.source.ticket);
    if (ticket?.stage === 'complete') return { kind: 'superseded' as const, sourceId: ticket.key, receipt: `ticket:${ticket.key}:complete` };
    // Otherwise every delivery for the key must be finished, and there must be one: a GitHub issue retired or cancelled before closeout never reaches `complete`.
    const deliveries = jobs.filter(item => item.key === entry.source.ticket);
    return deliveries.length && deliveries.every(item => ['completed', 'cancelled'].includes(item.status))
        ? { kind: 'superseded' as const, sourceId: deliveries.at(-1)!.id, receipt: `job:${deliveries.at(-1)!.id}:${deliveries.at(-1)!.status}` } : undefined;
}
