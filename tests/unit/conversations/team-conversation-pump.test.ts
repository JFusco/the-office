import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { Engine } from '../../../server/scheduling/engine';
import { Conversations } from '../../../server/conversations/conversations';
import { coordination } from '../../../server/scheduling/coordination';
import { projectById } from '../../../server/office/projects';
import { supersededError } from '../../../server/knowledge/handoff-admission';
import type { TeamMessage } from '../../../src/shared';

const stores: Store[] = [], roots: string[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });

const failedRead = { handoffProject: '', pickupChange: null, reply: 'The session inventory read timed out; the dependency is unchanged.', notifyRoles: [], question: '', goalChanges: [], slackRequests: [], notes: [], receipts: [{ id: 'read', action: 'GET', target: 'session bridge', verified: false, uncertain: true, detail: 'Timed out after 15 seconds' }] };
function setup(message: Partial<TeamMessage>, bound: boolean, reply: object = failedRead) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-team-pump-')); roots.push(root);
    const store = new Store(':memory:', projectById('cms-field-vocabulary'), root); stores.push(store);
    store.state.coordination = coordination();
    const queued: TeamMessage = { id: 'handoff', requestId: 'handoff', from: 'knowledge', to: 'pm', ticket: '', actionId: 'harper:job:1', body: 'Harper requests READ ONLY diagnosis', status: 'queued', createdAt: '', sessionId: '', recheck: false, error: '', recipients: [], receipts: [], ...message };
    store.state.messages = [queued];
    store.state.knowledge = { ...store.state.knowledge!, followups: bound ? [{ handoffId: queued.id } as never] : [] };
    const engine = new Engine(store), conversations = new Conversations(store, engine, root);
    const agent = vi.spyOn(engine.agents, 'followup').mockResolvedValue(reply as never);
    return { queued, conversations, store, agent };
}

test("a failed read in Harper's read-only diagnosis hand-off is an answer, not an unverified write", async () => {
    const { queued, conversations } = setup({}, true);
    await conversations.pump(queued.id);
    expect(queued).toMatchObject({ status: 'answered', error: '' });
});
test("a write request in Harper's diagnosis hand-off still fails beside a failed read", async () => {
    const { queued, conversations } = setup({}, true, { ...failedRead, notes: [{ summary: 's', detail: 'd' }] });
    await conversations.pump(queued.id);
    expect(queued.status).toBe('failed'); expect(queued.error).toContain('read-only diagnosis only');
});
test.each([
    ['a message Harper did not bind to a follow-up', {}, false, 'could not be verified'],
    ['a human request', { from: 'human' as const, actionId: '' }, true, 'could not be verified'],
    ['a conversation read-back Harper bound to a follow-up', { actionId: 'message:orig' }, true, 'lacks complete verified evidence'],
])('an unverified receipt still fails %s', async (_name, message, bound, error) => {
    const { queued, conversations } = setup(message, bound);
    await conversations.pump(queued.id);
    expect(queued.status).toBe('failed'); expect(queued.error).toContain(error);
});

test('a settled Harper sibling is never claimed or run; the pump takes its eligible neighbour once', async () => {
    const answered = { ...failedRead, reply: 'The listener read is rate limited; the dependency is unchanged.', receipts: [] };
    const { queued: neighbour, conversations, store, agent } = setup({ id: 'neighbour', requestId: 'neighbour' }, true, answered);
    const settled: TeamMessage = { ...neighbour, id: 'settled', requestId: 'settled', status: 'failed', supersededByHandoffId: 'neighbour', error: supersededError('neighbour') };
    store.state.messages.unshift(settled);
    store.state.knowledge!.followups = [{ handoffId: 'neighbour', handoffIds: ['settled', 'neighbour'] } as never];
    const claim = vi.spyOn(store, 'claim');
    await conversations.pump(settled.id);
    expect(claim).not.toHaveBeenCalled(); expect(agent).not.toHaveBeenCalled();
    await conversations.pump();
    expect(agent).toHaveBeenCalledTimes(1); expect(agent.mock.calls[0][1]).toMatchObject({ id: 'neighbour' });
    expect(neighbour.status).toBe('answered');
    expect(settled).toMatchObject({ status: 'failed', supersededByHandoffId: 'neighbour', sessionId: '' });
    await conversations.pump();
    expect(agent).toHaveBeenCalledTimes(1);
});
