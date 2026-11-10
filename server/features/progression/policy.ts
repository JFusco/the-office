import { createHash } from 'node:crypto';
import type { Feature, FeatureProgression } from '../../../src/contracts/features';

export interface FeaturePlanningConfig {
    progression?: FeatureProgression;
    assessment?: { enabled?: boolean; planningLabels?: string[]; ordinaryLabels?: string[] };
}
export type FeaturePlanningBindings = Record<string, FeaturePlanningConfig>;
export const POLICY_VERSION = 'pm-casey-v1';
export function featurePolicy(projectId: string, bindings: FeaturePlanningBindings = {}) {
    const input = bindings[projectId];
    const policy = { version: POLICY_VERSION, projectId, progression: input?.progression ?? 'manual',
        assessment: { enabled: input?.assessment?.enabled ?? false,
            planningLabels: [...(input?.assessment?.planningLabels ?? [])].sort(), ordinaryLabels: [...(input?.assessment?.ordinaryLabels ?? [])].sort() } };
    return { ...policy, digest: createHash('sha256').update(JSON.stringify(policy)).digest('hex') };
}
export function automaticFeature(feature: Feature) { return feature.progression === 'automatic'; }
export function automaticEnabled(feature: Feature, bindings: FeaturePlanningBindings) {
    return automaticFeature(feature) && featurePolicy(feature.projectId, bindings).progression === 'automatic';
}
export function assertFeaturePlanningConfig(bindings: unknown): asserts bindings is FeaturePlanningBindings | undefined {
    if (bindings === undefined) return;
    if (!bindings || typeof bindings !== 'object' || Array.isArray(bindings)) throw new Error('Feature planning must be a per-project configuration');
    for (const [project, value] of Object.entries(bindings)) {
        const c = value as FeaturePlanningConfig;
        if (!/^[a-zA-Z0-9_-]+$/.test(project) || !c || typeof c !== 'object' || Array.isArray(c) ||
            Object.keys(c).some(k => !['progression', 'assessment'].includes(k)) ||
            c.progression !== undefined && !['manual', 'automatic'].includes(c.progression)) throw new Error('Invalid feature planning policy');
        const a = c.assessment;
        if (a === undefined) continue;
        if (!a || typeof a !== 'object' || Array.isArray(a) || Object.keys(a).some(k => !['enabled', 'planningLabels', 'ordinaryLabels'].includes(k)) ||
            a.enabled !== undefined && typeof a.enabled !== 'boolean') throw new Error('Invalid feature assessment policy');
        for (const labels of [a.planningLabels, a.ordinaryLabels]) if (labels !== undefined && (!Array.isArray(labels) || labels.some(l => typeof l !== 'string' || !l.trim() || l !== l.trim()) || new Set(labels).size !== labels.length))
            throw new Error('Feature planning labels must be unique nonempty exact labels');
        if (a.planningLabels?.some(l => a.ordinaryLabels?.includes(l))) throw new Error('Feature planning and ordinary labels must be disjoint');
    }
}
