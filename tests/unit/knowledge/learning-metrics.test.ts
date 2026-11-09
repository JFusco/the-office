import { test, expect } from 'vitest';
import { learningMetrics, lessonsNeedingReview } from '../../../server/knowledge/learning-metrics';
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
test('needs-review requires evidence and a supplied matching revision before two distinct incidents', () => {
    const { store, close } = knowledgeStore();
    try {
        const k = store.state.knowledge!, lesson = learningLesson(); k.lessons.push(lesson);
        for (const id of ['a', 'b']) {
            lesson.recurrences.push({ subjectId: id, retrospectiveId: id, revision: 1, at: '2026-11-05', detail: 'Current same pattern', evidence: [{ kind: 'learning', ref: id, url: '', detail: 'Current proof' }] });
            k.exposures!.push({ id, stage: 'review', subject: { kind: 'job', id }, at: '2026-11-04', dispatchedAt: '2026-11-04', digest: 'text', eligible: [{ scope: 'project', id: 'L1', revision: 1 }], selected: [], omitted: [{ scope: 'project', id: 'L1', revision: 1, reason: 'character-limit' }] });
        }
        expect(lessonsNeedingReview(k)).toEqual([]);
        for (const exposure of k.exposures!) { exposure.selected = exposure.eligible; exposure.omitted = []; }
        expect(lessonsNeedingReview(k).map(item => item.id)).toEqual(['L1']);
        expect(learningMetrics(k, '2026-01', '2027-01')).toMatchObject({ exposedPairs: 2, applicationUnknown: 2 });
        lesson.revision = 2; expect(lessonsNeedingReview(k)).toEqual([]);
        lesson.revision = 1; lesson.reactivatedAt = '2026-11-06'; expect(lessonsNeedingReview(k)).toEqual([]);
    } finally { close(); }
});
