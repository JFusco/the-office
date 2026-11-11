import { afterEach, expect, test } from 'vitest';
import { z } from 'zod';
import { selectLessons, SECTION_LIMIT } from '../../../server/knowledge/lesson-selection';
const knowledgeContext = (store: Parameters<typeof selectLessons>[0], stage?: string) => selectLessons(store, { stage }).text;
import { retireLesson } from '../../../server/knowledge/lesson-commands';
import { WorkerRuntime } from '../../../server/workers/worker-runtime';
import type { command } from '../../../server/workers/process';
import type { Lesson, LessonStage } from '../../../src/shared';
import { knowledgeStore } from './knowledge-fixture';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));
function setup(projectId = 'brain') { const fixture = knowledgeStore(projectId); cleanup.push(fixture.close); return fixture; }
let sequence = 0;
const lesson = (statement: string, stages: LessonStage[], overrides: Partial<Lesson> = {}): Lesson => ({ id: `lesson-${++sequence}`, scope: 'project', kind: 'pitfall', when: 'Fixture situation', check: 'Fixture check', statement, detail: '', stages, paths: [], status: 'active', evidence: [{ kind: 'pr', ref: 'pr:x:1', url: 'https://github.com/JFusco/brain/pull/1', detail: 'PR #1' }], sourceRetrospectiveId: 'r', createdAt: `2026-11-0${(sequence % 9) + 1}T00:00:00Z`, updatedAt: '', ...overrides });

test('lessons reach delivery stages by purpose and nothing else', () => {
    const { store } = setup();
    store.state.knowledge!.lessons.push(lesson('IMPLEMENT-LESSON', ['implement']), lesson('REVIEW-LESSON', ['review']), lesson('VALIDATE-LESSON', ['validate']), lesson('INTAKE-LESSON', ['intake']), lesson('ANY-LESSON', ['any']));
    const seen = (stage: string) => knowledgeContext(store, stage);
    expect(seen('github-implement')).toContain('IMPLEMENT-LESSON');
    expect(seen('github-implement')).toContain('ANY-LESSON');
    expect(seen('github-implement')).not.toContain('REVIEW-LESSON');
    expect(seen('github-lead-pr')).toContain('REVIEW-LESSON');
    expect(seen('github-validate')).toContain('VALIDATE-LESSON');
    expect(seen('assignment-review')).toContain('INTAKE-LESSON');
    expect(seen('github-merge')).toContain('ANY-LESSON');
    expect(seen('github-merge')).not.toContain('IMPLEMENT-LESSON');
    for (const stage of ['conversation', 'slack-send', 'slack-recipient', 'slack-verify', 'readback', 'it-investigation']) {
        expect(seen(stage)).toContain('ANY-LESSON'); expect(seen(stage)).not.toContain('IMPLEMENT-LESSON');
    }
    expect(seen('feature-research')).toContain('INTAKE-LESSON');
    for (const stage of ['knowledge-research', 'daily-cto', 'retrospective', 'something-new', undefined])
        expect(seen(stage as string)).toBe('');
});

test('CEC stages get lessons by purpose, and mailbox, CI and staging waits get none', () => {
    const { store } = setup('cec');
    store.state.knowledge!.lessons.push(lesson('CEC-REVIEW', ['review']), lesson('CEC-REPAIR', ['repair']));
    expect(knowledgeContext(store, 'code-review')).toContain('CEC-REVIEW');
    expect(knowledgeContext(store, 'repair-review')).toContain('CEC-REPAIR');
    for (const stage of ['mailbox', 'ci', 'ready-for-staging']) expect(knowledgeContext(store, stage)).toBe('');
});

test('the section is bounded to whole lessons and retirement removes a lesson', () => {
    const { store } = setup();
    for (let i = 0; i < 30; i++)
        store.state.knowledge!.lessons.push(lesson(`Lesson ${i} ${'detail '.repeat(40)}`.trim(), ['any'], { evidence: Array.from({ length: 10 }, (_, e) => ({ kind: 'step', ref: `s${e}`, url: `https://github.com/JFusco/brain/pull/${e}${'x'.repeat(e === 0 ? 600 : 0)}`, detail: '' })) }));
    const section = knowledgeContext(store, 'github-review');
    expect(section.length).toBeLessThanOrEqual(SECTION_LIMIT);
    const lines = section.split('\n').slice(1);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.length).toBeLessThanOrEqual(20);
    for (const line of lines) {
        expect(line).toMatch(/^- \[pitfall · any\] When: Fixture situation Do: Lesson \d+ (detail ){39}detail Check: Fixture check Evidence: \S+ \S+ Reference: lesson:project:lesson-\d+@1$/);
        expect(line).not.toContain('x'.repeat(600)); // oversized URLs are omitted, never cut
    }
    const first = store.state.knowledge!.lessons.find(item => section.includes(item.statement))!;
    retireLesson(store, first.id);
    expect(knowledgeContext(store, 'github-review')).not.toContain(`${first.statement} `);
});

test('the actual worker prompt carries lessons for a delivery stage but not for leadership work', async () => {
    const { store } = setup();
    store.state.knowledge!.lessons.push(lesson('PROMPT-MARKER lesson', ['review']));
    const inputs: string[] = [];
    const execute: typeof command = async (_program, _args, options = {}) => {
        inputs.push(String(options.input || ''));
        for (const event of [{ type: 'thread.started', thread_id: crypto.randomUUID() }, { type: 'item.completed', item: { type: 'agent_message', text: '{"ok":true}' } }])
            options.onLine?.(JSON.stringify(event));
        return '';
    };
    const runtime = new WorkerRuntime(store, execute), schema = z.object({ ok: z.boolean() }).strict();
    await runtime.run('lead', 'Review the PR', schema, { readOnly: true, stage: 'github-lead-pr', ticket: 'GH-12' });
    await runtime.run('cto', 'Daily assessment', schema, { readOnly: true, crossProjectRead: true, stage: 'daily-cto' });
    expect(inputs[0]).toContain('PROJECT LESSONS');
    expect(inputs[0]).toContain('PROMPT-MARKER lesson');
    expect(inputs[1]).not.toContain('PROJECT LESSONS');
});

test("Sam's GitHub CI diagnosis receives repair lessons", () => {
    const { store } = setup();
    store.state.knowledge!.lessons.push(lesson('FLAKY-CHECK lesson', ['repair']));
    expect(knowledgeContext(store, 'github-ci-diagnosis')).toContain('FLAKY-CHECK lesson');
});

test('a running Harper worker never makes its ticket look owned to delivery', async () => {
    const { SessionBridge } = await import('../../../server/workers/session-bridge');
    const { store } = setup();
    const worker = (role: 'knowledge' | 'developer') => ({ id: crypto.randomUUID(), role, status: 'running', ticket: 'GH-12', requestId: `job:${role}`, provider: 'codex', sessionId: '', task: 'x', stage: role === 'knowledge' ? 'retrospective' : 'github-implement' } as never);
    const execute: typeof command = async (program, args) => program === 'claude' ? '[]' : program === 'git' ? `${store.project.repo}/.git\n` : '';
    const bridge = new SessionBridge(() => [store], execute, async () => [], async () => Object.assign([], { unaccounted: [] }));
    store.state.workLog = [worker('knowledge')];
    await bridge.refresh();
    expect(bridge.forProject(store, 'GH-12', 'other-job').ownership.status).toBe('clear');
    store.state.workLog = [worker('developer')];
    await bridge.refresh();
    expect(bridge.forProject(store, 'GH-12', 'other-job').ownership.status).toBe('owned');
});
