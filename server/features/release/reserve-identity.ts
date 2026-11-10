import type { Store } from '../../store/store';
import type { PublicationReceipt } from '../publication';
import { featureById } from '../commands';
import { enrolled, assertEnrollable } from '../enrollment-gate';
export function reserveIdentity(store: Store, featureId: string, itemId: string, receipt: PublicationReceipt) {
    store.transaction(() => {
        const feature = featureById(store, featureId), item = feature.publication.find(p => p.id === itemId);
        if (!item) throw new Error('Publication item is missing');
        if (!receipt.key || !receipt.url || item.key && item.key !== receipt.key) throw new Error('Publication returned conflicting ticket identity');
        if (enrolled(store, receipt.key) && enrolled(store, receipt.key)!.feature.id !== feature.id) throw new Error('Ticket belongs to another feature');
        if (!item.startedApprovalId) assertEnrollable(store, receipt.key, feature.id);
        item.key = receipt.key; item.url = receipt.url; item.fence = false;
    });
}
