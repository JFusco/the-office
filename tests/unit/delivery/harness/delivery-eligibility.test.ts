import { afterEach, expect, test } from 'vitest';
import { fakeGitHub, cleanupFakes } from '../support/fake-github';
import { gateRegisteredDelivery, deliveryIntakeBlocker } from '../../../../server/delivery/harness/delivery-eligibility';
import type { ScheduledWork } from '../../../../server/scheduling/scheduler';
afterEach(cleanupFakes);
test('projection and transactional claim gate use the same current holds and competing claims', () => {
    const f = fakeGitHub(), job = f.candidate();
    const item: ScheduledWork = { store: f.store, work: { projectId: f.store.project.id, kind: 'delivery', id: job.id }, stage: job.stage,
        rank: 3, enqueuedAt: job.requestedAt, eligibility: { state: 'runnable', reason: '', owner: '', nextCheckAt: null }, identity: () => job.id, execute: async () => {} };
    const [projected] = gateRegisteredDelivery(f.store, [item]); expect(projected.eligibility.state).toBe('runnable'); expect(projected.claimEligible!()).toBe(true);
    const other = f.store.claimWork({ projectId: f.store.project.id, kind: 'reconciliation', id: 'unmapped-request' }, 'other', 'readback')!;
    expect(projected.claimEligible!()).toBe(false); expect(gateRegisteredDelivery(f.store, [item])[0].eligibility.state).toBe('blocked');
    expect(deliveryIntakeBlocker(f.store, 'GH-123')).toContain('Unidentified'); f.store.finishClaim(other.id, 'interrupted');
    expect(projected.claimEligible!()).toBe(true); // no worker was ever dispatched by this claim
    const cto = f.store.claimWork({ projectId: f.store.project.id, kind: 'daily-cto', id: 'report' }, 'Avery', 'review', 'cto')!;
    expect(projected.claimEligible!()).toBe(true); expect(deliveryIntakeBlocker(f.store, 'GH-123')).toBeUndefined(); f.store.finishClaim(cto.id, 'completed');
});
