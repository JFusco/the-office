import { defaultPickupStatus } from '../../delivery/intake/default-pickup';
import type { Feature } from '../../../src/contracts/features';
import type { OfficeProject, OfficeSnapshot } from '../../../src/shared';
import { deferredPickup } from '../../../src/work/pickup-state';
import { currentApproval } from '../enrollment-gate';

/** What the intake gate reads: a project's state and identity. A Store is one; so is an incident observation. */
export interface IntakeView { state: OfficeSnapshot; project: Pick<OfficeProject, 'id' | 'provider'> }

export function automaticTicketIntakeWait(store: IntakeView, key: string): string {
    if (!key) return '';
    if (!store.state.coordination?.listener.assigned.some(issue => issue.key === key)) return 'Waiting for current configured intake membership';
    return deferredPickup(store.state, key, defaultPickupStatus(store.project)) ? `Waiting for ${store.state.coordination?.pickup?.status || defaultPickupStatus(store.project)} intake` : '';
}
/** Explicitly created planning is allowed outside intake. Approved delivery keeps its own fences. */
export function automaticIntakeWait(store: IntakeView, feature: Feature): string {
    if (!feature.handoff || !feature.sourceTicket || currentApproval(feature) || feature.publication.some(item => item.effects?.length || item.fence || item.startedApprovalId || item.queued)) return '';
    return automaticTicketIntakeWait(store, feature.sourceTicket);
}
