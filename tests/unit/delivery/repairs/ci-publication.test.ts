import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ciFixture, newHead, oldHead, plan } from '../../../fixtures/ci-repair';
import { publishCIRepair } from '../../../../server/delivery/repairs/ci-publication';

async function setup(kind: 'pr-metadata' | 'commit-messages' | 'retry') {
    const f = ciFixture(); await f.delivery.queueCIRepair(f.job); f.job.status = 'working';
    const repair = f.job.ciRepairs![0]; repair.phase = 'publish'; repair.plan = plan(kind);
    repair.plan.title = 'fix: corrected title'; repair.plan.body = 'Closes #322'; repair.plan.runId = kind === 'retry' ? 20 : 0;
    if (kind === 'commit-messages') { repair.repairedHead = newHead; repair.worktree = resolve(f.artifactRoot, `ci-${repair.id}`, 'candidate'); repair.hooksPath = resolve(repair.worktree, '.githooks'); f.setGitHead(newHead); }
    const failure = JSON.parse(readFileSync(repair.evidencePath, 'utf8'));
    return { ...f, repair, failure };
}
test.each(['pr-metadata', 'commit-messages', 'retry'] as const)('%s dispatches once with durable intent and independent read-back', async kind => {
    const f = await setup(kind);
    await publishCIRepair(f.delivery, f.job, f.repair, f.failure);
    await publishCIRepair(f.delivery, f.job, f.repair, f.failure);
    const writes = f.calls.filter(c => c.args.includes('PATCH') || c.args.includes('POST') || c.args[0] === 'push');
    expect(writes).toHaveLength(1);
    if (kind === 'commit-messages') expect(writes[0].args).toContain(`--force-with-lease=refs/heads/${f.repair.branch}:${oldHead}`);
    expect(f.store.getEffect(`harness:${f.job.id}:ci-repair:${f.repair.id}`)?.status).toBe('verified');
});
test.each([true, false])('lost response reconciles by read-back and never resends (landed=%s)', async landed => {
    const f = await setup('pr-metadata'); f.failWrites(landed);
    await expect(publishCIRepair(f.delivery, f.job, f.repair, f.failure)).rejects.toThrow('Connection lost');
    const second = publishCIRepair(f.delivery, f.job, f.repair, f.failure);
    if (landed) await second; else await expect(second).rejects.toThrow('will not be resent');
    expect(f.calls.filter(c => c.args.includes('PATCH'))).toHaveLength(1);
});
test('changed head blocks a message rewrite before dispatch', async () => {
    const f = await setup('commit-messages'); f.pr.head.sha = 'e'.repeat(40);
    await expect(publishCIRepair(f.delivery, f.job, f.repair, f.failure)).rejects.toThrow('unchanged');
    expect(f.calls.some(c => c.args[0] === 'push')).toBe(false);
});
test.each(['maintenance', 'repeated', 'new-attempt'] as const)('retry rejects %s', async kind => {
    const f = await setup('retry');
    if (kind === 'maintenance') f.failure.runs[0].path = '.github/workflows/brain-sync.yml';
    if (kind === 'repeated') f.job.ciRepairs!.unshift({ ...f.repair, id: 'prior' });
    if (kind === 'new-attempt') f.run.run_attempt++;
    await expect(publishCIRepair(f.delivery, f.job, f.repair, f.failure)).rejects.toThrow();
    expect(f.calls.some(c => c.args.includes('POST'))).toBe(false);
});
