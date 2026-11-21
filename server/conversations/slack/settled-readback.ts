import { slackRequestSettled } from './supersession-proof';
import type { OfficeSnapshot, TeamMessage } from '../../../src/shared';

/**
 * True for a message that failed only because a Slack delivery could not be confirmed, once that delivery
 * is confirmed or superseded: the original send, or a later request to read it back. Nothing is left to do
 * for it; the failure is history. The outbox and the scheduler both decide by this.
 */
export function settledSlackReadback(state: OfficeSnapshot, message: Pick<TeamMessage, 'id' | 'actionId' | 'error'>): boolean {
    return /Slack delivery could not be confirmed|Slack read-back did not match/.test(message.error || '')
        && slackRequestSettled(state, message.actionId?.startsWith('message:') ? message.actionId.slice(8) : message.id);
}
