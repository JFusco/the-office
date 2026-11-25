import { ROLE_NAMES, STAGE_LABELS, type OfficeProject, type OfficeSnapshot } from '../../src/shared';
import { jiraProgress } from '../../src/work/timeline/jira-progress';
import type { JiraQueueProgress } from '../../src/contracts/ticket-progress';
import { plannedNext } from '../delivery/pipeline/approach';
import { nextStage } from './workflow';
import { isFollowed } from './production/awaiting-production';

/** Send only the summary for tickets that entered delivery, including terminal rows to retire old intake. */
export function jiraQueueProgress(project: OfficeProject, snapshot: OfficeSnapshot, now: Date): JiraQueueProgress[] {
    if (project.provider !== 'azure') return [];
    return snapshot.tickets.flatMap(ticket => {
        const request = snapshot.deliveryQueue?.filter(r => r.key === ticket.key).at(-1);
        if (!ticket.pilot && ticket.stage === 'mailbox' && !request) return [];
        const routed = plannedNext(ticket, ticket.stage);
        const next = routed ?? (['qa', 'retest'].includes(ticket.stage) ? 'publish' : nextStage(ticket.stage));
        const progress = jiraProgress(ticket, next);
        if (ticket.stage === 'complete' && !ticket.production?.doneAt && !isFollowed(ticket, now)) {
            progress.state = 'passed';
            progress.next = '';
        } else if (request?.action === 'resume-ticket' && ticket.activity === 'blocked' &&
            (request.status === 'queued' || request.status === 'working')) {
            progress.phase = (request.status === 'queued' ? 'Resume queued · ' : 'Resume in progress · ') + STAGE_LABELS[ticket.stage];
            progress.owner = ROLE_NAMES.pm;
            progress.state = request.status;
            progress.next = 'Read back the current ticket and candidate before resuming';
            progress.visit = request.id + '/' + request.status;
        } else if (request && request.action !== 'resume-ticket' && ticket.stage === 'mailbox' && progress.state !== 'blocked') {
            progress.phase = request.status === 'queued' ? 'Delivery queued' : 'Intake · ' + request.status;
            progress.state = request.status === 'interrupted' || request.status === 'blocked' ? 'blocked' : request.status === 'working' ? 'working' : 'queued';
            progress.next = request.error || 'Check ticket eligibility';
            progress.visit = request.id + '/' + request.status;
        }
        return [{project: project.id, projectName: project.name, key: ticket.key, title: ticket.summary,
            at: request?.requestedAt || ticket.observedAt, progress}];
    });
}
