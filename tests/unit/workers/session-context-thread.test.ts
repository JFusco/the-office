import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

test('the thread reads no local configuration: an unreadable configuration file cannot stop it', async () => {
    const data = mkdtempSync(join(tmpdir(), 'context-thread-config-'));
    writeFileSync(join(data, 'office-config.json'), '{ not json');
    // Outside the test environment the configuration loader reads this file and throws on it.
    const { VITEST: _vitest, NODE_ENV: _mode, ...env } = process.env;
    const thread = new Worker(new URL('../../../server/workers/session-context-thread.ts', import.meta.url),
        { execArgv: ['--import', 'tsx'], env: { ...env, OFFICE_DATA_ROOT: data } });
    try {
        const reply = await new Promise<ContextThreadReply>((resolve, reject) => {
            thread.once('message', resolve); thread.once('error', reject);
            thread.once('exit', code => reject(new Error(`thread exited ${code}`)));
            thread.postMessage({ seq: 3, source: 'claude', path: '/nonexistent/outside.jsonl', id: 'outside', projects: [] });
        });
        expect(reply.seq).toBe(3);
        expect('failure' in reply).toBe(true);
    } finally { await thread.terminate(); rmSync(data, { recursive: true, force: true }); }
}, 30000);
