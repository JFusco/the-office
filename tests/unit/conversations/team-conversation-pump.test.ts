import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { Engine } from '../../../server/scheduling/engine';
import { Conversations } from '../../../server/conversations/conversations';
import { coordination } from '../../../server/scheduling/coordination';
import { projectById } from '../../../server/office/projects';
import type { TeamMessage } from '../../../src/shared';

const stores: Store[] = [], roots: string[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });

const failedRead = { handoffProject: '', pickupChange: null, reply: 'The session inventory read timed out; the dependency is unchanged.', notifyRoles: [], question: '', goalChanges: [], slackRequests: [], notes: [], receipts: [{ id: 'read', action: 'GET', target: 'session bridge', verified: false, uncertain: true, detail: 'Timed out after 15 seconds' }] };
function setup(message: Partial<TeamMessage>, bound: boolean) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-team-pump-')); roots.push(root);
    const store = new Store(':memory:', projectById('cms-field-vocabulary'), root); stores.push(store);
    store.state.coordination = coordination();
    const queued: TeamMessage = { id: 'handoff', requestId: 'handoff', from: 'knowledge', to: 'pm', ticket: '', actionId: 'harper:job:1', body: 'Harper requests READ ONLY diagnosis', status: 'queued', createdAt: '', sessionId: '', recheck: false, error: '', recipients: [], receipts: [], ...message };
    store.state.messages = [queued];
    store.state.knowledge = { ...store.state.knowledge!, followups: bound ? [{ handoffId: queued.id } as never] : [] };
    const engine = new Engine(store), conversations = new Conversations(store, engine, root);
    vi.spyOn(engine.agents, 'followup').mockResolvedValue(failedRead as never);
    return { queued, conversations };
}

test("a failed read in Harper's read-only diagnosis hand-off is an answer, not an unverified write", async () => {
    const { queued, conversations } = setup({}, true);
    await conversations.pump(queued.id);
    expect(queued).toMatchObject({ status: 'answered', error: '' });
});
test.each([
    ['a message Harper did not bind to a follow-up', {}, false],
    ['a human request', { from: 'human' as const, actionId: '' }, true],
])('an unverified receipt still fails %s', async (_name, message, bound) => {
    const { queued, conversations } = setup(message, bound);
    await conversations.pump(queued.id);
    expect(queued.status).toBe('failed'); expect(queued.error).toContain('could not be verified');
});
