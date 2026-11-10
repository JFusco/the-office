import { expect, test, vi } from 'vitest';
import { z } from 'zod';
import { authority as config, intakeFixture } from '../knowledge/slack-intake/fixture';
import { WorkerRuntime } from '../../../server/workers/worker-runtime';
import { CommandFailure } from '../../../server/workers/process';
// Synthetic execution seam only. Real capability refusal is covered in the separate profile suite.
vi.mock('../../../server/workers/slack-intake-profile', async importOriginal => ({ ...await importOriginal<object>(), assertSlackIntakeCapability: async () => undefined }));

test.each(['success', 'failure'])('private worker projection never contains source content: %s', async outcome => {
    const f = intakeFixture(), secret = 'fixture-private-source https://fixture.slack.com/C123';
    try {
        const runtime = new WorkerRuntime(f.store, async (_, args, opts) => {
            expect(opts?.readOnly).toBe(true); expect(opts?.terminateStragglers).toBe(true); expect(opts?.input).toBe(secret);
            expect(args).toContain('apps._default.enabled=false'); expect(opts?.input).not.toContain('OFFICE SESSION BRIDGE');
            if (outcome === 'failure') throw new CommandFailure(secret, 'other', true);
            const events = [{ type: 'item.completed', item: { type: 'agent_message', text: JSON.stringify({ summary: secret }) } }];
            events.forEach(event => opts?.onLine?.(JSON.stringify(event))); return events.map(e => JSON.stringify(e)).join('\n');
        });
        const promise = runtime.run('knowledge', secret, z.object({ summary: z.string() }).strict(), { stage: 'knowledge-slack-intake', cwd: f.store.dataRoot, intakeConfig: config, intakeBinding: f.binding(), onIntakeEvent: () => {}, readOnly: true, requestId: 'opaque' });
        if (outcome === 'failure') await expect(promise).rejects.toThrow('intake-worker-unavailable'); else await promise;
        expect(JSON.stringify(f.store.state)).not.toContain(secret);
        expect(JSON.stringify(f.store.state)).not.toContain('https://fixture.slack.com');
    } finally { f.close(); }
});
test('classification of collected evidence runs without any app or Slack tool capability', async () => {
    const f = intakeFixture();
    try {
        let codex: string[] = [];
        const runtime = new WorkerRuntime(f.store, async (program, args, opts) => {
            if (program !== 'codex') return '';
            codex = args;
            const events = [{ type: 'item.completed', item: { type: 'agent_message', text: JSON.stringify({ summary: 'classified' }) } }];
            events.forEach(event => opts?.onLine?.(JSON.stringify(event))); return events.map(e => JSON.stringify(e)).join('\n');
        });
        await runtime.run('knowledge', 'Classify', z.object({ summary: z.string() }).strict(), { stage: 'knowledge-slack-intake', cwd: f.store.dataRoot, intakeConfig: config, intakeBinding: f.binding(), intakeProcessing: true, onIntakeEvent: () => {}, readOnly: true, requestId: 'opaque' });
        expect(codex.some(arg => arg.startsWith('apps.fixture.tools=') || arg === 'apps.fixture.enabled=true')).toBe(false);
        for (const expected of ['--ignore-user-config', '--strict-config', 'web_search="disabled"', 'features.apps=false']) expect(codex).toContain(expected);
    } finally { f.close(); }
});
test.each([['pause', 'cancelled'], ['observation', 'invalid-output']])('private failures keep sanitized cancellation metadata: %s', async (cause, category) => {
    const f = intakeFixture();
    try {
        let runtime: WorkerRuntime;
        runtime = new WorkerRuntime(f.store, async (program, _args, opts) => {
            if (program !== 'codex') return '';
            if (cause === 'pause') runtime.pause(); else opts?.onLine?.(JSON.stringify({ type: 'item.completed', item: { type: 'mcp_tool_call' } }));
            throw new CommandFailure('fixture-private-source', 'cancelled', true);
        });
        const promise = runtime.run('knowledge', 'Read', z.object({ summary: z.string() }).strict(), { stage: 'knowledge-slack-intake', cwd: f.store.dataRoot, intakeConfig: config, intakeBinding: f.binding(), onIntakeEvent: () => { throw Error('fixture-private-source'); }, readOnly: true, requestId: 'opaque' });
        const error = await promise.catch(e => e);
        expect(error).toBeInstanceOf(CommandFailure); expect(error).toMatchObject({ message: 'intake-worker-unavailable', category, dispatched: true });
    } finally { f.close(); }
});
