import { expect, test } from 'vitest';
import { digest } from '../../../server/store/readback-evidence';
import { ctoInputRecovered } from '../../../server/conversations/cto-input-resolution';
test('only the completed bound CTO answer resolves its alert, retaining the original failed request', () => {
    const original: any = { id: 'original', from: 'human', to: 'cto', body: 'Mark the videos goal done', status: 'failed' }, linked: any = { id: 'continuation', from: 'human', to: 'cto', body: original.body, status: 'queued', inputRecovery: { originalMessageId: original.id, originalSha256: digest(original) } }, answer: any = { id: 'reply', requestId: linked.id, from: 'cto', to: 'cto', status: 'answered', error: '', receipts: [] }, state: any = { messages: [original, linked] };
    expect(ctoInputRecovered(state, original)).toBe(false); linked.status = 'answered'; expect(ctoInputRecovered(state, original)).toBe(false);
    state.messages.push(answer); expect(ctoInputRecovered(state, original)).toBe(true); expect(original.status).toBe('failed');
    answer.receipts = [{ verified: false, uncertain: true }]; expect(ctoInputRecovered(state, original)).toBe(false);
    answer.receipts = []; original.body += ' changed'; expect(ctoInputRecovered(state, original)).toBe(false);
});
