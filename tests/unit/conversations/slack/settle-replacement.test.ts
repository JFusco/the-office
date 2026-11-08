import { expect, test } from 'vitest';
import { settleRequestedSlackReplacement } from '../../../../server/conversations/slack/settle-replacement';
import { SlackMessages } from '../../../../server/conversations/slack';
import { Conversations } from '../../../../server/conversations/conversations';
import { Engine } from '../../../../server/scheduling/engine';
import { supersessionFixture } from './fixture';

test('fresh verification automatically closes only the original explicitly bound in the human request', async () => {
    const f = supersessionFixture(); try {
        f.human.slackReplacement = { originalDeliveryId: 'delivery', reason: f.input.reason }; f.replacement.status = 'verifying';
        const verifySlack = async () => ({ found: true, channelId: f.replacement.channelId, messageTs: f.replacement.messageTs, permalink: f.replacement.permalink, targetId: 'U123', workspaceId: 'T123', text: f.replacement.text, detail: 'Injected read-back' });
        await new SlackMessages(f.store, { verifySlack } as any).verify(f.replacement);
        expect(f.replacement.status).toBe('confirmed'); expect(f.delivery.supersededBy?.replacementDeliveryId).toBe('replacement'); expect(f.store.state.slackDeliveries).toHaveLength(2);
    } finally { f.close(); }
});
test('absent authority leaves the warning; closeout mismatch cannot downgrade a confirmed new message', () => {
    const f = supersessionFixture(); try {
        settleRequestedSlackReplacement(f.store, f.replacement); expect(f.delivery.supersededBy).toBeUndefined();
        f.human.slackReplacement = { originalDeliveryId: 'delivery', reason: f.input.reason }; f.human.ticket = 'GH-999';
        settleRequestedSlackReplacement(f.store, f.replacement); expect(f.delivery.supersededBy).toBeUndefined(); expect(f.replacement.status).toBe('confirmed');
    } finally { f.close(); }
});
test('human replacement metadata is durable and cannot be changed by reusing a message ID', () => {
    const f = supersessionFixture(); try {
        const chat = new Conversations(f.store, new Engine(f.store), f.root), id = crypto.randomUUID();
        const input = { id, role: 'pm', body: 'Send a completion follow-up', slackReplacement: { originalDeliveryId: 'delivery', reason: f.input.reason } };
        expect(chat.enqueue(input).slackReplacement).toEqual(input.slackReplacement);
        expect(() => chat.enqueue({ ...input, slackReplacement: { ...input.slackReplacement, reason: 'Changed authority' } })).toThrow('different request');
    } finally { f.close(); }
});
