import { expect, test } from 'vitest';
import { retainSessionMessage, type SessionConversation } from '../../../server/workers/session-conversation';

test('conversation evidence preserves roles and times, reports bounds, and does not mutate prior evidence', () => {
    let conversation: SessionConversation = { projects: ['brain'], messages: [], omittedMessages: 0 };
    const original = conversation;
    for (let i = 0; i < 65; i++) conversation = retainSessionMessage(conversation, 'user', String(i), `at-${i}`);
    expect(original.messages).toEqual([]);
    expect(conversation.projects).toEqual(['brain']);
    expect(conversation.omittedMessages).toBe(1);
    expect(conversation.messages[0]).toEqual({ role: 'user', at: 'at-1', text: '1', truncated: false });
    expect(conversation.messages.at(-1)?.text).toBe('64');
    conversation = retainSessionMessage(conversation, 'assistant', 'x'.repeat(4001), 'latest');
    expect(conversation.messages).toHaveLength(64);
    expect(conversation.omittedMessages).toBe(2);
    expect(conversation.messages.at(-1)).toEqual({ at: 'latest', role: 'assistant', text: 'x'.repeat(4000), truncated: true });
});
