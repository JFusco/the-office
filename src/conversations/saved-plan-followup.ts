import type { OfficeSnapshot } from '../shared';
export function savedPlanFollowup(snapshot: OfficeSnapshot, actionId: string) {
    return snapshot.tickets.find(ticket => actionId === `ticket:${ticket.key}:plan` && ticket.pilot && ticket.stage === 'plan' && ticket.activity === 'blocked' && (ticket.blocker === 'Saved implementation plan is required' || !!ticket.savedPlanRecoveryFailure) && ticket.results.plan?.outcome === 'passed');
}
