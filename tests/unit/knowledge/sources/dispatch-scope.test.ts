import { expect, it } from 'vitest';
import { z } from 'zod';
import { knowledgeStore, job } from '../knowledge-fixture';
import { SourceRegistry } from '../../../../server/knowledge/sources/registry';
import { WorkerRuntime } from '../../../../server/workers/worker-runtime';

it('runs no command when a follow-up would reuse revoked source-derived work', async () => {
    const f = knowledgeStore();
    try {
        const store = f.store, registry = new SourceRegistry(store.db), source = registry.create({ kind: 'artifact', title: 'Private source', homeProjectId: 'brain' });
        const work = job(); store.state.coordination!.jobs!.push(work);
        store.state.knowledge!.exposures = [{ id: 'attempt', stage: 'implement', at: 'now', dispatchedAt: 'now', digest: '', eligible: [], selected: [], omitted: [], subject: { kind: 'job', id: work.id }, sourceBindings: [{ sourceId: source.id }] }];
        registry.subscribe(source.id, 'brain', false);
        let commands = 0;
        const runtime = new WorkerRuntime(store, async () => { commands++; throw Error('Unexpected provider'); });
        runtime.knowledgeContext = { registry, stores: new Map([['brain', store]]), brain: { snapshot: async () => '', search: async () => [], read: async () => ({ text: '', contentSha256: '' }) } };
        await expect(runtime.run('lead', 'Retained private result', z.object({ ok: z.boolean() }).strict(), { readOnly: true, requestId: work.id, ticket: work.key, stage: 'github-lead-pr' })).rejects.toThrow('source access changed');
        expect(commands).toBe(0); expect(store.state.workLog).toHaveLength(0);
    } finally { f.close(); }
});
