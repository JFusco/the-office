import type { ITInvestigation } from '../../../src/contracts/it-investigations';
import type { Store } from '../../store/store';

/**
 * A transient read failure is classified only for read-only work, so it has no effect to reconcile. A later
 * completed attempt of the same request at the same stage settles it.
 */
export function retriedReadResolution(store: Store, entry: ITInvestigation) {
    if (entry.source.kind !== 'worker' || entry.source.failureKind !== 'transient-read') return;
    const work = store.state.workLog || [], failed = work.find(item => item.id === entry.source.id && item.requestId === entry.source.requestId);
    // Without a request ID there is nothing binding a later attempt to this one.
    if (!failed?.requestId || !failed.startedAt) return;
    const later = work.find(item => item.requestId === failed.requestId && item.stage === failed.stage && item.status === 'completed' && !!item.startedAt && item.startedAt > failed.startedAt);
    return later ? { kind: 'confirmed' as const, sourceId: later.id, receipt: `worker:${later.id}` } : undefined;
}
