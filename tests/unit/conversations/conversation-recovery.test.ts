import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { Engine } from '../../../server/scheduling/engine';
import { Conversations } from '../../../server/conversations/conversations';
import { ITSpecialist } from '../../../server/it/it-specialist';
import { coordination } from '../../../server/scheduling/coordination';
import { projectById } from '../../../server/office/projects';
import { projectOutbox } from '../../../server/conversations/outbox';
import { scheduledWork } from '../../../server/scheduling/scheduled-work';
import { canFileGithubIssue } from '../../../server/github/github-context';
import { uncertainConversations, conversationReadbackReady, pendingReadback, queueConversationReadback } from '../../../server/conversations/conversation-recovery';
import { harperHandoff, reconcileBlockerFollowups } from '../../../server/knowledge/blocker-followups';
import { supersededError } from '../../../server/knowledge/handoff-admission';
import type { TeamMessage } from '../../../src/shared';
const stores: Store[] = [], roots: string[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });
function setup() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-conversation-recovery-')); roots.push(root);
    const store = new Store(':memory:', projectById('cms-field-vocabulary'), root); stores.push(store);
    store.state.coordination = coordination();
    const original: TeamMessage = { id: 'original', requestId: 'original', from: 'human', to: 'pm', ticket: '', actionId: '', body: 'Create one GitHub issue for the approved scoped correction', status: 'failed', createdAt: '', sessionId: 'saved-native-session', recheck: false, error: 'Worker exited with surviving subprocesses; effects require reconciliation', recipients: [], receipts: [] };
    store.state.messages = [original];
    store.state.workLog = [{ id: 'writer', requestId: original.id, role: 'pm', stage: 'conversation', status: 'failed', processId: 987654321 } as any];
    const engine = new Engine(store), conversations = new Conversations(store, engine, root);
    const health = { report: vi.fn(async () => ({ services: [], checkedAt: '', context: '' })) };
    const offices = { entries: new Map([['cms-field-vocabulary', { store, engine }]]) };
    return { store, original, engine, conversations, it: new ITSpecialist(offices as any, health as any) };
}
function reply(originalId = 'original') { return { handoffProject: '', pickupChange: null, reply: 'The identified original issue was created once and read back.', notifyRoles: [], question: '', goalChanges: [], slackRequests: [], notes: [], receipts: [{ id: 'readback', action: 'conversation-readback', target: originalId, verified: true, uncertain: false, detail: 'All saved commands and the exact created issue independently reconciled; no write repeated' }] }; }
test('IT durably queues one read-only reconciliation and leaves execution to the scheduler', async () => {
    const a = setup(), worker = vi.spyOn(a.engine.agents, 'followup');
    await a.it.tick(new Date('2026-10-29T23:00:00Z'), true);
    const saved = a.store.state.messages[1];
    expect(saved).toMatchObject({ from: 'it', to: 'pm', status: 'queued', actionId: 'message:original', recheck: false });
    expect(saved.body).toContain('saved-native-session'); expect(saved.body).toContain('Never repeat the create');
    expect(canFileGithubIssue('pm', saved, '')).toBe(false); expect(worker).not.toHaveBeenCalled();
    await a.it.tick(new Date('2026-10-29T23:01:00Z'), true);
    expect(a.store.state.messages).toHaveLength(2); expect(a.store.state.it!.recoveries['conversation:original'].attempts).toBe(1);
    expect(a.store.state.it!.recoveries['conversation:original'].requestId).toBe(saved.id);
    expect(a.store.state.coordination!.requests || []).toEqual([]);
});
test('confirmed read-back resolves the outbox while the original failed writer and history remain unchanged', async () => {
    const a = setup(); await a.it.tick(new Date('2026-10-29T23:00:00Z'), true);
    const message = a.store.state.messages[1], prior = JSON.stringify(a.original);
    const worker = vi.spyOn(a.engine.agents, 'followup').mockResolvedValue(reply() as any);
    await a.conversations.pump(message.id);
    expect(worker).toHaveBeenCalledTimes(1); expect(message.status).toBe('answered');
    expect(projectOutbox(a.store.state).find(item => item.id === 'message:original')?.status).toBe('resolved');
    expect(JSON.stringify(a.original)).toBe(prior); expect(a.store.state.workLog![0].status).toBe('failed');
    await a.it.tick(new Date('2026-10-29T23:01:00Z'), true);
    expect(a.store.state.it!.recoveries['conversation:original'].status).toBe('resolved');
    expect(a.store.state.messages.filter(m => m.from === 'it')).toHaveLength(1);
});
test.each([
    { effect: 'uncertain', verified: true, uncertain: true },
    { effect: 'unverified', verified: false, uncertain: false },
    { effect: 'certain', verified: true, uncertain: false },
])('a reused human read-back with a $effect effect keeps outbox and scheduling resolution consistent', async ({ verified, uncertain }) => {
    const a = setup();
    const attempts = (['failed', 'interrupted'] as const).map(status => ({ ...a.original, id: `it-${status}`, requestId: `it-${status}`,
        from: 'it' as const, status, actionId: 'message:original', error: 'Prior failed read-back' }));
    a.store.state.messages.push(...attempts);
    const manual = a.conversations.enqueue({ id: crypto.randomUUID(), role: 'pm', actionId: 'message:original', body: 'Read back the original effects without repeating any writes.' });
    await a.it.tick(new Date('2026-10-29T23:00:00Z'), true);
    expect(a.store.state.it!.recoveries['conversation:original'].requestId).toBe(manual.id);
    expect(a.store.state.messages.filter(message => message.from === 'it')).toEqual(attempts);
    const prior = JSON.stringify([a.original, ...attempts]), workers = structuredClone(a.store.state.workLog);
    const answer = reply();
    answer.receipts.push({ id: 'original-effect', action: 'github-issue-create', target: `https://github.com/${a.store.project.repository}/issues/113`,
        verified, uncertain, detail: 'Provider read-back for another original effect' });
    vi.spyOn(a.engine.agents, 'followup').mockResolvedValue(answer);
    await a.conversations.pump(manual.id);
    const saved = a.store.state.messages.find(message => message.requestId === manual.id && message.from === 'pm');
    expect(saved).toMatchObject({ status: 'answered', actionId: 'message:original', receipts: answer.receipts });
    const resolved = verified && !uncertain;
    expect(manual.status).toBe(resolved ? 'answered' : 'failed');
    expect(projectOutbox(a.store.state).find(item => item.id === 'message:original')?.status).toBe(resolved ? 'resolved' : 'open');
    const projection = scheduledWork({ store: a.store, engine: a.engine, conversations: a.conversations }, new Map([[a.store.project.id, a.store]]));
    for (const message of [a.original, ...attempts])
        expect(projection.find(item => item.work.id === message.id)?.eligibility.state).toBe(resolved ? 'terminal' : 'blocked');
    expect(uncertainConversations(a.store)).toEqual(resolved ? [] : [a.original]);
    expect(JSON.stringify([a.original, ...attempts])).toBe(prior);
    expect(a.store.state.workLog).toEqual(workers);
});
test.each(['wrong-target', 'uncertain', 'goal-change', 'notify'])('automatic read-back cannot resolve the original with %s', async scenario => {
    const a = setup(); await a.it.tick(new Date('2026-10-29T23:00:00Z'), true);
    const message = a.store.state.messages[1], answer: any = reply();
    if (scenario === 'wrong-target') answer.receipts[0].target = 'different-request';
    if (scenario === 'uncertain') answer.receipts[0].uncertain = true;
    if (scenario === 'goal-change') answer.goalChanges = [{ id: 'unauthorized' }];
    if (scenario === 'notify') answer.notifyRoles = ['developer'];
    vi.spyOn(a.engine.agents, 'followup').mockResolvedValue(answer);
    await a.conversations.pump(message.id);
    expect(message.status).toBe('failed');
    expect(projectOutbox(a.store.state).find(item => item.id === 'message:original')?.status).toBe('open');
    expect(a.store.state.messages.some(m => m.from === 'pm' && m.receipts.some(r => r.action === 'conversation-readback'))).toBe(false);
    expect(a.original.status).toBe('failed');
});
test('unknown or live process ownership and pause/drain retain the failure without dispatch', async () => {
    const a = setup();
    expect(uncertainConversations(a.store)).toEqual([a.original]);
    expect(conversationReadbackReady(a.store, a.original, () => true)).toBe(false);
    a.store.state.workLog![0].status = 'stopping';
    expect(conversationReadbackReady(a.store, a.original, () => false)).toBe(false);
    await a.it.tick(new Date('2026-10-29T23:00:00Z'), true); expect(a.store.state.messages).toHaveLength(1);
    a.store.state.workLog![0].status = 'failed'; a.store.state.workLog![0].processId = undefined;
    expect(conversationReadbackReady(a.store, a.original, () => false)).toBe(false);
    a.store.state.workLog![0].processId = 987654321;
    await a.it.tick(new Date('2026-10-29T23:01:00Z'), true); expect(a.store.state.messages).toHaveLength(2);
    const recovery = a.store.state.it!.recoveries['conversation:original'];
    a.store.state.paused = true; await a.it.tick(new Date('2026-10-29T23:02:00Z'), true);
    expect(recovery.status).toBe('retrying'); expect(recovery.attempts).toBe(1);
    a.store.state.paused = false; a.store.state.draining = true; await a.it.tick(new Date('2026-10-29T23:03:00Z'), true);
    expect(recovery.status).toBe('retrying'); expect(a.store.state.messages).toHaveLength(2);
});
test('three failed reads exhaust bounded IT recovery without replaying the original creation', async () => {
    const a = setup(), start = Date.parse('2026-10-29T23:00:00Z');
    for (const ms of [0, 60000, 180000, 600000]) {
        for (const message of a.store.state.messages.filter(m => m.from === 'it')) message.status = 'failed';
        await a.it.tick(new Date(start + ms), true);
    }
    expect(a.store.state.messages.filter(m => m.from === 'it')).toHaveLength(3);
    expect(a.store.state.it!.recoveries['conversation:original']).toMatchObject({ attempts: 3, status: 'needs-human' });
    expect(a.store.state.it!.reports.at(-1)!.followUps.some(f => f.owner === 'Morgan')).toBe(true);
    expect(a.store.state.messages.filter(m => canFileGithubIssue(m.to, m, ''))).toEqual([a.original]);
});
test('a pending human read-back is reused, and permission-only failures never trigger recovery', () => {
    const a = setup(), manual = { ...a.original, id: 'manual', requestId: 'manual', actionId: 'message:original', body: 'Read back the original', status: 'queued' as const };
    a.store.state.messages.push(manual); expect(queueConversationReadback(a.store, a.original)).toBe(manual);
    expect(a.store.state.messages).toHaveLength(2);
    a.original.error = 'Permission denied before dispatch'; expect(uncertainConversations(a.store)).toEqual([]);
});

