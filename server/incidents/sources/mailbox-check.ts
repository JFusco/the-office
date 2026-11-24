import type { OfficeSnapshot } from '../../../src/shared';

/**
 * A Jira mailbox check queued or running blanks the mailbox's last error before it reads anything
 * (`server/cec/mailbox.ts`), so until the check ends a blank error says nothing about the failure. An
 * error that is present is read as usual, whatever else is queued.
 */
export const mailboxErrorHidden = (state: OfficeSnapshot) => !state.intake?.error && (state.intake?.status === 'working' || !!state.pendingMail);
