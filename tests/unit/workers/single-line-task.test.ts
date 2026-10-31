import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { z } from 'zod';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { WorkerRuntime } from '../../../server/workers/worker-runtime';
import type { command } from '../../../server/workers/process';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));

test('a single-line task (such as the daily CTO prompt with inline facts) reaches the model once, not twice', async () => {
    const root = mkdtempSync(resolve(tmpdir(), 'office-single-line-')), store = new Store(':memory:', projectById('cms-field-vocabulary'), root);
    cleanup.push(() => { store.close(); rmSync(root, { recursive: true, force: true }); });
    let input = '';
    const execute: typeof command = async (_program, _args, options = {}) => {
        input = String(options.input || '');
        for (const event of [{ type: 'thread.started', thread_id: crypto.randomUUID() }, { type: 'item.completed', item: { type: 'agent_message', text: '{"ok":true}' } }])
            options.onLine?.(JSON.stringify(event));
        return '';
    };
    const marker = 'FACTS-MARKER-' + 'x'.repeat(5000);
    await new WorkerRuntime(store, execute).run('cto', `Daily assessment. Facts: ${marker}`, z.object({ ok: z.boolean() }).strict(), { readOnly: true, crossProjectRead: true, stage: 'daily-cto' });
    expect(input.split(marker).length - 1).toBe(1);
    expect(input).toContain('Daily assessment.');
});
