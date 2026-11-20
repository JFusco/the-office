import type { BlockedCause, CountedCause } from '../../../src/contracts/work';

/** The only causes a repair wait stands in for: stops nobody classified, and failures and interruptions. */
const REPLACED: ReadonlySet<BlockedCause> = new Set(['unclassified', 'failed', 'interrupted']);

/**
 * The cause blocked work is counted under. A repair wait in effect replaces only an unclassified,
 * failed or interrupted stop, or a missing cause. A decision, a prerequisite, a pause and an
 * unconfirmed write stay what they are, whether they stood before the wait or arose after it.
 */
export function effectiveCause(cause: BlockedCause | undefined, waiting: boolean): CountedCause {
    const recorded = cause ?? 'unclassified';
    return waiting && REPLACED.has(recorded) ? 'awaiting-repair' : recorded;
}
