import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { test, expect } from 'vitest';
import { ciFixture, newHead } from '../../../fixtures/ci-repair';
import { guardCIRepair } from '../../../../server/delivery/repairs/ci-guard';

test.each(['head', 'fork', 'base', 'owner', 'claim-ended', 'closed', 'scope', 'paused'] as const)('CI write refuses changed %s', async change => {
    const f = ciFixture(); await f.delivery.queueCIRepair(f.job); f.job.status = 'working';
    if (change === 'head') f.pr.head.sha = newHead;
    if (change === 'fork') f.pr.head.repo.full_name = 'other/brain';
    if (change === 'base') f.pr.base.sha = newHead;
    if (change === 'owner') f.store.claimWork({projectId:f.store.project.id,kind:'delivery',id:'competing'},'other','implement');
    if (change === 'claim-ended') {const verify=f.delivery.verifyPR.bind(f.delivery);f.delivery.verifyPR=async(...args)=>{const r=await verify(...args);for(const c of f.store.activeClaims())f.store.finishClaim(c.id,'stopping');return r;};}
    if (change === 'closed') f.issue.state = 'closed';
    if (change === 'scope') f.issue.updated_at = '2026-11-04T21:36:00Z';
    if (change === 'paused') f.store.state.paused = true;
    await expect(claimedDelivery(f.store, f.job, () => guardCIRepair(f.delivery, f.job, f.job.ciRepairs![0]))).rejects.toThrow();
    expect(f.calls.some(c => c.args.includes('push') || c.args.includes('PATCH'))).toBe(false);
});
