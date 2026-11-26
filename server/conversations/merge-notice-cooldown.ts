import type { Store } from '../store/store';

/** How long a merge-notice candidate whose read had nothing to send waits before it is read again. */
export const MERGE_NOTICE_RECHECK_MS = 30 * 60 * 1000;

/** Closed PR waits are shared by the PR. Recipient waits also include the issue key. */
const waits = new WeakMap<Store, Map<string, { until: number; policy: string }>>();
const waitKey = (pr: number, issueKey?: string) => `${pr}:${issueKey ?? ''}`;

/** The PR was read within the wait under these same notice settings (a fingerprint) and had nothing to send. */
export function coolingDown(store: Store, pr: number, policy: string, issueKey?: string): boolean {
    const project = waits.get(store), key = waitKey(pr, issueKey);
    const wait = project?.get(key);
    if (wait && wait.policy === policy && store.clock.now().getTime() < wait.until) return true;
    project?.delete(key);
    return false;
}

/** Start the wait for this PR, and drop waits that have run out. */
export function coolDown(store: Store, pr: number, policy: string, issueKey?: string): void {
    const now = store.clock.now().getTime(), project = waits.get(store) ?? new Map<string, { until: number; policy: string }>();
    for (const [key, wait] of project) if (wait.until <= now) project.delete(key);
    project.set(waitKey(pr, issueKey), { until: now + MERGE_NOTICE_RECHECK_MS, policy });
    waits.set(store, project);
}

/** The PR was seen open again (reopened): its next close or merge is read at once. */
export function clearCooldown(store: Store, pr: number): void {
    const project = waits.get(store);
    if (!project) return;
    for (const key of project.keys()) if (key.startsWith(waitKey(pr))) project.delete(key);
}
