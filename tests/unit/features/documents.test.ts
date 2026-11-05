import { expect, test } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { createFeature } from '../../../server/features/commands';
import { document, artifactPath } from '../../../server/features/documents';
test('full immutable documents require registered identity, containment and matching content', () => {
    const root = mkdtempSync(resolve(tmpdir(), 'office-feature-doc-')), store = new Store(':memory:', projectById('brain'), root);
    try {
        const f = createFeature(store, { action: 'create', requestId: 'one', title: 'Feature', intent: 'Full plan' });
        const doc = document(store, f, '# Complete plan\n\nEvery acceptance criterion.'); f.plans.push(doc);
        expect(artifactPath(store, f, doc.id)).toBe(realpathSync(doc.path));
        expect(() => artifactPath(store, f, '../unregistered')).toThrow('Unknown');
        writeFileSync(doc.path, 'changed');
        expect(() => artifactPath(store, f, doc.id)).toThrow('digest');
    } finally { store.close(); rmSync(root, { recursive: true, force: true }); }
});
