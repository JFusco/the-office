import { supersedingDelivery } from './supersession-proof';
import type { OfficeSnapshot, SlackDelivery } from '../../../src/shared';

/** Rebuild the UI-only closeout view; never expose a stale saved presentation as current proof. */
export function projectSlackDeliveries(state: OfficeSnapshot): SlackDelivery[] {
    return (state.slackDeliveries || []).map(delivery => {
        const { supersession: _stale, ...source } = delivery;
        const replacement = supersedingDelivery(state, delivery);
        return replacement ? { ...source, supersession: { replacementDeliveryId: replacement.id, channelId: replacement.channelId, messageTs: replacement.messageTs, permalink: replacement.permalink, reason: delivery.supersededBy!.reason } } : source;
    });
}
