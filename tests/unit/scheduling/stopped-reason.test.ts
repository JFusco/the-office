import { expect, test } from 'vitest';
import { stoppedReason } from '../../../server/scheduling/stopped-reason';

test('each stopped status gets a cause and a reason built from the record\'s own first line', () => {
    expect(stoppedReason('failed', { error: 'Error: A ticket update could not be verified.\nmore' })).toEqual({ cause: 'failed', reason: 'Failed, not retried: A ticket update could not be verified.' });
    expect(stoppedReason('uncertain', { detail: 'Slack delivery could not be confirmed.' })).toEqual({ cause: 'unconfirmed', reason: 'Effect unconfirmed; read back, never resent: Slack delivery could not be confirmed.' });
    expect(stoppedReason('interrupted', {})).toEqual({ cause: 'interrupted', reason: 'Interrupted, waiting for recovery' });
    expect(stoppedReason('blocked', { detail: '  ', error: 42 })).toEqual({ cause: 'needs-decision', reason: 'Blocked, needs a decision' });
});

test('an unknown status still needs a decision and names itself; long explanations are clipped', () => {
    expect(stoppedReason('parked', { detail: 'x'.repeat(300) }).reason).toBe(`Stopped (parked): ${'x'.repeat(240)}…`);
    expect(stoppedReason('parked', {}).cause).toBe('needs-decision');
});
