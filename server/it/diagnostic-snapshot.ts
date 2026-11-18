import { investigationFollowUps } from './investigations/follow-ups';
import type { ITState } from '../../src/shared';
import { followUpStatus } from '../../src/health/outstanding-follow-ups';
import type { Store } from '../store/store';
import { nativeDeliveryResolved } from './native-delivery-resolved';

/** Project current local source state without rewriting historical reports or refreshing probe timestamps. */
export function diagnosticSnapshot(store: Store): ITState | undefined {
    const it = store.state.it;
    if (!it) return;
    const followUps = (it.reports.at(-1)?.followUps || []).filter(followUp => {
        if (followUp.id.startsWith('investigation:')) return false;
        const recovery = it.recoveries[followUp.id];
        return followUp.id.startsWith('native-delivery:') ? !nativeDeliveryResolved(store, followUp.id, recovery?.requestId) : recovery?.status !== 'resolved';
    });
    for (const [id, recovery] of Object.entries(it.recoveries)) {
        if (id.startsWith('native-delivery:') && !followUps.some(f => f.id === id) && !nativeDeliveryResolved(store, id, recovery.requestId))
            followUps.push({ id, owner: 'IT', detail: recovery.detail });
    }
    for (const current of investigationFollowUps(store)) {
        const index = followUps.findIndex(item => item.id === current.id);
        if (index >= 0) followUps[index] = current; else followUps.push(current);
    }
    return { ...it, projectId: store.project.id, followUps,
        status: followUpStatus(followUps) };
}
