import type { Feature, FeatureBinding, FeaturePublicationItem } from '../../../src/contracts/features';
import type { Store } from '../../store/store';
import { currentApproval } from '../enrollment-gate';

export function handoffBinding(feature: Feature, item: FeaturePublicationItem): FeatureBinding {
    const approval = currentApproval(feature);
    if (!approval || !approval.manifest.items.some(i => i.id === item.id)) throw new Error('Current feature item approval is missing');
    return {featureId: feature.id, itemId: item.id, approvalId: approval.id, approvalDigest: approval.digest};
}
export function sameBinding(a: FeatureBinding | undefined, b: FeatureBinding) {
    return !!a && a.featureId === b.featureId && a.itemId === b.itemId && a.approvalId === b.approvalId && a.approvalDigest === b.approvalDigest;
}
/** A ticket key alone is never evidence that this authorized handoff succeeded. */
export function readHandoff(store: Store, feature: Feature, item: FeaturePublicationItem): boolean {
    const binding = handoffBinding(feature, item), saved = item.handoff;
    if (store.state.coordination?.jobs?.some(j => j.key === item.key && j.status !== 'cancelled' && sameBinding(j.featureBinding, binding))) return true;
    if (store.state.tickets.some(t => t.key === item.key && t.pilot && sameBinding(t.featureBinding, binding))) return true;
    if (!saved || saved.featureId !== binding.featureId || saved.itemId !== binding.itemId || saved.approvalId !== binding.approvalId) return false;
    const record = saved.kind === 'request' ? store.state.deliveryQueue?.find(r => r.id === saved.id) : saved.kind === 'review' ? store.state.coordination?.listener.reviews.find(r => r.id === saved.id) : undefined;
    return !!record && record.key === item.key && ['queued', 'working'].includes(record.status) && sameBinding(record.featureBinding, binding);
}
