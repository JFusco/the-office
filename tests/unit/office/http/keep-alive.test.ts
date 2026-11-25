import { once } from 'node:events';
import { createServer, type Server } from 'node:http';
import { connect, type AddressInfo, type Socket } from 'node:net';
import { performance } from 'node:perf_hooks';
import { afterEach, expect, test } from 'vitest';
import { keepAliveThroughStalls } from '../../../../server/office/http/keep-alive';

const REQUEST = 'GET / HTTP/1.1\r\nHost: localhost\r\n\r\n';
/** Longer than Node's own window: its 5 s keep-alive and the 1 s it adds. */
const STALL_MS = 6_500;
const servers: Server[] = [];
const sockets: Socket[] = [];
afterEach(() => {
    for (const socket of sockets.splice(0)) socket.destroy();
    for (const server of servers.splice(0)) { server.closeAllConnections(); server.close(); }
});

/** Holds the main thread, as a long synchronous step in the service does. */
function hold(ms: number): void { const until = performance.now() + ms; while (performance.now() < until); }

const answering = () => createServer((_request, response) => response.end('ok'));

/** The length of the complete `200 ok` reply that `text` starts with, or 0 while it is still arriving. */
function replyLength(text: string): number {
    const head = text.indexOf('\r\n\r\n');
    if (head < 0) return 0;
    const headers = text.slice(0, head), length = Number(/\r\ncontent-length: *(\d+)/i.exec(headers)?.[1]);
    if (!headers.startsWith('HTTP/1.1 200 ') || length !== 2) throw new Error(`Unexpected reply: ${headers.split('\r\n')[0]}`);
    if (text.length < head + 4 + length) return 0;
    if (text.slice(head + 4, head + 4 + length) !== 'ok') throw new Error('Unexpected reply body');
    return head + 4 + length;
}

/**
 * Two requests on one connection. Once the first reply is complete the second is written, and the main thread is
 * held for `STALL_MS` before the server can read it. Both replies must arrive complete on the same socket.
 */
async function secondRequestAfterStall(server: Server): Promise<void> {
    servers.push(server);
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const socket = connect((server.address() as AddressInfo).port, '127.0.0.1');
    sockets.push(socket);
    await once(socket, 'connect');
    return new Promise((resolve, reject) => {
        let phase: 'first reply' | 'second reply' = 'first reply', received = '';
        const fail = (what: string) => reject(new Error(`${what} during the ${phase}`));
        socket.on('data', chunk => {
            try {
                received += chunk;
                const length = replyLength(received);
                if (!length) return;
                if (phase === 'second reply') { resolve(); return; }
                received = received.slice(length);
                phase = 'second reply';
                socket.write(REQUEST);
                hold(STALL_MS);
            } catch (error) { reject(error); }
        });
        socket.on('error', (error: NodeJS.ErrnoException) => fail(`Socket error ${error.code}`));
        // After a settled result this is the fixture's own cleanup and changes nothing.
        socket.on('close', () => fail('Connection closed'));
        socket.write(REQUEST);
    });
}

test("the Office's keep-alive window answers a queued request after a stall", async () => {
    const server = answering();
    keepAliveThroughStalls(server);
    expect(server.keepAliveTimeout).toBe(65_000);
    await secondRequestAfterStall(server);
}, 20_000);
