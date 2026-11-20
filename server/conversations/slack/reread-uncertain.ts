import { runtimeRevision } from '../../office/revision';
import { sanitize } from '../../office/security';
import { SlackMessages } from '../slack';
import { supersedingDelivery } from './supersession-proof';
import type { Conversations } from '../conversations';
import type { Store } from '../../store/store';
import type { SlackDelivery } from '../../../src/shared';

let running: string | undefined;
/** The revision of the code this service is running; read once. */
const runningRevision = () => running ??= runtimeRevision().hash;

/**
 * An unconfirmed, not superseded Slack delivery that this release has not read back yet: it was last
 * touched before this service started, and no automatic read on this release is recorded for it. A
 * delivery this process sent or read itself has just been compared by the same code.
 */
export function dueSlackReread(store: Pick<Store, 'state'>, revision: string): SlackDelivery | undefined {
    return (store.state.slackDeliveries || []).find(delivery => delivery.status === 'uncertain' && delivery.rereadRevision !== revision
        && delivery.updatedAt < store.state.startedAt && !supersedingDelivery(store.state, delivery));
}

/**
 * With nothing else for the team to do, reads back one unconfirmed Slack delivery without a person
 * asking. Read-only: the delivery is looked up and compared, and nothing is sent. A delivery that is
 * confirmed settles its notice and outbox item as an asked-for read-back does. One that still does not
 * match stays uncertain with its item and is not read again until the release changes, since only new
 * code can read it differently. True when it used the turn.
 */
export async function rereadUncertainSlack(conversations: Conversations, known?: string): Promise<boolean> {
    const { store, engine } = conversations;
    if (!store.state.slackDeliveries?.some(candidate => candidate.status === 'uncertain')) return false;
    const revision = known ?? runningRevision(), delivery = dueSlackReread(store, revision);
    if (!delivery || store.state.paused || store.state.draining || !store.claim(conversations.owner)) return false;
    conversations.running = true;
    engine.busy = true;
    const heartbeat = setInterval(() => store.claim(conversations.owner), 20000);
    // Marked first: a read that dies is not started again on every turn.
    delivery.rereadRevision = revision;
    store.save();
    try {
        await new SlackMessages(store, engine.agents).verify(delivery);
        store.emit('slack-reread-confirmed', `The Office read back the unconfirmed Slack message to ${delivery.targetName} by itself. It is confirmed; nothing was sent.`, 'pm');
    }
    catch (error) {
        delivery.error = sanitize(String(error));
        delivery.updatedAt = store.clock.now().toISOString();
        store.emit('slack-reread-unconfirmed', `The Office read back the unconfirmed Slack message to ${delivery.targetName} by itself and still could not confirm it: ${delivery.error} Nothing was sent.`, 'pm');
    }
    finally {
        clearInterval(heartbeat);
        store.release(conversations.owner);
        engine.busy = false;
        conversations.running = false;
        store.save();
    }
    return true;
}
