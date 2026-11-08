import { CommandFailure } from './process';
import { sanitize } from '../office/security';
import type { Store } from '../store/store';

/** Retain a typed process failure for deterministic IT admission, not model-written outcomes. */
export function recordWorkerFailure(store: Store, id: string, error: unknown): void {
    const work = store.state.workLog?.find(work => work.id === id);
    if (work && error instanceof CommandFailure)
        work.failure = { category: error.category, dispatched: error.dispatched, detail: sanitize(error.message).slice(0, 1000) };
}