test('native issue filing and its read-back keep capabilities while recording administrative effort', async () => {
    const a = setup(), run = vi.spyOn(a.engine.agents, 'run').mockResolvedValue(reply() as any);
    await a.engine.agents.followup('pm', a.original);
    expect(run.mock.calls[0][3]).toMatchObject({ readOnly: false, effortKind: 'administrative' });
    const recovery = queueConversationReadback(a.store, a.original);
    await a.engine.agents.followup('pm', recovery);
    expect(run.mock.calls[1][3]).toMatchObject({ readOnly: true, effortKind: 'administrative' });
});

// One open read-back per original while Harper's earlier requests are settled or still ending (issue 535).
type Setup = ReturnType<typeof setup>;
const harper = (a: Setup, id: string, over: Partial<TeamMessage> = {}): TeamMessage => ({ ...a.original, id, requestId: id, from: 'knowledge', to: 'pm', actionId: 'message:original', body: 'Harper requests READ ONLY diagnosis and source read-back.', status: 'queued', error: '', sessionId: '', ...over });
function bind(a: Setup, handoffId: string | undefined, handoffIds: string[]) {
    a.store.state.knowledge!.followups = [{ id: 'message:original', source: { kind: 'message', id: 'original' }, key: '', fingerprint: '', owner: 'Morgan', nextAction: '', evidence: [], disposition: 'unresolved', createdAt: '', updatedAt: '', history: [], handoffIds, ...(handoffId ? { handoffId } : {}) }];
    return a.store.state.knowledge!.followups[0];
}
const tracked = (a: Setup, recovery: Partial<NonNullable<Setup['store']['state']['it']>['recoveries'][string]>) => {
    a.store.state.it = { checkedAt: '', nextCheckAt: '', status: 'monitoring', reports: [], services: [], recoveries: { 'conversation:original': { attempts: 1, nextAt: '', status: 'retrying', detail: a.original.error, ...recovery } } };
    return a.store.state.it.recoveries['conversation:original'];
};
const sameOriginal = (a: Setup) => a.store.state.messages.filter(message => message.actionId === 'message:original' && ['queued', 'working'].includes(message.status));

