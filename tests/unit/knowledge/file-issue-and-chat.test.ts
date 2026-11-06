import { afterEach, expect, test, vi } from 'vitest';
import { fileLessonIssue, lessonIssueMarker } from '../../../server/knowledge/file-lesson-issue';
import { declineLessonIssue } from '../../../server/knowledge/lesson-commands';
import { knowledgeChatPrompt } from '../../../server/knowledge/chat-prompt';
import { Engine } from '../../../server/scheduling/engine';
import { Conversations } from '../../../server/conversations/conversations';
import type { command } from '../../../server/workers/process';
import type { Lesson } from '../../../src/shared';
import { knowledgeStore } from './knowledge-fixture';

const cleanup: (() => void)[] = [];
afterEach(() => { cleanup.splice(0).forEach(fn => fn()); vi.restoreAllMocks(); });
function setup(projectId = 'brain') { const fixture = knowledgeStore(projectId); cleanup.push(fixture.close); return fixture; }
const lesson = (overrides: Partial<Lesson> = {}): Lesson => ({ id: 'L-agents', scope: 'project', kind: 'convention', statement: 'Regenerate the catalog with pnpm wiki before committing', detail: 'The verify check fails on drift.', stages: ['implement'], paths: [], status: 'active', evidence: [{ kind: 'pr', ref: 'pr:x:7', url: 'https://github.com/JFusco/brain/pull/7', detail: 'PR #7' }], sourceRetrospectiveId: 'x:completed', recurrences: [], repositoryInstruction: { status: 'proposed' }, createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z', ...overrides });

/** A fake gh: issue search, create and view against an in-memory list. */
function fakeGh(options: { failCreate?: boolean } = {}) {
    const issues: { url: string; body: string }[] = [], calls: string[][] = [];
    const execute = (async (program: string, args: string[], opts: { input?: string } = {}) => {
        calls.push([program, ...args]);
        if (args[0] === 'issue' && args[1] === 'list') return JSON.stringify(issues);
        if (args[0] === 'issue' && args[1] === 'create') {
            const url = `https://github.com/JFusco/brain/issues/${100 + issues.length}`;
            issues.push({ url, body: opts.input || '' });
            if (options.failCreate) throw new Error('transport closed after create');
            return `Creating issue in JFusco/brain\n\n${url}\n`;
        }
        if (args[0] === 'issue' && args[1] === 'view') return JSON.stringify(issues.find(issue => issue.url === args[2]));
        throw new Error(`unexpected ${args.join(' ')}`);
    }) as typeof command;
    return { issues, calls, execute };
}

test('an approved AGENTS.md suggestion becomes exactly one GitHub issue with the marker, read back before it counts', async () => {
    const { store } = setup();
    store.state.knowledge!.lessons.push(lesson());
    const gh = fakeGh();
    const url = await fileLessonIssue(store, gh.execute, 'L-agents');
    expect(url).toBe('https://github.com/JFusco/brain/issues/100');
    expect(gh.issues[0].body).toContain(lessonIssueMarker({ id: 'L-agents' }));
    expect(gh.issues[0].body).toContain('https://github.com/JFusco/brain/pull/7');
    expect(store.state.knowledge!.lessons[0].repositoryInstruction).toMatchObject({ status: 'filed', issueUrl: url });
    expect(await fileLessonIssue(store, gh.execute, 'L-agents')).toBe(url);
    expect(gh.calls.filter(call => call[2] === 'create')).toHaveLength(1);
});

test('an uncertain create is reconciled by searching for the marker and never resent', async () => {
    const { store } = setup();
    store.state.knowledge!.lessons.push(lesson());
    const failing = fakeGh({ failCreate: true });
    await expect(fileLessonIssue(store, failing.execute, 'L-agents')).rejects.toThrow();
    expect(store.getEffect('lesson-issue:L-agents')?.status).toBe('uncertain');
    const url = await fileLessonIssue(store, failing.execute, 'L-agents');
    expect(url).toBe('https://github.com/JFusco/brain/issues/100');
    expect(failing.calls.filter(call => call[2] === 'create')).toHaveLength(1);
    expect(store.state.knowledge!.lessons[0].repositoryInstruction?.status).toBe('filed');
});

test('declined, CEC and unknown suggestions are never filed', async () => {
    const { store } = setup();
    store.state.knowledge!.lessons.push(lesson());
    declineLessonIssue(store, 'L-agents');
    const gh = fakeGh();
    await expect(fileLessonIssue(store, gh.execute, 'L-agents')).rejects.toThrow('Only a proposed');
    await expect(fileLessonIssue(store, gh.execute, 'missing')).rejects.toThrow('not found');
    const cec = setup('cec');
    cec.store.state.knowledge!.lessons.push(lesson());
    await expect(fileLessonIssue(cec.store, gh.execute, 'L-agents')).rejects.toThrow('GitHub projects only');
    expect(gh.calls).toEqual([]);
});

test('Harper answers chat read-only from saved knowledge and may only hand a request to Morgan', async () => {
    const { store } = setup();
    store.state.knowledge!.lessons.push(lesson());
    const engine = new Engine(store), conversations = new Conversations(store, engine, store.dataRoot);
    const reply = { handoffProject: '', pickupChange: null, reply: 'The catalog lesson is the one that matters.', notifyRoles: [], question: '', goalChanges: [], slackRequests: [], notes: [], receipts: [], goalReport: null };
    let task = '';
    vi.spyOn(engine.knowledgeAgents, 'run').mockImplementation(async (_role, text) => { task = text; return reply as never; });
    const asked = conversations.enqueue({ id: crypto.randomUUID(), role: 'knowledge', body: 'What did we learn this week?' });
    await conversations.pumpKnowledge();
    expect(task).toContain('Regenerate the catalog with pnpm wiki');
    expect(asked.status).toBe('answered');
    expect(store.state.messages.some(m => m.from === 'knowledge' && m.body === reply.reply)).toBe(true);
    vi.spyOn(engine.knowledgeAgents, 'run').mockImplementation(async () => ({ ...reply, notifyRoles: ['developer'] }) as never);
    const second = conversations.enqueue({ id: crypto.randomUUID(), role: 'knowledge', body: 'Tell Alex to fix it' });
    await conversations.pumpKnowledge();
    expect(second.status).toBe('failed');
    expect(knowledgeChatPrompt(store, second, '')).toContain('Read-only chat');
});

test("Morgan picks up Harper's note for the team, and Joe's messages to Harper stay with Harper", async () => {
    const { store } = setup();
    const engine = new Engine(store), conversations = new Conversations(store, engine, store.dataRoot);
    const toHarper = conversations.enqueue({ id: crypto.randomUUID(), role: 'knowledge', body: 'Question for Harper' });
    store.state.messages.push({ id: 'knowledge-report:x', requestId: 'knowledge-report:x', from: 'knowledge', to: 'pm', ticket: '', actionId: '', body: "Harper's note for the team: retire the flaky check", status: 'queued', createdAt: new Date().toISOString(), sessionId: '', recheck: false, error: '', recipients: [], receipts: [] } as never);
    const seen: string[] = [];
    engine.agents.followup = async (_role, message) => { seen.push(message.id); return { handoffProject: '', pickupChange: null, reply: 'Noted.', notifyRoles: [], question: '', goalChanges: [], slackRequests: [], notes: [], receipts: [], goalReport: null } as never; };
    await conversations.pump(toHarper.id);
    await conversations.pump('knowledge-report:x');
    expect(seen).toEqual(['knowledge-report:x']);
    expect(store.state.messages.find(m => m.id === 'knowledge-report:x')!.status).toBe('answered');
    expect(toHarper.status).toBe('queued');
});
