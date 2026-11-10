import { test, expect, vi } from 'vitest';
import { ciFixture, newHead, oldHead, plan } from '../../../fixtures/ci-repair';
import { runCIRepair } from '../../../../server/delivery/repairs/run-ci-repair';
import { bindMetadata } from '../../../../server/delivery/publication/metadata-context';
import { publishCIRepair } from '../../../../server/delivery/repairs/ci-publication';
import { readFileSync } from 'node:fs';

test('actual delivery entrypoint diagnoses GH-322 with Sam and publishes a validated message-only repair', async () => {
    const f = ciFixture(); await f.delivery.queueCIRepair(f.job);
    f.engine.agents.run = vi.fn(async (role, prompt, _schema, options) => {
        expect(role).toBe('lead'); expect(options?.readOnly).toBe(true); expect(prompt).toContain('body-max-line-length');
        return { ...plan('commit-messages'), messages: [{ sha: oldHead, message: 'feat: add Jest\n\nCloses #322\n' }] } as any;
    });
    await f.delivery.step(f.job); expect(f.job.ciRepairs![0].phase).toBe('apply'); expect(f.job.status).toBe('queued');
    await f.delivery.step(f.job);
    expect(f.job).toMatchObject({ head: newHead, stage: 'lead-pr', status: 'watching' });
    expect(f.job.ciRepairs![0].phase).toBe('done'); expect(f.job.steps[0].result.commit).toBe(oldHead);
    expect(f.calls.some(c => c.bin === 'pnpm' && c.args.includes('--from'))).toBe(true);
    expect(f.calls.filter(c => c.args[0] === 'push')).toHaveLength(1);
    expect(f.engine.agents.run).toHaveBeenCalledTimes(1);
});
test.each([false, true])('source diagnosis adopts a private clone and routes Alex through fresh review and QA with metadata history=%s', async retained => {
    const f = ciFixture(); await f.delivery.queueCIRepair(f.job);
    if (retained) f.job.prMetadataRepair = bindMetadata(f.delivery, f.job, f.pr, ['pr-metadata'], 'lead-pr');
    const history = structuredClone(f.job.prMetadataRepair);
    const emitted = f.store.emit.bind(f.store), phases: string[] = [];
    vi.spyOn(f.store, 'emit').mockImplementation((...args) => { if (args[0] === 'pr-conflict-repair-queued') phases.push(f.job.ciRepairs![0].phase); return emitted(...args); });
    f.engine.agents.run = vi.fn(async () => plan('source') as any);
    await f.delivery.step(f.job); await f.delivery.step(f.job);
    expect(f.job).toMatchObject({ stage: 'update-base', status: 'queued', repairReason: 'ci', approach: { review: 'focused', validation: 'independent-checks' } });
    expect(f.job.worktree.startsWith(f.root)).toBe(true); expect(f.calls.some(c => c.args[0] === 'push')).toBe(false);
    expect(phases).toEqual(['done']);
    expect(f.job.prMetadataRepair).toEqual(history);
});
test.each(['apply', 'publish'] as const)('a pre-saved metadata CI plan in %s stops before preparation or publication on an admitted job', async phase => {
    const f = ciFixture(); await f.delivery.queueCIRepair(f.job); f.job.status = 'working';
    const repair = f.job.ciRepairs![0]; repair.phase = phase; repair.plan = plan('pr-metadata');
    f.job.prMetadataRepair = bindMetadata(f.delivery, f.job, f.pr, ['pr-metadata'], 'lead-pr');
    const before = f.calls.length;
    await expect(runCIRepair(f.delivery, f.job, f.issue, f.artifactRoot)).rejects.toThrow('one-shot');
    expect(f.calls.slice(before)).toHaveLength(0); expect(repair.phase).toBe(phase);
});
test.each(['apply', 'publish'] as const)('an admitted job reconciles a historical dispatched CI metadata effect in %s without preparation', async phase => {
    const f = ciFixture(); await f.delivery.queueCIRepair(f.job); f.job.status = 'working';
    const repair = f.job.ciRepairs![0]; repair.plan = { ...plan('pr-metadata'), title: 'fix: corrected title', body: 'Closes #322' };
    const failure = JSON.parse(readFileSync(repair.evidencePath, 'utf8'));
    f.failWrites(); await expect(publishCIRepair(f.delivery, f.job, repair, failure)).rejects.toThrow('Connection lost');
    const id = `harness:${f.job.id}:ci-repair:${repair.id}`, original = structuredClone(f.store.getEffect(id));
    f.job.prMetadataRepair = bindMetadata(f.delivery, f.job, f.pr, ['pr-metadata'], 'lead-pr'); repair.phase = phase;
    const before = f.calls.length;
    await runCIRepair(f.delivery, f.job, f.issue, f.artifactRoot);
    expect(repair.phase).toBe('done'); expect(f.store.getEffect(id)?.status).toBe('verified');
    expect(f.store.getEffect(id)?.payload).toEqual(original?.payload);
    expect(f.calls.slice(before).every(c => c.bin === 'gh' && !c.args.includes('PATCH'))).toBe(true);
    expect(f.calls.filter(c => c.args.includes('PATCH'))).toHaveLength(1);
});
test('real access blocker stays explicit and never starts a local or provider writer', async () => {
    const f = ciFixture(); await f.delivery.queueCIRepair(f.job);
    f.engine.agents.run = vi.fn(async () => ({ ...plan('blocked'), summary: 'Joe must restore the expired CI credential' }) as any);
    await f.delivery.step(f.job); expect(f.job.status).toBe('blocked'); expect(f.job.detail).toContain('credential');
    expect(f.calls.some(c => c.bin === 'git')).toBe(false);
});
test('interrupted diagnosis is not automatically repeated', async () => {
    const f = ciFixture(); await f.delivery.queueCIRepair(f.job); const repair = f.job.ciRepairs![0]; repair.diagnosisStarted = true;
    f.engine.agents.run = vi.fn(); f.job.status = 'working';
    await expect(runCIRepair(f.delivery, f.job, f.issue, f.artifactRoot)).rejects.toThrow('reconciled');
    expect(f.engine.agents.run).not.toHaveBeenCalled();
});
test('interrupted publication reads the original effect without rebuilding or resending', async () => {
    const f = ciFixture(); await f.delivery.queueCIRepair(f.job);
    f.engine.agents.run = vi.fn(async () => ({ ...plan('pr-metadata'), title: 'fix: corrected title', body: 'Closes #322' }) as any);
    await f.delivery.step(f.job); f.failWrites(); await f.delivery.step(f.job);
    expect(f.job.status).toBe('blocked'); expect(f.job.ciRepairs![0].phase).toBe('publish');
    await f.delivery.step(f.job); expect(f.job.status).toBe('watching'); expect(f.job.ciRepairs![0].phase).toBe('done');
    expect(f.calls.filter(c => c.args[0] === 'clone')).toHaveLength(1); expect(f.calls.filter(c => c.args.includes('PATCH'))).toHaveLength(1);
});
