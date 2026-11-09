import { test, expect } from 'vitest';
import { improvementManifest, improvementMarker } from '../../../server/knowledge/improvement-publication';
import { improvementFixture } from './improvement-fixture';
for (const project of ['brain', 'cec']) test(`${project}: fixed provider operations retain provenance and assignment`, async () => {
    const f = improvementFixture(project);
    try {
        const manifest = await improvementManifest(f.store, f.item, f.provider);
        expect(manifest.items[0].operations.map(item => item.kind)).toEqual(['create', 'assign']);
        expect(JSON.stringify(manifest.items[0].operations[0].payload)).toContain(improvementMarker(f.item.id));
        expect(JSON.stringify(manifest)).toContain(f.item.regression);
    } finally { f.close(); }
});
