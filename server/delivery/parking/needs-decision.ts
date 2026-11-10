import type { StageResult, TicketJob } from '../../../src/shared';

/** Human decisions and external waits (e.g. an upstream release) both belong on the board, not in a hidden blocker. */
const DECISION_KINDS = new Set(['human-hold', 'scope', 'permission', 'provider-wait']);

/** Only a structured blocked outcome that names a human decision parks; findings on a passed result never do. */
export function needsDecision(result: StageResult, job?: Pick<TicketJob, 'stage' | 'pr'>): boolean {
    // A published PR can keep observing provider readiness without asking a person
    // to return its card to Ready. Registered release waits retain their own park.
    if (job?.stage === 'lead-pr' && job.pr && result.resolution?.kind === 'provider-wait' && !result.resolution.release)
        return false;
    return result.outcome === 'blocked' && !!result.resolution && DECISION_KINDS.has(result.resolution.kind);
}
