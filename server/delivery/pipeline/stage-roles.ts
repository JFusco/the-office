import type { Role, TicketJob } from '../../../src/shared';
import type { WorkSlot } from '../../scheduling/slot-policy';

const ROLES: Partial<Record<TicketJob['stage'], Role>> = { 'ci-recovery': 'pm', implement: 'developer', 'scope-repair': 'developer', 'update-base': 'developer', review: 'lead', validate: 'qa', draft: 'developer', 'lead-pr': 'lead', 'prepare-pr': 'lead', closeout: 'pm' };

/** The worker role that runs a GitHub delivery stage; `merge` is harness-only and has none. */
export function stageRole(stage: TicketJob['stage']): Role {
    return ROLES[stage]!;
}

/**
 * Scheduling slot for a GitHub delivery job. Continuations and source amendments may launch a
 * second model role inside one stage, so they stay exclusive (no slot) as before.
 */
export function deliverySlot(job: TicketJob): WorkSlot | undefined {
    if (job.implementationContinuation || job.sourceAmendment)
        return undefined;
    return { role: ROLES[job.stage] };
}
