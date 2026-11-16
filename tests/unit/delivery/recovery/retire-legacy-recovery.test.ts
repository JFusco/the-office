import { expect, test, vi } from 'vitest';
import { retireLegacyRecovery } from '../../../../server/delivery/recovery/retire-legacy-recovery';
import { workKey, type OfficeSnapshot, type TicketJob } from '../../../../src/shared';

const now = new Date('2026-11-15T13:00:00Z'), settled = () => false;
const job = (key: string, status: TicketJob['status'], extra: Record<string, unknown> = {}) => ({ id: key, key, status, stage: 'review', detail: 'original', steps: [], ...extra }) as unknown as TicketJob;
const state = (jobs?: TicketJob[]) => ({ coordination: jobs ? { jobs } : undefined }) as unknown as OfficeSnapshot;

test.each(['packedPublicationRepair', 'sourceAmendment'])('an unfinished job carrying %s is cancelled with a restart explanation', field => {
    const jobs = [job('GH-1', 'blocked', { [field]: { id: 'legacy' } })];
    expect(retireLegacyRecovery(state(jobs), now, settled)).toBe(1);
    expect(jobs[0]).toMatchObject({ status: 'cancelled', updatedAt: '2026-11-15T13:00:00.000Z', [field]: { id: 'legacy' } });
    expect(jobs[0].detail).toContain('one-time recovery path');
    expect(jobs[0].detail).toContain('restart it as a fresh delivery');
});

test('an unfinished job carrying the removed #156 stoppedBaseUpdate.greenMerge record is cancelled with a restart explanation', () => {
    const jobs = [job('GH-1', 'blocked', { stoppedBaseUpdate: { greenMerge: { id: 'legacy' } } })];
    expect(retireLegacyRecovery(state(jobs), now, settled)).toBe(1);
    expect(jobs[0]).toMatchObject({ status: 'cancelled', updatedAt: '2026-11-15T13:00:00.000Z', stoppedBaseUpdate: { greenMerge: { id: 'legacy' } } });
    expect(jobs[0].detail).toContain('restart it as a fresh delivery');
});

test('a queued or watching legacy job with unsettled effects is stopped as blocked, not cancelled', () => {
    const jobs = [job('GH-1', 'queued', { sourceAmendment: {} }), job('GH-2', 'watching', { packedPublicationRepair: {} }), job('GH-3', 'interrupted', { stoppedBaseUpdate: { greenMerge: {} } })];
    const before = structuredClone(jobs[2]);
    expect(retireLegacyRecovery(state(jobs), now, () => true)).toBe(0);
    for (const current of jobs.slice(0, 2)) {
        expect(current).toMatchObject({ status: 'blocked', updatedAt: '2026-11-15T13:00:00.000Z' });
        expect(current.detail).toContain('earlier writes need read-back before it can be cancelled and restarted');
    }
    expect(jobs[2]).toEqual(before);
});

test('a job with unsettled effects is left exactly as it is; only settled ones are retired', () => {
    const jobs = [job('GH-1', 'blocked', { sourceAmendment: {} }), job('GH-2', 'blocked', { sourceAmendment: {} })];
    const before = structuredClone(jobs[0]), unsettled = vi.fn((id: string) => id === 'GH-1');
    expect(retireLegacyRecovery(state(jobs), now, unsettled)).toBe(1);
    expect(jobs[0]).toEqual(before);
    expect(jobs[1].status).toBe('cancelled');
    expect(unsettled.mock.calls.map(([id]) => id)).toEqual(['GH-1', 'GH-2']);
});

test('finished jobs, ordinary jobs and stopped base updates are left alone without reading effects', () => {
    const jobs = [job('GH-2', 'completed', { sourceAmendment: {} }), job('GH-3', 'cancelled', { packedPublicationRepair: {} }), job('GH-4', 'queued'), job('GH-5', 'blocked', { stoppedBaseUpdate: {} })];
    const before = structuredClone(jobs), unsettled = vi.fn(settled);
    expect(retireLegacyRecovery(state(jobs), now, unsettled)).toBe(0);
    expect(jobs).toEqual(before);
    expect(unsettled).not.toHaveBeenCalled();
});

