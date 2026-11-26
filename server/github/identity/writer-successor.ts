import type { Store } from '../../store/store';

/** True for an intent the dispatch claim refused unsent: it never reached the provider. */
export const writerRefused = (intent: { status: string; dispatchedAt: string; writerRefusedAt?: string } | undefined) =>
    intent?.status === 'rejected' && !intent.dispatchedAt && !!intent.writerRefusedAt;

/**
 * The id a fixed-id GitHub caller uses next. An id the dispatch claim refused unsent keeps its row and audit, and its
 * successor is the same id with a counted writer-refusal suffix, so concurrent retries derive the same one. Any other
 * id, including one rejected for any other reason or attempted, is its own and keeps the caller's existing rules.
 */
export function writerSuccessor(store: Store, id: string): string {
    let next = id;
    for (let n = 1; writerRefused(store.getEffect(next)); n++) next = `${id}:writer-${n}`;
    return next;
}
