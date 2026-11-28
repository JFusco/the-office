import { afterEach, expect, test, vi } from 'vitest';
import { assertCorrectionCheckout, bindCorrectionClaim, correctionInstruction, runMarkerCorrection } from '../../../../server/delivery/publication/marker-correction-task';
import { ReleaseMarkerRefusal } from '../../../../server/delivery/publication/release-marker-stop';
import { ReleaseMarkerCorrectionResultSchema } from '../../../../server/workers/agents';
import { withAssignment } from '../../../../server/workers/assignment-context';
import { savedState } from '../../store/saved-state-fixture';
import { cleanupFakes, fakeGitHub, HEAD } from '../support/fake-github';
import { savedReturn } from '../support/marker-records';

afterEach(() => { vi.restoreAllMocks(); cleanupFakes(); });

function returned() {
    const f = fakeGitHub(), job = f.candidate({ stage: 'implement', status: 'working' } as any);
    job.releaseMarkerReturns = { 'writer-1': savedReturn({ worktree: job.worktree, branch: job.branch, refusedHead: HEAD }) };
    const pending = job.releaseMarkerReturns['writer-1'];
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: job.id }, 'test', 'implement', 'delivery')!;
    const assigned = <T>(run: () => T) => withAssignment(claim, 'delivery', run);
    return { f, job, pending, claim, assigned };
}
const typed = (run: () => unknown) => { try { run(); } catch (error) { if (error instanceof ReleaseMarkerRefusal) return error.evidence; throw error; } throw new Error('expected a refusal'); };

test('binding attaches the pending return to the current claim, only for an implement job with a return', () => {
    const r = returned();
    r.assigned(() => bindCorrectionClaim(r.f.store, r.job));
    expect(r.pending.correction).toEqual({ claimId: r.claim.id, at: expect.any(String) });
    // A correction bound earlier but never dispatched is bound again to this claim.
    r.pending.correction = { claimId: 'old-claim', at: 'x' };
    r.assigned(() => bindCorrectionClaim(r.f.store, r.job));
    expect(r.pending.correction.claimId).toBe(r.claim.id);
    const other = returned();
    other.job.stage = 'review';
    other.assigned(() => bindCorrectionClaim(other.f.store, other.job));
    expect(other.pending.correction).toBeUndefined();
    delete other.job.releaseMarkerReturns;
    other.job.stage = 'implement';
    expect(() => other.assigned(() => bindCorrectionClaim(other.f.store, other.job))).not.toThrow();
});

test('binding without a scheduler claim, or after a dispatch, refuses: a dispatched correction is never redispatched', () => {
    const r = returned();
    expect(typed(() => bindCorrectionClaim(r.f.store, r.job))).toMatchObject({ reason: 'indeterminate', diagnostic: expect.stringContaining('needs its scheduler claim') });
    r.pending.correction = { claimId: 'old-claim', at: 'x', dispatchedAt: 'y' };
    expect(typed(() => r.assigned(() => bindCorrectionClaim(r.f.store, r.job)))).toMatchObject({ disposition: 'interrupted-correction', correction: { refusedWorkId: 'writer-1', claimId: 'old-claim' } });
});

test('the task asks only for messages for the refused SHAs and leaves every Git command to the harness', () => {
    const text = correctionInstruction(savedReturn({ worktree: '/w', branch: 'codex/5-x', refusedHead: 'c'.repeat(40) }));
    for (const part of ['read only', 'e'.repeat(40), 'docs(readme): x [skip release]', 'README.md', `commit="${'c'.repeat(40)}"`, 'the harness applies your messages', 'outcome="blocked" with messages=[]'])
        expect(text).toContain(part);
    expect(text).toMatch(/do not edit files, run Git history commands/);
});

test('the refused checkout and its unpublished state are checked before reuse; with no pending return nothing is read', async () => {
    const r = returned(), calls = r.f.state.calls.length;
    await assertCorrectionCheckout(r.f.delivery, r.job);
    expect(r.f.state.calls.slice(calls)).toEqual(expect.arrayContaining([`git ls-remote --heads origin refs/heads/${r.job.branch} refs/heads/main`, expect.stringMatching(/^gh pr list .*--state all/)]));
    r.f.state.local.dirty = true;
    await expect(assertCorrectionCheckout(r.f.delivery, r.job)).rejects.toMatchObject({ evidence: { diagnostic: expect.stringContaining('the checkout moved') } });
    r.f.state.local.dirty = false;
    r.job.worktree = '/elsewhere';
    await expect(assertCorrectionCheckout(r.f.delivery, r.job)).rejects.toMatchObject({ evidence: { diagnostic: expect.stringContaining('no longer names the returned worktree') } });
    const none = returned();
    delete none.job.releaseMarkerReturns;
    const before = none.f.state.calls.length;
    await assertCorrectionCheckout(none.f.delivery, none.job);
    expect(none.f.state.calls).toHaveLength(before);
});

test('a correction dispatches read-only at github-implement with its own schema, after saving its dispatch time', async () => {
    const r = returned(), step = { store: r.f.store, root: r.f.artifactRoot(r.job), inputSha256: '', beforeWorkers: new Set<string>(), task: (text: string) => `TASK ${text}` };
    let savedBefore: unknown;
    const run = vi.spyOn(r.f.engine.agents, 'run').mockImplementation((async () => {
        savedBefore = (savedState<any>(r.f.store).coordination.jobs.find((job: any) => job.id === r.job.id).releaseMarkerReturns['writer-1'].correction.dispatchedAt);
        throw new Error('worker stopped');
    }) as never);
    r.assigned(() => bindCorrectionClaim(r.f.store, r.job));
    await expect(r.assigned(() => runMarkerCorrection(r.f.delivery, r.job, step))).rejects.toThrow('worker stopped');
    expect(savedBefore).toBe(r.pending.correction!.dispatchedAt);
    expect(run).toHaveBeenCalledWith('developer', `TASK ${correctionInstruction(r.pending)}`, ReleaseMarkerCorrectionResultSchema,
        expect.objectContaining({ readOnly: true, stage: 'github-implement', cwd: r.job.worktree, requestId: r.job.id, artifactsRoot: step.root }));
    // Dispatched once, it is never dispatched again.
    await expect(r.assigned(() => runMarkerCorrection(r.f.delivery, r.job, step))).rejects.toMatchObject({ evidence: { disposition: 'interrupted-correction' } });
    expect(run).toHaveBeenCalledTimes(1);
});

test('no pending return runs nothing; a correction bound to another claim refuses before any read', async () => {
    const r = returned(), step = { store: r.f.store, root: r.f.artifactRoot(r.job), inputSha256: '', beforeWorkers: new Set<string>(), task: (text: string) => text };
    const run = vi.spyOn(r.f.engine.agents, 'run');
    r.pending.correction = { claimId: 'another-claim', at: 'x' };
    const calls = r.f.state.calls.length;
    await expect(r.assigned(() => runMarkerCorrection(r.f.delivery, r.job, step))).rejects.toMatchObject({ evidence: { diagnostic: expect.stringContaining('not bound to this claim') } });
    expect(r.f.state.calls).toHaveLength(calls);
    r.job.stage = 'review';
    expect(await r.assigned(() => runMarkerCorrection(r.f.delivery, r.job, step))).toBeUndefined();
    expect(run).not.toHaveBeenCalled();
});
