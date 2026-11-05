import { expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { createFeature } from '../../../server/features/commands';
import { beginReader } from '../../../server/features/reader-attempts';
import { recoverFeatures } from '../../../server/features/recovery';
test('recovery waits for the old process and records one replacement without changing content revision', () => {
    const root = mkdtempSync(resolve(tmpdir(), 'office-feature-recovery-')), store = new Store(':memory:', projectById('brain'), root);
    try {
        const f = createFeature(store, { action: 'create', requestId: 'create', title: 'Search', intent: 'Find content' });
        f.baseline = { path: root, repository: store.project.repository, sha: 'base', ref: 'main', scope: [], files: {} };
        const old = beginReader(store, f);
        store.state.workLog!.push({ id: 'worker', requestId: f.id, processId: 1234, status: 'stopping' } as any);
        recoverFeatures(store, true, () => true);
        expect(f.attempts).toHaveLength(1); expect(f.status).toBe('blocked');
        recoverFeatures(store, false, () => false); recoverFeatures(store, false, () => false);
        expect(f.attempts).toHaveLength(2); expect(f.revision).toBe(1); expect(f.attempts[1].replacementOf).toBe(old.id);
        const next = beginReader(store, f); expect(next.id).toBe(f.attempts[1].id); expect(f.attempts).toHaveLength(2);
    } finally { store.close(); rmSync(root, { recursive: true, force: true }); }
});
