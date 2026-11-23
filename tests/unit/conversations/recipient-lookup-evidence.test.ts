import { expect, test } from 'vitest';
import { lookupSentNothing } from '../../../server/conversations/recipient-lookup-evidence';

const run = (status: string, failure?: object, stage = 'slack-recipient') => lookupSentNothing({ stage, status, failure } as any);
const failed = (category: string, code?: string) => run('failed', { category, dispatched: true, detail: 'refused', ...(code ? { code } : {}) });

test('a lookup that was interrupted, blocked or finished may be run again, as before', () => {
    for (const status of ['interrupted', 'blocked', 'completed']) expect(run(status), status).toBe(true);
    for (const status of ['running', 'queued', 'cancelled']) expect(run(status), status).toBe(false);
});

test('a failed lookup may be run again unless its failure is an effect of unknown outcome or was not recorded', () => {
    // What the runner records for a read-only launch that fails without acting.
    for (const category of ['other', 'provider-limit', 'transient-read', 'authentication', 'permission']) expect(failed(category), category).toBe(true);
    expect(failed('uncertain-effect')).toBe(false);
    expect(failed('other', 'surviving-subprocesses')).toBe(false);
    expect(run('failed')).toBe(false);
});

test('only the recipient lookup stage counts: a send or a verification is never such evidence', () => {
    for (const stage of ['slack-send', 'slack-verify', 'conversation-readback', '']) {
        expect(run('interrupted', undefined, stage), stage).toBe(false);
        expect(run('failed', { category: 'other', dispatched: true, detail: 'refused' }, stage), stage).toBe(false);
    }
});
