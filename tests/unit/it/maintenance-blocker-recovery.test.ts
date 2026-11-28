import { afterEach, expect, test } from 'vitest';
import { cleanupFakes } from '../maintenance/publication/support/fake-maintenance-github';
import { brainFixture } from '../maintenance/brain/support/brain-followup-fixture';
import { ITSpecialist } from '../../../server/it/it-specialist';
import { Coordinator } from '../../../server/scheduling/coordination';
import { executeRequest } from '../../../server/scheduling/requests';
afterEach(cleanupFakes);

/** A real IT tick over the Brain project, with the stopped nightly checkpoint the follow-up belongs to. */
function itOver(a: ReturnType<typeof brainFixture>) {
    a.store.state.coordination!.checkpoints = [{ id: 'cp', date: '2026-11-27', dueAt: '', requestedAt: '2026-11-27T22:00:00Z', startedAt: '', endedAt: '', status: 'blocked', runId: 'original', detail: 'Catalog refresh incomplete' }];
    const coordinator = new Coordinator(a.store, a.engine, a.execute as any);
    const it = new ITSpecialist({ entries: new Map([[a.store.project.id, { store: a.store, engine: a.engine, coordinator }]]) } as any, { report: async () => ({ checkedAt: '', context: '', services: [] }) } as any);
    const requests = () => (a.store.state.coordination!.requests || []).filter(request => request.action === 'reconcile-maintenance' && request.key === 'original');
    return { it, coordinator, requests };
}

test('an IT tick routes a stopped versioned follow-up with an attempted write to one deduplicated read-back request', async () => {
    const a = brainFixture(); a.followup.queue(); a.diagnose(); a.state.faults['issue-create'] = 'lost';
    await a.pump();
    expect(a.run.blockerFollowup).toMatchObject({ status: 'blocked', stop: { kind: 'uncertain-effect' } });
    const x = itOver(a);
    await x.it.tick(new Date('2026-11-28T09:00:00Z'), true);
    expect(x.requests()).toHaveLength(1);
    expect(a.store.state.it!.recoveries['maintenance-blocker:original']).toBeTruthy();
    await x.it.tick(new Date('2026-11-28T09:05:00Z'), true);
    expect(x.requests()).toHaveLength(1);
    expect(a.state.writes).toEqual(['issue-create']);
    const request = x.requests()[0];
    await a.claimed(a.run, 'reconciliation', () => executeRequest(a.store, a.engine, x.coordinator, request), 'reconcile-maintenance', request.id);
    expect(a.store.getEffect('maintenance:original:followup:issue-create')!.status).toBe('verified');
    expect(a.run.blockerFollowup!.status).toBe('queued');
    expect(a.state.writes).toEqual(['issue-create']);
});

test('an IT tick leaves a stopped follow-up with no attempted write to its outbox item, queueing nothing', async () => {
    const a = brainFixture(); a.followup.queue(); a.diagnose({ decision: 'blocked', summary: 'Needs a decision from Joe' });
    await a.pump();
    expect(a.run.blockerFollowup!.status).toBe('blocked');
    const x = itOver(a);
    await x.it.tick(new Date('2026-11-28T09:00:00Z'), true);
    expect(x.requests()).toEqual([]);
    expect(a.store.state.it!.recoveries['maintenance-blocker:original']).toBeUndefined();
    expect(a.state.writes).toEqual([]);
});
