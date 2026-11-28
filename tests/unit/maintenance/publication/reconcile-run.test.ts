import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeMaintenanceGitHub, HEAD } from './support/fake-maintenance-github';
import { reconcileVersionedRun } from '../../../../server/maintenance/publication/reconcile-run';
import type { MaintenanceRun } from '../../../../src/shared';
afterEach(cleanupFakes);

const run = (extra: Partial<MaintenanceRun> = {}) => ({ id: 'r', requestedAt: '', startedAt: '', endedAt: '', status: 'blocked', weekly: true, stage: 'proposal', error: 'Stopped', steps: [], ...extra }) as MaintenanceRun;
/** Runs the read-back under the scheduled recovery claim of this run, as the scheduler does. */
const recovery = <T>(f: ReturnType<typeof fakeMaintenanceGitHub>, target: MaintenanceRun, work: () => Promise<T>) => f.claimed(target, 'reconciliation', work, 'maintenance-readback', `recovery:${target.id}`);
const pushIntent = (f: ReturnType<typeof fakeMaintenanceGitHub>, runId: string) => ({ id: `maintenance:${runId}:k:push:x`, work: { projectId: f.store.project.id, kind: 'maintenance' as const, id: runId }, attemptId: runId, operation: 'git-push', target: `${f.repository}:b`,
    authorization: 'office-harness', payload: { head: HEAD, branch: 'b' }, expectedState: {}, status: 'uncertain' as const, createdAt: '', dispatchedAt: 'x', verifiedAt: '', receipt: null, error: '', elapsedMs: null });

test('a historical run goes on to the native read-back; a versioned harness-only stop settles with its unfinished work in the ledger', async () => {
    const f = fakeMaintenanceGitHub();
    const historical = run(); f.store.state.maintenance = { runs: [historical], lastDaily: '', lastWeekly: '', ledger: 'Ledger.' };
    expect(await reconcileVersionedRun(f.store, historical, f.execute as any)).toBeUndefined();
    const versioned = run({ id: 'v', stop: { kind: 'authority', at: '' } }); f.store.state.maintenance.runs.push(versioned);
    expect(await recovery(f, versioned, () => reconcileVersionedRun(f.store, versioned, f.execute as any))).toBe(versioned);
    expect(versioned).toMatchObject({ status: 'reconciled', error: '' });
    expect(versioned.steps.at(-1)).toMatchObject({ stage: 'maintenance-readback', result: { outcome: 'passed', receipts: [] } });
    expect(f.store.state.maintenance.ledger).toBe('Ledger.\nUNFINISHED MAINTENANCE v (stopped at proposal, publication writes settled by read-back): Stopped');
});

test('an unsettled publication write that does not read back keeps the run stopped; a worker in doubt keeps the native read-back', async () => {
    const f = fakeMaintenanceGitHub(), stopped = run({ stop: { kind: 'uncertain-effect', at: '' } });
    f.store.state.maintenance = { runs: [stopped], lastDaily: '', lastWeekly: '', ledger: '' };
    f.store.putEffect(pushIntent(f, 'r'));
    expect(await recovery(f, stopped, () => reconcileVersionedRun(f.store, stopped, f.execute as any))).toBe(stopped);
    expect(stopped).toMatchObject({ status: 'blocked', error: expect.stringMatching(/Publication read-back is incomplete: git-push/) });
    const inDoubt = run({ id: 'w', steps: [{ role: 'pm', stage: 'vendor-review', at: '', publicationVersion: 1, result: {} as any }] });
    f.store.state.maintenance.runs.push(inDoubt);
    f.store.state.workLog = [{ id: 'worker', requestId: 'w', stage: 'proposal', processId: 7, status: 'interrupted' } as any];
    expect(await recovery(f, inDoubt, () => reconcileVersionedRun(f.store, inDoubt, f.execute as any))).toBeUndefined();
});

