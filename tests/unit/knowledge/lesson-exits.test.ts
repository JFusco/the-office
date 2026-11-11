import { expect, test } from 'vitest';
import { expireLessons, graduateLessons, queueLessonIssueCheck } from '../../../server/knowledge/lesson-exits';
import { reactivateLesson } from '../../../server/knowledge/lesson-commands';
import { selectLessons } from '../../../server/knowledge/lesson-selection';
import type { command } from '../../../server/workers/process';
import { knowledgeStore, learningLesson } from './knowledge-fixture';
import { migrateSnapshot } from '../../../server/store/migrations';

test('a lesson past its end date leaves prompts and can be brought back', () => {
    const { store, close } = knowledgeStore('brain', '2026-11-12T15:00:00Z');
    try {
        store.state.knowledge!.lessons = [learningLesson('past', { validUntil: '2026-11-11' }), learningLesson('today', { validUntil: '2026-11-12' }), learningLesson('open')];
        expireLessons(store); expireLessons(store);
        expect(store.state.knowledge!.lessons.map(lesson => [lesson.id, lesson.status, lesson.retiredBy])).toEqual([['past', 'retired', 'expired'], ['today', 'active', undefined], ['open', 'active', undefined]]);
        expect(selectLessons(store, { stage: 'github-review' }).selected.map(ref => ref.id).sort()).toEqual(['open', 'today']);
        reactivateLesson(store, 'past');
        expect(store.state.knowledge!.lessons[0]).toMatchObject({ status: 'active' });
    } finally { close(); }
});

test('a lesson graduates only when its filed issue closed as completed, checked once a day', async () => {
    const { store, close, advance } = knowledgeStore('brain', '2026-11-12T15:00:00Z');
    try {
        const filed = (id: string) => learningLesson(id, { repositoryInstruction: { status: 'filed', issueUrl: `https://github.com/JFusco/brain/issues/${id}`, filedAt: '' } });
        store.state.knowledge!.lessons = [filed('1'), filed('2'), filed('3'), filed('4'), learningLesson('unfiled', { repositoryInstruction: { status: 'proposed' } })];
        const states: Record<string, string> = { 1: '{"state":"CLOSED","stateReason":"COMPLETED"}', 2: '{"state":"CLOSED","stateReason":"NOT_PLANNED"}', 3: '{"state":"OPEN","stateReason":""}' };
        const reads: string[] = [];
        const execute = (async (_file: string, args: string[]) => { reads.push(args[2]); const id = args[2].split('/').pop()!; if (!states[id]) throw new Error('gh unavailable'); return states[id]; }) as unknown as typeof command;
        await graduateLessons(store, execute);
        expect(reads).toHaveLength(4);
        expect(store.state.knowledge!.lessons.map(lesson => [lesson.id, lesson.status, lesson.retiredBy])).toEqual([['1', 'retired', 'graduated'], ['2', 'active', undefined], ['3', 'active', undefined], ['4', 'active', undefined], ['unfiled', 'active', undefined]]);

        const queued = () => store.state.coordination!.requests!.filter(request => request.action === 'check-lesson-issues').length;
        queueLessonIssueCheck(store); queueLessonIssueCheck(store); expect(queued()).toBe(1);
        for (const request of store.state.coordination!.requests!) request.status = 'completed';
        advance(24 * 3600000); queueLessonIssueCheck(store); expect(queued()).toBe(2);
        for (const lesson of store.state.knowledge!.lessons) delete lesson.repositoryInstruction;
        for (const request of store.state.coordination!.requests!) request.status = 'completed';
        advance(24 * 3600000); queueLessonIssueCheck(store); expect(queued()).toBe(2);
    } finally { close(); }
});

test('a stored lesson that belongs in its repository is offered once as an issue; declining it is not undone', () => {
    const { store, close } = knowledgeStore('cms-field-vocabulary');
    try {
        const k = store.state.knowledge!, id = '53b8a7c6-c5a0-40a9-b60b-99fc5800b4c7';
        k.lessons = [learningLesson(id), learningLesson('ordinary')];
        migrateSnapshot(store.state, store.project);
        const status = (lessonId: string) => k.lessons.find(lesson => lesson.id === lessonId)!.repositoryInstruction?.status;
        expect([status(id), status('ordinary')]).toEqual(['proposed', undefined]);
        k.lessons[0].repositoryInstruction = { status: 'declined' };
        migrateSnapshot(store.state, store.project);
        expect(k.lessons.find(lesson => lesson.id === id)!.repositoryInstruction).toEqual({ status: 'declined' });
    } finally { close(); }
});
