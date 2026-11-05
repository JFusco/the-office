import type { Feature } from '../../src/contracts/features';
import type { Store } from '../store/store';
export function featureItemComplete(store: Store, feature: Feature, itemId: string) {
    const item = feature.publication.find(p => p.id === itemId);
    if (!item?.startedApprovalId || !item.ownerId) return false;
    if (store.project.provider === 'github') return !!store.state.coordination?.jobs?.some(j => j.id === item.ownerId && j.key === item.key && j.status === 'completed' && !!j.mergeCommit);
    return store.state.tickets.some(t => t.key === item.key && t.runId === item.ownerId && t.stage === 'complete' && t.results['staging-qa']?.outcome === 'passed');
}
export function reconcileFeatureCompletion(store: Store) {
    for (const feature of store.state.features || []) {
        if (feature.phase !== 'delivery') continue;
        const approval = feature.approvals.at(-1);
        if (approval?.featureRevision !== feature.revision || !approval.manifest.items.every(i => featureItemComplete(store, feature, i.id))) continue;
        store.transaction(() => { feature.phase = 'complete'; feature.status = 'completed'; feature.detail = 'Every approved ticket reached its verified delivery milestone.'; store.emit('feature-completed', feature.title + ': ' + feature.detail, 'pm'); });
    }
}
