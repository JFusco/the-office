import { afterEach, expect, test, vi } from 'vitest';
import { cleanupFakes, HEAD } from './support/fake-maintenance-github';
import { publicationRun } from './support/publication-run';
import { publishMaintenanceDraft } from '../../../../server/maintenance/publication/publish-draft';
import { harnessOnlyStop, reconcilePublication, runEffects } from '../../../../server/maintenance/publication/reconcile-publication';
afterEach(cleanupFakes);
vi.mock('../../../../server/delivery/publication/release-marker-check', async importOriginal => ({ ...await importOriginal<object>(), releaseMarkerApplies: () => false }));

const deps = { confined: (async () => '') as any, assertCandidate: async () => {}, qualified: () => undefined, lintIsolation: () => undefined };

test.each(['pushLost', 'pr-create', 'comment'] as const)('an interrupted publication after the %s write is settled by read-back with no provider write', async fault => {
    const f = await publicationRun();
    f.state.faults[fault] = 'lost';
    await expect(f.claimed(f.run, 'maintenance', () => publishMaintenanceDraft(f.store, f.execute as any, f.owner(), f.progress, { ...f.content, head: HEAD, draftStep: 3 }, deps))).rejects.toThrow();
    const writes = [...f.state.writes];
    f.run.status = 'interrupted';
    expect(runEffects(f.store, f.run.id).some(effect => effect.status === 'uncertain')).toBe(true);
    expect(await reconcilePublication(f.store, f.run, f.execute as any)).toEqual({ settled: true, remaining: [] });
    expect(f.state.writes).toEqual(writes);
    expect(harnessOnlyStop(f.store, f.run)).toBe(true);
});

test('a read-back that does not find the write keeps the run stopped and sends nothing; an unknown operation is reported', async () => {
    const f = await publicationRun();
    f.store.putEffect({ id: 'maintenance:run-1:cms-k:push:x', work: { projectId: f.store.project.id, kind: 'maintenance', id: 'run-1' }, attemptId: 'run-1', operation: 'git-push',
        target: `${f.repository}:${f.branch}`, authorization: 'office-harness', payload: { head: HEAD, branch: f.branch }, expectedState: {}, status: 'uncertain', createdAt: '', dispatchedAt: 'x', verifiedAt: '', receipt: null, error: '', elapsedMs: null });
    f.store.putEffect({ id: 'maintenance:run-1:cms-k:odd', work: { projectId: f.store.project.id, kind: 'maintenance', id: 'run-1' }, attemptId: 'run-1', operation: 'github-merge',
        target: 'x', authorization: 'office-harness', payload: {}, expectedState: {}, status: 'uncertain', createdAt: '', dispatchedAt: 'x', verifiedAt: '', receipt: null, error: '', elapsedMs: null });
    const result = await reconcilePublication(f.store, f.run, f.execute as any);
    expect(result.settled).toBe(false);
    expect([...result.remaining].sort()).toEqual([`git-push ${f.repository}:${f.branch}`, 'github-merge x (unknown to publication read-back)']);
    expect(f.state.writes).toEqual([]);
});

test('a lost draft create settles only against its own saved bytes, base and issue, never the current run or project', async () => {
    const interrupted = async () => {
        const f = await publicationRun();
        f.state.faults['pr-create'] = 'lost';
        await expect(f.claimed(f.run, 'maintenance', () => publishMaintenanceDraft(f.store, f.execute as any, f.owner(), f.progress, { ...f.content, head: HEAD, draftStep: 3 }, deps))).rejects.toThrow();
        f.run.status = 'interrupted';
        const create = runEffects(f.store, f.run.id).find(effect => effect.operation === 'github-pr-create')!;
        expect(create.status).toBe('uncertain');
        return { f, create, writes: [...f.state.writes] };
    };
    // The project now targets another branch and the PR was retargeted to it: both agree with each other, not with the create.
    const retargeted = await interrupted();
    (retargeted.f.store.project as { target: string }).target = 'release';
    retargeted.f.state.pulls[0].base.ref = 'release';
    expect((await reconcilePublication(retargeted.f.store, retargeted.f.run, retargeted.f.execute as any)).remaining).toEqual([`github-pr-create ${retargeted.f.repository}:${retargeted.f.branch}`]);
    expect(retargeted.f.store.getEffect(retargeted.create.id)!.status).toBe('uncertain');
    // The run's saved draft bytes and the PR were both edited after the create: they match each other, not its digest.
    const edited = await interrupted();
    edited.f.progress.draft!.body = `${edited.f.content.body}\nEdited.`;
    edited.f.state.pulls[0].body = edited.f.progress.draft!.body;
    expect((await reconcilePublication(edited.f.store, edited.f.run, edited.f.execute as any)).settled).toBe(false);
    expect(edited.f.store.getEffect(edited.create.id)!.status).toBe('uncertain');
    // An exact match settles the original create with no further send.
    const exact = await interrupted();
    expect(await reconcilePublication(exact.f.store, exact.f.run, exact.f.execute as any)).toEqual({ settled: true, remaining: [] });
    expect(exact.f.store.getEffect(exact.create.id)!.status).toBe('verified');
    for (const { f, writes } of [retargeted, edited, exact]) expect(f.state.writes).toEqual(writes);
});
