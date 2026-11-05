import type { OfficeSnapshot, Ticket } from '../../src/shared';

export const MISSING_INTAKE = 'No longer present in the latest eligible intake. Recheck before starting.';

/** Only an unused mailbox placeholder can be retired without delivery read-back. */
function unusedMailbox(state: OfficeSnapshot, ticket: Ticket): boolean {
    return ticket.stage === 'mailbox' && ['waiting', 'idle', 'blocked'].includes(ticket.activity) &&
        (!ticket.blocker || ticket.blocker === MISSING_INTAKE) &&
        !ticket.pilot && !ticket.runId && !ticket.attempt && !ticket.prId && !ticket.commit &&
        !ticket.branch && !ticket.worktree && !ticket.previewUrl && !ticket.parked &&
        !Object.keys(ticket.results).length && !ticket.evidence.length && !ticket.findings.length &&
        !state.deliveryQueue?.some(request => request.key === ticket.key && ['queued', 'working'].includes(request.status)) &&
        !state.coordination?.jobs?.some(job => job.key === ticket.key && job.status !== 'cancelled') &&
        !state.workLog?.some(work => work.ticket === ticket.key && work.status === 'running') &&
        !state.coordination?.listener.reviews.some(review => review.key === ticket.key && review.status === 'working');
}

/** Call only with a complete, successful provider read. Retain all records and holds. */
export function reconcileMailbox(state: OfficeSnapshot, eligibleKeys: ReadonlySet<string>): Set<string> {
    const retired = new Set<string>();
    for (const ticket of state.tickets) {
        if (eligibleKeys.has(ticket.key) || !unusedMailbox(state, ticket)) continue;
        if (ticket.activity !== 'idle') {
            ticket.activity = 'idle';
            // Quiet the human alert while retaining the dispatch gate on stale fields.
            ticket.blocker = MISSING_INTAKE;
        }
        retired.add(ticket.key);
    }
    return retired;
}
