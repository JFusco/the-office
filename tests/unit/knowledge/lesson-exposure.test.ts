import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { prepareExposure, dispatchExposure } from '../../../server/knowledge/lesson-exposure';
import { selectLessons } from '../../../server/knowledge/lesson-selection';
import { learningMetrics } from '../../../server/knowledge/learning-metrics';
import { knowledgeStore, learningLesson } from './knowledge-fixture';
test('prepared handoff is immutable and does not count until provider dispatch; repeated dispatch is idempotent', () => {
    const { store, close } = knowledgeStore();
    try {
        store.state.knowledge!.lessons.push(learningLesson());
        prepareExposure(store, store.dataRoot, 'assignment', 'review', selectLessons(store, { stage: 'review' }), { kind: 'job', id: 'job:1' });
        const initial = readFileSync(`${store.dataRoot}/lessons.json`, 'utf8');
        const metrics = () => learningMetrics(store.state.knowledge!, '2026-01', '2027-01');
        expect(metrics().assignments).toBe(0);
        dispatchExposure(store, 'assignment'); dispatchExposure(store, 'assignment');
        expect(metrics()).toMatchObject({ assignments: 1, exposedPairs: 1, applicationUnknown: 1 });
        expect(readFileSync(`${store.dataRoot}/lessons.json`, 'utf8')).toBe(initial);
        expect(JSON.parse(initial).selected).toEqual([{ scope: 'project', id: 'L1', revision: 1 }]);
    } finally { close(); }
});
