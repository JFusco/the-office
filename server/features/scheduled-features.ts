import type { OfficeEntry } from '../scheduling/scheduled-work';
import type { ScheduledWork } from '../scheduling/scheduler';
import { observeHelperGroups } from './review-processes';
import { featureGate, currentApproval } from './enrollment-gate';
import { featureById } from './commands';
import { automaticFeature, automaticEnabled } from './progression/policy';
import { FEATURE_PLANNING } from '../office/config';
import { recoveryHeld } from './progression/wake';
export function scheduledFeatures({ store, engine, coordinator }: OfficeEntry): ScheduledWork[] {
    const owned = (key: string) => store.state.coordination?.jobs?.some(j => j.key === key && j.status !== 'cancelled') ||
        store.state.tickets.some(t => t.key === key && t.pilot) || store.state.deliveryQueue?.some(r => r.key === key && ['queued', 'working'].includes(r.status));
    return (store.state.features || []).flatMap(feature => {
        if (feature.phase === 'complete') return [];
        const policyWait = automaticFeature(feature) && !automaticEnabled(feature, FEATURE_PLANNING);
        const revision = feature.revision;
        const pending = !recoveryHeld(feature) && feature.phase === 'delivery' && feature.status === 'waiting' && currentApproval(feature)
            ? feature.publication.find(p => {
                if (p.queued || !p.verified) return false;
                if (owned(p.key)) { store.transaction(() => { featureById(store, feature.id).publication.find(item => item.id === p.id)!.queued = true; }); return false; }
                return featureGate(store, p.key).allowed && (store.project.provider === 'github' ? store.state.coordination?.listener.assigned.some(i => i.key === p.key) : store.state.tickets.some(t => t.key === p.key));
            }) : undefined;
        const stage = pending ? 'feature-delivery-admission' : 'feature-' + feature.phase;
        return [{ store, work: { projectId: store.project.id, kind: 'feature' as const, id: feature.id }, stage, rank: 3, enqueuedAt: feature.enqueuedAt, timing: feature.timing,
            eligibility: { state: policyWait || store.state.paused || feature.paused ? 'waiting' : feature.status === 'queued' || pending ? 'runnable' : feature.status === 'working' ? 'running' : feature.status === 'blocked' ? 'blocked' : 'waiting', reason: policyWait ? 'Waiting for automatic feature policy activation' : feature.detail, owner: feature.phase === 'plan' ? 'Alex' : feature.phase === 'delivery' ? 'Morgan' : 'Casey', nextCheckAt: feature.recovery?.nextAt ?? null },
            identity: () => JSON.stringify([feature.revision, feature.phase, feature.status, feature.paused, feature.activeAttempt, pending?.id, feature.recovery?.generation]),
            claimEligible: () => {
                const current = featureById(store, feature.id), item = current.publication.find(p => p.id === pending?.id);
                return (!automaticFeature(current) || automaticEnabled(current, FEATURE_PLANNING)) && ![current, ...current.reviewHistory.map(review => ({ ...current, review }))].some(owner => observeHelperGroups(store, owner).length) && !current.paused && !store.state.paused && current.revision === revision &&
                    (pending ? !recoveryHeld(current) && current.phase === 'delivery' && current.status === 'waiting' && !!currentApproval(current) && !!item?.verified && !item.queued && featureGate(store, item.key).allowed : current.status === 'queued');
            },
            execute: async () => {
                if (!pending) return engine.features.step(feature.id);
                try {
                    store.transaction(() => {
                        const current = featureById(store, feature.id), item = current.publication.find(p => p.id === pending.id)!;
                        if (recoveryHeld(current)) return;
                        if (current.revision !== revision || current.phase !== 'delivery' || !currentApproval(current) || current.paused || store.state.paused || !item.verified || !featureGate(store, item.key).allowed) throw new Error('Feature admission changed before handoff');
                        if (item.queued) return;
                        if (!owned(item.key)) {
                            if (store.project.provider === 'github') coordinator!.requestWork(item.key);
                            else engine.requestDelivery(item.key, 'start-pilot');
                        }
                        item.queued = true;
                    });
                } catch (error) {
                    store.transaction(() => {
                        const current = featureById(store, feature.id);
                        if (current.revision !== revision) return;
                        current.status = 'blocked'; current.detail = 'Delivery handoff needs reconciliation: ' + String(error);
                    });
                }
            } } satisfies ScheduledWork];
    });
}
