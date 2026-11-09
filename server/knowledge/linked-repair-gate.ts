import type { Store } from '../store/store';

/** An explicit repair relationship outranks wording-based duplicate matching. Reads only. */
export async function linkedRepairGap(store: Store, incidents: string[], open: { key: string }[], closed?: (key: string) => Promise<boolean>): Promise<string | undefined> {
    const originalIds = new Set(incidents.filter(id => id.startsWith('maintenance:')).map(id => id.slice('maintenance:'.length)));
    const keys = new Set<string>();
    for (const run of store.state.maintenance?.runs || []) {
        if (!originalIds.has(run.id) || !run.blockerFollowup) continue;
        if (!run.blockerFollowup.issue) return 'A linked maintenance repair has no verified provider identity; Morgan must reconcile it';
        keys.add(`GH-${run.blockerFollowup.issue}`);
    }
    for (const continuation of store.state.coordination?.continuations || []) {
        if (continuation.original.projectId === store.project.id && continuation.original.kind === 'maintenance' && originalIds.has(continuation.original.id)) keys.add(`GH-${continuation.repairIssue}`);
    }
    for (const key of keys) {
        if (open.some(item => item.key === key) || store.state.coordination?.jobs?.some(job => job.key === key && !['completed', 'cancelled'].includes(job.status))) return `Existing linked repair ${key} still owns this incident; Morgan must link the work`;
        if (!closed || !await closed(key)) return `Closure of linked repair ${key} is unverified; Morgan must reconcile it`;
    }
}