test('the exact-original lookup passes a settled sibling and an unbound lookalike, prefers the pinned survivor, and leaves a person\'s request alone', () => {
    const a = setup();
    const settled = harper(a, 'settled', { status: 'failed', supersededByHandoffId: 'live', error: supersededError('live') }), lookalike = harper(a, 'lookalike');
    const manual: TeamMessage = { ...a.original, id: 'manual', requestId: 'manual', actionId: 'message:original', status: 'queued', error: '' }, live = harper(a, 'live');
    a.store.state.messages.push(settled, lookalike, manual, live);
    const item = bind(a, 'live', ['settled', 'live']);
    expect(pendingReadback(a.store, a.original)).toBe(live);
    expect(queueConversationReadback(a.store, a.original)).toBe(live);
    expect(harperHandoff(a.store, settled)).toBe(true); expect(harperHandoff(a.store, lookalike)).toBe(false);
    reconcileBlockerFollowups(a.store);
    expect(item.handoffId).toBe('live');
    expect([manual, lookalike, live].map(message => message.status)).toEqual(['queued', 'queued', 'queued']);
    expect(a.store.state.messages).toHaveLength(5);
    // Without a pin a person's request is found in message order; Harper's unbound lookalike never is.
    item.handoffId = 'settled';
    expect(pendingReadback(a.store, a.original)).toBe(manual);
});

