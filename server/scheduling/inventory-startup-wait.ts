import { boardPreflightCandidate } from '../delivery/recovery/board-preflight';
import type { Store } from '../store/store';
import type { SessionBridge } from '../workers/session-bridge';
import type { HarnessRequest, WorkEligibility } from '../../src/shared';

/** Request kinds whose handlers always read the shared session inventory (server/scheduling/requests.ts). */
const ALWAYS: ReadonlySet<string> = new Set(['resume-discovery', 'reconcile-implementation', 'reconcile-validation', 'adopt-candidate', 'reconcile-scope-repair', 'cleanup-merged-candidate']);
/** Kinds that read it only for the exact original worker their head names; without a head they reconcile a saved result. */
const HEADED: ReadonlySet<string> = new Set(['reconcile-preparation', 'reconcile-closeout']);
export const STARTUP_WAIT_REASON = 'Waiting for the first complete session inventory since the Office started';

/** Whether this form of the request reads the shared inventory when its handler runs. */
function readsInventory(store: Store, request: Pick<HarnessRequest, 'action' | 'key' | 'head'>): boolean {
    if (ALWAYS.has(request.action)) return true;
    if (HEADED.has(request.action)) return !!request.head;
    if (request.action !== 'reconcile-base-update' || !request.head) return false;
    // Only the board-preflight read-back reads ownership, and only for the head it admitted; a stopped worker's ID does not.
    const job = store.state.coordination?.jobs?.find(job => job.key === request.key && job.status !== 'cancelled');
    if (!job || job.head !== request.head) return false;
    try { return boardPreflightCandidate(store, job)?.head === request.head; }
    // A failed local read holds only this request; once the inventory has been complete, its handler owns the error.
    catch { return true; }
}

/**
 * A queued request that reads the shared session inventory waits until that inventory has been complete once since the
 * Office started, so a cold read after a restart cannot spend it. Its handler's own ownership check is unchanged, and
 * nothing waits without a bridge.
 */
export function inventoryStartupWait(store: Store, request: Pick<HarnessRequest, 'action' | 'key' | 'head' | 'status'>, bridge?: Pick<SessionBridge, 'firstCompleteAt'>): WorkEligibility | null {
    if (request.status !== 'queued' || bridge?.firstCompleteAt !== '' || !readsInventory(store, request)) return null;
    return { state: 'waiting', reason: STARTUP_WAIT_REASON, owner: 'Office', nextCheckAt: null };
}
