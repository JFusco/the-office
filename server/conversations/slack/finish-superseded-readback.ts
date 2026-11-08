import { supersedingDelivery } from './supersession-proof';
import type { Store } from '../../store/store';
import type { TeamMessage } from '../../../src/shared';

/** A queued old read-back must not create a fresh failure after its warning was validly closed. */
export function finishSupersededReadback(store: Store, message: TeamMessage, record: (reply: TeamMessage) => void): boolean {
    if (!message.actionId.startsWith('message:')) return false;
    const id = message.actionId.slice(8), original = store.state.slackDeliveries?.find(delivery => delivery.requestId === id);
    const replacement = original && supersedingDelivery(store.state, original);
    if (!replacement) return false;
    record({ ...message, id: crypto.randomUUID(), from: 'pm', status: 'answered', createdAt: store.clock.now().toISOString(), body: 'The earlier Slack warning was closed by a verified follow-up. The original send outcome remains unknown; no additional message was sent.', error: '', recheck: false, receipts: [{ id: replacement.id, action: 'slack-supersession', target: replacement.permalink, verified: true, uncertain: false, detail: 'Verified replacement closes the old warning; original uncertainty is preserved.' }] });
    message.status = 'answered'; message.error = '';
    store.emit('message-answered', 'Earlier Slack follow-up superseded by a verified replacement.', 'pm', message.ticket);
    return true;
}
