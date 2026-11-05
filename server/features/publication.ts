import type { Feature, FeatureManifest, FeatureManifestItem, FeatureOperation } from '../../src/contracts/features';
import type { EffectIntent } from '../../src/shared';
import type { Store } from '../store/store';
import { Effects, EffectUncertainError } from '../store/effects';
import { assertEnrollable, currentApproval } from './enrollment-gate';
import { featureById } from './commands';

export interface PublicationReceipt { key: string; url: string; [field: string]: unknown }
export interface FeaturePublisher {
    context(): Promise<string>;
    verifyFinal?(item: FeatureManifestItem, receipt: PublicationReceipt): Promise<boolean>;
    validate(manifest: FeatureManifest): Promise<void>;
    preflight(item: FeatureManifestItem, operation: FeatureOperation, key: string): Promise<void>;
    dispatch(item: FeatureManifestItem, operation: FeatureOperation, key: string, marker: string): Promise<PublicationReceipt>;
    readBack(intent: Readonly<EffectIntent>): Promise<{ verified: boolean; receipt: PublicationReceipt }>;
    verify(receipt: PublicationReceipt, operation: FeatureOperation): Promise<boolean>;
}
function reserveIdentity(store: Store, featureId: string, itemId: string, receipt: PublicationReceipt) {
    store.transaction(() => {
        const feature = featureById(store, featureId), item = feature.publication.find(p => p.id === itemId);
        if (!item) throw new Error('Publication item is missing');
        if (!receipt.key || !receipt.url || item.key && item.key !== receipt.key) throw new Error('Publication returned conflicting ticket identity');
        if (store.state.features?.some(f => f.id !== feature.id && (f.sourceTicket === receipt.key || f.publication.some(p => p.key === receipt.key)))) throw new Error('Ticket belongs to another feature');
        if (!item.startedApprovalId) assertEnrollable(store, receipt.key, feature.id);
        item.key = receipt.key; item.url = receipt.url; item.fence = false;
    });
}
/** Stable item create IDs survive reorder and reapproval. Existing intent metadata is immutable. */
export async function publishFeature(store: Store, feature: Feature, provider: FeaturePublisher) {
    const featureId = feature.id;
    const approval = currentApproval(featureById(store, featureId));
    if (!approval) throw new Error('Current feature approval is required');
    const authorized = () => {
        const current = featureById(store, featureId);
        if (currentApproval(current)?.id !== approval.id || currentApproval(current)?.digest !== approval.digest || current.paused || store.state.paused) throw new Error('Feature authorization changed before publication');
        return current;
    };
    const mappedItem = (itemId: string) => {
        const mapped = featureById(store, featureId).publication.find(p => p.id === itemId);
        if (!mapped) throw new Error('Publication item is missing');
        return mapped;
    };
    authorized();
    const effects = new Effects(store);
    for (const item of approval.manifest.items) {
        authorized();
        if (mappedItem(item.id).startedApprovalId) continue;
        // An earlier approval's attempted operations must settle before replacement work.
        for (const id of [...mappedItem(item.id).effects]) {
            const prior = store.getEffect(id);
            if (prior && ['dispatching', 'uncertain'].includes(prior.status)) {
                if (!await effects.reconcile(id, intent => provider.readBack(intent))) throw new EffectUncertainError(id, 'Ticket publication remains uncertain; no resend');
                reserveIdentity(store, featureId, item.id, store.getEffect(id)!.receipt as PublicationReceipt);
                authorized();
            }
        }
        for (const operation of item.operations) {
            authorized();
            const mapped = mappedItem(item.id);
            if (mapped.startedApprovalId) break;
            const create = operation.kind === 'create';
            if (create && mapped.key && !mapped.createIntent) continue;
            let effectId = create ? 'feature:' + feature.id + ':item:' + item.id + ':create' : 'feature:' + feature.id + ':item:' + item.id + ':' + operation.id + ':' + approval.id;
            if (create && mapped.createIntent) effectId = mapped.createIntent;
            const prior = store.getEffect<any>(effectId);
            if (create && prior?.status === 'rejected' && !prior.dispatchedAt && prior.authorization !== approval.digest && prior.payload.operation.id !== operation.id) effectId = 'feature:' + feature.id + ':item:' + item.id + ':create:' + operation.id;
            const existing = store.getEffect(effectId);
            const marker = 'office-feature-' + feature.id + '-item-' + item.id;
            if (existing && ['dispatching', 'uncertain'].includes(existing.status)) {
                if (!await effects.reconcile(effectId, intent => provider.readBack(intent))) throw new EffectUncertainError(effectId, 'Ticket publication remains uncertain; no resend');
            }
            const saved = store.getEffect(effectId);
            if (saved?.status === 'verified') {
                reserveIdentity(store, featureId, item.id, saved.receipt as PublicationReceipt);
                continue;
            }
            if (saved && saved.authorization !== approval.digest) throw new Error('Prior undispatched operation needs a reviewed replacement; its authorization cannot be changed');
            store.transaction(() => {
                authorized();
                const current = mappedItem(item.id);
                if (!current.effects.includes(effectId)) current.effects.push(effectId);
                if (create) { current.createIntent = effectId; current.fence = true; }
            });
            const key = mappedItem(item.id).key;
            const dispatchAllowed = () => {
                authorized();
                const current = mappedItem(item.id);
                if (current.startedApprovalId || current.key !== key) throw new Error('Publication item changed before dispatch');
            };
            let receipt: PublicationReceipt;
            try { receipt = await effects.execute({
                id: effectId, work: { projectId: store.project.id, kind: 'feature', id: featureId }, attemptId: approval.id,
                operation: 'feature-' + operation.kind, target: store.project.repository,
                authorization: approval.digest, payload: { item, operation, key, marker }, expectedState: { approval: approval.digest, operation: operation.expected },
                preflight: async () => {
                    await provider.preflight(item, operation, key);
                    dispatchAllowed();
                },
                dispatch: () => { dispatchAllowed(); return provider.dispatch(item, operation, key, marker); },
                verify: async receipt => {
                    if (!await provider.verify(receipt, operation)) return false;
                    reserveIdentity(store, featureId, item.id, receipt); return true;
                },
            }); } catch (error) {
                const failed = store.getEffect(effectId);
                if (create && failed?.status === 'rejected' && !failed.dispatchedAt) store.transaction(() => { mappedItem(item.id).fence = false; });
                throw error;
            }
            reserveIdentity(store, featureId, item.id, receipt);
        }
    }
    for (const item of approval.manifest.items) {
        authorized();
        const mapped = mappedItem(item.id);
        if (!mapped.startedApprovalId && provider.verifyFinal && !await provider.verifyFinal(item, { key: mapped.key, url: mapped.url }))
            throw new Error('Final ticket content, assignment or intake visibility changed; reconcile before admission');
    }
    store.transaction(() => {
        const current = authorized();
        for (const item of approval.manifest.items) {
            const mapped = current.publication.find(p => p.id === item.id)!;
            if (!mapped.startedApprovalId) { mapped.approvalId = approval.id; mapped.verified = true; }
        }
        current.status = 'waiting'; current.detail = 'Ticket publication verified; ordered delivery is ready for admission.';
    });
}