test('after an adopted request closes, Harper sends its own first read-back when its fallback still qualifies', () => {
    const a = setup();
    a.original.error = 'Permission denied before dispatch';
    const manual: TeamMessage = { ...a.original, id: 'manual', requestId: 'manual', actionId: 'message:original', status: 'queued', error: '' };
    a.store.state.messages.push(manual);
    reconcileBlockerFollowups(a.store);
    const item = a.store.state.knowledge!.followups!.find(item => item.id === 'message:original')!;
    expect(item.handoffId).toBe('manual'); expect(a.store.state.messages.filter(message => message.from === 'knowledge')).toEqual([]);
    manual.status = 'answered';
    reconcileBlockerFollowups(a.store); reconcileBlockerFollowups(a.store);
    const sent = a.store.state.messages.filter(message => message.from === 'knowledge');
    expect(sent).toHaveLength(1); expect(sent[0]).toMatchObject({ actionId: 'message:original', status: 'queued' });
    expect(harperHandoff(a.store, sent[0])).toBe(true); expect(item.handoffIds).toEqual(['manual', sent[0].id]);
});

test.each([[1, 'retrying'], [3, 'needs-human']] as const)('IT adopts the live replacement of its settled remembered read-back and keeps %i attempts', async (attempts, status) => {
    const a = setup(), live = harper(a, 'live');
    a.store.state.messages.push(harper(a, 'settled', { status: 'failed', supersededByHandoffId: 'live', error: supersededError('live') }), live);
    bind(a, 'live', ['settled', 'live']);
    const recovery = tracked(a, { attempts, status, requestId: 'settled' });
    await a.it.tick(new Date('2026-10-29T23:00:00Z'), true);
    expect(recovery).toMatchObject({ attempts, status: 'retrying', requestId: 'live' });
    expect(a.store.state.it!.reports.at(-1)!.followUps).toContainEqual(expect.objectContaining({ id: 'conversation:original', owner: 'IT', detail: 'conversation-readback is queued; scheduler owns execution.' }));
    expect(sameOriginal(a)).toEqual([live]);
});

