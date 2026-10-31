import { expect, test } from 'vitest';
import { pruneCompletedReads } from '../../../server/operations/request-retention';

const request = (action: string, status: string, n: number) => ({ id: `${action}-${n}`, action, key: '', head: '', lane: 'operations', requestedAt: `2026-10-31T00:00:${String(n).padStart(2, '0')}Z`, status, detail: '' }) as any;
test('keeps only the most recent completed read operations and every other request', () => {
    const requests = [
        ...Array.from({ length: 30 }, (_, n) => request('poll', 'completed', n)),
        request('poll', 'queued', 31),
        request('reconcile-preparation', 'blocked', 32),
        request('correct-recovery-time', 'completed', 33),
        ...Array.from({ length: 3 }, (_, n) => request('refresh', 'completed', 40 + n)),
    ];
    expect(pruneCompletedReads(requests, 25)).toBe(5);
    expect(requests.filter(r => r.action === 'poll' && r.status === 'completed').map(r => r.id)).toEqual(Array.from({ length: 25 }, (_, n) => `poll-${n + 5}`));
    expect(requests.map(r => r.id)).toContain('poll-31');
    expect(requests.map(r => r.id)).toContain('reconcile-preparation-32');
    expect(requests.map(r => r.id)).toContain('correct-recovery-time-33');
    expect(requests.filter(r => r.action === 'refresh')).toHaveLength(3);
    expect(pruneCompletedReads(requests, 25)).toBe(0);
});
