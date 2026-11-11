import { uncertainPublications } from './release/reconcile-publication';
import { pendingRounds } from './questions/pending-round';
import { deliveryPreflight, type DeliveryPreflight } from './release/delivery-preflight';
import type { FeaturePublicationItem } from '../../src/contracts/features';
import { readHandoff, handoffBinding } from './release/handoff-readback';
import { FeatureError } from './progression/failure';
import { recoverFailure } from './progression/recover-failure';
import type { OfficeEntry } from '../scheduling/scheduled-work';
import type { ScheduledWork } from '../scheduling/scheduler';
import { observeHelperGroups } from './review-processes';
import { featureGate, currentApproval } from './enrollment-gate';
import { featureById } from './commands';
import { automaticFeature, automaticEnabled } from './progression/policy';
import { FEATURE_PLANNING } from '../office/config';
import { recoveryHeld } from './progression/wake';
export function scheduledFeatures({ store, engine, coordinator }: OfficeEntry): ScheduledWork[] {
    return (store.state.features || []).flatMap(feature => {
        if (feature.phase === 'complete') return [];
        const policyWait = automaticFeature(feature) && !automaticEnabled(feature, FEATURE_PLANNING);
        const revision = feature.revision;
        const reconcile = automaticFeature(feature) && uncertainPublications(store,feature).length > 0;
        const reconcileWait = reconcile && (pendingRounds(feature,'harness').length > 0 || !!feature.recovery?.nextAt && Date.parse(feature.recovery.nextAt)>store.clock.now().getTime());
        const approval = !reconcile && !recoveryHeld(feature) && feature.phase === 'delivery' && feature.status === 'waiting' ? currentApproval(feature) : undefined;
        // A waiting item must not hide a later admissible one, such as its own reordered predecessor.
        let preflight: DeliveryPreflight | undefined, admissible: FeaturePublicationItem | undefined;
        for (const item of approval ? feature.publication.filter(p => !p.queued && p.verified && approval.manifest.items.some(i => i.id === p.id)) : []) {
            const decision = deliveryPreflight(store, feature, item, coordinator?.dependencyStores?.());
            preflight ??= decision;
            if (decision.kind !== 'wait') { preflight = decision; admissible = item; break; }
        }
        const pending = admissible;
        const stage = reconcile ? 'feature-publication-readback' : pending ? 'feature-delivery-admission' : 'feature-' + feature.phase;
        return [{ store, work: { projectId: store.project.id, kind: 'feature' as const, id: feature.id }, stage, rank: 3, enqueuedAt: feature.enqueuedAt, timing: feature.timing,
            eligibility: { state: policyWait || store.state.paused || feature.paused || reconcileWait ? 'waiting' : reconcile ? 'runnable' : feature.status === 'queued' || pending ? 'runnable' : feature.status === 'working' ? 'running' : feature.status === 'blocked' ? 'blocked' : 'waiting', reason: policyWait ? 'Waiting for automatic feature policy activation' : preflight?.reason || feature.detail, owner: feature.phase === 'plan' ? 'Alex' : feature.phase === 'delivery' ? 'Morgan' : 'Casey', nextCheckAt: feature.recovery?.nextAt ?? null },
            identity: () => JSON.stringify([feature.revision, feature.phase, feature.status, feature.paused, feature.activeAttempt, pending?.id, currentApproval(feature)?.id, pending?.handoff, feature.recovery?.generation]),
            claimEligible: () => {
                const current = featureById(store, feature.id), item = current.publication.find(p => p.id === pending?.id);
                return (!automaticFeature(current) || automaticEnabled(current, FEATURE_PLANNING)) && ![current, ...current.reviewHistory.map(review => ({ ...current, review }))].some(owner => observeHelperGroups(store, owner).length) && !current.paused && !store.state.paused && current.revision === revision &&
                    (reconcile ? uncertainPublications(store,current).length>0 && !pendingRounds(current,'harness').length && (!current.recovery?.nextAt || Date.parse(current.recovery.nextAt)<=store.clock.now().getTime()) : pending ? !recoveryHeld(current) && current.phase === 'delivery' && current.status === 'waiting' && !!currentApproval(current) && !!item?.verified && !item.queued && featureGate(store, item.key).allowed : current.status === 'queued');
            },
            execute: async () => {
                if (reconcile) return engine.features.reconcile(feature.id);
                if (!pending) return engine.features.step(feature.id);
                try {
                    store.transaction(() => {
                        const current = featureById(store, feature.id), item = current.publication.find(p => p.id === pending.id)!;
                        if (recoveryHeld(current)) return;
                        if (current.revision !== revision || current.phase !== 'delivery' || !currentApproval(current) || current.paused || store.state.paused || !item.verified || !featureGate(store, item.key).allowed) throw new Error('Feature admission changed before handoff');
                        if (item.queued) return;
                        const decision = deliveryPreflight(store, current, item, coordinator?.dependencyStores?.());
                        if (decision.kind === 'wait') return;
                        if (decision.kind === 'conflict') throw new FeatureError('ownership', decision.reason);
                        if (!readHandoff(store, current, item)) {
                            const binding = handoffBinding(current, item);
                            const record = store.project.provider === 'github' ? coordinator!.requestWork(item.key, binding) : engine.requestDelivery(item.key, 'start-pilot', undefined, {binding});
                            item.handoff = {featureId: current.id, itemId: item.id, approvalId: binding.approvalId, kind: store.project.provider === 'github' ? 'review' : 'request', id: record.id};
                        }
                        if (!readHandoff(store, current, item)) throw new Error('The exact authorized handoff did not read back');
                        item.queued = true;
                    });
                } catch (error) {
                    store.transaction(() => {
                        const current = featureById(store, feature.id);
                        if (current.revision !== revision) return;
                        current.status = 'blocked'; current.detail = 'Delivery handoff needs reconciliation: ' + String(error);
                        recoverFailure(store, current, error, 'admission:' + revision + ':' + (current.recovery?.generation ?? 0));
                    });
                }
            } } satisfies ScheduledWork];
    });
}
