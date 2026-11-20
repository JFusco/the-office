import { expect, test } from 'vitest';
import { officeClient, ServiceHealth } from '../../../server/release/service-http';

function fakeFetch(answer: (url: string, init: any) => { status?: number; body: unknown }) {
    const requests: { url: string; method: string; body?: unknown }[] = [];
    const request = (async (url: string, init: any) => {
        requests.push({ url, method: init.method, ...(init.body ? { body: JSON.parse(init.body) } : {}) });
        const { status = 200, body } = answer(url, init);
        return new Response(JSON.stringify(body), { status });
    }) as any;
    return { requests, request };
}

test('the client reads health and the fence and posts acquire and release with the token', async () => {
    const open = { status: 'open' }, held = { status: 'held', tokenDigest: '1'.repeat(64), deployment: 'deploy-x', acquiredAt: '2026-11-20T03:00:00.000Z' };
    const { requests, request } = fakeFetch((url, init) => url.endsWith('/api/health') ? { body: { ok: true } } : { body: { fence: init.method === 'GET' ? open : JSON.parse(init.body).action === 'acquire' ? held : open } });
    const office = officeClient('http://127.0.0.1:4318', request);
    expect(await office.health()).toEqual({ ok: true });
    expect(await office.fence()).toEqual(open);
    expect(await office.acquireFence('t'.repeat(32), 'deploy-x')).toEqual(held);
    expect(await office.releaseFence('t'.repeat(32))).toEqual(open);
    expect(requests).toEqual([
        { url: 'http://127.0.0.1:4318/api/health', method: 'GET' }, { url: 'http://127.0.0.1:4318/api/deployment-fence', method: 'GET' },
        { url: 'http://127.0.0.1:4318/api/deployment-fence', method: 'POST', body: { action: 'acquire', token: 't'.repeat(32), deployment: 'deploy-x' } },
        { url: 'http://127.0.0.1:4318/api/deployment-fence', method: 'POST', body: { action: 'release', token: 't'.repeat(32) } },
    ]);
});

test('a refusal carries the status and the service\'s words, and an unreadable fence answer throws', async () => {
    const refused = officeClient('http://x', fakeFetch(() => ({ status: 409, body: { error: 'The deployment fence is held by deploy-y' } })).request);
    await expect(refused.acquireFence('t'.repeat(32), 'deploy-x')).rejects.toThrow(/answered 409.*held by deploy-y/);
    await expect(officeClient('http://x', fakeFetch(() => ({ body: { fence: { status: 'ajar' } } })).request).fence()).rejects.toThrow();
});

test('health without a fence, or with a malformed hash, is not a service a deployment can replace', () => {
    const health = { loadedHash: '1'.repeat(64), serviceInstanceId: 'i', pid: 12, busy: false, fence: { status: 'open' } };
    expect(ServiceHealth.safeParse({ ...health, extra: 'ignored' }).success).toBe(true);
    const { fence: _, ...legacy } = health;
    expect(ServiceHealth.safeParse(legacy).success).toBe(false);
    expect(ServiceHealth.safeParse({ ...health, loadedHash: 'abc' }).success).toBe(false);
});
