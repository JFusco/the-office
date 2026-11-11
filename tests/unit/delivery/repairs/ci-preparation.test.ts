import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { test, expect, vi } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ciFixture, oldHead, newHead, plan } from '../../../fixtures/ci-repair';
import { ciCheckout } from '../../../../server/delivery/repairs/ci-checkout';
import { prepareCIMetadataRepair } from '../../../../server/delivery/repairs/ci-preparation';

async function proposed() {
    const f = ciFixture(); await f.delivery.queueCIRepair(f.job);
    f.engine.agents.run = vi.fn(async () => ({ ...plan('commit-messages'), messages: [{ sha: oldHead, message: 'feat: add Jest\n\nCloses #322\n' }] }) as any);
    await claimedDelivery(f.store, f.job, () => f.delivery.step(f.job)); return f;
}
test('standalone candidate installs its own validation dependencies and resumes a failed lint without recloning or rediagnosing', async () => {
    const f = await proposed(), original = f.execute.getMockImplementation()!; let fail = true;
    f.execute.mockImplementation(async (bin, args, options) => {
        if (bin === 'pnpm' && args.includes('--from') && fail) throw new Error('commitlint unavailable');
        return original(bin, args, options);
    });
    await claimedDelivery(f.store, f.job, () => f.delivery.step(f.job));
    const repair = f.job.ciRepairs![0], path = resolve(f.artifactRoot, `ci-reword-${repair.id}.json`), evidence = readFileSync(path, 'utf8');
    expect(f.job.status).toBe('blocked'); expect(repair).toMatchObject({ phase: 'apply', repairedHead: newHead });
    expect(f.calls.find(c => c.bin === 'pnpm' && c.args[0] === 'install')?.args).toEqual(['install', '--frozen-lockfile', '--prod=false', '--ignore-workspace']);
    expect(f.calls.some(c => c.args[0] === 'push')).toBe(false);
    fail = false; await claimedDelivery(f.store, f.job, () => f.delivery.step(f.job));
    expect(f.job).toMatchObject({ status: 'watching', head: newHead });
    expect(readFileSync(path, 'utf8')).toBe(evidence);
    expect(f.calls.filter(c => c.args[0] === 'clone')).toHaveLength(1); expect(f.calls.filter(c => c.args[0] === 'push')).toHaveLength(1);
    expect(f.engine.agents.run).toHaveBeenCalledTimes(1);
});
test('a repository-owned workspace retains its own workspace dependency configuration', async () => {
    const f = await proposed(), repair = f.job.ciRepairs![0];
    const cwd = await ciCheckout(f.delivery, f.job, repair); writeFileSync(resolve(cwd, 'pnpm-workspace.yaml'), 'packages: []\n');
    await claimedDelivery(f.store, f.job, () => prepareCIMetadataRepair(f.delivery, f.job, repair, f.issue, f.artifactRoot));
    expect(f.calls.find(c => c.bin === 'pnpm' && c.args[0] === 'install')?.args).toEqual(['install', '--frozen-lockfile', '--prod=false']);
});
test('retained candidate drift and any saved publication stop local preparation', async () => {
    const f = await proposed(), repair = f.job.ciRepairs![0]; await ciCheckout(f.delivery, f.job, repair);
    f.setGitHead('e'.repeat(40));
    await expect(claimedDelivery(f.store, f.job, () => prepareCIMetadataRepair(f.delivery, f.job, repair, f.issue, f.artifactRoot))).rejects.toThrow('head changed');
    f.setGitHead(oldHead); vi.spyOn(f.store, 'getEffect').mockReturnValue({ status: 'uncertain' } as any);
    await expect(claimedDelivery(f.store, f.job, () => prepareCIMetadataRepair(f.delivery, f.job, repair, f.issue, f.artifactRoot))).rejects.toThrow('publication');
    expect(f.calls.some(c => c.bin === 'pnpm')).toBe(false);
});
test('a retained reword receipt is verified and never overwritten', async () => {
    const f = await proposed(), repair = f.job.ciRepairs![0];
    await claimedDelivery(f.store, f.job, () => prepareCIMetadataRepair(f.delivery, f.job, repair, f.issue, f.artifactRoot));
    const path = resolve(f.artifactRoot, `ci-reword-${repair.id}.json`), changed = JSON.stringify({ head: newHead, mapping: [] }); writeFileSync(path, changed);
    await expect(claimedDelivery(f.store, f.job, () => prepareCIMetadataRepair(f.delivery, f.job, repair, f.issue, f.artifactRoot))).rejects.toThrow('evidence changed');
    expect(readFileSync(path, 'utf8')).toBe(changed); expect(f.calls.some(c => c.args[0] === 'push')).toBe(false);
});
