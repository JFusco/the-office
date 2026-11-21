import { afterEach, expect, test } from 'vitest';
import { Store } from '../../../../server/store/store';
import { Engine } from '../../../../server/scheduling/engine';
import { Conversations } from '../../../../server/conversations/conversations';
import { coordination } from '../../../../server/scheduling/coordination';
import { scheduledWork } from '../../../../server/scheduling/scheduled-work';
import { projectOutbox } from '../../../../server/conversations/outbox';
import { settledSlackReadback } from '../../../../server/conversations/slack/settled-readback';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
const MISMATCH = 'Error: Slack read-back did not match the saved recipient, text, time, and message link';

/** A Slack send that could not be confirmed, and a first request to read it back that failed. */
function setup(delivery: 'uncertain' | 'confirmed') {
    const store = new Store(':memory:'); stores.push(store);
    const engine = new Engine(store), chat = new Conversations(store, engine, '/private/tmp');
    store.state.coordination = coordination();
    const message = (id: string, extra: Record<string, unknown>) => ({ id, requestId: id, from: 'human', to: 'pm', ticket: '', actionId: '', body: '', status: 'failed', createdAt: '2026-10-27T17:16:26Z', sessionId: '', recheck: false, error: '', recipients: [], receipts: [], ...extra });
    store.state.messages = [message('send', { error: 'Error: Slack delivery could not be confirmed. It will not be resent.' }), message('ask', { actionId: 'message:send', error: MISMATCH, createdAt: '2026-10-27T17:26:40Z' }), message('other', { error: 'Error: codex exited 1' })] as any;
    store.state.slackDeliveries = [{ id: 'd', requestId: 'send', status: delivery, targetName: 'Joe', error: '' }] as any;
    const state = (id: string) => scheduledWork({ store, engine, conversations: chat, coordinator: undefined } as any, new Map([[store.project.id, store]])).find(item => item.work.kind === 'conversation' && item.work.id === id)!.eligibility;
    return { store, state };
}

test('once the delivery is confirmed, the failed request to read it back is history for the scheduler and the outbox alike', () => {
    const { store, state } = setup('confirmed');
    expect(settledSlackReadback(store.state, store.state.messages[1])).toBe(true);
    expect(state('ask')).toMatchObject({ state: 'terminal', reason: 'The Slack delivery this was about is confirmed; the failed request is kept as history' });
    expect(state('send').state).toBe('terminal');
    expect(projectOutbox(store.state).filter(item => item.status === 'open' && /^message:(send|ask)$/.test(item.id))).toEqual([]);
});

test('while the delivery is unconfirmed the failed request stays blocked', () => {
    const { store, state } = setup('uncertain');
    expect(settledSlackReadback(store.state, store.state.messages[1])).toBe(false);
    expect(state('ask').state).toBe('blocked');
});

test('a message that failed for another reason is not this, whatever the delivery says', () => {
    const { store, state } = setup('confirmed');
    expect(settledSlackReadback(store.state, store.state.messages[2])).toBe(false);
    expect(state('other').state).toBe('blocked');
});
