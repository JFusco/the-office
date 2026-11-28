import { execFileSync } from 'node:child_process';
import { renameSync } from 'node:fs';
import { afterEach, expect, test, vi } from 'vitest';
import { observeInterruptedCorrections } from '../../../../server/delivery/publication/marker-interruption';
import { restartStoppedWriters } from '../../../../server/delivery/attempts/restart-stopped-writers';
import { stoppedWriter } from '../../../../server/delivery/attempts/restart-writer';
import { GitHubDelivery } from '../../../../server/delivery/pipeline/github-delivery';
import { cleanupFakes } from '../support/fake-github';
import { markerDelivery } from '../support/marker-delivery';
import { cleanupMarkerRepos } from '../support/marker-repo';

afterEach(() => { vi.restoreAllMocks(); cleanupFakes(); cleanupMarkerRepos(); });

/** A returned job whose correction was dispatched under `claim` and saved working, as a service exit leaves it. */
async function dispatched(side: 'before-move' | 'after-move' | 'no-mapping') {
    const d = markerDelivery({ onDisk: true });
    d.turns.push({ kind: 'implement', commits: [{ files: { 'README.md': 'readme 2\n' }, message: 'docs(readme): reword [skip release]' }] });
    await d.step();
    const pending = d.pending()!, refused = pending.refusedHead;
    // A mapped tip with the same tree and the marker removed, as a verified rewrite would produce.
    const tree = d.git(['rev-parse', `${refused}^{tree}`]).trim();
    const mapped = execFileSync('git', ['commit-tree', tree, '-p', d.base, '-m', 'docs(readme): reword'], { cwd: d.worktree, encoding: 'utf8',
        env: { ...process.env, GIT_AUTHOR_NAME: 'Office Test', GIT_AUTHOR_EMAIL: 'test@example.com', GIT_COMMITTER_NAME: 'Office Test', GIT_COMMITTER_EMAIL: 'test@example.com' } }).trim();
    d.job.status = 'working';
    pending.correction = { claimId: 'claim-before-exit', at: '2026-11-20T12:00:00.000Z', dispatchedAt: '2026-11-20T12:00:01.000Z',
        ...(side === 'no-mapping' ? {} : { mapping: { path: '/x/mapping.json', sha256: 'f'.repeat(64), refusedHead: refused, newHead: mapped } }) };
    if (side === 'after-move') d.git(['update-ref', `refs/heads/${d.job.branch}`, mapped, refused]);
    // The correction's own developer run, cut off by the exit: a dead writer run that ordinary restart rules would reset.
    const stoppedAt = new Date(Date.now() - 10 * 60_000).toISOString();
    d.store.state.workLog!.push({ id: 'correction-run', sessionId: 'correction-run', requestId: d.job.id, ticket: d.job.key, role: 'developer', provider: 'claude', stage: 'github-implement',
        status: 'interrupted', claimId: 'claim-before-exit', processId: 2147483646, startedAt: stoppedAt, endedAt: stoppedAt, lane: 'delivery' } as any);
    d.store.save();
    const priorHead = d.job.head, returns = Object.keys(d.job.releaseMarkerReturns!);
    // The service restarts: the store is opened again and recovered before anything dispatches.
    const { store, engine } = d.reopen();
    store.recover();
    const job = store.state.coordination!.jobs!.find(item => item.id === d.job.id)!;
    return { d, store, engine, job, refused, mapped, priorHead, returns };
}

test.each([['before-move', 'refused-tip'], ['after-move', 'mapped-tip']] as const)('a correction a service exit interrupted %s blocks, and the startup read says which tip is checked out', async (side, state) => {
    const { d, store, engine, job, refused, mapped, priorHead, returns } = await dispatched(side);
    expect(job).toMatchObject({ status: 'blocked', head: priorHead, stop: { kind: 'release-marker', releaseMarker: { disposition: 'interrupted-correction', reason: 'marked-package-change', paths: ['README.md'],
        correction: { claimId: 'claim-before-exit', refusedHead: refused, mappedHead: mapped, checkout: { state: 'outstanding' } } } } });
    const git: string[][] = [];
    await observeInterruptedCorrections(store, (async (program: string, args: string[], options: any) => { git.push(args); return d.execute(program, args, options); }) as any);
    expect(job.stop?.releaseMarker?.correction?.checkout).toMatchObject({ state, head: side === 'after-move' ? mapped : refused, branch: job.branch, clean: true });
    // Read only: no rewrite, reset, salvage, redispatch or push.
    expect(git.every(args => ['rev-parse', 'branch', 'status'].includes(args[0]))).toBe(true);
    expect(Object.keys(job.releaseMarkerReturns!)).toEqual(returns);
    expect(job.releaseMarkerReturns![returns[0]].status).toBe('pending');
    const delivery = new GitHubDelivery(store, engine, d.execute as any), run = vi.spyOn(engine.agents, 'run');
    expect(stoppedWriter(store, job)).toBeNull();
    await restartStoppedWriters(delivery);
    expect(run).not.toHaveBeenCalled();
    expect(d.git(['rev-parse', 'HEAD']).trim()).toBe(side === 'after-move' ? mapped : refused);
    expect(d.state.calls.filter(call => call.startsWith('git push'))).toHaveLength(0);
    // A second startup read changes nothing once the observation is attached.
    const attached = structuredClone(job.stop);
    await observeInterruptedCorrections(store, d.execute as any);
    expect(job.stop).toEqual(attached);
});

test('a missing checkout is reported unreadable; nothing is recreated', async () => {
    const { d, store, job } = await dispatched('no-mapping');
    renameSync(d.worktree, `${d.worktree}-moved`);
    await observeInterruptedCorrections(store, d.execute as any);
    expect(job.stop?.releaseMarker?.correction?.checkout).toMatchObject({ state: 'unreadable', diagnostic: expect.stringContaining('missing') });
});

