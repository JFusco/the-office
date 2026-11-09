import type { Store } from '../store/store';
import { enqueueRequest } from '../scheduling/requests';
import { improvementEligible } from './admit-improvement';
/** Admission requests use the existing operations lane, never Harper's model capacity. */
export function queueImprovements(store: Store): void {
    if (store.state.paused || store.state.draining || !store.state.knowledge?.enabled) return;
    const now = store.clock.now().toISOString();
    const pending = (id: string) => !!store.state.coordination?.requests?.some(request => request.action === 'admit-improvement' && request.head === id && ['queued', 'working'].includes(request.status));
    for (const item of store.state.knowledge?.improvements || []) {
        // Existing reservations reconcile by read-back (never resend) and closure checks free capacity; neither waits on the cap.
        if (['open', 'reserved', 'publishing', 'uncertain'].includes(item.status)) {
            if ((!item.nextCheckAt || item.nextCheckAt <= now) && !pending(item.id)) enqueueRequest(store, 'admit-improvement', '', item.id, 'operations');
            continue;
        }
        if ((store.state.knowledge!.improvements || []).filter(other => ['reserved', 'publishing', 'uncertain', 'open'].includes(other.status)).length >= 3) continue;
        if (item.status !== 'proposed' || !improvementEligible(store, item)) continue;
        if (pending(item.id)) continue;
        enqueueRequest(store, 'admit-improvement', '', item.id, 'operations');
    }
}
