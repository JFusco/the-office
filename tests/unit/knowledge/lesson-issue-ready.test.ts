import { afterEach, expect, test, vi } from 'vitest';
import { fileLessonIssue } from '../../../server/knowledge/file-lesson-issue';
import { readyPendingLessonIssues } from '../../../server/knowledge/lesson-issue-ready';
import { queueLessonIssueCheck } from '../../../server/knowledge/lesson-exits';
import { Coordinator } from '../../../server/scheduling/coordination';
import { Engine } from '../../../server/scheduling/engine';
import { executeRequest } from '../../../server/scheduling/requests';
import * as processTools from '../../../server/workers/process';
import type { command } from '../../../server/workers/process';
import type { EffectIntent } from '../../../src/shared';
import { knowledgeStore, learningLesson } from './knowledge-fixture';

const cleanup: (() => void)[] = [];
afterEach(() => { cleanup.splice(0).forEach(fn => fn()); vi.restoreAllMocks(); });
function setup() { const fixture = knowledgeStore('brain'); cleanup.push(fixture.close); return fixture; }
type TestStore = ReturnType<typeof setup>['store'];
const noWait = async () => {};
const LANES = [{ id: 'opt-backlog', name: 'Backlog' }, { id: 'opt-ready', name: 'Ready' }, { id: 'opt-progress', name: 'In progress' }];
const URL = 'https://github.com/JFusco/brain/issues/500';

/**
 * A fake gh for one repository and its board. GitHub's project automation is modelled by `addAfterReads`:
 * the card appears, in `firstLane`, only after that many card reads. `onStatusRead` runs before the nth Status read.
 */
function fakeGitHub(options: { addAfterReads?: number; firstLane?: string; failMove?: 'before' | 'after'; dropAssignee?: boolean; present?: boolean; onStatusRead?: (read: number, card: { option?: string }) => void } = {}) {
    const issues: { url: string; body: string; assignees: { login: string }[] }[] = [], moves: string[] = [], creates: string[] = [];
    let cardReads = 0, statusReads = 0, card: { id: string; number: number; option?: string } | undefined = options.present ? { id: 'PVTI_card', number: 500, option: 'opt-backlog' } : undefined;
    const execute = (async (program: string, args: string[], opts: { input?: string } = {}) => {
        if (program !== 'gh') throw new Error(`unexpected ${program}`);
        if (args[0] === 'issue' && args[1] === 'list') return JSON.stringify(issues);
        if (args[0] === 'issue' && args[1] === 'create') {
            const url = `https://github.com/JFusco/brain/issues/${500 + issues.length}`, assignee = args.indexOf('--assignee');
            creates.push(url);
            issues.push({ url, body: opts.input || '', assignees: assignee >= 0 && !options.dropAssignee ? [{ login: args[assignee + 1] }] : [] });
            return `${url}\n`;
        }
        if (args[0] === 'issue' && args[1] === 'view') return JSON.stringify(issues.find(issue => issue.url === args[2]));
        if (args[0] === 'api' && args[1] === 'graphql') {
            const { query, variables } = JSON.parse(opts.input || '{}') as { query: string; variables: Record<string, string> };
            if (query.includes('projectV2(number')) return JSON.stringify({ data: { user: { projectV2: { id: 'PVT_brain', fields: { nodes: [{ id: 'FIELD_status', name: 'Status', options: LANES }], pageInfo: { hasNextPage: false } } } } } });
            if (query.includes('items(first')) {
                cardReads++;
                if (!card && issues.length && cardReads > (options.addAfterReads ?? 0)) card = { id: 'PVTI_card', number: 500, option: options.firstLane === '' ? undefined : options.firstLane?.startsWith('opt-') ? options.firstLane : LANES.find(lane => lane.name === (options.firstLane ?? 'Backlog'))?.id };
                return JSON.stringify({ data: { node: { items: { nodes: card ? [{ id: card.id, content: { __typename: 'Issue', number: card.number, repository: { nameWithOwner: 'JFusco/brain' } } }] : [], pageInfo: { hasNextPage: false, endCursor: null } } } } });
            }
            if (query.includes('fieldValues')) {
                options.onStatusRead?.(++statusReads, card || {});
                const option = variables.item === card?.id ? card?.option : undefined;
                return JSON.stringify({ data: { node: { id: variables.item, fieldValues: { nodes: option ? [{ optionId: option, field: { id: 'FIELD_status' } }] : [], pageInfo: { hasNextPage: false } } } } });
            }
            if (query.includes('updateProjectV2ItemFieldValue')) {
                moves.push(variables.option);
                if (options.failMove === 'before') throw new Error('transport closed before the move');
                card!.option = variables.option;
                if (options.failMove === 'after') throw new Error('transport closed after the move');
                return JSON.stringify({ data: { updateProjectV2ItemFieldValue: { projectV2Item: { id: card!.id } } } });
            }
        }
        throw new Error(`unexpected ${args.join(' ')}`);
    }) as typeof command;
    return { issues, moves, creates, execute, card: () => card, setCard: (option: string) => { card!.option = option; } };
}

