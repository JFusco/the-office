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
test('a paused project still prunes completed reads on tick', async () => {
    const { mkdtempSync, rmSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { resolve } = await import('node:path');
    const { Store } = await import('../../../server/store/store');
    const { Engine } = await import('../../../server/scheduling/engine');
    const { Coordinator } = await import('../../../server/scheduling/coordination');
    const { projectById } = await import('../../../server/office/projects');
    const root = mkdtempSync(resolve(tmpdir(), 'office-retention-'));
    const store = new Store(':memory:', projectById('brain'), root);
    try {
        const c = new Coordinator(store, new Engine(store));
        c.activate(new Date('2026-10-31T00:00:00Z'));
        store.state.paused = true;
        c.state.requests = Array.from({ length: 40 }, (_, n) => request('refresh', 'completed', n));
        await c.tick(new Date('2026-10-31T00:01:00Z'));
        expect(c.state.requests.length).toBe(25);
    } finally { store.close(); rmSync(root, { recursive: true, force: true }); }
});
