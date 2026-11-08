import { expect, test, vi } from 'vitest';
import { ITSpecialist } from '../../../../server/it/it-specialist';
import { scheduledWork } from '../../../../server/scheduling/scheduled-work';
import { Scheduler } from '../../../../server/scheduling/scheduler';
import { officeCapacity } from '../../../../server/office/projects';
import { subprocessFixture, officeFix } from './subprocess-fixture';
test('normal tick and IT lane deliver one bounded subprocess proposal even when Slack is already confirmed', async () => {
    const f = subprocessFixture(); try {
        const run = vi.fn(async () => ({ summary: 'Synthetic process diagnosis', cause: 'process', evidence: [{ ref: 'artifact:sender/process-lifecycle.json', observation: 'Fixture child remained after the leader exited.' }], recommendation: 'Review the scoped Office proposal.', blocker: '', officeFix }));
        const entry = { store: f.store, engine: { itAgents: { run }, agents: { active: new Map() } }, coordinator: {} };
        const offices = { entries: new Map([['brain', entry]]) };
        const it = new ITSpecialist(offices as any, { report: async () => ({ services: [], checkedAt: '', context: '' }) } as any);
        await it.tick(f.store.clock.now(), true); await it.tick(f.store.clock.now(), true);
        expect(f.store.state.it!.investigations).toHaveLength(1); expect(run).not.toHaveBeenCalled();
        const scheduler = new Scheduler(officeCapacity(), f.store.clock, 'it');
        const pump = () => scheduler.pump([{ store: f.store, items: scheduledWork(entry as any, new Map() as any, f.store.clock.now(), 'it') }]);
        await pump(); await it.tick(f.store.clock.now(), true); await pump();
        expect(run).toHaveBeenCalledTimes(1); expect((run.mock.calls as unknown[][])[0][0]).toBe('it');
        expect((run.mock.calls as unknown[][])[0][3]).toMatchObject({ readOnly: true, timeout: 180000, stage: 'it-investigation' });
        expect(f.store.state.it!.reports.at(-1)!.followUps).toEqual([expect.objectContaining({ owner: 'Morgan', detail: expect.stringContaining('Office fix proposed:') })]);
        expect(f.delivery.status).toBe('confirmed'); expect(f.store.state.slackDeliveries).toHaveLength(1);
    } finally { f.close(); }
});