test('every unfinished status is retired, not only stopped ones', () => {
    const jobs = (['queued', 'working', 'blocked', 'interrupted', 'watching'] as TicketJob['status'][]).map((status, index) => job(`GH-${index}`, status, { packedPublicationRepair: {} }));
    expect(retireLegacyRecovery(state(jobs), now, settled)).toBe(jobs.length);
    expect(jobs.every(current => current.status === 'cancelled')).toBe(true);
});

test('state without coordination or jobs is left untouched', () => {
    expect(retireLegacyRecovery(state(), now, settled)).toBe(0);
    expect(retireLegacyRecovery(state([]), now, settled)).toBe(0);
});

test('service startup recovery retires a settled legacy job and keeps one whose effect still needs read-back', async () => {
    const { Store } = await import('../../../../server/store/store');
    const { coordination } = await import('../../../../server/scheduling/coordination');
    const store = new Store(':memory:');
    try {
        store.state.coordination = coordination();
        store.state.coordination.jobs = [job('GH-6', 'working', { sourceAmendment: {} }), job('GH-7', 'working'),
            job('GH-8', 'blocked', { sourceAmendment: {} }), job('GH-9', 'blocked', { sourceAmendment: {} }), job('GH-10', 'blocked', { sourceAmendment: {} }),
            job('GH-11', 'blocked', { stoppedBaseUpdate: { greenMerge: {} } }), job('GH-12', 'blocked', { stoppedBaseUpdate: { greenMerge: {} } }), job('GH-13', 'blocked', { stoppedBaseUpdate: {} })];
        const effect = (id: string, status: string) => store.putEffect({ id: `effect-${id}`, status, operation: 'git-push', target: 'origin', work: { projectId: store.project.id, kind: 'delivery', id }, payload: {} } as any);
        effect('GH-8', 'uncertain'); effect('GH-9', 'verified'); effect('GH-10', 'rejected'); effect('GH-12', 'uncertain');
        expect(store.db.prepare('SELECT COUNT(*) AS n FROM effects WHERE work_key=?').get(workKey({ projectId: store.project.id, kind: 'delivery', id: 'GH-8' }))).toEqual({ n: 1 });
        const kept = structuredClone(store.state.coordination.jobs.slice(-2));
        store.recover();
        expect(store.state.coordination.jobs.map(current => current.status)).toEqual(['cancelled', 'interrupted', 'blocked', 'cancelled', 'cancelled', 'cancelled', 'blocked', 'blocked']);
        expect(store.state.coordination.jobs[5].detail).toContain('restart it as a fresh delivery');
        expect(store.state.coordination.jobs.slice(-2)).toEqual(kept);
    } finally { store.close(); }
});

test('after startup recovery a queued legacy job with an uncertain write is blocked, its effect untouched and not runnable', async () => {
    const { Store } = await import('../../../../server/store/store');
    const { coordination } = await import('../../../../server/scheduling/coordination');
    const { scheduledWork } = await import('../../../../server/scheduling/scheduled-work');
    const store = new Store(':memory:');
    try {
        store.state.coordination = coordination();
        const admitted = (key: string, extra: Record<string, unknown> = {}) => job(key, 'queued', { requestedAt: '2026-11-15T12:00:00Z', admission: { kind: 'manual', projectId: store.project.id, jobId: key, key, reference: `isolated-original:${key}`, at: '2026-11-15T12:00:00Z' }, ...extra });
        store.state.coordination.jobs = [admitted('GH-20', { packedPublicationRepair: {} }), admitted('GH-21')];
        store.putEffect({ id: 'effect-GH-20', status: 'uncertain', operation: 'git-push', target: 'origin', work: { projectId: store.project.id, kind: 'delivery', id: 'GH-20' }, payload: {} } as any);
        const row = () => store.db.prepare('SELECT * FROM effects WHERE id=?').get('effect-GH-20');
        const effectBefore = row();
        store.recover();
        expect(store.state.coordination.jobs[0].status).toBe('blocked');
        expect(store.state.coordination.jobs[0].detail).toContain('earlier writes need read-back');
        expect(row()).toEqual(effectBefore);
        const items = scheduledWork({ store, engine: {}, conversations: {} } as any, new Map([[store.project.id, store]]) as any);
        const eligibility = (id: string) => items.find(item => item.work.kind === 'delivery' && item.work.id === id)?.eligibility.state;
        expect(eligibility('GH-21')).toBe('runnable');
        expect(eligibility('GH-20')).toBe('blocked');
    } finally { store.close(); }
});
