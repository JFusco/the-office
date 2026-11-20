import type { CountedCause, ProgressionItem } from '../../src/contracts/work';
import { effectiveCause } from '../incidents/repair/repair-wait-cause';

/** Every cause, at zero. A cause missing here does not compile. */
const NONE: Record<CountedCause, number> = { 'needs-decision': 0, 'awaiting-repair': 0, interrupted: 0, unconfirmed: 0, dependency: 0, paused: 0, failed: 0, unclassified: 0 };
export const BLOCKED_CAUSES = Object.keys(NONE) as readonly CountedCause[];

/**
 * Counts blocked work by cause. Blocked work without a recorded cause is counted as unclassified, not as a decision.
 * `waiting` says whether a harness repair in progress covers an item's stop; such an item is counted once, as
 * awaiting repair, only when its own cause is unclassified, failed or interrupted.
 */
export function blockedCauses(progression: readonly ProgressionItem[], waiting: (item: ProgressionItem) => boolean = () => false): Record<CountedCause, number> {
    const counts = { ...NONE };
    for (const item of progression) if (item.eligibility.state === 'blocked') counts[effectiveCause(item.eligibility.cause, waiting(item))]++;
    return counts;
}
