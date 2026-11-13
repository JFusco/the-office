import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { OutboxMaintenanceStatus } from '../../../../src/conversations/OutboxMaintenanceStatus';
import { recommendedReply } from '../../../../src/conversations/recommended-reply';
import { Outbox } from '../../../../src/conversations/Outbox';
import { OutboxLessonDecision } from '../../../../src/conversations/OutboxLessonDecision';
import { lessonDecisionState, readLessonDecision } from '../../../../src/conversations/lesson-decision-state';
import { initialSnapshot } from '../../../../server/store/store';
import { coordination } from '../../../../server/scheduling/coordination';
import { learningLesson } from '../../knowledge/knowledge-fixture';

function fixture() {
    const snapshot = initialSnapshot();
    snapshot.project = { id: 'brain', name: 'Brain', provider: 'github' } as never;
    snapshot.mode = 'live'; snapshot.coordination = coordination();
    snapshot.knowledge = { enabled: true, lessons: [learningLesson('local', { statement: 'Check plan archives.', detail: 'The archive contained a private path.', when: 'Before publishing', check: 'No private path in the diff', repositoryInstruction: { status: 'proposed' } })], pending: [], retrospectives: [], consumed: [] } as never;
    snapshot.outbox = [{ id: 'lesson-issue:local', title: 'Harper suggests a durable team improvement', detail: 'Check plan archives.', status: 'open', role: 'knowledge', ticket: '', url: '', createdAt: '', updatedAt: '' }];
    return snapshot;
}
const render = (s: ReturnType<typeof fixture>, actionId = 'lesson-issue:local') => renderToStaticMarkup(createElement(OutboxLessonDecision, { snapshot: s, actionId }));
test('selecting a lesson shows the situation, rationale and direct decisions instead of a model composer', () => {
    const snapshot = fixture();
    const html = renderToStaticMarkup(createElement(Outbox, { snapshot, initialId: 'lesson-issue:local', sendMessage: async () => { throw Error('No chat allowed'); } }));
    for (const text of ['Before publishing', 'No private path in the diff', 'The archive contained a private path.', 'Approve — file issue', 'Decline', 'it does not apply a repository change']) expect(html).toContain(text);
    expect(html).not.toContain('Message Morgan'); expect(html).not.toContain('Suggested reply');
});
test('an admitted or failed filing request locks both decisions across remounts without claiming the issue exists', () => {
    const s = fixture();
    for (const status of ['queued', 'working', 'blocked', 'interrupted', 'completed'] as const) {
        s.coordination!.requests = [{ id: 'original-request', action: 'file-lesson-issue', head: 'local', key: '', status, requestedAt: '', detail: 'Provider result uncertain', lane: 'operations' }];
        const html = render(s); expect(html.match(/disabled=""/g)).toHaveLength(2); expect(html).not.toContain('Issue filed and verified.');
    }
    expect(render(s)).toContain('waiting for the verified lesson record');
});
test('only a filed record shows success and its issue link; declining preserves the lesson', () => {
    const s = fixture(), lesson = s.knowledge!.lessons[0];
    lesson.repositoryInstruction = { status: 'filed', issueUrl: 'https://github.com/fixture/brain/issues/9' };
    expect(render(s)).toContain('Issue filed and verified.'); expect(render(s)).toContain('https://github.com/fixture/brain/issues/9'); expect(render(s)).not.toContain('<button');
    lesson.repositoryInstruction = { status: 'declined' };
    expect(render(s)).toContain('Suggestion declined.'); expect(render(s)).not.toContain('<button'); expect(lesson.status).toBe('active');
});
test('a lesson ID from another project cannot expose decision controls', () => {
    const s = fixture(); expect(lessonDecisionState(s, 'lesson-issue:elsewhere')?.proposed).toBeFalsy();
    expect(render(s, 'lesson-issue:elsewhere')).toContain('not available in the selected project'); expect(render(s, 'lesson-issue:elsewhere')).not.toContain('<button');
});
test('office-wide proposals describe their cross-project effect and use the existing accept/decline commands', () => {
    const s = fixture(); s.officeKnowledge = { lessons: [], proposals: [{ id: 'shared', projectId: 'brain', statement: 'Check original effects.', when: 'Before another write', check: 'Every effect accounted for', detail: 'Preserve uncertain effects.', status: 'proposed' }] } as never;
    const state = lessonDecisionState(s, 'office-lesson:shared'); expect(state).toMatchObject({ approve: 'accept-office-lesson', decline: 'decline-office-lesson' });
    expect(render(s, 'office-lesson:shared')).toContain('Accept for all projects'); expect(render(s, 'office-lesson:shared')).toContain('Preserve uncertain effects.');
});

test('exhausted ownership and missing-output maintenance explains the actual owner without suggesting another attempt', () => {
    const s = fixture(); s.maintenance = { runs: [{ id: 'original', status: 'blocked', error: 'incomplete-live-session-inventory; missing-persisted-command-output', readbackRetry: { exhausted: true, attempts: 3 } }] } as never;
    const html = renderToStaticMarkup(createElement(OutboxMaintenanceStatus, { snapshot: s, actionId: 'maintenance:original' }));
    expect(html).toContain('Waiting on Office and the runtime owner'); expect(html).toContain('stopped after 3 attempts'); expect(html).toContain('original command output is also missing'); expect(html).not.toContain('<button');
    expect(recommendedReply(s, '', 'maintenance:original', 'pm')).toBe('');
});

test('a decision-status refresh rejects failed or cross-project reads instead of treating them as permission to resubmit', async () => {
    const s = fixture();
    await expect(readLessonDecision(async () => new Response('{}', { status: 503 }), 'brain', 'lesson-issue:local')).rejects.toThrow('503');
    await expect(readLessonDecision(async () => new Response(JSON.stringify(s)), 'cms-field-vocabulary', 'lesson-issue:local')).rejects.toThrow('another project');
    await expect(readLessonDecision(async () => new Response(JSON.stringify(s)), 'brain', 'lesson-issue:local')).resolves.toMatchObject({ id: 'local', proposed: true });
});
