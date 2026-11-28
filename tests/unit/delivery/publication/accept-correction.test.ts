import { afterEach, expect, test, vi } from 'vitest';
import { APPROACH_GUARD_REJECTION } from '../../../../server/delivery/pipeline/approach';
import { acceptCorrection } from '../../../../server/delivery/publication/accept-correction';
import { ReleaseMarkerRefusal } from '../../../../server/delivery/publication/release-marker-stop';
import { deliveryInputSha256 } from '../../../../server/github/github-context';
import { digest } from '../../../../server/store/readback-evidence';
import { withAssignment } from '../../../../server/workers/assignment-context';
import { cleanupFakes, fakeGitHub } from '../support/fake-github';
import { passingResult, savedReturn } from '../support/marker-records';

afterEach(cleanupFakes);
const APPROACH = { plan: 'none', review: 'focused', validation: 'developer-checks', checks: ['pnpm run verify:ci'], reason: 'Retained from the refused implementation' } as const;

function accepting() {
    const f = fakeGitHub(), job = f.candidate({ stage: 'implement', status: 'working', head: '', approach: undefined } as any);
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: job.id }, 'test', 'implement', 'delivery')!;
    job.releaseMarkerReturns = { 'writer-1': savedReturn({ worktree: job.worktree, branch: job.branch, correction: { claimId: claim.id, at: 'x', dispatchedAt: 'y', workId: 'fix-1' } }) };
    const pending = job.releaseMarkerReturns['writer-1'];
    const acceptance = { refusedWorkId: 'writer-1', correctionWorkId: 'fix-1', pendingSha256: digest(pending), inputSha256: deliveryInputSha256(f.store, job.key), claimId: claim.id };
    const result = passingResult('f'.repeat(40), { worktree: job.worktree, branch: job.branch, approach: APPROACH as any });
    const next = vi.fn(() => 'review' as const), learn = vi.fn();
    const accept = (over: Partial<typeof acceptance> = {}, assigned = claim) => withAssignment(assigned, 'delivery', () => acceptCorrection(f.store, job, result, 'developer', { ...acceptance, ...over }, next, learn));
    return { f, job, claim, pending, result, next, learn, accept };
}

test('one transaction resolves the return, applies the retained approach, records the step, adopts the head and selects the next stage', () => {
    const a = accepting();
    a.accept();
    expect(a.pending.status).toBe('resolved');
    expect(a.job.approach).toMatchObject({ review: 'focused', validation: 'developer-checks' });
    expect(a.job.steps.at(-1)).toEqual({ stage: 'implement', workerId: 'fix-1', result: a.result });
    expect(a.job).toMatchObject({ head: 'f'.repeat(40), worktree: a.result.worktree, branch: a.result.branch, stage: 'review', status: 'queued' });
    expect(a.next).toHaveBeenCalledTimes(1);
    expect(a.learn).toHaveBeenCalledTimes(1);
});

// Review repair pass (run cab5a4a5): the retained approach is guarded by the ordinary job-wide worker predicate.
test('an unresolved failed review worker blocks a reduced retained approach; a later completed review permits it', () => {
    const a = accepting(), work = (id: string, stage: string, status: string, startedAt: string) =>
        (a.f.store.state.workLog ??= []).push({ id, requestId: a.job.id, ticket: a.job.key, role: stage === 'github-review' ? 'lead' : 'developer', stage, status, startedAt } as any);
    work('writer-1', 'github-implement', 'completed', '2026-11-20T10:00:00.000Z');
    work('review-1', 'github-review', 'failed', '2026-11-20T10:05:00.000Z');
    work('fix-1', 'github-implement', 'completed', '2026-11-20T10:10:00.000Z');
    expect(() => a.accept()).toThrow(APPROACH_GUARD_REJECTION);
    expect(a.job.releaseMarkerReturns!['writer-1'].status).toBe('pending');
    expect(a.job).toMatchObject({ head: '', stage: 'implement', status: 'working' });
    expect(a.job.approach).toBeUndefined();
    expect(a.job.steps).toEqual([]);
    expect(a.learn).not.toHaveBeenCalled();
    work('review-2', 'github-review', 'completed', '2026-11-20T10:15:00.000Z');
    a.accept();
    expect(a.job.releaseMarkerReturns!['writer-1'].status).toBe('resolved');
    expect(a.job).toMatchObject({ head: 'f'.repeat(40), stage: 'review', approach: { review: 'focused', validation: 'developer-checks' } });
});

test.each([
    ['the pending record changed', (a: ReturnType<typeof accepting>) => { a.pending.refusedHead = 'a'.repeat(40); return {}; }],
    ['another correction work', () => ({ correctionWorkId: 'fix-2' })],
    ['changed human inputs', () => ({ inputSha256: 'x' })],
    ['another claim', () => ({ claimId: 'claim-x' })],
    ['a resolved return', (a: ReturnType<typeof accepting>) => { a.pending.status = 'resolved'; return { pendingSha256: digest(a.pending) }; }],
])('%s refuses acceptance and leaves the job exactly as it was', (_name, change) => {
    const a = accepting(), over = change(a), before = JSON.stringify(a.job);
    expect(() => a.accept(over)).toThrow(ReleaseMarkerRefusal);
    expect(JSON.stringify(a.job)).toBe(before);
    expect(a.learn).not.toHaveBeenCalled();
});
