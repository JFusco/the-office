import { test, expect } from 'vitest';
import { RetrospectiveResultSchema } from '../../../server/knowledge/retrospective-result';
import { migrateSnapshot } from '../../../server/store/migrations';
import { configureKnowledge } from '../../../server/knowledge/lesson-commands';
import { knowledgeOutbox } from '../../../server/knowledge/knowledge-outbox';
import { knowledgeStore, learningLesson } from './knowledge-fixture';
test('legacy inactive guidance is retired and histories survive migration; registration uses current time without fake exposure', () => {
    const { store, close } = knowledgeStore();
    try {
        const k = store.state.knowledge!; k.lessons = [learningLesson('old', { tier: undefined, revision: undefined, status: 'ineffective' as never, recurrences: [{ detail: 'x' }] } as never)];
        delete k.improvementGrant; delete k.learningStartedAt; k.consumed.push('saved');
        migrateSnapshot(store.state, store.project, '2026-11-09T10:00:00Z');
        expect(k.lessons[0]).toMatchObject({ tier: 'guidance', revision: 1, status: 'retired' }); expect(k.lessons[0]).not.toHaveProperty('recurrences');
        expect(k.consumed).toContain('saved'); expect(k.exposures).toEqual([]);
        expect(store.state.knowledge!.improvementGrant?.registeredAt).toBe('2026-11-09T10:00:00Z');
        configureKnowledge(store, { enabled: true, improvementsEnabled: false }); expect(store.state.knowledge!.improvementGrant?.enabled).toBe(false);
    } finally { close(); }
});
test('model cannot promote procedure/rule authority or provide executable fields', () => {
    const parses = (tier: string) => RetrospectiveResultSchema.safeParse({ summary: 'x', improvements: [], lessons: [{ tier, when: 'x', statement: 'x', check: 'x', detail: '', kind: 'process', stages: ['any'], paths: [], evidenceIds: [], repositoryInstruction: false }] }).success;
    expect(parses('guidance')).toBe(true);
    for (const tier of ['procedure', 'rule']) expect(parses(tier)).toBe(false);
});
test('migration drops recurrence grading from lessons, office mirrors and a pending roll-up, keeps source reviews, and is idempotent', () => {
    const { store, close } = knowledgeStore();
    try {
        const k = store.state.knowledge!, reasons = ['source-changed', 'source-withdrawn', 'office-authored'] as const;
        k.lessons = [learningLesson('graded', { needsReview: true }), ...reasons.map(reason => learningLesson(reason, { needsReview: true, sourceReviewReason: reason }))];
        k.officeLessons = [{ ...learningLesson('office', { scope: 'office' }), recurrences: [{ detail: 'x' }] } as never];
        k.rollupRetry = { id: 'rollup:2026-11-06', attempts: 1, nextAt: '', lastError: '', flaggedLessonIds: ['graded'], metrics: { completed: 1, recurrences: 2 }, learning: { assignments: 1, applicationUnknown: 1, procedureConfirmed: 0, procedureFailed: 0, procedureUnknown: 0 } } as never;
        migrateSnapshot(store.state, store.project, '2026-11-09T10:00:00Z');
        expect(k.lessons[0]).not.toHaveProperty('needsReview');
        expect(knowledgeOutbox(store.state).map(item => item.id).filter(id => id.startsWith('lesson-review:'))).toEqual(reasons.map(reason => `lesson-review:${reason}`));
        for (const reason of reasons) expect(k.lessons.find(lesson => lesson.id === reason)).toMatchObject({ needsReview: true, sourceReviewReason: reason });
        expect(k.officeLessons![0]).not.toHaveProperty('recurrences');
        expect(k.rollupRetry).toEqual({ id: 'rollup:2026-11-06', attempts: 1, nextAt: '', lastError: '', metrics: { completed: 1 }, learning: { assignments: 1 } });
        const once = JSON.stringify(k);
        migrateSnapshot(store.state, store.project, '2026-11-10T10:00:00Z');
        expect(JSON.stringify(k)).toBe(once);
    } finally { close(); }
});
