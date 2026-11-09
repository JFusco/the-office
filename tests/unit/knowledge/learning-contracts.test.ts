import { test, expect } from 'vitest';
import { RetrospectiveResultSchema } from '../../../server/knowledge/retrospective-result';
import { migrateSnapshot } from '../../../server/store/migrations';
import { configureKnowledge } from '../../../server/knowledge/lesson-commands';
import { knowledgeStore, learningLesson } from './knowledge-fixture';
test('legacy inactive guidance and histories survive migration; registration uses current time without fake exposure', () => {
    const { store, close } = knowledgeStore();
    try {
        const k = store.state.knowledge!; k.lessons = [learningLesson('old', { tier: undefined, revision: undefined, status: 'ineffective' })];
        delete k.improvementGrant; delete k.learningStartedAt; k.consumed.push('saved');
        migrateSnapshot(store.state, store.project, '2026-11-09T10:00:00Z');
        expect(k.lessons[0]).toMatchObject({ tier: 'guidance', revision: 1, status: 'ineffective' });
        expect(k.consumed).toContain('saved'); expect(k.exposures).toEqual([]);
        expect(store.state.knowledge!.improvementGrant?.registeredAt).toBe('2026-11-09T10:00:00Z');
        configureKnowledge(store, { enabled: true, improvementsEnabled: false }); expect(store.state.knowledge!.improvementGrant?.enabled).toBe(false);
    } finally { close(); }
});
test('model cannot promote procedure/rule authority or provide executable fields', () => {
    for (const tier of ['procedure', 'rule']) expect(RetrospectiveResultSchema.safeParse({ summary: 'x', recurrences: [], improvements: [], lessons: [{ tier, statement: 'x', detail: '', kind: 'process', stages: ['any'], paths: [], evidenceIds: [], repositoryInstruction: false }] }).success).toBe(false);
});
