import { uncertainConversations, conversationReadbackReady, queueConversationReadback } from '../conversations/conversation-recovery';
import type { ITContext } from './context';

/** Queue read-backs for interrupted human conversations. */
export async function readBackConversations(context: ITContext): Promise<void> {
    const { offices, store, engine, coordinator, state, it, actions, followUps, current, now, health, nextAt, retainedPartials, retainedCloseouts, services, activationBudget, recover } = context;
    for (const original of uncertainConversations(store)) {
        const id = `conversation:${original.id}`;
        current.add(id);
        if (!conversationReadbackReady(store, original)) {
            followUps.push({ id, owner: 'IT', detail: state.paused || state.draining ? 'Read-back waits while this project is paused or draining.' : 'Read-back waits for confirmed original process termination.' });
            continue;
        }
        await recover(id, original.error, async () => queueConversationReadback(store, original), `Morgan reads back the original conversation ${original.id}; no issue creation or other write may be retried.`, 'Morgan');
    }
}
