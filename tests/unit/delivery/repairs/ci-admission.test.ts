import { test, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { ciFixture } from '../../../fixtures/ci-repair';
import { queueCIDiagnosis } from '../../../../server/delivery/repairs/ci-admission';

test('adopted GH-322 with no worktree schedules Sam, saves the failure and never writes to a provider', async () => {
    const f = ciFixture(); expect(await f.delivery.queueCIRepair(f.job)).toBe(true);
    expect(f.job).toMatchObject({ stage: 'lead-pr', status: 'queued', worktree: '' });
    expect(existsSync(f.job.ciRepairs![0].evidencePath)).toBe(true);
    expect(f.calls.some(c => c.bin === 'git' || c.args.includes('POST'))).toBe(false);
    f.job.status = 'watching'; expect(await queueCIDiagnosis(f.delivery, f.job)).toBe(false);
});
test.each(['paused', 'prerequisite', 'uncertain'] as const)('%s stops automatic recovery', async kind => {
    const f = ciFixture();
    if (kind === 'paused') f.store.state.paused = true;
    if (kind === 'prerequisite') f.job.prerequisites = [{} as any];
    if (kind === 'uncertain') f.job.steps[0].result.receipts.push({ uncertain: true, verified: false } as any);
    expect(await queueCIDiagnosis(f.delivery, f.job)).toBe(false); expect(f.calls).toEqual([]);
});
test('same failure is not retried and the total repair budget survives changing check IDs', async () => {
    const f = ciFixture(); await queueCIDiagnosis(f.delivery, f.job);
    f.job.ciRepairs![0].phase = 'done'; f.job.status = 'watching';
    expect(await queueCIDiagnosis(f.delivery, f.job)).toBe(false);
    f.job.ciRepairs!.push({ ...f.job.ciRepairs![0] }, { ...f.job.ciRepairs![0] });
    f.check.name = 'new failure'; f.check.id = 11; f.check.app.slug = 'external-ci';
    expect(await queueCIDiagnosis(f.delivery, f.job)).toBe(true); expect(f.job.status).toBe('blocked'); expect(f.job.ciRepairs).toHaveLength(3);
});