function promoted(store: TestStore) {
    store.state.knowledge!.lessons.push(learningLesson('L-ready', { repositoryInstruction: { status: 'proposed' } }));
    return () => store.state.knowledge!.lessons.find(lesson => lesson.id === 'L-ready')!.repositoryInstruction!;
}
function filed(store: TestStore, issueUrl = URL) {
    store.state.knowledge!.lessons.push(learningLesson('L-ready', { repositoryInstruction: { status: 'filed', issueUrl, filedAt: '2026-11-20T00:00:00Z', lanePending: true } }));
    return () => store.state.knowledge!.lessons.find(lesson => lesson.id === 'L-ready')!.repositoryInstruction!;
}
const effect = (store: TestStore, attempt = 0) => store.getEffect(`lesson-issue-ready:L-ready:${attempt}`);
const preparedMove: EffectIntent = {
    id: 'lesson-issue-ready:L-ready:0', work: { projectId: 'brain', kind: 'retrospective', id: 'L-ready' }, attemptId: 'L-ready',
    operation: 'lesson-issue-lane', target: 'PVTI_card', authorization: 'joe-approved-lesson-issue',
    payload: { project: 'PVT_brain', item: 'PVTI_card', field: 'FIELD_status', option: 'opt-ready', lane: 'Ready', backlog: 'opt-backlog' },
    expectedState: { lane: 'first' }, status: 'prepared', createdAt: '2026-11-20T00:00:00Z',
    dispatchedAt: '', verifiedAt: '', receipt: null, error: '', elapsedMs: null,
};

test('a promoted lesson issue is assigned to Joe and its automation-added card is moved from Backlog to Ready once', async () => {
    const { store } = setup(), instruction = promoted(store), gh = fakeGitHub({ addAfterReads: 2 });
    await fileLessonIssue(store, gh.execute, 'L-ready', noWait);
    expect(gh.issues[0].assignees).toEqual([{ login: 'JFusco' }]);
    expect(gh.moves).toEqual(['opt-ready']);
    expect(gh.card()?.option).toBe('opt-ready');
    expect(instruction()).toMatchObject({ status: 'filed', issueUrl: gh.issues[0].url });
    expect(instruction().lanePending).toBeUndefined();
    expect(effect(store)?.status).toBe('verified');
    await readyPendingLessonIssues(store, gh.execute, noWait);
    expect(gh.moves).toHaveLength(1);
});

test('an issue GitHub does not read back as assigned to Joe is never filed, recreated or moved', async () => {
    const { store } = setup(), instruction = promoted(store), gh = fakeGitHub({ dropAssignee: true });
    await expect(fileLessonIssue(store, gh.execute, 'L-ready', noWait)).rejects.toThrow();
    await expect(fileLessonIssue(store, gh.execute, 'L-ready', noWait)).rejects.toThrow('not yet confirmed');
    expect(instruction().status).toBe('proposed');
    expect(gh.creates).toHaveLength(1);
    expect(gh.moves).toEqual([]);
    gh.issues[0].assignees = [{ login: 'JFusco' }];
    expect(await fileLessonIssue(store, gh.execute, 'L-ready', noWait)).toBe(gh.issues[0].url);
    expect(gh.creates).toHaveLength(1);
    expect(instruction().status).toBe('filed');
});

