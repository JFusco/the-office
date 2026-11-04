import { test, expect, vi } from 'vitest';
import { ciFixture, newHead, oldHead, plan } from '../../../fixtures/ci-repair';
import { runCIRepair } from '../../../../server/delivery/repairs/run-ci-repair';

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
test('source diagnosis adopts a private clone and routes Alex through fresh review and QA', async () => {
    const f = ciFixture(); await f.delivery.queueCIRepair(f.job);
    const emitted = f.store.emit.bind(f.store), phases: string[] = [];
    vi.spyOn(f.store, 'emit').mockImplementation((...args) => { if (args[0] === 'pr-conflict-repair-queued') phases.push(f.job.ciRepairs![0].phase); return emitted(...args); });
    f.engine.agents.run = vi.fn(async () => plan('source') as any);
    await f.delivery.step(f.job); await f.delivery.step(f.job);
    expect(f.job).toMatchObject({ stage: 'update-base', status: 'queued', repairReason: 'ci', approach: { review: 'focused', validation: 'independent-checks' } });
    expect(f.job.worktree.startsWith(f.root)).toBe(true); expect(f.calls.some(c => c.args[0] === 'push')).toBe(false);
    expect(phases).toEqual(['done']);
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
