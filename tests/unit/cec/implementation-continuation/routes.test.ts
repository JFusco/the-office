import { expect, test } from 'vitest';
import { fixture } from './fixtures';
import { implementationContinuationRoute } from '../../../../server/cec/implementation-continuation/routes';

test('read-only preview is scoped to CEC and returns an explicit unavailable reason without dispatch', async () => {
    const f = fixture(); try {
        const invoke = (path: string, method = 'GET') => {
            const url = new URL(path, 'http://fixture.invalid');
            return implementationContinuationRoute(new Request(url, { method }), url, f.store);
        };
        expect(await invoke('/api/other')).toBeUndefined();
        expect((await invoke('/api/cec/saved-implementation', 'POST'))?.status).toBe(405);
        expect((await invoke('/api/cec/saved-implementation?ticket=GH-70'))?.status).toBe(400);
        // Refuse before touching Git or a provider; this original writer is not settled.
        f.work.status = 'running';
        const response = await invoke(`/api/cec/saved-implementation?ticket=${f.t.key}`);
        expect(await response?.json()).toMatchObject({ available: false, reason: expect.stringContaining('active') });
        expect(f.store.state.deliveryQueue || []).toHaveLength(0);
    } finally { f.close(); }
});
