import { afterEach, expect, test, vi } from 'vitest';
import { cleanupFakes, fakeGitHub } from '../support/fake-github';
import { claimedDelivery } from '../../../fixtures/delivery-claim';

afterEach(() => { vi.restoreAllMocks(); cleanupFakes(); });

test('a stage stopped by a closed issue records its kind and clears it when the job runs again', async () => {
    const f = fakeGitHub();
    const job = f.candidate({ stage: 'review' });
    const worker = vi.spyOn(f.engine.agents, 'run');
    f.state.issue.state = 'closed';
    await claimedDelivery(f.store, job, () => f.delivery.step(job));
    expect(job).toMatchObject({ status: 'blocked', stage: 'review', stop: { kind: 'source-closed' } });
    expect(job.detail).toContain('Issue is closed or no longer assigned');
    expect(worker).not.toHaveBeenCalled();

    f.state.issue.state = 'open';
    worker.mockRejectedValue(new Error('gh exited 1: HTTP 502'));
    job.status = 'queued';
    await claimedDelivery(f.store, job, () => f.delivery.step(job));
    expect(job).toMatchObject({ status: 'blocked', stop: { kind: 'transient' } });

    let duringRun: unknown = 'not run';
    worker.mockImplementation((async () => { duringRun = job.stop; throw new Error('Candidate changed since independent review'); }) as never);
    job.status = 'queued';
    await claimedDelivery(f.store, job, () => f.delivery.step(job));
    expect(duringRun).toBeUndefined();
    expect(job.stop?.kind).toBe('unclassified');
});
