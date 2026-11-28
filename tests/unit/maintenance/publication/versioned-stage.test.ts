import { expect, test } from 'vitest';
import { assertNoAmbiguousAttempt, latestWorker } from '../../../../server/maintenance/publication/versioned-stage';

test('an unstarted position with a spawned worker since the last saved step is ambiguous and goes to read-back', () => {
    const run: any = { id: 'r', requestedAt: '2026-11-28T00:00:00Z', steps: [{ stage: 'vendor-review', at: '2026-11-28T01:00:00Z' }] };
    const store: any = { state: { workLog: [{ id: 'w0', requestId: 'r', stage: 'proposal-review', processId: 4, startedAt: '2026-11-28T00:30:00Z' }] } };
    expect(() => assertNoAmbiguousAttempt(store, run, 'proposal-review')).not.toThrow();
    store.state.workLog.push({ id: 'w1', requestId: 'r', stage: 'proposal-review', startedAt: '2026-11-28T01:30:00Z' });
    expect(() => assertNoAmbiguousAttempt(store, run, 'proposal-review')).not.toThrow();
    store.state.workLog.push({ id: 'w2', requestId: 'r', stage: 'proposal-review', processId: 9, startedAt: '2026-11-28T01:40:00Z' });
    let stop: unknown;
    try { assertNoAmbiguousAttempt(store, run, 'proposal-review'); } catch (error) { stop = error; }
    expect(stop).toMatchObject({ kind: 'authority' });
    expect(latestWorker(store, run, 'proposal-review')).toBe('w2');
});

test('a versioned step replays a precomputed result without launching, and otherwise retains outputs only for a passed result', async () => {
    const { runVersionedStep } = await import('../../../../server/maintenance/publication/versioned-stage');
    const run: any = { id: 'r', requestedAt: '2026-11-28T00:00:00Z', steps: [] };
    const store: any = { state: { workLog: [] } };
    let launched = 0;
    const agents: any = { run: async () => { launched++; return { outcome: 'passed' }; } };
    const reroute: any = { outcome: 'reroute' };
    const replay = await runVersionedStep(store, agents, (async () => '') as any, run, { role: 'developer', stage: 'proposal', instructions: '', candidates: [] }, { launch: () => { throw new Error('never'); }, precomputed: reroute }, {} as any);
    expect(replay.result).toBe(reroute);
    expect(launched).toBe(0);
});
