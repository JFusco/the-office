import { supersedeSlackDelivery } from './supersede-delivery';
import { sanitize } from '../../office/security';
import type { Store } from '../../store/store';
import type { SlackDelivery } from '../../../src/shared';

/** Only explicit human request metadata permits automatic closeout after a fresh send is confirmed. */
export function settleRequestedSlackReplacement(store: Store, delivery: SlackDelivery): void {
    const human = store.state.messages.find(message => message.id === delivery.requestId && message.from === 'human' && message.to === 'pm');
    if (!human?.slackReplacement || delivery.status !== 'confirmed') return;
    try { supersedeSlackDelivery(store, { ...human.slackReplacement, replacementDeliveryId: delivery.id }); }
    catch (error) {
        // A closeout rejection must not turn a positively verified new delivery into an uncertain send.
        store.emit('slack-supersession-blocked', `Replacement delivered, but the old warning remains: ${sanitize(String(error)).slice(0, 800)}`, 'pm', human.ticket);
    }
}
