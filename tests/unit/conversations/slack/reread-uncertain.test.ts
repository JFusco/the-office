import { afterEach, expect, test } from 'vitest';
import { Store } from '../../../../server/store/store';
import { Engine } from '../../../../server/scheduling/engine';
import { Conversations } from '../../../../server/conversations/conversations';
import { dueSlackReread, rereadUncertainSlack } from '../../../../server/conversations/slack/reread-uncertain';
import { CommandFailure } from '../../../../server/workers/process';
import { scheduledWork } from '../../../../server/scheduling/scheduled-work';
import { coordination } from '../../../../server/scheduling/coordination';
import { projectOutbox } from '../../../../server/conversations/outbox';
import type { SlackDelivery } from '../../../../src/shared';

const stores: Store[] = [];
afterEach(() => { for (const store of stores.splice(0)) store.close(); });
// Sent a little under an hour ago: after the delivery was created, as the read-back requires.
const TS = (Date.now() / 1000 - 50 * 60).toFixed(6), LINK = `https://fixture.slack.com/archives/DTEST123/p${TS.replace('.', '')}`;
const SAVED = '- lock: minimatch@10.2.6 is replaced by minimatch@11.0.9';
const STORED = '• lock: <mailto:minimatch@10.2.6|minimatch@10.2.6> is replaced by <mailto:minimatch@11.0.9|minimatch@11.0.9>';

/** A delivery left unconfirmed by an earlier process of the service. */
function setup(stored = STORED) {
    const store = new Store(':memory:'); stores.push(store);
    const engine = new Engine(store), chat = new Conversations(store, engine, '/private/tmp'); chat.archive = () => {};
    const before = new Date(Date.parse(store.state.startedAt) - 60 * 60 * 1000).toISOString();
    const delivery: SlackDelivery = { id: 'delivery', requestId: 'request-1', targetType: 'person', targetId: 'UJOE123', targetName: 'Joe Fixture', workspaceId: 'TTEST123', text: SAVED, status: 'uncertain',
        channelId: 'DTEST123', messageTs: TS, permalink: LINK, sessionId: '', createdAt: before, updatedAt: before, error: 'Error: Slack read-back did not match the saved recipient, text, time, and message link' } as SlackDelivery;
    store.state.slackDeliveries = [delivery];
    let reads = 0, sends = 0;
    engine.agents.sendSlack = async () => { sends++; throw new Error('Nothing may be sent'); };
    engine.agents.verifySlack = async () => { reads++; return { found: true, channelId: 'DTEST123', messageTs: TS, permalink: LINK, targetId: 'UJOE123', workspaceId: 'TTEST123', text: stored, detail: '' } as any; };
    const open = () => projectOutbox(store.state).filter(item => item.status === 'open').map(item => item.id);
    return { store, engine, chat, delivery, counts: () => ({ reads, sends }), open };
}

test('a due delivery is read back once; confirmed, its outbox item closes and nothing is sent', async () => {
    const s = setup();
    expect(s.open()).toEqual(['message:request-1']);
    expect(dueSlackReread(s.store, 'release-a')?.id).toBe('delivery');
    expect(await rereadUncertainSlack(s.chat, 'delivery', 'release-a')).toBe(true);
    expect(s.delivery).toMatchObject({ status: 'confirmed', error: '' });
    expect([s.counts(), s.open(), s.engine.busy, s.chat.running]).toEqual([{ reads: 1, sends: 0 }, [], false, false]);
    expect(dueSlackReread(s.store, 'release-a')).toBeUndefined();
    expect(await rereadUncertainSlack(s.chat, 'delivery', 'release-a')).toBe(false);
    expect(s.counts().reads).toBe(1);
});

test('one that still does not match keeps its item and its original error, and is not read again until the release changes', async () => {
    const s = setup('• lock: something else entirely'), original = s.delivery.error;
    expect(await rereadUncertainSlack(s.chat, 'delivery', 'release-a')).toBe(true);
    expect(s.delivery).toMatchObject({ status: 'uncertain', rereadRevision: 'release-a', error: original });
    expect(s.open()).toEqual(['message:request-1']);
    expect(dueSlackReread(s.store, 'release-a')).toBeUndefined();
    expect(await rereadUncertainSlack(s.chat, 'delivery', 'release-a')).toBe(false);
    expect(s.counts()).toEqual({ reads: 1, sends: 0 });
    expect(dueSlackReread(s.store, 'release-b')?.id).toBe('delivery');
    expect(await rereadUncertainSlack(s.chat, 'delivery', 'release-b')).toBe(true);
    expect(s.counts().reads).toBe(2);
});

test('a read stopped by a pause or a shutdown does not use up the release\'s one read', async () => {
    const s = setup();
    s.engine.agents.verifySlack = async () => { throw new CommandFailure('Worker paused; reconcile any external effects before resuming', 'cancelled', true); };
    expect(await rereadUncertainSlack(s.chat, 'delivery', 'release-a')).toBe(true);
    expect([s.delivery.status, s.delivery.rereadRevision, s.engine.busy, s.chat.running]).toEqual(['uncertain', undefined, false, false]);
    expect(dueSlackReread(s.store, 'release-a')?.id).toBe('delivery');
});

test.each<[string, (s: ReturnType<typeof setup>) => void]>([
    ['this process touched the delivery itself', s => { s.delivery.updatedAt = new Date(Date.parse(s.store.state.startedAt) + 1000).toISOString(); }],
    ['the delivery is confirmed', s => { s.delivery.status = 'confirmed'; }],
    ['the Office is paused', s => { s.store.state.paused = true; }],
    ['the Office is draining', s => { s.store.state.draining = true; }],
    ['another owner holds the store', s => { s.store.claim('someone-else'); }],
    ['the team is in the middle of something', s => { s.engine.busy = true; }],
    ['a conversation is running', s => { s.chat.running = true; }],
])('nothing is read when %s', async (_name, change) => {
    const s = setup(); change(s);
    expect(await rereadUncertainSlack(s.chat, 'delivery', 'release-a')).toBe(false);
    expect(s.counts().reads).toBe(0);
});

test('the scheduler offers the read as its own work item, and only while it is due', () => {
    const s = setup(), entry = { store: s.store, engine: s.engine, conversations: s.chat, coordinator: undefined } as any;
    s.store.state.coordination = coordination();
    const offered = () => scheduledWork(entry, new Map([[s.store.project.id, s.store]])).filter(item => item.stage === 'slack-reread').map(item => item.work.id);
    expect(offered()).toEqual(['slack-reread:delivery']);
    s.delivery.status = 'confirmed';
    expect(offered()).toEqual([]);
});
