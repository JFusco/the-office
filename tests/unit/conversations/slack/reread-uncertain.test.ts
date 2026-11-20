import { afterEach, expect, test } from 'vitest';
import { Store } from '../../../../server/store/store';
import { Engine } from '../../../../server/scheduling/engine';
import { Conversations } from '../../../../server/conversations/conversations';
import { dueSlackReread, rereadUncertainSlack } from '../../../../server/conversations/slack/reread-uncertain';
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

test('with nothing waiting, the pump reads an old unconfirmed delivery back once; confirmed, its outbox item closes and nothing is sent', async () => {
    const s = setup();
    expect(s.open()).toEqual(['message:request-1']);
    await s.chat.pump();
    expect(s.delivery).toMatchObject({ status: 'confirmed', error: '' });
    expect([s.counts(), s.open(), s.engine.busy, s.chat.running]).toEqual([{ reads: 1, sends: 0 }, [], false, false]);
    await s.chat.pump();
    expect(s.counts().reads).toBe(1);
});

test('one that still does not match stays unconfirmed with its item, and is not read again until the release changes', async () => {
    const s = setup('• lock: something else entirely');
    expect(await rereadUncertainSlack(s.chat, 'release-a')).toBe(true);
    expect(s.delivery).toMatchObject({ status: 'uncertain', rereadRevision: 'release-a' });
    expect(s.delivery.error).toContain('did not match');
    expect(s.open()).toEqual(['message:request-1']);
    expect(await rereadUncertainSlack(s.chat, 'release-a')).toBe(false);
    expect(s.counts()).toEqual({ reads: 1, sends: 0 });
    // A read this process made counts as this release's own, whatever the release is called: the delivery is no longer old.
    expect(dueSlackReread(s.store, 'release-b')).toBeUndefined();
    s.delivery.updatedAt = new Date(Date.parse(s.store.state.startedAt) - 1000).toISOString();
    expect(await rereadUncertainSlack(s.chat, 'release-b')).toBe(true);
    expect(s.counts().reads).toBe(2);
});

test.each<[string, (s: ReturnType<typeof setup>) => void]>([
    ['this process touched the delivery itself', s => { s.delivery.updatedAt = new Date(Date.parse(s.store.state.startedAt) + 1000).toISOString(); }],
    ['the delivery is confirmed', s => { s.delivery.status = 'confirmed'; }],
    ['the Office is paused', s => { s.store.state.paused = true; }],
    ['the Office is draining', s => { s.store.state.draining = true; }],
    ['another owner holds the store', s => { s.store.claim('someone-else'); }],
])('nothing is read when %s', async (_name, change) => {
    const s = setup(); change(s);
    expect(await rereadUncertainSlack(s.chat, 'release-a')).toBe(false);
    expect(s.counts().reads).toBe(0);
});

test('a message waiting for the team is answered first', async () => {
    const s = setup();
    let followups = 0;
    s.engine.agents.followup = async () => { followups++; return { handoffProject: '', pickupChange: null, reply: 'Noted.', notifyRoles: [], question: '', goalChanges: [], slackRequests: [], notes: [], receipts: [] } as any; };
    s.chat.enqueue({ id: crypto.randomUUID(), body: 'What is in flight?', role: 'pm' });
    await s.chat.pump();
    expect([followups, s.counts().reads]).toEqual([1, 0]);
    await s.chat.pump();
    expect(s.counts().reads).toBe(1);
});
