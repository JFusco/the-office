import { expect, test, vi } from 'vitest';
import { syncInvestigations } from '../../../../server/it/investigations/ledger';
import { investigationReady } from '../../../../server/it/investigations/readiness';
import { investigationFixture } from './fixture';

test('the original group, worker state, active claim and project controls all fence diagnosis', () => {
    const f = investigationFixture(); try {
        syncInvestigations(f.store); const entry = f.store.state.it!.investigations![0], dead = vi.fn(() => false);
        expect(investigationReady(f.store, entry, dead)).toBe(true);
        expect(investigationReady(f.store, entry, () => true)).toBe(false);
        for (const pid of [undefined, 0, -1, NaN]) { f.worker.processId = pid; expect(investigationReady(f.store, entry, dead)).toBe(false); }
        f.worker.processId = 2147483600; f.worker.status = 'stopping'; expect(investigationReady(f.store, entry, dead)).toBe(false); f.worker.status = 'failed';
        const claim = f.store.claimWork({ projectId: 'brain', kind: 'notice', id: 'notice' }, 'owner', 'send')!;
        expect(investigationReady(f.store, entry, dead)).toBe(false); f.store.finishClaim(claim.id, 'completed');
        f.store.state.paused = true; expect(investigationReady(f.store, entry, dead)).toBe(false); f.store.state.paused = false;
        f.store.state.draining = true; expect(investigationReady(f.store, entry, dead)).toBe(false);
    } finally { f.close(); }
});
