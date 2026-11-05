import type { Feature, FeatureApproval, FeatureBinding } from '../../src/contracts/features';
import type { Store } from '../store/store';
import { digest } from './documents';

export function enrolled(store: Store, key: string) {
    const feature = store.state.features?.find(f => f.sourceTicket === key || f.publication.some(p => p.key === key));
    return feature ? { feature, item: feature.publication.find(p => p.key === key) } : undefined;
}
export function currentApproval(feature: Feature): FeatureApproval | undefined {
    const approval = feature.approvals.at(-1);
    return approval?.featureRevision === feature.revision ? approval : undefined;
}
export function predecessorComplete(store: Store, feature: Feature, itemId: string, approval: FeatureApproval): boolean {
    const predecessor = approval.manifest.items.find(i => i.id === itemId)?.predecessor;
    if (!predecessor) return true;
    const parent = feature.publication.find(p => p.id === predecessor);
    if (!parent?.key || !parent.startedApprovalId) return false;
    if (store.project.provider === 'github')
        return !!store.state.coordination?.jobs?.some(j => j.id === parent.ownerId && j.key === parent.key && j.status === 'completed' && !!j.mergeCommit);
    return !!store.state.tickets.some(t => t.key === parent.key && t.runId === parent.ownerId && t.stage === 'complete' && t.results['staging-qa']?.outcome === 'passed');
}
/** Durable structured prerequisites, independent of replaceable intake rows. */
export function featureGate(store: Store, key: string): { allowed: boolean; reason: string; version: string } {
    if (!store.state.features?.length) return { allowed: true, reason: '', version: '' };
    const entry = enrolled(store, key), started = entry?.item?.startedApprovalId;
    const version = digest([entry?.feature.revision, entry?.feature.paused, entry?.feature.approvals.at(-1)?.digest, store.state.features?.flatMap(f => f.publication.map(p => [p.id, p.verified, p.fence, p.startedApprovalId]))]);
    const existing = store.state.coordination?.jobs?.some(j => j.key === key && (j.steps?.length || 0) > 0) || store.state.tickets.some(t => t.key === key && t.pilot);
    if (started || !entry && existing) return { allowed: true, reason: '', version };
    if (store.state.features?.some(f => f.publication.some(p => p.fence))) return { allowed: false, reason: 'Morgan is reconciling a feature ticket creation before new admissions', version };
    if (!entry) return { allowed: true, reason: '', version };
    const { feature, item } = entry, approval = currentApproval(feature);
    const reason = feature.paused ? 'Feature is paused' : !approval ? 'Feature requires approval of its current reviewed plan' :
        !item || !feature.publication.length || approval.manifest.items.some(i => !feature.publication.some(p => p.id === i.id && p.verified && (p.approvalId === approval.id || !!p.startedApprovalId))) ? 'Feature publication is not fully verified' :
        !predecessorComplete(store, feature, item.id, approval) ? 'Waiting for verified predecessor completion' : '';
    return { allowed: !reason, reason, version };
}
export function assertFeatureGate(store: Store, key: string) {
    const gate = featureGate(store, key);
    if (!gate.allowed) throw new Error(gate.reason);
}
export function assertEnrollable(store: Store, key: string, featureId = '') {
    const other = enrolled(store, key);
    if (other && other.feature.id !== featureId) throw new Error('Ticket is already enrolled in a feature');
    const jobs = store.state.coordination?.jobs || [], reviews = store.state.coordination?.listener.reviews || [];
    const aliases = new Set([key, 'ticket:' + key, ...jobs.filter(j => j.key === key).map(j => j.id), ...reviews.filter(r => r.key === key).map(r => r.id), ...(store.state.deliveryQueue || []).filter(r => r.key === key).map(r => r.id)]);
    if (jobs.some(j => j.key === key && j.status !== 'cancelled') || store.state.tickets.some(t => t.key === key && t.pilot) ||
        store.state.deliveryQueue?.some(r => r.key === key && ['working', 'queued', 'interrupted'].includes(r.status)) ||
        store.activeClaims().some(c => aliases.has(c.work.id)) ||
        reviews.some(r => r.key === key && r.status === 'working'))
        throw new Error('Delivery already owns this ticket. Start a separate follow-up feature.');
}
export function bindFeature(store: Store, key: string, ownerId: string): FeatureBinding | undefined {
    return store.transaction(() => {
        assertFeatureGate(store, key);
        const entry = enrolled(store, key);
        if (!entry?.item) return undefined;
        const { feature, item } = entry;
        const approval = item.startedApprovalId ? feature.approvals.find(a => a.id === item.startedApprovalId) : currentApproval(feature);
        if (!approval) throw new Error('Feature approval is missing');
        if (item.ownerId && item.ownerId !== ownerId) throw new Error('Another delivery owns the feature item');
        item.startedApprovalId = approval.id; item.ownerId = ownerId;
        return { featureId: feature.id, itemId: item.id, approvalId: approval.id, approvalDigest: approval.digest };
    });
}
