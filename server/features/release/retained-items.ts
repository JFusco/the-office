import type { Feature, FeatureManifest } from '../../../src/contracts/features';
import { digest } from '../documents';

export function assertRetainedItems(feature: Feature, manifest: FeatureManifest) {
    for (const item of feature.publication) {
        const next = manifest.items.find(i => i.id === item.id);
        if (!next) throw new Error('Published or uncertain items must retain their stable identity');
        if (item.startedApprovalId) {
            const prior = feature.approvals.find(a => a.id === item.startedApprovalId)?.manifest.items.find(i => i.id === item.id);
            if (!prior || digest(prior) !== digest(next)) throw new Error('Started work retains its approved scope; create a follow-up feature');
        }
        if (item.key && next.key && item.key !== next.key) throw new Error('Mapped ticket identity cannot change');
    }
}
