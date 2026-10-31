import type { HarnessRequest } from '../../src/contracts/work';

/** Idempotent provider reads with no reconciliation value once completed. */
const READ_OPERATIONS = new Set(['refresh', 'poll', 'observe-dependencies']);
export const RETAINED_PER_ACTION = 25;

/**
 * Keeps only the most recent completed read operations per action. Without this the
 * persisted state grows by one record per minute per project, and every save and
 * snapshot re-serializes all of them on the event loop.
 */
export function pruneCompletedReads(requests: HarnessRequest[], retained = RETAINED_PER_ACTION): number {
    const seen = new Map<string, number>(), keep: HarnessRequest[] = [];
    for (let index = requests.length - 1; index >= 0; index--) {
        const request = requests[index];
        if (READ_OPERATIONS.has(request.action) && request.status === 'completed') {
            const count = seen.get(request.action) || 0;
            seen.set(request.action, count + 1);
            if (count >= retained) continue;
        }
        keep.push(request);
    }
    const removed = requests.length - keep.length;
    if (removed) requests.splice(0, requests.length, ...keep.reverse());
    return removed;
}
