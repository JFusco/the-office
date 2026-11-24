import { expect, test } from 'vitest';
import { mailboxErrorHidden } from '../../../../server/incidents/sources/mailbox-check';

const state = (intake: Record<string, unknown>, pendingMail?: unknown) => ({ intake, pendingMail }) as any;

test('a check queued or running hides the mailbox error it blanked; an error that is present is never hidden', () => {
    expect(mailboxErrorHidden(state({ status: 'idle', error: '' }, { id: 'm' }))).toBe(true);
    expect(mailboxErrorHidden(state({ status: 'working', error: '' }))).toBe(true);
    expect(mailboxErrorHidden(state({ status: 'blocked', error: 'Error: x' }, { id: 'm' }))).toBe(false);
    expect(mailboxErrorHidden(state({ status: 'working', error: 'Error: x' }))).toBe(false);
    expect(mailboxErrorHidden(state({ status: 'idle', error: '' }))).toBe(false);
});
