import { expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { createFeature } from '../../../server/features/commands';
import { document, digest } from '../../../server/features/documents';
import { approveFeature } from '../../../server/features/approval';
import { approvedDelivery } from '../../../server/features/delivery-binding';
test('approval binds the complete accepted plan, manifest and source evidence; duplicate requests reuse it', async () => {
    const root = mkdtempSync(resolve(tmpdir(), 'office-approval-')), store = new Store(':memory:', projectById('brain'), root);
    try {
        const f = createFeature(store, { action: 'create', requestId: 'create', title: 'Search', intent: 'Find content' });
        f.phase = 'approval'; f.status = 'waiting';
        f.baseline = { path: root, repository: store.project.repository, sha: 'base', ref: 'main', scope: ['src/a.ts'], files: {} };
        f.briefs.push(document(store, f, 'Complete brief')); f.confirmedBrief = f.briefs[0].digest;
        f.manifest = { provider: 'github', destination: store.project.repository, items: [{ id: 'one', title: 'First', key: '', action: 'create', predecessor: '', criteria: ['Exact criterion'], operations: [{ id: 'create', kind: 'create', payload: {}, expected: {} }] }] };
        f.plans.push(document(store, f, 'Complete plan\n\x60\x60\x60feature-manifest\n' + JSON.stringify(f.manifest) + '\n\x60\x60\x60'));
        f.review = { run: 'run', revision: 3, fingerprint: 'fingerprint', helperCommit: 'helper' } as any;
        const inspect = async () => ({ status: 'complete', researchDigest: 'research', revision: 3, fingerprint: 'fingerprint', run: 'run', plan: f.plans[0].markdown }) as any;
        const compare = async () => ({ observedSha: 'new-unrelated-commit', comparisonDigest: 'same-relevant-content' });
        const input = { action: 'approve', requestId: 'approve', expectedRevision: 1, planDigest: f.plans[0].digest, manifestDigest: digest(f.manifest) };
        await approveFeature(store, f.id, input, async () => {}, undefined, inspect, compare);
        await approveFeature(store, f.id, input, async () => { throw new Error('Must not observe again'); }, undefined, inspect, compare);
        expect(f.approvals).toHaveLength(1); expect(f.phase).toBe('delivery');
        const a = f.approvals[0];
        expect(a).toMatchObject({ featureId: f.id, projectId: store.project.id, observedSha: 'new-unrelated-commit', planDigest: input.planDigest });
        const binding = { featureId: f.id, itemId: 'one', approvalId: a.id, approvalDigest: a.digest };
        expect(approvedDelivery(store, binding).item.criteria).toEqual(['Exact criterion']);
        a.manifest.items[0].criteria.push('Tampered');
        expect(() => approvedDelivery(store, binding)).toThrow('changed');
    } finally { store.close(); rmSync(root, { recursive: true, force: true }); }
});
