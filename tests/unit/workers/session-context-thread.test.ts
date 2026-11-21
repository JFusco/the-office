import { Worker } from 'node:worker_threads';
import { expect, test } from 'vitest';
import type { ContextThreadReply } from '../../../server/workers/session-context-thread';

test('the thread entry starts under the service runtime and answers a read it cannot make with a failure, not by dying', async () => {
    const thread = new Worker(new URL('../../../server/workers/session-context-thread.ts', import.meta.url), { execArgv: ['--import', 'tsx'] });
    try {
        const reply = await new Promise<ContextThreadReply>((resolve, reject) => {
            thread.once('message', resolve); thread.once('error', reject);
            thread.once('exit', code => reject(new Error(`thread exited ${code}`)));
            thread.postMessage({ seq: 7, source: 'codex', path: '/nonexistent/outside.jsonl', id: 'outside', projects: [] });
        });
        expect(reply.seq).toBe(7);
        expect('failure' in reply && typeof reply.failure.message).toBe('string');
    } finally { await thread.terminate(); }
}, 30000);
