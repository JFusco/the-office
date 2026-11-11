import { test, expect } from 'vitest';
import { learningMetrics } from '../../../server/knowledge/learning-metrics';
import { knowledgeStore, learningLesson } from './knowledge-fixture';
test('activation distinguishes unavailable, partial and complete weekly coverage', () => {
    const f = knowledgeStore();
    try {
        const k = f.store.state.knowledge!; k.learningStartedAt = '2026-11-03T12:00:00Z';
        expect(learningMetrics(k, '2026-10-23', '2026-10-30').coverage?.status).toBe('unavailable');
        expect(learningMetrics(k, '2026-10-30', '2026-11-06').coverage).toEqual({ status: 'partial', startedAt: k.learningStartedAt });
        expect(learningMetrics(k, '2026-11-06', '2026-11-13').coverage?.status).toBe('complete');
        delete k.learningStartedAt;
        expect(learningMetrics(k, '2026-11-06', '2026-11-13').coverage?.status).toBe('unavailable');
    } finally { f.close(); }
});
