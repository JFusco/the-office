import { expect, test } from 'vitest';
import { expireLessons, graduateLessons, queueLessonIssueCheck } from '../../../server/knowledge/lesson-exits';
import { reactivateLesson, retireLesson } from '../../../server/knowledge/lesson-commands';
import { selectLessons } from '../../../server/knowledge/lesson-selection';
import type { command } from '../../../server/workers/process';
import { knowledgeStore, learningLesson } from './knowledge-fixture';

test('a lesson past its end date leaves prompts and can be brought back', () => {
    const { store, close } = knowledgeStore('brain', '2026-11-12T15:00:00Z');
    try {
        store.state.knowledge!.lessons = [learningLesson('past', { validUntil: '2026-11-11' }), learningLesson('today', { validUntil: '2026-11-12' }), learningLesson('open')];
        expireLessons(store); expireLessons(store);
        expect(store.state.knowledge!.lessons.map(lesson => [lesson.id, lesson.status, lesson.retiredBy])).toEqual([['past', 'retired', 'expired'], ['today', 'active', undefined], ['open', 'active', undefined]]);
        expect(selectLessons(store, { stage: 'github-review' }).selected.map(ref => ref.id).sort()).toEqual(['open', 'today']);
        reactivateLesson(store, 'past');
        expect(store.state.knowledge!.lessons[0]).toMatchObject({ status: 'active' });
        expireLessons(store);
        expect(store.state.knowledge!.lessons[0]).toMatchObject({ status: 'active' });
    } finally { close(); }
});

test('a lesson graduates only when its filed issue closed as completed, checked once a day', async () => {
    const { store, close, advance } = knowledgeStore('brain', '2026-11-12T15:00:00Z');
    try {
        const filed = (id: string) => learningLesson(id, { repositoryInstruction: { status: 'filed', issueUrl: `https://github.com/JFusco/brain/issues/${id}`, filedAt: '' } });
        // '5' was reactivated before its issue closed; that must not stop it graduating.
        store.state.knowledge!.lessons = [filed('1'), filed('2'), filed('3'), filed('4'), { ...filed('5'), reactivatedAt: '2026-11-09T00:00:00Z' }, learningLesson('unfiled', { repositoryInstruction: { status: 'proposed' } })];
        const done = '{"state":"CLOSED","stateReason":"COMPLETED","closedAt":"2026-11-10T00:00:00Z"}';
        const states: Record<string, string> = { 1: done, 5: done, 2: '{"state":"CLOSED","stateReason":"NOT_PLANNED"}', 3: '{"state":"OPEN","stateReason":""}' };
        const reads: string[] = [];
        const execute = (async (_file: string, args: string[]) => { reads.push(args[2]); const id = args[2].split('/').pop()!; if (!states[id]) throw new Error('gh unavailable'); return states[id]; }) as unknown as typeof command;
        await graduateLessons(store, execute);
        expect(reads).toHaveLength(5);
        expect(store.state.knowledge!.lessons.map(lesson => [lesson.id, lesson.status, lesson.retiredBy])).toEqual([['1', 'retired', 'graduated'], ['2', 'active', undefined], ['3', 'active', undefined], ['4', 'active', undefined], ['5', 'retired', 'graduated'], ['unfiled', 'active', undefined]]);
        reactivateLesson(store, '1');
        await graduateLessons(store, execute);
        expect(store.state.knowledge!.lessons[0]).toMatchObject({ status: 'active' });

        const queued = () => store.state.coordination!.requests!.filter(request => request.action === 'check-lesson-issues').length;
        queueLessonIssueCheck(store); queueLessonIssueCheck(store); expect(queued()).toBe(1);
        for (const request of store.state.coordination!.requests!) request.status = 'completed';
        advance(24 * 3600000); queueLessonIssueCheck(store); expect(queued()).toBe(2);
        for (const lesson of store.state.knowledge!.lessons) delete lesson.repositoryInstruction;
        for (const request of store.state.coordination!.requests!) request.status = 'completed';
        advance(24 * 3600000); queueLessonIssueCheck(store); expect(queued()).toBe(2);
    } finally { close(); }
});

test('graduation applies to the current record after the provider read and never overrides Joe', async () => {
    const { store, close } = knowledgeStore('brain', '2026-11-12T15:00:00Z');
    try {
        const filed = (id: string) => learningLesson(id, { repositoryInstruction: { status: 'filed', issueUrl: `https://github.com/JFusco/brain/issues/${id}`, filedAt: '' } });
        store.state.knowledge!.lessons = [filed('human'), filed('cloned')];
        const execute = (async (_file: string, args: string[]) => {
            if (args[2].endsWith('/human')) retireLesson(store, 'human');
            else store.state.knowledge!.lessons = structuredClone(store.state.knowledge!.lessons); // a rollback replaces state
            return '{"state":"CLOSED","stateReason":"COMPLETED","closedAt":"2026-11-10T00:00:00Z"}';
        }) as unknown as typeof command;
        await graduateLessons(store, execute);
        expect(store.state.knowledge!.lessons.map(lesson => [lesson.id, lesson.status, lesson.retiredBy])).toEqual([['human', 'retired', 'human'], ['cloned', 'retired', 'graduated']]);
        const graduated = store.state.events.filter(event => event.kind === 'lesson-retired' && event.message.includes('graduated'));
        expect(graduated).toHaveLength(1);
        expect(graduated[0].message).toContain('Guidance cloned');
    } finally { close(); }
});

test('a superseded lesson cannot be reactivated, so two versions are never both active', () => {
    const { store, close } = knowledgeStore('brain', '2026-11-12T15:00:00Z');
    try {
        store.state.knowledge!.lessons = [learningLesson('old', { status: 'retired', retiredBy: 'harper', supersededBy: 'new' }), learningLesson('new', { supersedes: 'old' })];
        expect(() => reactivateLesson(store, 'old')).toThrow('superseded');
        expect(store.state.knowledge!.lessons.map(lesson => lesson.status)).toEqual(['retired', 'active']);
    } finally { close(); }
});
