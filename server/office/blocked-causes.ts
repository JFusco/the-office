import type { BlockedCause, ProgressionItem } from '../../src/contracts/work';

export const BLOCKED_CAUSES: readonly BlockedCause[] = ['needs-decision', 'interrupted', 'unconfirmed', 'dependency', 'paused', 'failed', 'unclassified'];

/** Counts blocked work by cause. Blocked work without a recorded cause is counted as unclassified, not as a decision. */
export function blockedCauses(progression: readonly ProgressionItem[]): Record<BlockedCause, number> {
    const counts = Object.fromEntries(BLOCKED_CAUSES.map(cause => [cause, 0])) as Record<BlockedCause, number>;
    for (const item of progression) if (item.eligibility.state === 'blocked') counts[item.eligibility.cause || 'unclassified']++;
    return counts;
}
