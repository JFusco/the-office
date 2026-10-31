import { handsOff } from '../delivery/harness/scope';
import type { Store } from '../store/store';
import type { MaintenanceRun } from '../../src/shared';

/**
 * Hands-off projects: a scheduled daily run may start despite an earlier blocked or interrupted
 * run, because its follow-up re-reads live provider state and de-duplicates before any write.
 * Returns the ids it supersedes; anything else still requires the original read-back.
 */
export function supersedablePriorRuns(store: Pick<Store, 'project'>, runs: MaintenanceRun[], scheduled: boolean): string[] | null {
    const unverified = runs.filter(run => ['blocked', 'interrupted'].includes(run.status));
    if (!unverified.length) return [];
    if (!scheduled || !handsOff(store)) return null;
    // A run an earlier run already superseded is not superseded again; it stays with that earlier record.
    const claimed = new Set(runs.flatMap(run => run.supersedes || []));
    return unverified.filter(run => !claimed.has(run.id)).map(run => run.id);
}

export function unverifiedPriorRunNote(run: MaintenanceRun): string {
    return run.supersedes?.length
        ? `EARLIER UNVERIFIED RUN(S) ${run.supersedes.join(', ')} stopped without proof of their effects. Treat anything they may have done as possibly done: read live PRs, issues, merges and board state first, and never repeat an action you can observe. `
        : '';
}
