import type { Store } from '../store/store';

/** How long a merge-notice candidate whose read had nothing to send waits before it is read again. */
export const MERGE_NOTICE_RECHECK_MS = 30 * 60 * 1000;

/** In memory, per project store and PR number: a restart reads every candidate again. */
const waits = new WeakMap<object, Map<number, { until: number; policy: string }>>();

/** The PR was read within the wait under these same notice settings (a fingerprint) and had nothing to send. */
export function coolingDown(store: Store, pr: number, policy: string): boolean {
    const wait = waits.get(store)?.get(pr);
    if (wait && wait.policy === policy && store.clock.now().getTime() < wait.until) return true;
    waits.get(store)?.delete(pr);
    return false;
}

/** Start the wait for this PR, and drop waits that have run out. */
export function coolDown(store: Store, pr: number, policy: string): void {
    const now = store.clock.now().getTime(), project = waits.get(store) ?? new Map<number, { until: number; policy: string }>();
    for (const [number, wait] of project) if (wait.until <= now) project.delete(number);
    project.set(pr, { until: now + MERGE_NOTICE_RECHECK_MS, policy });
    waits.set(store, project);
}

/** The PR was seen open again (reopened): its next close or merge is read at once. */
export function clearCooldown(store: Store, pr: number): void {
    waits.get(store)?.delete(pr);
}
