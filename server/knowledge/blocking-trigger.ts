import type { PendingRetrospective, RetrospectiveTrigger } from '../../src/shared';

export type BlockingTrigger = Extract<RetrospectiveTrigger, 'parked' | 'blocked' | 'repair-budget'>;
const BLOCKING: ReadonlySet<RetrospectiveTrigger> = new Set(['parked', 'blocked', 'repair-budget']);

export const isBlocking = (trigger: RetrospectiveTrigger): trigger is BlockingTrigger => BLOCKING.has(trigger);

/** The block a retrospective answers: its own trigger, or one a learning batch absorbed. Undefined for routine learning. */
export function blockingTrigger(pending: Pick<PendingRetrospective, 'trigger' | 'blockedBy'>): BlockingTrigger | undefined {
    return pending.blockedBy ?? (isBlocking(pending.trigger) ? pending.trigger : undefined);
}
