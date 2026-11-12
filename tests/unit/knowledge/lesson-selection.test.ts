import { test, expect } from 'vitest';
import { selectLessons, MAX_LESSONS, SECTION_LIMIT } from '../../../server/knowledge/lesson-selection';
import { knowledgeStore, learningLesson } from './knowledge-fixture';
test('stage and path relevance rank ahead of recency; hypotheses and uninstalled procedures stay out', () => {
    const { store, close } = knowledgeStore();
    try {
        store.state.knowledge!.lessons = [learningLesson('any', { stages: ['any'] }), learningLesson('new', { createdAt: '2026-11-07' }), learningLesson('path', { paths: ['server\\knowledge'] }), learningLesson('idea', { tier: 'hypothesis' }), learningLesson('uninstalled', { tier: 'procedure' })];
        const selected = selectLessons(store, { stage: 'github-review', paths: ['server/knowledge/foo.ts'] });
        expect(selected.selected[0].id).toBe('path');
        expect(selected.selected.map(item => item.id)).toEqual(['path', 'new', 'any']);
        expect(selectLessons(store, { stage: 'knowledge-research' }).text).toBe('');
    } finally { close(); }
});
test('every eligible pair is either supplied whole or explicitly omitted by its budget', () => {
    const { store, close } = knowledgeStore();
    try {
        store.state.knowledge!.lessons = Array.from({ length: 30 }, (_, i) => learningLesson(String(i), { statement: 'x'.repeat(1000) }));
        const selection = selectLessons(store, { stage: 'review' });
        expect(selection.text.length).toBeLessThanOrEqual(SECTION_LIMIT);
        expect(selection.selected.length + selection.omitted.length).toBe(30);
        expect(selection.omitted.every(item => item.reason === 'character-limit')).toBe(true);
    } finally { close(); }
});
test('a prompt carries at most ten lessons and names the rest as omitted by count', () => {
    const { store, close } = knowledgeStore();
    try {
        store.state.knowledge!.lessons = Array.from({ length: 14 }, (_, i) => learningLesson(`L${i}`, { statement: `Short lesson ${i}` }));
        const selection = selectLessons(store, { stage: 'github-review' });
        expect(MAX_LESSONS).toBe(10);
        expect(selection.selected).toHaveLength(10);
        expect(selection.omitted.map(item => item.reason)).toEqual(Array(4).fill('count-limit'));
    } finally { close(); }
});
test('a conversation read-back receives general guidance, not repair lessons', () => {
    const { store, close } = knowledgeStore();
    try {
        store.state.knowledge!.lessons = [learningLesson('repair', { stages: ['repair'] }), learningLesson('any', { stages: ['any'] })];
        expect(selectLessons(store, { stage: 'conversation-readback' }).selected.map(item => item.id)).toEqual(['any']);
        expect(selectLessons(store, { stage: 'github-ci-recovery' }).selected.map(item => item.id)).toEqual(['repair', 'any']);
    } finally { close(); }
});
