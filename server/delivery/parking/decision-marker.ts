import type { TicketJob } from '../../../src/shared';

/** The marker of a park's decision comment: the job and its step count when it parked. */
export const decisionMarker = (job: Pick<TicketJob, 'id' | 'steps'>) => `Office decision ${job.id}:${job.steps.length}`;
