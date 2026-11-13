import type { OfficeSnapshot, TeamMessage } from '../../src/shared';
import { digest } from '../store/readback-evidence';
/** Actual linked reply settles the alert; the original rejected request remains failed history. */
export function ctoInputRecovered(state: OfficeSnapshot, original: TeamMessage): boolean {
    const linked = state.messages.filter(message => message.inputRecovery?.originalMessageId === original.id);
    if (linked.length !== 1) return false;
    const request = linked[0];
    if (original.from !== 'human' || original.to !== 'cto' || original.status !== 'failed' || request.status !== 'answered' || request.from !== 'human' || request.to !== 'cto' || request.body !== original.body || request.inputRecovery?.originalSha256 !== digest(original)) return false;
    const answers = state.messages.filter(message => message.requestId === request.id && message.from === 'cto' && message.to === 'cto' && message.status === 'answered' && !message.error && message.receipts.every(receipt => receipt.verified && !receipt.uncertain));
    return answers.length === 1;
}
