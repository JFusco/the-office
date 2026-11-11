import type { Store } from '../../store/store';
import { digest } from '../documents';
/** One observer per store, shared by all SSE clients; authorization is recomputed on every refresh. */
export class QuestionNotifications {
    private stores = new Map<Store, () => void>();
    private listeners = new Set<() => void>();
    private hash: string;
    constructor(private projection: () => unknown) { this.hash = digest(projection()); }
    observe(stores: Iterable<Store>) {
        const current = new Set(stores);
        for (const [store, listener] of this.stores) if (!current.has(store)) { store.commitListeners.delete(listener); this.stores.delete(store); }
        // Store drops a listener that threw; re-adding it here resumes notifications on the next pump.
        for (const store of current) { const listener = this.stores.get(store) ?? (() => this.refresh()); this.stores.set(store,listener); store.commitListeners.add(listener); }
        this.refresh();
    }
    refresh() {
        const hash = digest(this.projection());
        if (hash === this.hash) return;
        this.hash = hash;
        for (const listener of this.listeners) { try { listener(); } catch { this.listeners.delete(listener); } }
    }
    subscribe(listener: () => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
    dispose() { for (const [store,listener] of this.stores) store.commitListeners.delete(listener); this.stores.clear(); this.listeners.clear(); }
}
