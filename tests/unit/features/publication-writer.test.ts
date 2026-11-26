import { expect, test, vi } from 'vitest';
import { publishFeature, type FeaturePublisher } from '../../../server/features/publication';
import { bindGitHubIdentity } from '../../../server/github/identity/identity-runtime';
import type { GitHubAppConfig } from '../../../server/github/identity/app-config';
import { WriterRefused } from '../../../server/store/effects';
import { fixture } from './test-store';

const config = (writes: GitHubAppConfig['writes'][string] = {}): GitHubAppConfig => ({ appId: 1001, installationId: 2002, botLogin: 'office-test[bot]',
    keySource: { kind: 'keychain', service: 's', account: 'a' }, repositories: { brain: { repository: 'JFusco/brain', repositoryId: 4004 } }, writes: { brain: writes } });

test('a create the claim refuses unsent releases only its own fence; the next authorized run creates once under one stable successor', async () => {
    const f = fixture();
    try {
        const item = { id: 'stable', title: 'Feature', key: '', action: 'create' as const, predecessor: '', criteria: ['Works'], operations: [{ id: 'create', kind: 'create' as const, payload: {}, expected: {} }] };
        f.feature.phase = 'delivery';
        f.feature.approvals.push({ id: 'a', digest: 'auth-a', featureRevision: 1, manifest: { provider: 'github', destination: f.store.project.repository, items: [item] } } as any);
        f.feature.publication.push({ id: item.id, key: '', url: '', approvalId: 'a', verified: false, queued: false, effects: [], fence: false });
        let current = config(), dispatches = 0, release!: () => void;
        bindGitHubIdentity(f.store, { config: () => current });
        const held = new Promise<void>(resolve => { release = resolve; });
        const receipt = { key: 'GH-10', url: 'https://github.com/JFusco/brain/issues/10' };
        const provider: FeaturePublisher = { context: async () => '', validate: async () => {}, preflight: vi.fn(async () => {}), verify: async () => true,
            dispatch: async () => { dispatches++; return receipt; }, readBack: async () => ({ verified: false, receipt }) };
        const original = `feature:${f.feature.id}:item:stable:create`;
        (provider.preflight as any).mockImplementationOnce(() => held);
        const first = publishFeature(f.store, f.feature, provider);
        await vi.waitFor(() => expect(f.store.getEffect(original)?.status).toBe('prepared'));
        expect(f.feature.publication[0]).toMatchObject({ createIntent: original, fence: true });
        // The route changes while the operator intent waits: a rollback naming an activation this route never had holds it.
        current = config({ 'issue-create': { mode: 'operator', revokes: 'never-activated' } });
        release();
        await expect(first).rejects.toBeInstanceOf(WriterRefused);
        expect(f.store.getEffect(original)).toMatchObject({ status: 'rejected', dispatchedAt: '', writerRefusedAt: expect.any(String) });
        expect(f.feature.publication[0]).toMatchObject({ createIntent: original, fence: false });
        expect(dispatches).toBe(0);
        // A later authorized run: one successor, recorded with its fence, the original kept with its audit.
        current = config();
        await publishFeature(f.store, f.feature, provider);
        expect(dispatches).toBe(1);
        expect(f.feature.publication[0]).toMatchObject({ createIntent: `${original}:writer-1`, key: 'GH-10', verified: true });
        expect(f.feature.publication[0].effects).toEqual([original, `${original}:writer-1`]);
        expect(f.store.getEffect(`${original}:writer-1`)).toMatchObject({ status: 'verified', writer: { principal: 'operator' } });
        expect(f.store.getEffect(original)?.status).toBe('rejected');
    } finally { f.close(); }
});
