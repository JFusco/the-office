import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { expect, test } from 'vitest';
import { officeReader, OfficeReadError } from '../../../server/overseer/office-client';

const BASE = 'http://127.0.0.1:4318';
const HEALTH_BODY = { ok: true, loadedHash: 'a'.repeat(64), serviceInstanceId: 'service-1', pid: 42, busy: false, fence: { status: 'open' }, release: { status: 'verified', commit: 'b'.repeat(40) }, extra: 1 };
const incident = (n: number, extra: Record<string, unknown> = {}) => ({
    id: `inc-${n.toString(16).padStart(16, '0')}`, state: 'observed', revision: 2, cause: { source: 'stopped-work', provider: 'github' },
    research: { eligible: true, reason: 'x', at: '2026-11-20T00:00:00.000Z' }, subjects: [{ status: 'open' }, { status: 'cleared' }, { status: 'open' }], ...extra,
});

type Answer = Response | Error | (() => Response | Error);
/** A fetch that answers in order and records every request exactly as made. */
function office(...answers: Answer[]) {
    const calls: { url: string; init: RequestInit }[] = [];
    const request = (async (url: string, init: RequestInit) => {
        calls.push({ url, init });
        const next = answers.shift();
        const answer = typeof next === 'function' ? next() : next;
        if (!answer) throw new Error('unexpected request');
        if (answer instanceof Error) throw answer;
        return answer;
    }) as unknown as typeof fetch;
    return { calls, request };
}
const json = (body: unknown, init: ResponseInit = {}) => new Response(JSON.stringify(body), init);
const reset = (code = 'ECONNRESET') => Object.assign(new TypeError('fetch failed'), { cause: Object.assign(new Error('socket'), { code }) });

test('every request is a body-less GET to a fixed path that follows no redirect and has a deadline', async () => {
    const { calls, request } = office(json(HEALTH_BODY), json({ incidents: [] }));
    const reader = officeReader(BASE, request);
    await reader.health();
    await reader.researchIncidents();
    expect(calls.map(call => call.url)).toEqual([`${BASE}/api/health`, `${BASE}/api/incidents?research=1`]);
    for (const { init } of calls) {
        expect(init.method).toBe('GET');
        expect(init.redirect).toBe('error');
        expect(init.body).toBeUndefined();
        expect(init.signal).toBeInstanceOf(AbortSignal);
        expect(Object.keys(init).sort()).toEqual(['method', 'redirect', 'signal']);
    }
});

test('health is read through the deployment schema, with the release when the service reports one', async () => {
    const reader = (body: unknown) => officeReader(BASE, office(json(body)).request);
    expect(await reader(HEALTH_BODY).health()).toEqual({ serviceInstanceId: 'service-1', loadedHash: 'a'.repeat(64), pid: 42, busy: false, fence: 'open', release: { status: 'verified', commit: 'b'.repeat(40) } });
    expect((await reader({ ...HEALTH_BODY, release: { status: 'unknown', reason: 'x' } }).health()).release).toEqual({ status: 'unknown' });
    expect((await reader({ ...HEALTH_BODY, release: undefined }).health()).release).toBeNull();
    expect((await reader({ ...HEALTH_BODY, fence: { status: 'invalid', reason: 'unreadable' } }).health()).fence).toBe('invalid');
    expect((await reader({ ...HEALTH_BODY, fence: { status: 'held', tokenDigest: 'c'.repeat(64), deployment: 'deploy-1', acquiredAt: 'now' } }).health()).fence).toBe('held');
    await expect(reader({ ...HEALTH_BODY, fence: undefined }).health()).rejects.toThrow('deployment fence');
    await expect(reader({ ok: true }).health()).rejects.toThrow(OfficeReadError);
});

