import { expect, test } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { WorkerRuntime } from '../../../../server/workers/worker-runtime';
import { CommandFailure, type command } from '../../../../server/workers/process';
import { knowledgeStore } from '../../knowledge/knowledge-fixture';
import { diagnostic } from './fixture';
test('runtime retains diagnostics without converting an uncertain writer into accepted completion', async () => {
    const f = knowledgeStore(); try {
        const execute: typeof command = async (_program, _args, options = {}) => { options.onLifecycle?.(diagnostic()); throw new CommandFailure('Worker exited with surviving subprocesses; must be reconciled', 'uncertain-effect', true, 'surviving-subprocesses'); };
        await expect(new WorkerRuntime(f.store, execute).run('pm', 'Synthetic only', z.object({ ok: z.boolean() }), { readOnly: true, stage: 'conversation', requestId: 'synthetic' })).rejects.toThrow('surviving subprocesses');
        const work = f.store.state.workLog!.find(w => w.requestId === 'synthetic')!;
        const dir = resolve(f.store.dataRoot, 'sessions', work.id);
        expect(work.status).toBe('failed'); expect(work.failure?.category).toBe('uncertain-effect'); expect(work.failure?.code).toBe('surviving-subprocesses');
        expect(JSON.parse(readFileSync(resolve(dir, 'process-lifecycle.json'), 'utf8'))).toMatchObject(diagnostic());
        expect(existsSync(resolve(dir, 'result.json'))).toBe(false); expect(existsSync(resolve(dir, 'execution-completion.json'))).toBe(false);
    } finally { f.close(); }
});
