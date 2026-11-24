import type { Server } from 'node:http';

/**
 * How long, in milliseconds, an idle keep-alive connection is kept after its previous response; the server also
 * advertises it as `Keep-Alive: timeout=65`. Node 24.14 closes the connection 1 s after that, so time the connection
 * already sat idle shortens the stall it can outlast. Once that timer is due, it can close the connection before Node
 * reads a request already queued on it, and the client is reset instead of answered late. Node's own 5 s was shorter
 * than the stalls the service has had; 65 s also outlasts the 10 s the deployment controller allows each request.
 */
export const KEEP_ALIVE_MS = 65_000;

/** Keeps idle keep-alive connections for `ms`, so a request queued during a stall that ends within it is answered, not reset. */
export function keepAliveThroughStalls(server: Pick<Server, 'keepAliveTimeout'>, ms = KEEP_ALIVE_MS): void {
    server.keepAliveTimeout = ms;
}