test('without its own running claim the versioned read-back leaves the run, its Effects and the ledger untouched; the bound claim settles with no write', async () => {
    const f = fakeMaintenanceGitHub(), stopped = run({ stop: { kind: 'uncertain-effect', at: '' } }), other = run({ id: 'other' });
    f.store.state.maintenance = { runs: [stopped, other], lastDaily: '', lastWeekly: '', ledger: 'Ledger.' };
    f.store.putEffect(pushIntent(f, 'r'));
    f.state.remote.b = HEAD;
    const snapshot = () => JSON.stringify({ run: stopped, effect: f.store.getEffect('maintenance:r:k:push:x'), ledger: f.store.state.maintenance!.ledger });
    const before = snapshot();
    // Absent: no scheduler claim at all.
    await expect(reconcileVersionedRun(f.store, stopped, f.execute as any)).rejects.toThrow(/No running scheduler claim/);
    // Another run's recovery, or a request for another run.
    await expect(f.claimed(other, 'reconciliation', () => reconcileVersionedRun(f.store, stopped, f.execute as any), 'maintenance-readback', 'recovery:other')).rejects.toThrow(/not bound to the read-back of maintenance run r/);
    f.store.state.coordination!.requests = [{ id: 'req-other', action: 'reconcile-maintenance', key: 'other', head: '', lane: 'delivery', requestedAt: '', status: 'working', detail: '' } as any];
    await expect(f.claimed(other, 'reconciliation', () => reconcileVersionedRun(f.store, stopped, f.execute as any), 'reconcile-maintenance', 'req-other')).rejects.toThrow(/not bound/);
    // Expired: the claim finished before the read-back ran.
    await expect(f.claimed(stopped, 'reconciliation', async () => {
        const { currentAssignment } = await import('../../../../server/workers/assignment-context');
        f.store.finishClaim(currentAssignment()!.claim.id, 'interrupted');
        return reconcileVersionedRun(f.store, stopped, f.execute as any);
    }, 'maintenance-readback', 'recovery:r')).rejects.toThrow(/no longer running/);
    expect(snapshot()).toBe(before);
    // The request bound to this run settles the matching attempt and sends nothing.
    f.store.state.coordination!.requests!.push({ id: 'req-r', action: 'reconcile-maintenance', key: 'r', head: '', lane: 'delivery', requestedAt: '', status: 'working', detail: '' } as any);
    expect(await f.claimed(stopped, 'reconciliation', () => reconcileVersionedRun(f.store, stopped, f.execute as any), 'reconcile-maintenance', 'req-r')).toBe(stopped);
    expect(f.store.getEffect('maintenance:r:k:push:x')!.status).toBe('verified');
    expect(stopped.status).toBe('reconciled');
    expect(f.state.writes).toEqual([]);
});

test('the harness may settle a refusal after a saved worker step and a saved issue decision', async () => {
    const f = fakeMaintenanceGitHub();
    const stopped = run({ startedAt: '2026-11-28T20:00:00.000Z', stop: { kind: 'authority', at: '' },
        steps: [{ role: 'pm', stage: 'vendor-review', at: '2026-11-28T20:01:00.000Z', publicationVersion: 1, result: {} as any }],
        publication: { version: 1, candidates: [{ index: 0, key: 'key', issueDecision: { workerId: 'decision' } as any }], evidence: [] } });
    f.store.state.maintenance = { runs: [stopped], lastDaily: '', lastWeekly: '', ledger: '' };
    const worker = { requestId: 'r', processId: 7, status: 'completed', executionStatus: 'completed' };
    f.store.state.workLog = [
        { ...worker, id: 'review', stage: 'vendor-review', role: 'pm', startedAt: '2026-11-28T20:00:01.000Z', endedAt: '2026-11-28T20:00:59.000Z' },
        { ...worker, id: 'decision', stage: 'proposal-issue', role: 'developer' },
        { ...worker, id: 'refused', stage: 'proposal', role: 'developer', processId: undefined, executionStatus: undefined, status: 'failed' },
    ] as any;
    expect(await recovery(f, stopped, () => reconcileVersionedRun(f.store, stopped, f.execute as any))).toBe(stopped);
    expect(stopped.status).toBe('reconciled');
    expect(f.state.writes).toEqual([]);
});
