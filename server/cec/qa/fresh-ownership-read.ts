import type { Store } from '../../store/store';
import type { SessionBridge } from '../../workers/session-bridge';

/** Wait out an older in-flight observation, then request at most one observation after source verification. */
export async function freshOwnershipRead(bridge: Pick<SessionBridge, 'refresh' | 'forProject'> | undefined,
    store: Store, key: string, requestId: string, after: string) {
    if (!bridge || !Number.isFinite(Date.parse(after))) return;
    const read = await bridge.refresh();
    if (Date.parse(read.observedAt) < Date.parse(after)) await bridge.refresh();
    // The caller still requires complete/fresh coverage and unchanged authority. No TTL or grace change.
    return bridge.forProject(store, key, requestId);
}
