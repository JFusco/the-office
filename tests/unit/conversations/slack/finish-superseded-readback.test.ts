import { expect, test, vi } from 'vitest';
import { supersedeSlackDelivery } from '../../../../server/conversations/slack/supersede-delivery';
import { finishSupersededReadback } from '../../../../server/conversations/slack/finish-superseded-readback';
import { Conversations } from '../../../../server/conversations/conversations';
import { Engine } from '../../../../server/scheduling/engine';
import { syncOutbox } from '../../../../server/conversations/outbox';
import { supersessionFixture } from './fixture';

test('a previously queued read-back finishes from the replacement receipt without a model or new send', async () => {
    const f = supersessionFixture(); try {
        const engine = new Engine(f.store), chat = new Conversations(f.store, engine, f.root), run = vi.spyOn(engine.agents, 'followup'); syncOutbox(f.store.state);
        const message = chat.enqueue({ id: crypto.randomUUID(), role: 'pm', actionId: 'message:notice', ticket: 'GH-350', body: 'Read back the old notice' });
        supersedeSlackDelivery(f.store, f.input); await chat.pump(message.id);
        expect(message.status).toBe('answered'); expect(run).not.toHaveBeenCalled(); expect(f.store.state.slackDeliveries).toHaveLength(2);
        expect(f.store.state.messages.find(reply => reply.requestId === message.id && reply.from === 'pm')!.body).toContain('original send outcome remains unknown');
    } finally { f.close(); }
});
test('the queued read-back fast path refuses an invalidated replacement', () => {
    const f = supersessionFixture(); try {
        supersedeSlackDelivery(f.store, f.input); f.replacement.status = 'uncertain';
        expect(finishSupersededReadback(f.store, { actionId: 'message:notice' } as any, vi.fn())).toBe(false);
    } finally { f.close(); }
});
