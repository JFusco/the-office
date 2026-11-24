import type { Role, TicketJob } from '../../../src/shared';
import type { WorkSlot } from '../../scheduling/slot-policy';

import { deliveryRoles as ROLES } from '../../../src/contracts/ticket-progress';

/** The worker role that runs a GitHub delivery stage; `merge` is harness-only and has none. */
export function stageRole(stage: TicketJob['stage']): Role {
    return ROLES[stage]!;
}

/**
 * Scheduling slot for a GitHub delivery job. Continuations may launch a
 * second model role inside one stage, so they stay exclusive (no slot) as before.
 */
export function deliverySlot(job: TicketJob): WorkSlot | undefined {
    if (job.implementationContinuation)
        return undefined;
    return { role: ROLES[job.stage] };
}
