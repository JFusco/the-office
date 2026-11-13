import type { Feature } from '../../../src/contracts/features';
import type { Store } from '../../store/store';
import { deferredPickup } from '../../../src/work/pickup-state';
import { currentApproval } from '../enrollment-gate';

export function automaticTicketIntakeWait(store: Store, key: string): string {
    if (!key) return '';
    if (!store.state.coordination?.listener.assigned.some(issue => issue.key === key)) return 'Waiting for current configured intake membership';
    return deferredPickup(store.state, key) ? `Waiting for ${store.state.coordination?.pickup?.status || (store.project.provider === 'github' ? 'Ready' : 'To Do')} intake` : '';
}
/** Explicitly created planning is allowed outside intake. Approved delivery keeps its own fences. */
export function automaticIntakeWait(store: Store, feature: Feature): string {
    if (!feature.handoff || !feature.sourceTicket || currentApproval(feature) || feature.publication.some(item => item.effects?.length || item.fence || item.startedApprovalId || item.queued)) return '';
    return automaticTicketIntakeWait(store, feature.sourceTicket);
}
