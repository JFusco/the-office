import type { ScheduledWork } from '../scheduling/scheduler';
import type { Store } from '../store/store';
import { featureGate } from './enrollment-gate';

export function gateFeatureWork(store: Store, items: ScheduledWork[]): ScheduledWork[] {
    for (const item of items) {
        if (!['delivery', 'intake'].includes(item.work.kind)) continue;
        const key = store.state.coordination?.jobs?.find(j => j.id === item.work.id)?.key ||
            store.state.coordination?.listener.reviews.find(r => r.id === item.work.id)?.key ||
            store.state.deliveryQueue?.find(r => r.id === item.work.id)?.key ||
            store.state.tickets.find(t => item.work.id === t.key || item.work.id === 'ticket:' + t.key)?.key;
        if (!key) continue;
        const original = item.identity, eligible = item.claimEligible;
        item.identity = () => original() + ':' + featureGate(store, key).version;
        item.claimEligible = () => (!eligible || eligible()) && featureGate(store, key).allowed;
        const gate = featureGate(store, key);
        if (!gate.allowed && item.eligibility.state === 'runnable') item.eligibility = { state: 'waiting', reason: gate.reason, owner: 'Morgan', nextCheckAt: null };
    }
    return items;
}
