import { STAGES } from '../../shared';

/**
 * Whether asking Morgan to assess a ticket for feature planning can still change anything. Once
 * the ticket's delivery has reached implementation its route is settled, and the request would
 * only answer that the existing decision is retained. A ticket with no recorded delivery stage
 * (not started, or a project that tracks delivery elsewhere) can still be assessed.
 */
export function planningAssessable(ticket: { stage?: string } | undefined): boolean {
    const stage = (STAGES as readonly string[]).indexOf(ticket?.stage || '');
    return stage < STAGES.indexOf('implement');
}