test('a refusal, invalid JSON or an oversized answer is an error, error bodies included', async () => {
    const limits = { requestTimeoutMs: 1000, maxResponseBytes: 64 };
    const read = (answer: Response) => officeReader(BASE, office(answer).request, limits).health();
    await expect(read(new Response('busy', { status: 503 }))).rejects.toThrow('/api/health answered 503: busy');
    await expect(read(new Response('not json'))).rejects.toThrow('did not answer JSON');
    await expect(read(new Response('x'.repeat(65), { headers: { 'content-length': '65' } }))).rejects.toThrow('answered 65 bytes, more than 64');
    const streamed = (status: number) => new Response(new ReadableStream({ start(controller) { for (let i = 0; i < 5; i++) controller.enqueue(new Uint8Array(20)); controller.close(); } }), { status });
    await expect(read(streamed(200))).rejects.toThrow('more than 64 bytes');
    await expect(read(streamed(500))).rejects.toThrow('more than 64 bytes');
    await expect(read(new Response('x'.repeat(100), { status: 500, headers: { 'content-length': '100' } }))).rejects.toThrow('more than 64');
});

test('a reset connection is retried once; a second reset, a timeout, a refusal or an HTTP error is not', async () => {
    const twice = office(reset(), json(HEALTH_BODY));
    expect((await officeReader(BASE, twice.request).health()).serviceInstanceId).toBe('service-1');
    expect(twice.calls).toHaveLength(2);
    for (const code of ['EPIPE', 'UND_ERR_SOCKET']) {
        const once = office(reset(code), json(HEALTH_BODY));
        await officeReader(BASE, once.request).health();
        expect(once.calls, code).toHaveLength(2);
    }
    const again = office(reset(), reset(), json(HEALTH_BODY));
    await expect(officeReader(BASE, again.request).health()).rejects.toThrow('could not be read: fetch failed (ECONNRESET)');
    expect(again.calls).toHaveLength(2);
    for (const failure of [new DOMException('timed out', 'TimeoutError'), reset('ECONNREFUSED'), new Response('no', { status: 502 })]) {
        const single = office(failure, json(HEALTH_BODY));
        await expect(officeReader(BASE, single.request).health()).rejects.toThrow(OfficeReadError);
        expect(single.calls).toHaveLength(1);
    }
});

test('a redirect is refused, and the target is never asked', async () => {
    const seen: string[] = [];
    const server = createServer((req, res) => {
        seen.push(req.url!);
        if (req.url === '/api/health') { res.writeHead(302, { location: '/elsewhere' }); res.end(); }
        else { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(HEALTH_BODY)); }
    });
    await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
    try {
        const { port } = server.address() as AddressInfo;
        await expect(officeReader(`http://127.0.0.1:${port}`).health()).rejects.toThrow(OfficeReadError);
        expect(seen).toEqual(['/api/health']);
    } finally { await new Promise(done => server.close(done)); }
});

test('the research list keeps the fields selection needs and counts open subjects', async () => {
    const reader = officeReader(BASE, office(json({ incidents: [incident(1), incident(2, { research: { eligible: false, reason: 'y', at: null }, cause: { source: 'runner' } })] })).request);
    expect(await reader.researchIncidents()).toEqual([
        { id: 'inc-0000000000000001', state: 'observed', revision: 2, source: 'stopped-work', researchEligible: true, researchAt: '2026-11-20T00:00:00.000Z', openSubjects: 2 },
        { id: 'inc-0000000000000002', state: 'observed', revision: 2, source: 'runner', researchEligible: false, researchAt: null, openSubjects: 2 },
    ]);
});

test('one invalid row anywhere in the list rejects the whole read', async () => {
    const rows = Array.from({ length: 60 }, (_, i) => incident(i + 1));
    for (const bad of [{ state: 'unknown' }, { id: 'inc-x' }, { cause: { source: 'elsewhere' } }, { research: { eligible: 'yes', at: null } }, { subjects: [{ status: 'gone' }] }, { revision: -1 }]) {
        const list: Record<string, unknown>[] = [...rows];
        list[55] = { ...list[55], ...bad };
        await expect(officeReader(BASE, office(json({ incidents: list })).request).researchIncidents(), JSON.stringify(bad)).rejects.toThrow('valid incident list');
    }
    await expect(officeReader(BASE, office(json(rows)).request).researchIncidents()).rejects.toThrow('valid incident list');
});
