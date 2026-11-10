import type { Store } from '../../store/store';
import type { Feature } from '../../../src/contracts/features';
import type { FeaturePublisher, PublicationReceipt } from '../publication';
import { Effects, EffectUncertainError } from '../../store/effects';
import { reserveIdentity } from './reserve-identity';
import { featureById } from '../commands';
import { pendingRounds } from '../questions/pending-round';
export function uncertainPublications(store: Store, feature: Feature) {
    return feature.publication.flatMap(item => item.effects.map(id => ({itemId: item.id, effect: store.getEffect(id)})))
        .filter(row => row.effect && ['dispatching','uncertain'].includes(row.effect.status));
}
/** Original intent remains readable after its authorization is superseded. Never dispatches. */
export async function reconcilePublication(store: Store, feature: Feature, provider: FeaturePublisher) {
    for (const {itemId, effect} of uncertainPublications(store, feature)) {
        if (!await new Effects(store).reconcile(effect!.id, intent => provider.readBack(intent))) throw new EffectUncertainError(effect!.id, 'Original publication remains uncertain; no resend');
        const current=featureById(store,feature.id),item=current.publication.find(p=>p.id===itemId);
        if (!item?.effects.includes(effect!.id)) throw new Error('Original publication identity changed during read-back');
        reserveIdentity(store, feature.id, itemId, store.getEffect(effect!.id)!.receipt as PublicationReceipt);
    }
    store.transaction(() => {
        const current=featureById(store,feature.id);
        // Only work that was waiting on this read-back resumes; unrelated waits and questions keep their state.
        const resume = current.recovery?.wait === 'fence' || current.phase === 'delivery' && ['queued','blocked'].includes(current.status);
        if (current.recovery?.wait === 'fence') {current.recovery.wait=undefined;current.recovery.nextAt=null;}
        if (!resume || pendingRounds(current).length) return;
        current.status='queued';current.enqueuedAt=store.clock.now().toISOString();current.detail='Original publication reconciled; current authorization gates still apply';
    });
}
