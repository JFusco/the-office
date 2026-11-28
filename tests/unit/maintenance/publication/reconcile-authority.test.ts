import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeMaintenanceGitHub } from './support/fake-maintenance-github';
import { assertReconcileAuthority, reconcileAuthority } from '../../../../server/maintenance/publication/reconcile-authority';
import type { MaintenanceRun } from '../../../../src/shared';
afterEach(cleanupFakes);

const run = (id: string) => ({ id, requestedAt: '', startedAt: '', endedAt: '', status: 'blocked', weekly: true, stage: 'proposal', error: '', steps: [] }) as MaintenanceRun;

test('only the scheduled recovery, a reconcile-maintenance request or the PM outbox recheck bound to this run own its read-back', async () => {
    const f = fakeMaintenanceGitHub(), target = run('r');
    f.store.state.maintenance = { runs: [target], lastDaily: '', lastWeekly: '', ledger: '' };
    expect(reconcileAuthority(f.store, 'r')).toMatch(/No running scheduler claim/);
    expect(await f.claimed(target, 'reconciliation', async () => reconcileAuthority(f.store, 'r'), 'maintenance-readback', 'recovery:r')).toBeUndefined();
    expect(await f.claimed(target, 'reconciliation', async () => reconcileAuthority(f.store, 'r'), 'maintenance-readback', 'recovery:other')).toMatch(/not bound/);
    f.store.state.coordination!.requests = [{ id: 'req', action: 'reconcile-maintenance', key: 'r', head: '', lane: 'delivery', requestedAt: '', status: 'working', detail: '' } as any,
        { id: 'refresh', action: 'refresh', key: 'r', head: '', lane: 'delivery', requestedAt: '', status: 'working', detail: '' } as any];
    expect(await f.claimed(target, 'reconciliation', async () => reconcileAuthority(f.store, 'r'), 'reconcile-maintenance', 'req')).toBeUndefined();
    expect(await f.claimed(target, 'reconciliation', async () => reconcileAuthority(f.store, 'r'), 'refresh', 'refresh')).toMatch(/not bound/);
    f.store.state.messages.push({ id: 'm1', to: 'pm', recheck: true, actionId: 'maintenance:r' } as any, { id: 'm2', to: 'pm', recheck: false, actionId: 'maintenance:r' } as any);
    expect(await f.claimed(target, 'conversation', async () => reconcileAuthority(f.store, 'r'), 'conversation:pm', 'm1')).toBeUndefined();
    expect(await f.claimed(target, 'conversation', async () => reconcileAuthority(f.store, 'r'), 'conversation:pm', 'm2')).toMatch(/not bound/);
    // A maintenance or continuation claim of the run is not a read-back authority.
    expect(await f.claimed(target, 'maintenance', async () => reconcileAuthority(f.store, 'r'))).toMatch(/not bound/);
    await expect(f.claimed(target, 'maintenance', async () => assertReconcileAuthority(f.store, 'r'))).rejects.toThrow(/not bound/);
});
