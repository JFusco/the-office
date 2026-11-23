import type { DeliveryRequest, OfficeSnapshot } from '../../../src/shared';

/**
 * The first request an operator's command queued for a ticket after its repair resume, or null.
 * Three requests are an operator's and nothing else's: one marked `operator` (the `start-pilot`
 * and `resume-ticket` commands, see server/office/http/commands.ts), a QA-plan retry and a
 * saved-implementation continuation, which only a person's approval queues. A request an
 * automatic path queued (a ticket moved out of Jira Blocked, a sign-in wait, a conversation,
 * nightly work, a feature handoff) is not.
 *
 * "After" is the queue's own order: a project's delivery queue only grows, so it needs no
 * clock. A command that found a request already queued or working for the ticket queued none,
 * left no trace, and is not seen here.
 */
export function ticketMovedByHand(state: Pick<OfficeSnapshot, 'deliveryQueue'>, resume: Pick<DeliveryRequest, 'id' | 'key'>): { kind: string; at: string } | null {
    const queue = state.deliveryQueue ?? [], own = queue.findIndex(request => request.id === resume.id);
    if (own < 0) return null;
    const moved = queue.slice(own + 1).find(request => request.key === resume.key && (request.operator || request.qaPlanRetry || request.implementationContinuation));
    return moved ? { kind: moved.qaPlanRetry ? 'continue-qa-plan' : moved.action, at: moved.requestedAt } : null;
}
