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
            job('GH-8', 'blocked', { sourceAmendment: {} }), job('GH-9', 'blocked', { sourceAmendment: {} }), job('GH-10', 'blocked', { sourceAmendment: {} })];
        const effect = (id: string, status: string) => store.putEffect({ id: `effect-${id}`, status, operation: 'git-push', target: 'origin', work: { projectId: store.project.id, kind: 'delivery', id }, payload: {} } as any);
        effect('GH-8', 'uncertain'); effect('GH-9', 'verified'); effect('GH-10', 'rejected');
        expect(store.db.prepare('SELECT COUNT(*) AS n FROM effects WHERE work_key=?').get(workKey({ projectId: store.project.id, kind: 'delivery', id: 'GH-8' }))).toEqual({ n: 1 });
        store.recover();
        expect(store.state.coordination.jobs.map(current => current.status)).toEqual(['cancelled', 'interrupted', 'blocked', 'cancelled', 'cancelled']);
    } finally { store.close(); }
});
