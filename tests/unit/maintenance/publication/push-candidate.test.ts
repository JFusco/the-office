import { afterEach, expect, test, vi } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanupFakes, HEAD } from './support/fake-maintenance-github';
import { publicationRun } from './support/publication-run';
import { pushMaintenanceCandidate } from '../../../../server/maintenance/publication/push-candidate';
import { pushHookBaseline } from '../../../../server/maintenance/publication/hook-baseline';
import { MaintenanceStop, maintenanceStopOf } from '../../../../server/maintenance/publication/maintenance-stop';
import { runEffects } from '../../../../server/maintenance/publication/reconcile-publication';
import { recordedPush } from '../../../../server/delivery/publication/record-push';
import { currentAssignment } from '../../../../server/workers/assignment-context';
import { assertPushCredential } from '../../../../server/github/identity/push-credentials';
import { admitMarkedPush } from '../../../../server/delivery/publication/marker-publication';
afterEach(() => { cleanupFakes(); vi.mocked(recordedPush).mockClear(); vi.mocked(admitMarkedPush).mockClear(); vi.mocked(assertPushCredential).mockReset(); });
// The release-marker check has its own suite; these cases are about the push Effect itself.
vi.mock('../../../../server/delivery/publication/release-marker-check', async importOriginal => ({ ...await importOriginal<object>(), releaseMarkerApplies: () => false }));
// Spies around the real push capture and marker admission, so a held push can be shown to reach neither.
vi.mock('../../../../server/delivery/publication/record-push', async importOriginal => { const actual = await importOriginal<typeof import('../../../../server/delivery/publication/record-push')>(); return { ...actual, recordedPush: vi.fn(actual.recordedPush) }; });
vi.mock('../../../../server/delivery/publication/marker-publication', async importOriginal => { const actual = await importOriginal<typeof import('../../../../server/delivery/publication/marker-publication')>(); return { ...actual, admitMarkedPush: vi.fn(actual.admitMarkedPush) }; });
vi.mock('../../../../server/github/identity/push-credentials', async importOriginal => {
    const actual = await importOriginal<typeof import('../../../../server/github/identity/push-credentials')>();
    return { ...actual, assertPushCredential: vi.fn(actual.assertPushCredential) };
});
// Marks when a read runs inside saved-writer reconciliation, so the lookup order of an attempted push can be shown.
const reconciling = vi.hoisted(() => ({ depth: 0 }));
vi.mock('../../../../server/github/identity/write-boundary', async importOriginal => {
    const actual = await importOriginal<typeof import('../../../../server/github/identity/write-boundary')>();
    return { ...actual, reconcileGitHubWrite: vi.fn(async (...args: Parameters<typeof actual.reconcileGitHubWrite>) => { reconciling.depth++; try { return await actual.reconcileGitHubWrite(...args); } finally { reconciling.depth--; } }) };
});

const push = (f: Awaited<ReturnType<typeof publicationRun>>, branch = f.branch) => f.claimed(f.run, 'maintenance', () =>
    pushMaintenanceCandidate(f.store, f.execute as any, f.owner(), { branch, worktree: f.project.repo, head: HEAD, base: 'b'.repeat(40), hooks: f.progress.candidate!.hooks }, async () => {}));
const refusal = async (work: Promise<unknown>) => { try { await work; } catch (error) { return error; } throw new Error('not refused'); };
const pushIntent = (f: Awaited<ReturnType<typeof publicationRun>>) => ({ id: `maintenance:run-1:cms-k:push:${HEAD}`, work: { projectId: f.store.project.id, kind: 'maintenance' as const, id: 'run-1' }, attemptId: 'run-1',
    operation: 'git-push', target: `${f.repository}:${f.branch}`, authorization: 'office-harness', payload: { head: HEAD, branch: f.branch }, expectedState: { key: `push:${HEAD}` },
    createdAt: '2026-11-28T00:00:00.000Z', dispatchedAt: '', verifiedAt: '', receipt: null, error: '', elapsedMs: null });

test('the reviewed head is pushed once to its own ref through a maintenance Effect and read back; a replay pushes nothing', async () => {
    const f = await publicationRun();
    const outcome = await push(f);
    expect(f.state.writes).toEqual([`push refs/heads/${f.branch}`]);
    expect(f.store.getEffect(outcome.effectId)).toMatchObject({ status: 'verified', operation: 'git-push', work: { kind: 'maintenance', id: 'run-1' }, payload: { head: HEAD, branch: f.branch } });
    expect(outcome.effectId).toBe(`maintenance:run-1:cms-k:push:${HEAD}`);
    await push(f);
    expect(f.state.writes).toHaveLength(1);
});

test('a lost push response is read back, never resent; an unexpected tip stops; a matching ref is an observation', async () => {
    const lost = await publicationRun(); lost.state.faults.pushLost = 'lost';
    await expect(push(lost)).rejects.toThrow();
    await push(lost);
    expect(lost.state.writes).toHaveLength(1);
    const moved = await publicationRun(); moved.state.remote[moved.branch] = 'c'.repeat(40);
    await expect(push(moved)).rejects.toThrow(/not the reviewed head/);
    expect(moved.state.writes).toEqual([]);
    const already = await publicationRun(); already.state.remote[already.branch] = HEAD;
    expect(await push(already)).toEqual({ effectId: '', observed: 'already-at-head' });
    expect(already.state.writes).toEqual([]);
});

