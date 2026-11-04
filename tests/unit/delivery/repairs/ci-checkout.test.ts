import { test, expect } from 'vitest';
import { ciFixture, newHead } from '../../../fixtures/ci-repair';
import { ciCheckout, verifyCIHooks } from '../../../../server/delivery/repairs/ci-checkout';
import { publishCandidate } from '../../../../server/delivery/publication/publish-pr';

test('creates an isolated checkout at the diagnosed SHA and never switches the primary worktree', async () => {
    const f = ciFixture(); await f.delivery.queueCIRepair(f.job); const repair = f.job.ciRepairs![0];
    const cwd = await ciCheckout(f.delivery, f.job, repair);
    expect(cwd.startsWith(f.artifactRoot)).toBe(true);
    expect(f.calls.find(c => c.args[0] === 'checkout')?.options.cwd).toBe(cwd);
    expect(f.calls.find(c => c.args[0] === 'config')?.args).toEqual(['config', 'core.hooksPath', cwd + '/.githooks']);
    f.job.worktree = cwd;
    await verifyCIHooks(f.delivery, f.job);
    repair.hooksPath = '/different/hooks';
    await expect(verifyCIHooks(f.delivery, f.job)).rejects.toThrow('safeguards');
    await expect(ciCheckout(f.delivery, f.job, repair)).rejects.toThrow('reconciled');
    expect(f.calls.filter(c => c.args[0] === 'clone')).toHaveLength(1);
});

test('ordinary source publication also refuses disabled hooks before pushing the repaired head', async () => {
    const f = ciFixture(); await f.delivery.queueCIRepair(f.job); const repair = f.job.ciRepairs![0];
    f.job.worktree = await ciCheckout(f.delivery, f.job, repair);
    f.job.head = newHead; f.setGitHead(newHead); repair.hooksPath = '/different/hooks';
    await expect(publishCandidate(f.store, f.execute, f.delivery.jobs, f.job, f.artifactRoot)).rejects.toThrow('safeguards');
    expect(f.calls.some(c => c.args[0] === 'push')).toBe(false);
});
