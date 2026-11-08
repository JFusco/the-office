export interface SessionConversation {
    projects: string[];
    messages: { at: string; role: 'user' | 'assistant'; text: string; truncated: boolean }[];
    omittedMessages: number;
}

/** Bounded conversation evidence for loaded chats; never an activity or authorization claim. */
export function retainSessionMessage(conversation: SessionConversation, role: 'user' | 'assistant', text: string, at: string): SessionConversation {
    const messages = [...conversation.messages, { at, role, text: text.slice(0, 4000), truncated: text.length > 4000 }];
    const removed = Math.max(0, messages.length - 64);
    return { ...conversation, messages: messages.slice(-64), omittedMessages: conversation.omittedMessages + removed };
}
