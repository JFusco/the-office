import { afterEach, expect, test } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { DeploymentFence } from '../../../../server/office/deployment-fence';
import { deploymentFenceRoute } from '../../../../server/office/http/deployment-fence-route';

const TOKEN = 'deploy-token-0123456789';
const dbs: DatabaseSync[] = [];
afterEach(() => dbs.splice(0).forEach(db => db.close()));
function context() { const db = new DatabaseSync(':memory:'); dbs.push(db); const fence = new DeploymentFence(db); return { fence, context: { offices: { fence } } }; }
const call = (ctx: Parameters<typeof deploymentFenceRoute>[2], method: string, path: string, body?: unknown, lengthless = false) => {
    const url = new URL(`http://127.0.0.1:4318${path}`);
    const text = body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body);
    return deploymentFenceRoute(new Request(url, { method, headers: { 'Content-Type': 'application/json', ...(text === undefined || lengthless ? {} : { 'Content-Length': String(Buffer.byteLength(text)) }) }, body: text }), url, ctx);
};

test('the fence is read, acquired and released through its own route', async () => {
    const { context: ctx, fence } = context();
    expect(await (await call(ctx, 'GET', '/api/deployment-fence'))!.json()).toEqual({ fence: { status: 'open' } });
    const acquired = await (await call(ctx, 'POST', '/api/deployment-fence', { action: 'acquire', token: TOKEN, deployment: 'release x' }))!.json();
    expect(acquired.fence).toMatchObject({ status: 'held', deployment: 'release x' });
    expect(fence.held()).toBe(true);
    expect(await (await call(ctx, 'POST', '/api/deployment-fence', { action: 'release', token: TOKEN }))!.json()).toEqual({ fence: { status: 'open' } });
});

test('a malformed or oversized fence request is refused and changes nothing', async () => {
    const { context: ctx, fence } = context();
    for (const body of [{ action: 'acquire', token: TOKEN }, { action: 'open-sesame' }, { action: 'release', token: TOKEN, extra: 1 }, 'not json'])
        expect((await call(ctx, 'POST', '/api/deployment-fence', body))!.status).toBe(400);
    expect((await call(ctx, 'POST', '/api/deployment-fence', { action: 'acquire', token: TOKEN, deployment: 'x'.repeat(5000) }))!.status).toBe(413);
    expect((await call(ctx, 'PUT', '/api/deployment-fence', {}))!.status).toBe(405);
    // A body with no declared length is never read.
    expect((await call(ctx, 'POST', '/api/deployment-fence', { action: 'acquire', token: TOKEN, deployment: 'release x' }, true))!.status).toBe(411);
    expect(fence.held()).toBe(false);
});

test('other paths pass through the route untouched', async () => {
    const { context: ctx } = context();
    expect(await call(ctx, 'POST', '/api/commands?project=cec', { action: 'pause' })).toBeUndefined();
    expect(await call(ctx, 'GET', '/api/health')).toBeUndefined();
});