test('a changed push destination or hook path after editing is refused before any intent', async () => {
    const f = await publicationRun();
    f.state.origin = 'https://github.com/someone/else.git';
    await expect(push(f)).rejects.toThrow(/destination changed/);
    f.state.origin = `https://github.com/${f.repository}.git`; f.state.hooksPath = '.husky/_';
    await expect(push(f)).rejects.toThrow(/hook path changed/);
    expect(f.state.writes).toEqual([]);
    expect(f.store.getEffect(`maintenance:run-1:cms-k:push:${HEAD}`)?.dispatchedAt || '').toBe('');
});

test('two branches at the same head each get their own intent and capture', async () => {
    const f = await publicationRun();
    const first = await push(f, 'codex/101-a');
    const second = await f.claimed(f.run, 'maintenance', () => pushMaintenanceCandidate(f.store, f.execute as any, { ...f.owner(), subject: 'cms-other' },
        { branch: 'codex/102-b', worktree: f.project.repo, head: HEAD, base: 'b'.repeat(40), hooks: f.progress.candidate!.hooks }, async () => {}));
    expect(first.effectId).not.toBe(second.effectId);
    expect(f.state.writes).toEqual(['push refs/heads/codex/101-a', 'push refs/heads/codex/102-b']);
});

/** A fresh CMS candidate whose fetched target had a Husky `.husky/_` directory in this state at baseline and at push. */
async function cmsCandidate(husky: 'empty' | 'absent' | 'git-hooks') {
    const f = await publicationRun('run-1', 'codex/101-restore-x', 'cms-field-vocabulary');
    if (husky !== 'git-hooks') { f.state.hooksPath = '.husky/_'; if (husky === 'empty') mkdirSync(resolve(f.project.repo, '.husky', '_'), { recursive: true }); }
    f.progress.candidate!.hooks = await pushHookBaseline(f.execute as any, f.project.repo);
    return f;
}
const untouched = (f: Awaited<ReturnType<typeof publicationRun>>) => {
    expect(f.state.writes).toEqual([]);
    expect(runEffects(f.store, 'run-1')).toEqual([]);
    expect(vi.mocked(recordedPush)).not.toHaveBeenCalled();
    expect(vi.mocked(admitMarkedPush)).not.toHaveBeenCalled();
    expect(f.state.calls.filter(call => call.startsWith('git ls-remote') || call.startsWith('git push'))).toEqual([]);
};

test.each(['empty', 'absent'] as const)('a fresh CMS push with %s .husky/_ at baseline and at push is refused before marker admission, intent and dispatch', async husky => {
    const f = await cmsCandidate(husky);
    expect(f.progress.candidate!.hooks.chain).toBe((await pushHookBaseline(f.execute as any, f.project.repo)).chain);
    const stop = await refusal(push(f));
    expect(stop).toBeInstanceOf(MaintenanceStop);
    expect(maintenanceStopOf(stop, 'now')).toEqual({ kind: 'authority', at: 'now' });
    expect(String(stop)).toMatch(/CMS maintenance publication is held/);
    untouched(f);
});

test('an equal policy surface or passing check and hook-fixture receipts do not open the CMS push', async () => {
    const f = await cmsCandidate('git-hooks');
    // The destination, hook path and chain are exactly the baseline, and the run holds passing retained checks for this head.
    expect(await pushHookBaseline(f.execute as any, f.project.repo)).toEqual(f.progress.candidate!.hooks);
    const retained = resolve(f.store.dataRoot, 'runs', 'run-1', 'evidence', '2'); mkdirSync(retained, { recursive: true }); writeFileSync(resolve(retained, '0-verify.log'), 'verify:ci passed');
    f.run.publication!.evidence.push({ step: 2, stage: 'proposal', workerId: 'w', issue: f.issue.number, branch: f.branch, head: HEAD,
        checks: [{ kind: 'checks', commit: HEAD, url: '', summary: 'pnpm run verify:ci', source: '/scratch/verify.log', path: resolve(retained, '0-verify.log'), sha256: 'f'.repeat(64) }] });
    (f.run.steps[2].result as any).receipts = [{ id: 'hooks', action: 'hook-fixture', target: 'pre-push', verified: true, uncertain: false, detail: 'passed' }];
    await expect(push(f)).rejects.toBeInstanceOf(MaintenanceStop);
    untouched(f);
});

