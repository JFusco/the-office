import { FeatureError } from './progression/failure';
import type { Feature, FeatureManifest } from '../../src/contracts/features';
import type { WorkRef } from '../../src/shared';
import { workKey } from '../../src/shared';
import type { Store } from '../store/store';
const key = (store: Store, id: string): WorkRef => ({ projectId: store.project.id, kind: 'issue', id: id.replace(/^GH-/, '') });
export function featureDependencyEdges(store: Store, feature?: Feature, manifest?: FeatureManifest): [string, WorkRef][] {
    return (feature ? [feature] : store.state.features || []).flatMap(f => {
        const items = manifest || f.approvals.at(-1)?.manifest;
        if (!items) return [];
        const identity = (id: string) => items.items.find(i => i.id === id)?.key || f.publication.find(p => p.id === id)?.key || 'feature:' + f.id + ':' + id;
        return items.items.filter(i => i.predecessor).map(i => [workKey(key(store, identity(i.id))), key(store, identity(i.predecessor))] as [string, WorkRef]);
    });
}
export function assertFeatureDependencyOrder(store: Store, feature: Feature, manifest: FeatureManifest) {
    const graph = new Map<string, string[]>();
    const edge = (from: string, to: string) => graph.set(from, [...(graph.get(from) || []), to]);
    const records = [...(store.state.coordination?.listener.reviews || []), ...(store.state.coordination?.jobs || []), ...store.state.tickets];
    for (const record of records) {
        for (const p of record.prerequisites || []) {
            if (p.target.projectId !== store.project.id) continue;
            const target = p.target.kind === 'delivery' ? store.state.coordination?.jobs?.find(j => j.id === p.target.id)?.key || p.target.id : p.target.id;
            edge(workKey(key(store, record.key)), workKey(key(store, target)));
        }
    }
    for (const [from, to] of featureDependencyEdges(store, feature, manifest)) edge(from, workKey(to));
    const active = new Set<string>(), done = new Set<string>();
    const visit = (node: string): void => {
        if (active.has(node)) throw new FeatureError('invalid-content', 'Feature order creates a prerequisite cycle');
        if (done.has(node)) return;
        active.add(node); for (const next of graph.get(node) || []) visit(next); active.delete(node); done.add(node);
    };
    for (const node of graph.keys()) visit(node);
}
