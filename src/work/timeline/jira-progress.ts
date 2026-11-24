import { ROLE_NAMES, STAGE_LABELS, STAGE_ROLE, type Stage, type Ticket } from '../../shared';
import type { TicketProgress } from '../../contracts/ticket-progress';

export function jiraProgress(ticket: Ticket, planned?: Stage): TicketProgress {
    const {stage, activity, production} = ticket;
    const phase = STAGE_LABELS[stage];
    const owner = ROLE_NAMES[STAGE_ROLE[stage]];
    const visit = [ticket.runId, stage, ticket.attempt, activity].join('/');
    if (production?.doneAt)
        return {phase: 'Delivery complete', owner: '', next: '', state: 'passed', visit: production.doneAt};
    if (activity === 'blocked' || activity === 'disconnected')
        return {phase: activity === 'blocked' ? 'Blocked · ' + phase : 'Interrupted · ' + phase, owner: ticket.parked?.published ? 'You' : owner, next: ticket.blocker || 'Check the last recorded attempt', state: 'blocked', visit};
    if (stage === 'complete')
        return {phase, owner, next: production?.statusNote || production?.note || (production?.deployedAt ? 'Confirm Jira closeout' : 'Confirm the production deployment'), state: 'waiting', visit};
    if (stage === 'mailbox')
        return {phase: 'Waiting for intake', owner, next: 'Check ticket eligibility', state: 'queued', visit};
    const state = activity === 'working' ? 'working' : 'waiting';
    if (stage === 'ready-for-staging' || stage === 'ci')
        return {phase, owner, next: stage === 'ci' ? 'Check the Azure build result' : 'Verify the staging deployment', state, visit};
    const next = planned ? STAGE_LABELS[planned] : '';
    return {phase: (state === 'waiting' ? 'Waiting · ' : '') + phase, owner, next, state, visit};
}
