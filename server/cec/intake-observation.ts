import type { Ticket } from '../../src/shared';

/** Refresh provider metadata while retaining the local delivery and its evidence. */
export function applyIntakeObservation(ticket: Ticket, observed: Ticket, at: string): void {
    Object.assign(ticket, {
        summary: observed.summary, status: observed.status, statusId: observed.statusId,
        assignee: observed.assignee, updated: observed.updated, observedAt: at,
        boardMember: observed.boardMember, type: observed.type, subtask: observed.subtask,
    });
}
