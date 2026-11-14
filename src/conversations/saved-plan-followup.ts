import type { OfficeSnapshot, Ticket } from '../shared';
export function isSavedPlanFollowup(ticket: Ticket): boolean {
    if (!ticket.pilot || ticket.stage !== 'plan' || ticket.activity !== 'blocked' || ticket.savedPlanRecovery || ticket.results.plan?.outcome !== 'passed') return false;
    const interruptedReadback = /^Error:\s*I cannot clear dispatch\b[\s\S]*\bsession (?:bridge|inventory)\b/i.test(ticket.blocker) &&
        !(ticket.results.plan.evidence || []).some(evidence => !!evidence.path);
    return ticket.blocker === 'Saved implementation plan is required' || !!ticket.savedPlanRecoveryFailure || interruptedReadback;
}
export function savedPlanFollowup(snapshot: OfficeSnapshot, actionId: string) {
    return snapshot.tickets.find(ticket => actionId === `ticket:${ticket.key}:plan` && isSavedPlanFollowup(ticket));
}