test('an existing unassigned issue carrying the marker is neither adopted nor filed again', async () => {
    const { store } = setup(), instruction = promoted(store), gh = fakeGitHub();
    gh.issues.push({ url: URL, body: 'Office lesson L-ready · proposed by Harper', assignees: [] });
    await expect(fileLessonIssue(store, gh.execute, 'L-ready', noWait)).rejects.toThrow('not assigned to JFusco');
    expect(gh.creates).toEqual([]);
    expect(instruction().status).toBe('proposed');
});

test('a card a person already moved is left in their lane, including a lane the board no longer lists', async () => {
    for (const firstLane of ['In progress', 'opt-retired']) {
        const { store } = setup(), instruction = filed(store), gh = fakeGitHub({ firstLane });
        gh.issues.push({ url: URL, body: '', assignees: [{ login: 'JFusco' }] });
        await readyPendingLessonIssues(store, gh.execute, noWait);
        expect(gh.moves).toEqual([]);
        expect(instruction().lanePending).toBeUndefined();
    }
});

test('a person moving the card after the first read is never overwritten', async () => {
    const { store } = setup(), instruction = filed(store);
    const gh = fakeGitHub({ onStatusRead: (read, card) => { if (read === 2) card.option = 'opt-progress'; } });
    gh.issues.push({ url: URL, body: '', assignees: [{ login: 'JFusco' }] });
    await readyPendingLessonIssues(store, gh.execute, noWait);
    expect(gh.moves).toEqual([]);
    expect(effect(store)?.status).toBe('rejected');
    await readyPendingLessonIssues(store, gh.execute, noWait);
    expect(gh.moves).toEqual([]);
    expect(gh.card()?.option).toBe('opt-progress');
    expect(instruction().lanePending).toBeUndefined();
});

test('a pending issue from another repository does not move a same-number card', async () => {
    const { store } = setup(), gh = fakeGitHub({ present: true });
    const instruction = filed(store, 'https://github.com/JFusco/cms-field-vocabulary/issues/500');
    await readyPendingLessonIssues(store, gh.execute, noWait);
    expect(gh.moves).toEqual([]);
    expect(gh.card()?.option).toBe('opt-backlog');
    expect(effect(store)).toBeUndefined();
    expect(instruction().lanePending).toBe(true);
});

test('the pickup setting must match the board option exactly before filing moves the card', async () => {
    const { store } = setup(), instruction = promoted(store), gh = fakeGitHub({ present: true });
    store.state.coordination!.pickup = { enabled: true, status: 'ready' };
    await fileLessonIssue(store, gh.execute, 'L-ready', noWait);
    expect(gh.moves).toEqual([]);
    expect(gh.card()?.option).toBe('opt-backlog');
    expect(instruction()).toMatchObject({ status: 'filed', lanePending: true });

    store.state.coordination!.pickup.status = 'Ready';
    await readyPendingLessonIssues(store, gh.execute, noWait);
    expect(gh.moves).toEqual(['opt-ready']);
    expect(effect(store)?.status).toBe('verified');
    expect(instruction().lanePending).toBeUndefined();
});

test('a card that has not appeared yet leaves the filing done and the lane pending for the daily check', async () => {
    const { store } = setup(), instruction = promoted(store), gh = fakeGitHub({ addAfterReads: 100 });
    await fileLessonIssue(store, gh.execute, 'L-ready', noWait);
    expect(instruction()).toMatchObject({ status: 'filed', lanePending: true });
    expect(gh.issues).toHaveLength(1);
    expect(effect(store)).toBeUndefined();
    expect(store.state.events.some(event => event.kind === 'lesson-issue-lane-pending')).toBe(true);

    const later = fakeGitHub(); later.issues.push(...gh.issues);
    await readyPendingLessonIssues(store, later.execute, noWait);
    expect(later.moves).toEqual(['opt-ready']);
    expect(later.creates).toEqual([]);
    expect(instruction().lanePending).toBeUndefined();
});

