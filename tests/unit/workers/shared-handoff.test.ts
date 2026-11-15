import { expect, test, vi } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { WorkerRuntime } from '../../../server/workers/worker-runtime';
import { DEVELOPER_MODEL } from '../../../server/workers/claude';
import { knowledgeStore } from '../knowledge/knowledge-fixture';
const schema = z.object({ outcome: z.enum(['passed', 'blocked']), summary: z.string() }).strict();

test.each(['pm', 'developer', 'lead', 'qa', 'cto', 'it', 'analyst', 'knowledge'] as const)('%s uses the existing shared assignment and role response with Harper guidance', async role => {
    const f = knowledgeStore('brain', '2026-11-06T23:00:00Z');
    const execute = vi.fn(async (program, args, options) => {
        const assignment = /harness-authored assignment is (.*?);/.exec(options.input)![1];
        const saved = JSON.parse(readFileSync(assignment, 'utf8'));
        expect(saved.role).toBe(role); expect(saved.work.projectId).toBe('brain');
        expect(options.input).toContain('Harper\'s scoped lessons remain advisory');
        expect(options.input).toContain('existing authorized budget');
        expect(options.input).toContain('never a blind resend');
        const payload = { outcome: 'blocked', summary: 'Synthetic setup prerequisite' };
        const session = args[args.indexOf('--session-id') + 1];
        const events = program === 'claude' ? [
            { type: 'system', subtype: 'init', session_id: session, model: DEVELOPER_MODEL },
            { type: 'assistant', session_id: session, message: { id: 'fixture', model: DEVELOPER_MODEL, content: [] } },
            { type: 'result', subtype: 'success', is_error: false, session_id: session, structured_output: payload, modelUsage: { [DEVELOPER_MODEL]: {} }, usage: { input_tokens: 1, output_tokens: 1 } },
        ] : [{ type: 'item.completed', item: { type: 'agent_message', text: `\`\`\`json\n${JSON.stringify(payload)}\n\`\`\`` } }];
        events.forEach(event => options.onLine?.(JSON.stringify(event)));
        return events.map(event => JSON.stringify(event)).join('\n');
    });
    try {
        const runtime = new WorkerRuntime(f.store, execute);
        await expect(runtime.run(role, 'Synthetic assignment', schema, { stage: role === 'analyst' ? 'feature-research' : 'conversation', readOnly: true, officeQA: role === 'qa' })).resolves.toMatchObject({ outcome: 'blocked' });
        expect(execute).toHaveBeenCalledTimes(1);
        const work = f.store.state.workLog!.at(-1)!, dir = resolve(f.store.dataRoot, 'sessions', work.id);
        expect(work.executionStatus).toBe('completed'); expect(work.status).toBe('blocked');
        if (role !== 'developer') {
            expect(readFileSync(resolve(dir, 'response-original.txt'), 'utf8')).toContain('```json');
            expect(JSON.parse(readFileSync(resolve(dir, 'response-normalization.json'), 'utf8'))).toMatchObject({ repeatedActions: false });
        }
    } finally { f.close(); }
});

test('invalid completed JSON remains an error and never starts another provider turn', async () => {
    const f = knowledgeStore('brain', '2026-11-06T23:00:00Z');
    const execute = vi.fn(async () => JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: '{"outcome":"passed"}' } }));
    try {
        const runtime = new WorkerRuntime(f.store, execute);
        await expect(runtime.run('qa', 'Synthetic assignment', schema, { stage: 'conversation', readOnly: true, officeQA: true })).rejects.toThrow();
        expect(execute).toHaveBeenCalledTimes(1);
        const work = f.store.state.workLog!.at(-1)!;
        expect(existsSync(resolve(f.store.dataRoot, 'sessions', work.id, 'execution-completion.json'))).toBe(false);
    } finally { f.close(); }
});
