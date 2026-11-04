import { test, expect } from 'vitest';
import { ciFixture, newHead } from '../../../fixtures/ci-repair';
import { guardCIRepair } from '../../../../server/delivery/repairs/ci-guard';

test.each(['head', 'fork', 'base', 'owner', 'stale', 'closed', 'scope', 'paused'] as const)('CI write refuses changed %s', async change => {
    const f = ciFixture(); await f.delivery.queueCIRepair(f.job); f.job.status = 'working';
    if (change === 'head') f.pr.head.sha = newHead;
    if (change === 'fork') f.pr.head.repo.full_name = 'other/brain';
    if (change === 'base') f.pr.base.sha = newHead;
    if (change === 'owner') f.ownership.ownership.status = 'owned';
    if (change === 'stale') f.ownership.fresh = false;
    if (change === 'closed') f.issue.state = 'closed';
    if (change === 'scope') f.issue.updated_at = '2026-11-04T21:36:00Z';
    if (change === 'paused') f.store.state.paused = true;
    await expect(guardCIRepair(f.delivery, f.job, f.job.ciRepairs![0])).rejects.toThrow();
    expect(f.calls.some(c => c.args.includes('push') || c.args.includes('PATCH'))).toBe(false);
});