test('a prepared CMS push intent stays unsent; a verified one is honored and a dispatching one goes to its read-back', async () => {
    const prepared = await cmsCandidate('git-hooks');
    prepared.store.putEffect({ ...pushIntent(prepared), status: 'prepared' });
    const before = JSON.stringify(prepared.store.getEffect(`maintenance:run-1:cms-k:push:${HEAD}`));
    await expect(push(prepared)).rejects.toBeInstanceOf(MaintenanceStop);
    expect(JSON.stringify(prepared.store.getEffect(`maintenance:run-1:cms-k:push:${HEAD}`))).toBe(before);
    expect(prepared.state.writes).toEqual([]);
    expect(vi.mocked(recordedPush)).not.toHaveBeenCalled();
    const verified = await cmsCandidate('git-hooks');
    verified.store.putEffect({ ...pushIntent(verified), status: 'verified', dispatchedAt: 'x', verifiedAt: 'x', receipt: { head: HEAD } });
    verified.state.remote[verified.branch] = HEAD;
    expect(await push(verified)).toEqual({ effectId: `maintenance:run-1:cms-k:push:${HEAD}` });
    expect(verified.state.writes).toEqual([]);
    const attempted = await cmsCandidate('git-hooks');
    attempted.store.putEffect({ ...pushIntent(attempted), status: 'uncertain', dispatchedAt: 'x' });
    attempted.state.remote[attempted.branch] = HEAD;
    await push(attempted);
    expect(attempted.store.getEffect(`maintenance:run-1:cms-k:push:${HEAD}`)!.status).toBe('verified');
    expect(attempted.state.writes).toEqual([]);
    expect(vi.mocked(recordedPush)).not.toHaveBeenCalled();
});

test('an existing push intent is handled before fresh admission: a verified receipt is honored after hook drift, an attempted one is looked up only inside its read-back', async () => {
    // Verified: honored from its receipt with no remote lookup and no hook check, even though the hooks drifted locally.
    const verified = await cmsCandidate('git-hooks');
    verified.store.putEffect({ ...pushIntent(verified), status: 'verified', dispatchedAt: 'x', verifiedAt: 'x', receipt: { head: HEAD } });
    verified.state.hooksPath = '.husky/_';
    const before = verified.state.calls.length;
    expect(await push(verified)).toEqual({ effectId: `maintenance:run-1:cms-k:push:${HEAD}` });
    expect(verified.state.calls.slice(before).filter(call => call.startsWith('git ls-remote') || call.startsWith('git rev-parse --git-path'))).toEqual([]);
    expect(verified.state.writes).toEqual([]);
    // Attempted: every remote lookup happens inside the saved-writer reconciliation, and a matching ref settles it.
    const attempted = await cmsCandidate('git-hooks');
    attempted.store.putEffect({ ...pushIntent(attempted), status: 'dispatching', dispatchedAt: 'x' });
    attempted.state.remote[attempted.branch] = HEAD;
    const lookups: boolean[] = [];
    const execute = async (program: string, args: string[], options: any = {}) => { if (program === 'git' && args[0] === 'ls-remote') lookups.push(reconciling.depth > 0); return attempted.execute(program, args, options); };
    await attempted.claimed(attempted.run, 'maintenance', () => pushMaintenanceCandidate(attempted.store, execute as any, attempted.owner(),
        { branch: attempted.branch, worktree: attempted.project.repo, head: HEAD, base: 'b'.repeat(40), hooks: attempted.progress.candidate!.hooks }, async () => {}));
    expect(lookups.length).toBeGreaterThan(0);
    expect(lookups.every(Boolean)).toBe(true);
    expect(attempted.store.getEffect(`maintenance:run-1:cms-k:push:${HEAD}`)!.status).toBe('verified');
    expect(attempted.state.writes).toEqual([]);
    expect(vi.mocked(recordedPush)).not.toHaveBeenCalled();
    // An attempted push the remote does not show stays unsettled and is never resent.
    const unseen = await cmsCandidate('git-hooks');
    unseen.store.putEffect({ ...pushIntent(unseen), status: 'uncertain', dispatchedAt: 'x' });
    await expect(push(unseen)).rejects.toThrow(/will not be resent/);
    expect(unseen.state.writes).toEqual([]);
    // An intent for this head bound to another branch is not this push.
    const other = await cmsCandidate('git-hooks');
    other.store.putEffect({ ...pushIntent(other), status: 'verified', payload: { head: HEAD, branch: 'codex/999-other' }, dispatchedAt: 'x', verifiedAt: 'x', receipt: { head: HEAD } });
    await expect(push(other)).rejects.toThrow(/bound to another branch or target/);
});

test('a claim that expires during the final credential check stops the native push and read-back never resends it', async () => {
    const f = await publicationRun(), id = pushIntent(f).id;
    let expired = false;
    vi.mocked(assertPushCredential).mockImplementation(async store => {
        if (store.getEffect(id)?.status === 'dispatching') {
            store.finishClaim(currentAssignment()!.claim.id, 'interrupted');
            expired = true;
        }
    });
    await expect(push(f)).rejects.toThrow(/claim is no longer running/);
    expect(expired).toBe(true);
    expect(f.store.getEffect(id)?.status).toBe('uncertain');
    await expect(push(f)).rejects.toThrow(/will not be resent/);
    expect(f.state.calls.filter(call => call.startsWith('git push'))).toEqual([]);
});
