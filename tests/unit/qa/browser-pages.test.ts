import { afterEach, expect, test } from 'vitest';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { browserPages } from '../../../server/qa/browser-pages';

const servers: Server[] = [];
afterEach(() => servers.splice(0).forEach(server => server.close()));
async function listening(status: number, body: string) {
    const requests: string[] = [];
    const server = createServer((request, response) => { requests.push(`${request.method} ${request.url}`); response.writeHead(status, { 'content-type': 'application/json' }); response.end(body); });
    servers.push(server);
    await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
    return { port: (server.address() as AddressInfo).port, requests };
}

test('reads only the tab list, and returns the URLs of page targets', async () => {
    const { port, requests } = await listening(200, JSON.stringify([
        { type: 'page', url: 'https://app.example.test/projects', title: 'Projects', webSocketDebuggerUrl: 'ws://127.0.0.1/devtools/page/1' },
        { type: 'service_worker', url: 'chrome-extension://abc/background.js' }, { type: 'iframe', url: 'https://app.example.test/frame' }, { type: 'page' }]));
    expect(await browserPages(port)).toEqual([{ url: 'https://app.example.test/projects' }]);
    expect(requests).toEqual(['GET /json/list']);
});

test.each([[500, '[]'], [200, '{"not":"a list"}'], [200, 'not json']])('null when the port answers %s %s', async (status, body) => {
    const { port } = await listening(status, body);
    expect(await browserPages(port)).toBeNull();
});

test('null when nothing listens on the port', async () => {
    const { port } = await listening(200, '[]');
    await new Promise(done => servers.pop()!.close(done));
    expect(await browserPages(port)).toBeNull();
});

test('a redirect is refused, so the read never leaves the port it was given', async () => {
    const elsewhere = await listening(200, JSON.stringify([{ type: 'page', url: 'https://app.example.test/projects' }]));
    const redirecting = createServer((_request, response) => { response.writeHead(302, { location: `http://127.0.0.1:${elsewhere.port}/json/list` }); response.end(); });
    servers.push(redirecting);
    await new Promise<void>(done => redirecting.listen(0, '127.0.0.1', done));
    expect(await browserPages((redirecting.address() as AddressInfo).port)).toBeNull();
    expect(elsewhere.requests).toEqual([]);
});
