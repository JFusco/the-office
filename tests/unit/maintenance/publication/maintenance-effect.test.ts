import { afterEach, expect, test } from 'vitest';
import { cleanupFakes } from './support/fake-maintenance-github';
import { publicationRun } from './support/publication-run';
import { maintenanceEffect, maintenanceEffectBase, ownershipRefusal } from '../../../../server/maintenance/publication/maintenance-effect';
afterEach(cleanupFakes);

const effect = (sent: string[], guard: () => void | Promise<void> = () => {}) => ({ key: 'probe', operation: 'github-issue-comment', target: 'https://example.test/i/1', payload: { body: 'x' },
    guard, dispatch: async () => { sent.push('dispatch'); return { ok: true }; }, readBack: async () => ({ ok: true }) });

test('a fresh write needs the run\'s own running maintenance claim; another run, no claim or a lost claim write nothing', async () => {
    const f = await publicationRun(), sent: string[] = [];
    await expect(maintenanceEffect(f.store, f.owner(), effect(sent))).rejects.toThrow(/No running scheduler claim/);
    const other = { ...f.run, id: 'other' };
    f.store.state.maintenance!.runs.push(other);
    await expect(f.claimed(other, 'maintenance', () => maintenanceEffect(f.store, f.owner(), effect(sent)))).rejects.toThrow(/not this run/);
    await expect(f.claimed(f.run, 'maintenance', async () => {
        const claim = f.store.activeClaims().find(item => item.work.id === f.run.id)!;
        f.store.finishClaim(claim.id, 'interrupted');
        return maintenanceEffect(f.store, f.owner(), effect(sent));
    })).rejects.toThrow(/no longer running/);
    expect(sent).toEqual([]);
    await f.claimed(f.run, 'maintenance', () => maintenanceEffect(f.store, f.owner(), effect(sent)));
    expect(sent).toEqual(['dispatch']);
    expect(f.store.getEffect(maintenanceEffectBase('run-1', 'cms-k', 'probe'))).toMatchObject({ status: 'verified', work: { kind: 'maintenance', id: 'run-1' }, attemptId: 'run-1', authorization: 'office-harness' });
});

test('a hold that appears during the asynchronous preflight is refused before dispatch', async () => {
    const f = await publicationRun(), sent: string[] = [];
    f.store.state.coordination!.jobs = [];
    const guard = () => { f.store.state.coordination!.jobs!.push({ id: 'job', key: `GH-${f.issue.number}`, status: 'blocked', stage: 'implement' } as any); };
    await expect(f.claimed(f.run, 'maintenance', () => maintenanceEffect(f.store, f.owner(), effect(sent, guard)))).rejects.toThrow(/owned by delivery job/);
    expect(sent).toEqual([]);
});

test('a Brain follow-up writes only under its own repair-followup continuation claim', async () => {
    const f = await publicationRun();
    f.run.status = 'reconciled'; f.run.blockerFollowup = { status: 'working', detail: '', publicationVersion: 1 };
    const owner = { ...f.owner(), claim: 'repair-followup' as const, subject: 'followup' };
    expect(await f.claimed(f.run, 'maintenance', async () => ownershipRefusal(f.store, owner))).toMatch(/repair-followup claim/);
    expect(await f.claimed(f.run, 'continuation', async () => ownershipRefusal(f.store, owner))).toBeUndefined();
});

test('a maintenance write declares no resend exception', async () => {
    const f = await publicationRun();
    await expect(maintenanceEffect(f.store, f.owner(), { ...effect([]), notLanded: async () => true })).rejects.toThrow(/never resent/);
});
