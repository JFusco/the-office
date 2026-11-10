import { expect, it } from 'vitest';
import { knowledgeStore, job, result } from '../knowledge-fixture';
import { SourceRegistry } from '../../../../server/knowledge/sources/registry';
import { knowledgeOfficeState } from '../../../../server/knowledge/office-state-view';
import { revokedSubjects } from '../../../../server/knowledge/sources/retained-scope';
import { leadershipEntries } from '../../../../server/knowledge/leadership-context';
import type { OfficeEntry } from '../../../../server/scheduling/scheduled-work';

it('revokes lookup-derived job, conversation and note copies while preserving private audit state', () => {
    const f = knowledgeStore();
    try {
        const store = f.store, registry = new SourceRegistry(store.db), source = registry.create({ kind: 'artifact', title: 'Private source', homeProjectId: 'brain' });
        const work = job({ id: 'owned-job', detail: 'PRIVATE RESULT', steps: [{ stage: 'implement', result: result('implement', { summary: 'PRIVATE RESULT' }) } as never] });
        store.state.coordination!.jobs!.push(work);
        store.state.knowledge!.exposures = [{ id: 'attempt', stage: 'implement', at: 'now', dispatchedAt: 'now', digest: '', eligible: [], selected: [], omitted: [], subject: { kind: 'job', id: work.id } }];
        store.state.knowledge!.lookups = [{ id: 'attempt', stage: 'implement', startedAt: 'now', records: [{ assignment: 'attempt', index: 1, at: 'now', outcome: 'served', sourceBindings: [{ sourceId: source.id }], selected: [], textSha256: 'hash', technicalStatus: 'unavailable', snapshot: null }] } as never];
        store.state.messages.push({ id: 'reply', requestId: work.id, ticket: work.key, body: 'PRIVATE RESULT', from: 'pm', to: 'cto', recipients: [], receipts: [], status: 'answered', createdAt: 'now' } as never);
        store.state.projectNotes.push({ id: 'note', requestId: work.id, ticket: work.key, summary: 'PRIVATE RESULT', detail: 'Private note' } as never);
        expect(knowledgeOfficeState(registry, 'brain', store.state).coordination!.jobs).toHaveLength(1);
        const global = leadershipEntries([{ store } as OfficeEntry], registry)[0].store;
        expect(global.state.coordination!.jobs).toHaveLength(0); expect(global.state.messages).toHaveLength(0);
        registry.subscribe(source.id, 'brain', false);
        expect(revokedSubjects(registry, 'brain', store.state)).toContainEqual({ kind: 'job', id: work.id });
        const projected = knowledgeOfficeState(registry, 'brain', store.state);
        expect(projected.coordination!.jobs).toHaveLength(0); expect(projected.messages).toHaveLength(0); expect(projected.projectNotes).toHaveLength(0);
        expect(store.state.coordination!.jobs![0].steps[0].result.summary).toBe('PRIVATE RESULT');
        registry.subscribe(source.id, 'brain', true);
        expect(knowledgeOfficeState(registry, 'brain', store.state).coordination!.jobs).toHaveLength(1);
    } finally { f.close(); }
});
