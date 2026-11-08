import { expect, test, vi } from 'vitest';
import { scheduledInvestigations } from '../../../../server/it/investigations/scheduled';
import { syncInvestigations } from '../../../../server/it/investigations/ledger';
import { investigationFixture } from './fixture';
import { assertWorkerLane } from '../../../../server/workers/worker-lanes';

test('pure scheduler projection rechecks termination at claim and retains exhausted ownership', () => {
    const f = investigationFixture(); try {
        syncInvestigations(f.store); let live = false; const run = vi.fn();
        const before = structuredClone(f.store.state.it), [item] = scheduledInvestigations(f.store, run, f.store.clock.now(), () => live);
        expect(f.store.state.it).toEqual(before); expect(item.eligibility.state).toBe('runnable'); expect(item.claimEligible!()).toBe(true);
        live = true; expect(item.claimEligible!()).toBe(false);
        const entry = f.store.state.it!.investigations![0]; entry.status = 'working'; entry.attempts = 3; entry.nextAt = f.store.clock.now().toISOString();
        expect(scheduledInvestigations(f.store, run, f.store.clock.now(), () => false)[0].eligibility).toMatchObject({ state: 'blocked', owner: 'Morgan' });
        expect(() => assertWorkerLane('it', 'it-investigation', true, { lane: 'it', claim: { work: item.work, lane: 'it' } as any })).not.toThrow();
        expect(() => assertWorkerLane('it', 'it-investigation', false)).toThrow();
    } finally { f.close(); }
});
test('an interrupted read waits for its deadline and stopped diagnosis group before a bounded retry', () => {
    const f = investigationFixture(); try {
        syncInvestigations(f.store); const entry = f.store.state.it!.investigations![0]; entry.attempts = 1; entry.status = 'working'; entry.nextAt = new Date(f.store.clock.now().getTime() + 1000).toISOString();
        expect(scheduledInvestigations(f.store, vi.fn(), f.store.clock.now(), () => false)[0].eligibility.state).toBe('waiting');
        f.advance(1001); f.store.state.workLog!.push({ ...f.worker, id: 'diagnosis', requestId: entry.id, stage: 'it-investigation', status: 'interrupted', processId: 123 });
        expect(scheduledInvestigations(f.store, vi.fn(), f.store.clock.now(), pid => pid === 123)[0].eligibility.state).toBe('waiting');
        expect(scheduledInvestigations(f.store, vi.fn(), f.store.clock.now(), () => false)[0].eligibility.state).toBe('runnable');
    } finally { f.close(); }
});