test('a queued return whose correction has not started still receives its first dispatch after a restart', async () => {
    const d = markerDelivery({ onDisk: true });
    d.turns.push({ kind: 'implement', commits: [{ files: { 'README.md': 'readme 2\n' }, message: 'docs(readme): reword [skip release]' }] });
    await d.step();
    d.store.save();
    const { store, engine } = d.reopen();
    store.recover();
    const job = store.state.coordination!.jobs!.find(item => item.id === d.job.id)!;
    expect(job).toMatchObject({ status: 'queued', stage: 'implement' });
    expect(Object.values(job.releaseMarkerReturns!)[0].correction).toBeUndefined();
    const run = vi.spyOn(engine.agents, 'run').mockRejectedValue(new Error('dispatched'));
    const delivery = new GitHubDelivery(store, engine, d.execute as any);
    const { claimedDelivery } = await import('../../../fixtures/delivery-claim');
    await claimedDelivery(store, job, () => delivery.step(job));
    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0][3]).toMatchObject({ readOnly: true, stage: 'github-implement' });
    expect(job.stop?.releaseMarker?.disposition).toBe('interrupted-correction');
});

// Direct cases for the interruption helpers themselves.
test('only a dispatched correction on its own claim is an interruption; an undispatched one is unbound so it can still be dispatched', async () => {
    const { interruptedCorrection, interruptCorrectionAtStartup, persistMarkerStop } = await import('../../../../server/delivery/publication/marker-interruption');
    const { indeterminate, ReleaseMarkerRefusal } = await import('../../../../server/delivery/publication/release-marker-stop');
    const { withAssignment } = await import('../../../../server/workers/assignment-context');
    const { fakeGitHub } = await import('../support/fake-github');
    const { savedReturn } = await import('../support/marker-records');
    const evidence = interruptedCorrection(savedReturn({ correction: { claimId: 'c', at: 'x', workId: 'fix-1' } }), { state: 'outstanding' }, new Error('Worker paused')).evidence;
    expect(evidence).toEqual({ reason: 'marked-package-change', disposition: 'interrupted-correction', commit: 'e'.repeat(40), paths: ['README.md'], inventoryPaths: [],
        commits: [{ sha: 'e'.repeat(40), paths: ['README.md'], inventoryPaths: [] }], diagnostic: 'Worker paused',
        correction: { refusedWorkId: 'writer-1', refusedHead: 'c'.repeat(40), claimId: 'c', workId: 'fix-1', checkout: { state: 'outstanding' } } });
    const f = fakeGitHub(), job = f.candidate({ stage: 'implement', status: 'working' } as any), now = new Date('2026-11-20T12:00:00Z');
    job.releaseMarkerReturns = { 'writer-1': savedReturn({ worktree: job.worktree, branch: job.branch, refusedHead: f.state.local.head, correction: { claimId: 'gone', at: 'x' } }) };
    // Startup: bound but never dispatched is unbound, and the generic interruption applies.
    expect(interruptCorrectionAtStartup(job, now)).toBe(false);
    expect(job.releaseMarkerReturns['writer-1'].correction).toBeUndefined();
    job.releaseMarkerReturns['writer-1'].correction = { claimId: 'gone', at: 'x', dispatchedAt: 'y' };
    job.status = 'queued';
    expect(interruptCorrectionAtStartup(job, now)).toBe(false);
    job.status = 'working';
    expect(interruptCorrectionAtStartup(job, now)).toBe(true);
    expect(job).toMatchObject({ status: 'blocked', stop: { kind: 'release-marker', at: now.toISOString(), releaseMarker: { disposition: 'interrupted-correction', correction: { checkout: { state: 'outstanding' } } } } });
    // The step: a typed refusal blocks with its own evidence; another claim's correction is left alone.
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: job.id }, 'step', 'implement', 'delivery')!;
    job.status = 'working'; delete job.stop;
    job.releaseMarkerReturns['writer-1'].correction = { claimId: 'another', at: 'x', dispatchedAt: 'y' };
    await withAssignment(claim, 'delivery', () => persistMarkerStop(f.delivery, job, new Error('worker stopped')));
    expect(job.status).toBe('working');
    await withAssignment(claim, 'delivery', () => persistMarkerStop(f.delivery, job, indeterminate('tool unavailable: x')));
    expect(job).toMatchObject({ status: 'blocked', stop: { releaseMarker: { reason: 'indeterminate', diagnostic: 'tool unavailable: x' } } });
    job.status = 'working'; delete job.stop;
    job.releaseMarkerReturns['writer-1'].correction = { claimId: claim.id, at: 'x' };
    await withAssignment(claim, 'delivery', () => persistMarkerStop(f.delivery, job, new Error('issue read failed')));
    expect(job.releaseMarkerReturns['writer-1'].correction).toBeUndefined();
    expect(job.stop).toBeUndefined();
    job.releaseMarkerReturns['writer-1'].correction = { claimId: claim.id, at: 'x', dispatchedAt: 'y' };
    await withAssignment(claim, 'delivery', () => persistMarkerStop(f.delivery, job, new Error('Worker paused')));
    expect((job as { stop?: { releaseMarker?: unknown } }).stop?.releaseMarker).toMatchObject({ disposition: 'interrupted-correction', diagnostic: 'Worker paused', correction: { claimId: claim.id, checkout: { state: 'refused-tip', head: f.state.local.head, clean: true } } });
    expect(ReleaseMarkerRefusal).toBeTypeOf('function');
});
