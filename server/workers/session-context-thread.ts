import { parentPort } from 'node:worker_threads';
import { contextReaders, type ContextSource } from './session-context-readers';
import { packContextFailure, type PackedContextFailure } from './context-failure-transport';
import type { ContextProject } from './session-context-file';
import type { SessionContext } from './session-scope';

export interface ContextThreadRequest { seq: number; source: ContextSource; path: string; id: string; projects: ContextProject[] }
export type ContextThreadReply = { seq: number; context: SessionContext } | { seq: number; failure: PackedContextFailure };

/**
 * Thread entry: session logs are read here, never on the service's own event loop. A read needs hundreds of
 * turns of a loop inside a fixed deadline, and the service's loop is held for seconds at a time by store saves;
 * this thread's loop is idle between reads. The caches of derived context live here for the thread's life.
 */
if (parentPort) {
    const port = parentPort, readers = contextReaders();
    port.on('message', async ({ seq, source, path, id, projects }: ContextThreadRequest) => {
        let reply: ContextThreadReply;
        try { reply = { seq, context: await readers[source](path, id, projects) }; }
        catch (error) { reply = { seq, failure: packContextFailure(error) }; }
        port.postMessage(reply);
    });
}
