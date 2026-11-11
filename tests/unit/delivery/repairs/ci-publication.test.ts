import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ciFixture, newHead, oldHead, plan } from '../../../fixtures/ci-repair';
import { publishCIRepair } from '../../../../server/delivery/repairs/ci-publication';
import { bindMetadata } from '../../../../server/delivery/publication/metadata-context';

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
    await claimedDelivery(f.store, f.job, () => publishCIRepair(f.delivery, f.job, f.repair, f.failure));
    await claimedDelivery(f.store, f.job, () => publishCIRepair(f.delivery, f.job, f.repair, f.failure));
    const writes = f.calls.filter(c => c.args.includes('PATCH') || c.args.includes('POST') || c.args[0] === 'push');
    expect(writes).toHaveLength(1);
    if (kind === 'commit-messages') expect(writes[0].args).toContain(`--force-with-lease=refs/heads/${f.repair.branch}:${oldHead}`);
    expect(f.store.getEffect(`harness:${f.job.id}:ci-repair:${f.repair.id}`)?.status).toBe('verified');
});
test.each([true, false])('lost response reconciles by read-back and never resends (landed=%s)', async landed => {
    const f = await setup('pr-metadata'); f.failWrites(landed);
    await expect(claimedDelivery(f.store, f.job, () => publishCIRepair(f.delivery, f.job, f.repair, f.failure))).rejects.toThrow('Connection lost');
    const second = claimedDelivery(f.store, f.job, () => publishCIRepair(f.delivery, f.job, f.repair, f.failure));
    if (landed) await second; else await expect(second).rejects.toThrow('will not be resent');
    expect(f.calls.filter(c => c.args.includes('PATCH'))).toHaveLength(1);
});
test('a retained admitted metadata record prevents a separate CI metadata dispatch', async () => {
    const f = await setup('pr-metadata');
    f.job.prMetadataRepair = bindMetadata(f.delivery, f.job, f.pr, ['pr-metadata'], 'lead-pr');
    await expect(claimedDelivery(f.store, f.job, () => publishCIRepair(f.delivery, f.job, f.repair, f.failure))).rejects.toThrow('one-shot');
    expect(f.calls.filter(c => c.args.includes('PATCH'))).toHaveLength(0);
    expect(f.store.getEffect(`harness:${f.job.id}:ci-repair:${f.repair.id}`)).toBeUndefined();
});
test.each([true, false])('a retained metadata record preserves readback of an uncertain CI retry ID landed=%s', async landed => {
    const f = await setup('pr-metadata'), execute = f.delivery.execute;
    const id = `harness:${f.job.id}:ci-repair:${f.repair.id}`;
    let rejected = false;
    f.delivery.execute = (async (program, args, options) => {
        if (program === 'gh' && args[0] === 'pr' && f.store.getEffect(id)?.status === 'prepared' && !rejected) {
            rejected = true; throw new Error('Synthetic rejected preflight');
        }
        return execute(program, args, options);
    }) as typeof execute;
    await expect(claimedDelivery(f.store, f.job, () => publishCIRepair(f.delivery, f.job, f.repair, f.failure))).rejects.toThrow('rejected preflight');
    const original = structuredClone(f.store.getEffect(id)); expect(original?.dispatchedAt).toBe('');
    f.failWrites(landed);
    await expect(claimedDelivery(f.store, f.job, () => publishCIRepair(f.delivery, f.job, f.repair, f.failure))).rejects.toThrow('Connection lost');
    const retry = `${id}:retry-1`, uncertain = structuredClone(f.store.getEffect(retry));
    expect(uncertain?.status).toBe('uncertain'); expect(uncertain?.dispatchedAt).not.toBe('');
    f.job.prMetadataRepair = bindMetadata(f.delivery, f.job, f.pr, ['pr-metadata'], 'lead-pr');
    const record = structuredClone(f.job.prMetadataRepair);
    const resume = claimedDelivery(f.store, f.job, () => publishCIRepair(f.delivery, f.job, f.repair, f.failure));
    if (landed) await resume; else await expect(resume).rejects.toThrow('will not be resent');
    expect(f.store.getEffect(id)).toEqual(original); expect(f.store.getEffect(retry)?.payload).toEqual(uncertain?.payload);
    expect(f.store.getEffect(retry)?.status).toBe(landed ? 'verified' : 'uncertain');
    expect(f.job.prMetadataRepair).toEqual(record); expect(f.calls.filter(c => c.args.includes('PATCH'))).toHaveLength(1);
});
test('changed head blocks a message rewrite before dispatch', async () => {
    const f = await setup('commit-messages'); f.pr.head.sha = 'e'.repeat(40);
    await expect(claimedDelivery(f.store, f.job, () => publishCIRepair(f.delivery, f.job, f.repair, f.failure))).rejects.toThrow('unchanged');
    expect(f.calls.some(c => c.args[0] === 'push')).toBe(false);
});
test.each(['maintenance', 'repeated', 'new-attempt'] as const)('retry rejects %s', async kind => {
    const f = await setup('retry');
    if (kind === 'maintenance') f.failure.runs[0].path = '.github/workflows/brain-sync.yml';
    if (kind === 'repeated') f.job.ciRepairs!.unshift({ ...f.repair, id: 'prior' });
    if (kind === 'new-attempt') f.run.run_attempt++;
    await expect(claimedDelivery(f.store, f.job, () => publishCIRepair(f.delivery, f.job, f.repair, f.failure))).rejects.toThrow();
    expect(f.calls.some(c => c.args.includes('POST'))).toBe(false);
});
test.each(['advancing-base', 'retargeted-base', 'foreign-head'] as const)('uncertain push read-back preserves effect identity with %s', async change => {
    const f = await setup('commit-messages'); f.failWrites();
    await expect(claimedDelivery(f.store, f.job, () => publishCIRepair(f.delivery, f.job, f.repair, f.failure))).rejects.toThrow('Connection lost');
    f.pr.base.sha = 'e'.repeat(40);
    if (change === 'retargeted-base') f.pr.base.ref = 'other-target';
    if (change === 'foreign-head') f.pr.head.repo.full_name = 'other/repository';
    const reconciled = claimedDelivery(f.store, f.job, () => publishCIRepair(f.delivery, f.job, f.repair, f.failure));
    if (change === 'advancing-base') {
        await reconciled;
        expect(f.store.getEffect(`harness:${f.job.id}:ci-repair:${f.repair.id}`)?.status).toBe('verified');
    } else await expect(reconciled).rejects.toThrow(change === 'retargeted-base' ? 'repository or target' : 'will not be resent');
    expect(f.calls.filter(c => c.args[0] === 'push')).toHaveLength(1);
});
