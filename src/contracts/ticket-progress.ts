import type { Role, TicketJob } from '../shared';

export const deliveryRoles: Partial<Record<TicketJob['stage'], Role>> = { 'ci-recovery': 'pm', implement: 'developer', 'scope-repair': 'developer', 'update-base': 'developer', review: 'lead', validate: 'qa', draft: 'developer', 'lead-pr': 'lead', 'prepare-pr': 'lead', closeout: 'pm' };

export interface TicketProgress {
    phase: string;
    owner: string;
    next: string;
    state: 'working' | 'queued' | 'waiting' | 'blocked' | 'passed';
    /** A semantic visit, stable across observation timestamps and heartbeats. */
    visit: string;
}

export interface JiraQueueProgress {
    project: string;
    projectName: string;
    key: string;
    title: string;
    at: string;
    progress: TicketProgress;
}
