import { afterEach, expect, test } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { DeploymentFence } from '../../../../server/office/deployment-fence';
import { deploymentFenceGate } from '../../../../server/office/http/deployment-fence-gate';

const TOKEN = 'deploy-token-0123456789';
const dbs: DatabaseSync[] = [];
afterEach(() => dbs.splice(0).forEach(db => db.close()));
function context(held: boolean) { const db = new DatabaseSync(':memory:'); dbs.push(db); const fence = new DeploymentFence(db); if (held) fence.acquire(TOKEN, 'release x'); return { offices: { fence } }; }
const request = (method: string, path: string, body?: unknown, lengthless = false) => {
    const url = new URL(`http://127.0.0.1:4318${path}`), text = body === undefined ? undefined : JSON.stringify(body);
    return { url, req: new Request(url, { method, headers: { 'Content-Type': 'application/json', ...(text === undefined || lengthless ? {} : { 'Content-Length': String(Buffer.byteLength(text)) }) }, body: text }) };
};

test('with no fence held every request passes through and no body is read', async () => {
    const ctx = context(false), { req, url } = request('POST', '/api/commands?project=cec', { action: 'resume-ticket', key: 'CEC-1' });
    expect(await deploymentFenceGate(req, url, ctx)).toBeUndefined();
    expect(req.bodyUsed).toBe(false);
});

test('while fenced every write is refused with 409 and reads still pass', async () => {
    const ctx = context(true);
    for (const [method, path, body] of [['POST', '/api/commands?project=cec', { action: 'resume-ticket', key: 'CEC-1' }], ['POST', '/api/messages', { body: 'hi' }], ['POST', '/api/preferences', { quality: 'low' }], ['POST', '/api/features', {}], ['PUT', '/api/goals', {}], ['PATCH', '/api/preferences', {}], ['DELETE', '/api/goals', undefined]] as const) {
        const { req, url } = request(method, path, body);
        const refused = (await deploymentFenceGate(req, url, ctx))!;
        expect(refused.status).toBe(409);
        expect((await refused.json()).fence).toMatchObject({ status: 'held' });
    }
    for (const path of ['/api/health', '/api/office?project=cec']) {
        const { req, url } = request('GET', path);
        expect(await deploymentFenceGate(req, url, ctx)).toBeUndefined();
    }
});

test('pause and drain still reach the command route with their body intact; resume does not', async () => {
    const ctx = context(true);
    for (const action of ['pause', 'drain']) {
        const { req, url } = request('POST', '/api/commands?project=cec', { action });
        expect(await deploymentFenceGate(req, url, ctx)).toBeUndefined();
        expect(JSON.parse(await req.text())).toEqual({ action });
    }
    const { req, url } = request('POST', '/api/commands?project=cec', { action: 'resume' });
    expect((await deploymentFenceGate(req, url, ctx))!.status).toBe(409);
});

test('a refused resume reports the fence held when body inspection began', async () => {
    const ctx = context(true), { fence } = ctx.offices;
    const held = fence.read();
    const { req, url } = request('POST', '/api/commands?project=cec', { action: 'resume' });
    const pending = deploymentFenceGate(req, url, ctx);
    expect(fence.release(TOKEN)).toEqual({ status: 'open' });
    const refused = (await pending)!;
    expect(refused.status).toBe(409);
    expect((await refused.json()).fence).toEqual(held);
});

test('a pause with no declared length is refused without its body being read', async () => {
    const ctx = context(true), { req, url } = request('POST', '/api/commands?project=cec', { action: 'pause' }, true);
    expect((await deploymentFenceGate(req, url, ctx))!.status).toBe(409);
    expect(req.bodyUsed).toBe(false);
});

test('an oversized command body is refused without being read', async () => {
    const ctx = context(true), url = new URL('http://127.0.0.1:4318/api/commands?project=cec');
    const req = new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': '5000' }, body: JSON.stringify({ action: 'pause', pad: 'x'.repeat(4980) }) });
    expect((await deploymentFenceGate(req, url, ctx))!.status).toBe(409);
});
