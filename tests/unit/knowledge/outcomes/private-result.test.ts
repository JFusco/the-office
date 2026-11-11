import { expect, it } from 'vitest';
import { knowledgeStore } from '../knowledge-fixture';
import { SourceRegistry } from '../../../../server/knowledge/sources/registry';
import { captureLearning } from '../../../../server/knowledge/learning-events';
import { readAcceptedResult } from '../../../../server/knowledge/outcomes/private-result';
import { runRetrospective, type KnowledgeRunner } from '../../../../server/knowledge/run-retrospective';
import { digest } from '../../../../server/knowledge/digest';
import { selectLessons } from '../../../../server/knowledge/lesson-selection';
import { knowledgeSnapshot } from '../../../../server/knowledge/knowledge-snapshot';

it('retains exact source-derived accepted work privately and carries its scope through generic citations', async () => {
    const f = knowledgeStore('cec');
    try {
        const store = f.store, registry = new SourceRegistry(store.db, store.clock), source = registry.create({ kind: 'artifact', title: 'Private', homeProjectId: 'brain' });
        registry.subscribe(source.id, 'cec', true);
        const knowledge = store.state.knowledge!; knowledge.enabled = true;
        const subject = { kind: 'job' as const, id: 'scoped-work' };
        knowledge.exposures = [{ id: 'attempt', at: 'now', dispatchedAt: 'now', stage: 'implement', subject, digest: 'hash', eligible: [], selected: [], omitted: [], sourceBindings: [{ sourceId: source.id }] }];
        const result = { outcome: 'passed', summary: 'PRIVATE ACCEPTED TEXT', citations: [] };
        captureLearning(store, subject, 'GH-1', 'implement', 'accepted', result, result.summary, 'work', true);
        const pending = knowledge.pending[0], proof = pending.opportunities![0].evidence[0];
        expect(JSON.stringify(pending)).not.toContain('PRIVATE ACCEPTED TEXT');
        expect(readAcceptedResult(store, proof.acceptedResult!)?.result).toEqual(result);
        const scans: string[] = [], context = { registry, stores: new Map([['cec', store]]), brain: { snapshot: async () => '', search: async () => [], read: async () => ({ text: '', contentSha256: '' }) }, scan: async (text: string) => { scans.push(text); return { version: 1 as const, inputSha256: digest(text), scannerVersion: 'injected', policyVersion: 'injected', clean: true, findings: [] }; } };
        const runner = (async (prompt: string) => {
            expect(prompt).toContain('PRIVATE ACCEPTED TEXT');
            return { summary: 'PRIVATE DERIVED SUMMARY', lessons: [{ when: 'Fixture situation', check: 'Fixture check', statement: 'Derived advisory guidance', detail: 'Private derivation', kind: 'pitfall', stages: ['any'], paths: [], evidenceIds: ['job:scoped-work'], repositoryInstruction: false }] };
        }) as KnowledgeRunner;
        await runRetrospective(store, runner, pending.id, context);
        expect(scans).toHaveLength(2);
        expect(knowledge.lessons[0].evidence[0].sourceBindings).toContainEqual({ sourceId: source.id });
        expect(selectLessons(store, { stage: 'implement' }, registry).sourceBindings).toContainEqual({ sourceId: source.id });
        registry.subscribe(source.id, 'cec', false);
        const scoped = knowledgeSnapshot(registry, 'cec', knowledge)!;
        expect(scoped.lessons).toEqual([]); expect(scoped.retrospectives).toEqual([]);
        expect(selectLessons(store, { stage: 'implement' }, registry).text).toBe('');
        expect(readAcceptedResult(store, { ...proof.acceptedResult!, sha256: 'b'.repeat(64) })).toBeUndefined();
        expect(JSON.stringify(store.state.knowledge)).not.toContain('PRIVATE ACCEPTED TEXT');
    } finally { f.close(); }
});