test('an uncertain move is settled by read-back and never sent twice', async () => {
    const { store } = setup(), instruction = promoted(store), gh = fakeGitHub({ failMove: 'after' });
    await fileLessonIssue(store, gh.execute, 'L-ready', noWait);
    expect(effect(store)?.status).toBe('uncertain');
    expect(instruction().lanePending).toBe(true);
    await readyPendingLessonIssues(store, gh.execute, noWait);
    expect(gh.moves).toEqual(['opt-ready']);
    expect(effect(store)?.status).toBe('verified');
    expect(instruction().lanePending).toBeUndefined();
});

test('a saved move still requires its exact lane read-back after the board binding is removed', async () => {
    const { store } = setup(), instruction = promoted(store), gh = fakeGitHub({ failMove: 'after' });
    await fileLessonIssue(store, gh.execute, 'L-ready', noWait);
    expect(effect(store)?.status).toBe('uncertain');
    store.project = { ...store.project, githubProject: undefined };

    gh.setCard('opt-progress');
    await readyPendingLessonIssues(store, gh.execute, noWait);
    expect(effect(store)?.status).toBe('uncertain');
    expect(instruction().lanePending).toBe(true);
    expect(gh.moves).toEqual(['opt-ready']);

    gh.setCard('opt-ready');
    await readyPendingLessonIssues(store, gh.execute, noWait);
    expect(effect(store)?.status).toBe('verified');
    expect(instruction().lanePending).toBeUndefined();
    expect(gh.moves).toEqual(['opt-ready']);
});

test('an uncertain move is read back against its saved card and lane, not today\'s pickup setting', async () => {
    const { store } = setup(), instruction = promoted(store), gh = fakeGitHub({ failMove: 'before' });
    await fileLessonIssue(store, gh.execute, 'L-ready', noWait);
    store.state.coordination!.pickup = { enabled: true, status: 'Backlog' };
    await readyPendingLessonIssues(store, gh.execute, noWait);
    expect(effect(store)?.status).toBe('uncertain');
    expect(gh.moves).toHaveLength(1);
    expect(instruction().lanePending).toBe(true);
    gh.setCard('opt-ready');
    await readyPendingLessonIssues(store, gh.execute, noWait);
    expect(effect(store)?.status).toBe('verified');
    expect(gh.moves).toHaveLength(1);
    expect(instruction().lanePending).toBeUndefined();
});

test('a move refused before sending, such as an Office pause, stays pending and is tried once more afresh', async () => {
    const { store } = setup(), instruction = promoted(store);
    const gh = fakeGitHub({ onStatusRead: read => { if (read === 1) store.state.paused = true; } });
    await fileLessonIssue(store, gh.execute, 'L-ready', noWait);
    expect(gh.creates).toHaveLength(1);
    expect(gh.moves).toEqual([]);
    expect(effect(store)).toMatchObject({ status: 'rejected', dispatchedAt: '' });
    expect(instruction().lanePending).toBe(true);
    store.state.paused = false;
    await readyPendingLessonIssues(store, gh.execute, noWait);
    expect(gh.moves).toEqual(['opt-ready']);
    expect(effect(store, 1)?.status).toBe('verified');
    expect(instruction().lanePending).toBeUndefined();
    await readyPendingLessonIssues(store, gh.execute, noWait);
    expect(gh.moves).toHaveLength(1);
    expect(gh.creates).toHaveLength(1);
});

