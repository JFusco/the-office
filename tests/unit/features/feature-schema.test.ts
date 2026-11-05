import { expect, test } from 'vitest';
import { DiscoverySchema, ManifestSchema, manifestFromPlan } from '../../../server/features/feature-schema';
const item = { id: 'one', title: 'First', key: '', action: 'create', predecessor: '', criteria: ['Works'], operations: [{ id: 'create', kind: 'create', payload: {}, expected: {} }] };
test('question rounds are bounded and manifests require stable unique ordered identities', () => {
    expect(() => DiscoverySchema.parse({ summary: 's', brief: 'b', ready: false, questions: Array(4).fill({ question: 'q', recommendation: 'r', choices: [] }) })).toThrow();
    const manifest = { provider: 'github', destination: 'JFusco/brain', items: [item] };
    expect(ManifestSchema.parse(manifest).items[0].id).toBe('one');
    expect(() => ManifestSchema.parse({ ...manifest, items: [item, item] })).toThrow();
    expect(() => ManifestSchema.parse({ ...manifest, items: [{ ...item, predecessor: 'later' }] })).toThrow();
    expect(() => manifestFromPlan('No manifest')).toThrow('exactly one');
    const fenced = '\x60\x60\x60feature-manifest\n' + JSON.stringify(manifest) + '\n\x60\x60\x60';
    expect(manifestFromPlan(fenced)).toEqual(manifest);
    expect(() => manifestFromPlan(fenced + '\n' + fenced)).toThrow('exactly one');
});