test.each([['backoff', 1, '2026-10-29T23:30:00.000Z', 0, 1], ['exhaustion', 3, '', 0, 3], ['a due retry', 1, '', 1, 2]] as const)('with only a different original\'s request pending, Harper then IT queue no same-original read-back during %s', async (_case, attempts, nextAt, queued, after) => {
    const a = setup();
    a.store.state.messages.push(harper(a, 'kept', { status: 'answered' }), harper(a, 'settled', { status: 'failed', supersededByHandoffId: 'kept', error: supersededError('kept') }),
        { ...a.original, id: 'other', requestId: 'other', from: 'it', actionId: 'message:another-original', status: 'queued', error: '' });
    bind(a, 'kept', ['kept', 'settled']);
    const recovery = tracked(a, { attempts, nextAt, status: attempts >= 3 ? 'needs-human' : 'retrying', requestId: 'settled' });
    reconcileBlockerFollowups(a.store);
    expect(sameOriginal(a)).toEqual([]);
    await a.it.tick(new Date('2026-10-29T23:00:00Z'), true);
    expect(sameOriginal(a)).toHaveLength(queued); expect(recovery.attempts).toBe(after);
    if (queued) expect(recovery.requestId).toBe(sameOriginal(a)[0].id);
});

test('an untracked original keeps Harper\'s first read-back route', () => {
    const a = setup();
    reconcileBlockerFollowups(a.store);
    expect(sameOriginal(a)).toEqual([expect.objectContaining({ from: 'it', actionId: 'message:original' })]);
});

test('while Harper\'s bound read-back is still stopping, Harper and then IT both wait without a message or an attempt, and IT reads once it has stopped', async () => {
    const a = setup(), reader = harper(a, 'reader', { status: 'interrupted', error: 'Session interrupted.' });
    a.store.state.messages.push(reader);
    bind(a, 'reader', ['reader']);
    a.store.state.workLog!.push({ id: 'reader-run', requestId: 'reader', role: 'pm', stage: 'conversation-readback', status: 'stopping', processId: 4242 } as any);
    const recovery = tracked(a, { attempts: 1, requestId: 'reader' });
    expect(conversationReadbackReady(a.store, a.original, () => false)).toBe(true);
    reconcileBlockerFollowups(a.store);
    await a.it.tick(new Date('2026-10-29T23:00:00Z'), true);
    expect(a.store.state.messages).toHaveLength(2); expect(recovery.attempts).toBe(1);
    expect(a.store.state.it!.reports.at(-1)!.followUps).toContainEqual(expect.objectContaining({ id: 'conversation:original', detail: expect.stringContaining('earlier read-back') }));
    expect(() => queueConversationReadback(a.store, a.original)).toThrow('still stopping');
    a.store.state.workLog!.at(-1)!.status = 'interrupted';
    reconcileBlockerFollowups(a.store);
    expect(a.store.state.messages).toHaveLength(2);
    await a.it.tick(new Date('2026-10-29T23:01:00Z'), true);
    expect(sameOriginal(a)).toEqual([expect.objectContaining({ from: 'it' })]); expect(recovery.attempts).toBe(2);
});

test.each(['wrong-target', 'uncertain'])('a Harper-bound read-back with a %s receipt keeps the original open', async scenario => {
    const a = setup(), readback = harper(a, 'readback'), answer: any = reply();
    a.store.state.messages.push(readback); bind(a, 'readback', ['readback']);
    if (scenario === 'wrong-target') answer.receipts[0].target = 'different-request'; else answer.receipts[0].uncertain = true;
    vi.spyOn(a.engine.agents, 'followup').mockResolvedValue(answer);
    await a.conversations.pump(readback.id);
    expect(readback.status).toBe('failed');
    expect(projectOutbox(a.store.state).find(item => item.id === 'message:original')?.status).toBe('open');
    expect(a.original.status).toBe('failed');
});
