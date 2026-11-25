import { expect, test, vi } from 'vitest';
import { investigationScheduler } from './investigation-scheduler';
import { investigationFixture } from './fixture';

test('normal IT tick admits once; the IT scheduler runs Ellis and projects Morgan ownership without a send', async () => {
    const f = investigationFixture(); try {
        const run = vi.fn(async () => ({ summary: 'Original send outcome is unknown', cause: 'unknown', evidence: [{ ref: 'delivery:delivery', observation: 'Uncertain receipt in saved state' }], recommendation: 'Morgan reconciles the original', blocker: 'Dispatch receipt unavailable' }));
        const { it, pump } = investigationScheduler(f.store, run);
        await it.tick(f.store.clock.now(), true); await it.tick(f.store.clock.now(), true);
        expect(f.store.state.it!.investigations).toHaveLength(1); expect(run).not.toHaveBeenCalled();
        await pump();
        expect(run).toHaveBeenCalledTimes(1); expect((run.mock.calls as unknown[][])[0][0]).toBe('it');
        await it.tick(f.store.clock.now(), true);
        expect(f.store.state.it!.status).toBe('needs-attention'); expect(f.store.state.it!.reports.at(-1)!.followUps).toEqual([expect.objectContaining({ owner: 'Morgan' })]);
        expect(f.delivery.status).toBe('uncertain'); expect(f.store.state.slackDeliveries).toHaveLength(1);
        await pump(); expect(run).toHaveBeenCalledTimes(1);
    } finally { f.close(); }
});
