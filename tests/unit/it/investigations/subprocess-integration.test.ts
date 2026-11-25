import { expect, test, vi } from 'vitest';
import { investigationScheduler } from './investigation-scheduler';
import { subprocessFixture, officeFix } from './subprocess-fixture';
test('normal tick and IT lane deliver one bounded subprocess proposal even when Slack is already confirmed', async () => {
    const f = subprocessFixture(); try {
        const run = vi.fn(async () => ({ summary: 'Synthetic process diagnosis', cause: 'process', evidence: [{ ref: 'artifact:sender/process-lifecycle.json', observation: 'Fixture child remained after the leader exited.' }], recommendation: 'Review the scoped Office proposal.', blocker: '', officeFix }));
        const { it, pump } = investigationScheduler(f.store, run);
        await it.tick(f.store.clock.now(), true); await it.tick(f.store.clock.now(), true);
        expect(f.store.state.it!.investigations).toHaveLength(1); expect(run).not.toHaveBeenCalled();
        await pump(); await it.tick(f.store.clock.now(), true); await pump();
        expect(run).toHaveBeenCalledTimes(1); expect((run.mock.calls as unknown[][])[0][0]).toBe('it');
        expect((run.mock.calls as unknown[][])[0][3]).toMatchObject({ readOnly: true, timeout: 180000, stage: 'it-investigation' });
        expect(f.store.state.it!.reports.at(-1)!.followUps).toEqual([expect.objectContaining({ owner: 'Morgan', detail: expect.stringContaining('Office fix proposed:') })]);
        expect(f.delivery.status).toBe('confirmed'); expect(f.store.state.slackDeliveries).toHaveLength(1);
    } finally { f.close(); }
});
