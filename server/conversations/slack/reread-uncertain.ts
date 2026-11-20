import { runtimeRevision } from '../../office/revision';
import { sanitize } from '../../office/security';
import { CommandFailure } from '../../workers/process';
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
export function dueSlackReread(store: Pick<Store, 'state'>, known?: string): SlackDelivery | undefined {
    const uncertain = (store.state.slackDeliveries || []).filter(delivery => delivery.status === 'uncertain' && delivery.updatedAt < store.state.startedAt);
    if (!uncertain.length) return undefined;
    const revision = known ?? runningRevision();
    return uncertain.find(delivery => delivery.rereadRevision !== revision && !supersedingDelivery(store.state, delivery));
}

/**
 * Reads back one unconfirmed Slack delivery without a person asking; the scheduler offers it when the
 * delivery is due (`dueSlackReread`), behind whatever a person asked for. Read-only: the message is
 * looked up and compared, and nothing is sent. A delivery that is confirmed settles its notice and
 * outbox item as an asked-for read-back does. One that still does not match stays unconfirmed with its
 * item and its original error, and is not read again until the release changes, since only new code
 * can read it differently. A read stopped by a pause or a shutdown does not count. True when it read.
 */
export async function rereadUncertainSlack(conversations: Conversations, deliveryId: string, known?: string): Promise<boolean> {
    const { store, engine } = conversations, revision = known ?? runningRevision();
    const delivery = dueSlackReread(store, revision);
    if (!delivery || delivery.id !== deliveryId || store.state.paused || store.state.draining) return false;
    if (conversations.running || engine.busy || engine.agents.active.size || store.state.intake.status === 'working' || store.state.nightlyDispatching || !store.claim(conversations.owner)) return false;
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
        if (error instanceof CommandFailure && error.category === 'cancelled') delete delivery.rereadRevision;
        // The delivery keeps the error it was left with: the outbox and the incident ledger read that one.
        else store.emit('slack-reread-unconfirmed', `The Office read back the unconfirmed Slack message to ${delivery.targetName} by itself and still could not confirm it: ${sanitize(String(error))} Nothing was sent.`, 'pm');
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
