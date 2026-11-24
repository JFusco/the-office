import { expect, test, vi } from 'vitest';
import type { Incident } from '../../../src/contracts/incidents';
import { mailboxFreeze } from '../../../server/incidents/mailbox-freeze';

const KEY = 'cec/provider/intake';
const ledgerWith = (subject: Record<string, unknown> | null) => (subject ? [{ subjects: [{ projectId: 'cec', kind: 'provider', id: 'intake', status: 'open', ...subject }] }] : []) as unknown as Incident[];
const observation = (outcome: { id: number; kind: 'mail-delivered' | 'mail-blocked'; at: string } | null | 'unreadable', over: Record<string, unknown> = {}) => ({
    projectId: 'cec', provider: 'azure', state: { intake: { status: 'idle', error: '' }, pendingMail: { id: 'm' } } as any,
    lastMailCheckOutcome: () => { if (outcome === 'unreadable') throw new Error('events unreadable'); return outcome; }, ...over,
});
const delivered = (id: number) => ({ id, kind: 'mail-delivered' as const, at: '2026-11-20T12:00:00.000Z' });

test('the mailbox subject is kept through a check under way unless a check has succeeded since the failure was read', () => {
    expect(mailboxFreeze(observation({ id: 7, kind: 'mail-blocked', at: 'a' }), ledgerWith({ mailCheckOutcomeId: 7 }), () => {})).toBe(KEY);
    expect(mailboxFreeze(observation(delivered(7)), ledgerWith({ mailCheckOutcomeId: 7 }), () => {})).toBe(KEY);
    expect(mailboxFreeze(observation(delivered(9)), ledgerWith({ mailCheckOutcomeId: 7 }), () => {})).toBeNull();
});

test('a subject saved without the event ID, or an event log that cannot be read, proves no recovery', () => {
    expect(mailboxFreeze(observation(delivered(9)), ledgerWith({ lastObservedAt: '2020-01-01T00:00:00.000Z' }), () => {})).toBe(KEY);
    const report = vi.fn();
    expect(mailboxFreeze(observation('unreadable'), ledgerWith({ mailCheckOutcomeId: 7 }), report)).toBe(KEY);
    expect(report).toHaveBeenCalledWith(expect.stringMatching(/mailbox outcome could not read cec/));
});

test('nothing is kept without an open mailbox subject, a hidden error or a Jira mailbox', () => {
    expect(mailboxFreeze(observation(null), ledgerWith(null), () => {})).toBeNull();
    expect(mailboxFreeze(observation(null, { state: { intake: { status: 'blocked', error: 'Error: x' } } }), ledgerWith({ mailCheckOutcomeId: 7 }), () => {})).toBeNull();
    expect(mailboxFreeze(observation(null, { provider: 'github' }), ledgerWith({ mailCheckOutcomeId: 7 }), () => {})).toBeNull();
});
