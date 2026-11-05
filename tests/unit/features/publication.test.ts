import { expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { createFeature } from '../../../server/features/commands';
import { publishFeature, type FeaturePublisher } from '../../../server/features/publication';
import { featureGate } from '../../../server/features/enrollment-gate';
import { fixture } from './test-store';
import { commandFeature, featureById } from '../../../server/features/commands';
test('an uncertain create retains its identity across approvals and is reconciled without dispatch', async () => {
    const root = mkdtempSync(resolve(tmpdir(), 'office-publication-')), store = new Store(':memory:', projectById('brain'), root);
    try {
        const feature = createFeature(store, { action: 'create', requestId: 'create', title: 'Feature', intent: 'Test' });
        const operation = { id: 'create', kind: 'create' as const, payload: { title: 'First' }, expected: {} };
        const item = { id: 'stable', title: 'First', key: '', action: 'create' as const, predecessor: '', criteria: ['Works'], operations: [operation] };
        feature.approvals.push({ id: 'a', digest: 'auth-a', featureRevision: 1, manifest: { provider: 'github', destination: store.project.repository, items: [item] } } as any);
        feature.publication.push({ id: 'stable', key: '', url: '', approvalId: 'a', verified: false, queued: false, effects: [], fence: false });
        let dispatches = 0, found = false;
        const provider: FeaturePublisher = { context: async () => '', validate: async () => {}, preflight: async () => {}, dispatch: async () => { dispatches++; throw new Error('Response lost after creation'); }, verify: async () => true, readBack: async intent => { expect(intent.authorization).toBe('auth-a'); return { verified: found, receipt: { key: 'GH-10', url: 'https://github.com/JFusco/brain/issues/10' } }; } };
        await expect(publishFeature(store, feature, provider)).rejects.toThrow('Response lost');
        expect(dispatches).toBe(1); expect(featureGate(store, 'GH-99').allowed).toBe(false);
        feature.revision = 2; feature.approvals.push({ id: 'b', digest: 'auth-b', featureRevision: 2, manifest: { provider: 'github', destination: store.project.repository, items: [item] } } as any);
        await expect(publishFeature(store, feature, provider)).rejects.toThrow('uncertain');
        expect(dispatches).toBe(1);
        found = true;
        await publishFeature(store, feature, provider);
        expect(dispatches).toBe(1); expect(feature.publication[0]).toMatchObject({ key: 'GH-10', verified: true, approvalId: 'b', fence: false });
        expect(featureGate(store, 'GH-99').allowed).toBe(true);
        expect(store.getEffect('feature:' + feature.id + ':item:stable:create')?.authorization).toBe('auth-a');
    } finally { store.close(); rmSync(root, { recursive: true, force: true }); }
});
function approved() {
    const f = fixture();
    const item = { id: 'stable', title: 'Feature', key: '', action: 'create' as const, predecessor: '', criteria: ['Works'], operations: [
        { id: 'create', kind: 'create' as const, payload: {}, expected: {} },
        { id: 'assign', kind: 'assign' as const, payload: { assignee: 'Joe' }, expected: {} },
    ] };
    f.feature.phase = 'delivery';
    f.feature.approvals.push({ id: 'a', digest: 'auth-a', featureRevision: 1, manifest: { provider: 'github', destination: f.store.project.repository, items: [item] } } as any);
    f.feature.publication.push({ id: item.id, key: '', url: '', approvalId: 'a', verified: false, queued: false, effects: [], fence: false });
    return f;
}
test('replacement approval reconciles the original uncertain assignment before any new operation', async () => {
    const f = approved();
    try {
        let dispatches = 0, found = false;
        const receipt = { key: 'GH-10', url: 'https://example.test/10' };
        const provider: FeaturePublisher = { context: async () => '', validate: async () => {}, preflight: async () => {}, verify: async () => true,
            dispatch: async (_item, operation) => { dispatches++; if (operation.kind === 'assign' && !found) throw new Error('Assignment response lost'); return receipt; },
            readBack: async intent => { expect(intent.authorization).toBe('auth-a'); expect(intent.attemptId).toBe('a'); return { verified: found, receipt }; } };
        await expect(publishFeature(f.store, f.feature, provider)).rejects.toThrow('Assignment response lost');
        expect(dispatches).toBe(2);
        const original = f.store.getEffect('feature:' + f.feature.id + ':item:stable:assign:a')!;
        f.feature.revision = 2; f.feature.approvals.push({ ...f.feature.approvals[0], id: 'b', digest: 'auth-b', featureRevision: 2 });
        await expect(publishFeature(f.store, f.feature, provider)).rejects.toThrow('uncertain');
        expect(dispatches).toBe(2); expect(f.store.getEffect('feature:' + f.feature.id + ':item:stable:assign:b')).toBeUndefined();
        found = true; await publishFeature(f.store, f.feature, provider);
        expect(dispatches).toBe(3); expect(f.feature.publication[0].verified).toBe(true);
        expect(f.store.getEffect(original.id)).toMatchObject({ authorization: 'auth-a', attemptId: 'a', payload: original.payload, expectedState: original.expectedState, status: 'verified' });
    } finally { f.close(); }
});
for (const action of ['pause', 'revise'] as const) {
    test('rollback followed by ' + action + ' during preflight prevents provider dispatch', async () => {
        const f = approved();
        try {
            let release!: () => void, started!: () => void, dispatches = 0;
            const waiting = new Promise<void>(resolve => { started = resolve; });
            const provider: FeaturePublisher = { context: async () => '', validate: async () => {},
                preflight: async () => { started(); await new Promise<void>(resolve => { release = resolve; }); },
                dispatch: async () => { dispatches++; return { key: 'GH-10', url: 'https://example.test/10' }; }, verify: async () => true, readBack: async () => ({ verified: false, receipt: { key: '', url: '' } }) };
            const result = publishFeature(f.store, f.feature, provider);
            const rejected = expect(result).rejects.toThrow('authorization changed');
            await waiting;
            expect(() => f.store.transaction(() => { throw new Error('Concurrent rollback'); })).toThrow();
            commandFeature(f.store, f.feature.id, { action, requestId: action, expectedRevision: 1, ...(action === 'revise' ? { instruction: 'New scope' } : {}) });
            release(); await rejected;
            expect(dispatches).toBe(0);
            expect(featureById(f.store, f.feature.id).publication[0]).toMatchObject({ key: '', fence: false, verified: false });
        } finally { f.close(); }
    });
    test('rollback and ' + action + ' after dispatch retains verified identity and stops subsequent operations', async () => {
        const f = approved();
        try {
            let release!: () => void, started!: () => void, dispatches = 0;
            const waiting = new Promise<void>(resolve => { started = resolve; });
            const provider: FeaturePublisher = { context: async () => '', validate: async () => {}, preflight: async () => {},
                dispatch: async () => { dispatches++; return { key: 'GH-10', url: 'https://example.test/10' }; },
                verify: async () => { started(); await new Promise<void>(resolve => { release = resolve; }); return true; }, readBack: async () => ({ verified: false, receipt: { key: '', url: '' } }) };
            const result = publishFeature(f.store, f.feature, provider);
            const rejected = expect(result).rejects.toThrow('authorization changed');
            await waiting;
            expect(() => f.store.transaction(() => { throw new Error('Concurrent rollback'); })).toThrow();
            commandFeature(f.store, f.feature.id, { action, requestId: action, expectedRevision: 1, ...(action === 'revise' ? { instruction: 'New scope' } : {}) });
            release(); await rejected;
            expect(dispatches).toBe(1);
            expect(featureById(f.store, f.feature.id).publication[0]).toMatchObject({ key: 'GH-10', fence: false, verified: false });
            expect(f.store.getEffect('feature:' + f.feature.id + ':item:stable:create')?.status).toBe('verified');
            const persisted = JSON.parse((f.store.db.prepare('SELECT body FROM state WHERE id=1').get() as any).body).features[0];
            expect(persisted.publication[0].key).toBe('GH-10');
        } finally { f.close(); }
    });
}