test('a rejected move with a dispatch timestamp stays on its original attempt', async () => {
    const { store } = setup(), instruction = filed(store), gh = fakeGitHub({ present: true });
    const dispatchedAt = '2026-11-20T00:01:00Z';
    store.putEffect({ ...preparedMove, status: 'rejected', dispatchedAt, error: 'Read back as never landed' });
    await readyPendingLessonIssues(store, gh.execute, noWait);
    expect(gh.moves).toEqual([]);
    expect(effect(store)).toMatchObject({ status: 'rejected', dispatchedAt });
    expect(effect(store, 1)).toBeUndefined();
    expect(instruction().laneAttempt).toBeUndefined();
    expect(instruction().lanePending).toBe(true);
});

test('a move whose intent was saved but never claimed is resumed under the same intent', async () => {
    const { store } = setup(), instruction = filed(store), gh = fakeGitHub({ present: true });
    store.putEffect(preparedMove);
    await readyPendingLessonIssues(store, gh.execute, noWait);
    expect(effect(store)?.status).toBe('verified');
    expect(gh.moves).toEqual(['opt-ready']);
    expect(instruction().lanePending).toBeUndefined();
});

test('lesson issues filed before lane moves are never moved by the daily check', async () => {
    const { store } = setup(), gh = fakeGitHub();
    gh.issues.push({ url: URL, body: '', assignees: [] });
    store.state.knowledge!.lessons.push(learningLesson('L-old', { repositoryInstruction: { status: 'filed', issueUrl: URL, filedAt: '2026-11-01T00:00:00Z' } }));
    await readyPendingLessonIssues(store, gh.execute, noWait);
    expect(gh.moves).toEqual([]);
});

test('the daily check is still queued for a pending card whose lesson retired, and not for a retired lesson alone', () => {
    const checks = (store: TestStore) => (store.state.coordination!.requests || []).filter(request => request.action === 'check-lesson-issues');
    const pending = setup().store;
    pending.state.knowledge!.enabled = true;
    pending.state.knowledge!.lessons = [learningLesson('L-gone', { status: 'retired', repositoryInstruction: { status: 'filed', issueUrl: URL, lanePending: true } })];
    queueLessonIssueCheck(pending);
    expect(checks(pending)).toHaveLength(1);

    const settled = setup().store;
    settled.state.knowledge!.enabled = true;
    settled.state.knowledge!.lessons = [learningLesson('L-gone', { status: 'retired', repositoryInstruction: { status: 'filed', issueUrl: URL } })];
    queueLessonIssueCheck(settled);
    expect(checks(settled)).toEqual([]);
});

test('with retrospectives disabled the daily request recovers a retired lesson card without graduating active lessons', async () => {
    const { store, advance } = setup(), gh = fakeGitHub({ present: true });
    const active = learningLesson('L-active', { repositoryInstruction: { status: 'filed', issueUrl: 'https://github.com/JFusco/brain/issues/501' } });
    store.state.knowledge!.enabled = false;
    store.state.knowledge!.lessons = [
        learningLesson('L-retired', { status: 'retired', repositoryInstruction: { status: 'filed', issueUrl: URL, lanePending: true } }),
        active,
    ];
    const execute = vi.spyOn(processTools, 'command').mockImplementation(gh.execute);
    const checks = () => (store.state.coordination!.requests || []).filter(request => request.action === 'check-lesson-issues');
    queueLessonIssueCheck(store);
    queueLessonIssueCheck(store);
    expect(checks()).toHaveLength(1);

    const engine = new Engine(store);
    await executeRequest(store, engine, new Coordinator(store, engine), checks()[0]);
    expect(checks()[0].status).toBe('completed');
    expect(gh.moves).toEqual(['opt-ready']);
    expect(store.state.knowledge!.lessons[0].repositoryInstruction?.lanePending).toBeUndefined();
    expect(execute.mock.calls.some(([, args]) => args[0] === 'issue' && args[1] === 'view')).toBe(false);
    expect(active.status).toBe('active');

    advance(24 * 60 * 60 * 1000);
    queueLessonIssueCheck(store);
    expect(checks()).toHaveLength(1);
});
