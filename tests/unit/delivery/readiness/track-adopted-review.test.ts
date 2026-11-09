import { test, expect, vi } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ciFixture, oldHead, newHead } from '../../../fixtures/ci-repair';
import { trackAdoptedReview } from '../../../../server/delivery/readiness/track-adopted-review';
import { ProjectProgress } from '../../../../server/delivery/board/project-progress';

test('a legitimately advanced adopted PR enters guarded repair after its fresh blocked Lead assessment', async () => {
    const f = ciFixture(); f.job.existingPR = true;
    f.pr.head.sha = newHead; f.check.head_sha = newHead; f.check.conclusion = 'success'; f.setGitHead(newHead);
    f.delivery.queueCIRepair = async () => false;
    f.delivery.readinessPolicy = async () => ({}) as any;
    vi.spyOn(ProjectProgress.prototype, 'reviewStarted').mockResolvedValue(undefined);
    const path = resolve(f.artifactRoot, 'advanced-assessment.json'); writeFileSync(path, 'Exact new-head assessment');
    let runs = 0;
    f.engine.agents.run = async () => {
        runs++; expect(f.job.head).toBe(newHead);
        return { ...structuredClone(f.job.steps[0].result), commit: newHead, worktree: '', outcome: 'blocked',
            findings: [{ id: 'packed-checks', summary: 'Mandatory checks missing', expected: 'Passing receipts', actual: 'No receipts', status: 'open', attempts: 0 }],
            resolution: { kind: 'source-repair', findingIds: ['packed-checks'], evidenceIds: ['assessment'] },
            evidence: [{ id: 'assessment', kind: 'review', summary: 'Fresh assessment', path, commit: newHead, environment: 'fixture', url: '', observedAt: '' }] } as any;
    };
    await f.delivery.observe(); expect(f.job).toMatchObject({ stage: 'lead-pr', status: 'queued', head: oldHead });
    expect(f.job.lastPRFingerprint).toContain(newHead);
    await f.delivery.step(f.job);
    expect(runs).toBe(1);
    expect(f.job).toMatchObject({ stage: 'update-base', status: 'queued', head: newHead, repairCycle: { publishedHead: newHead } });
    expect(f.job.steps[0].result.commit).toBe(oldHead);
    expect(f.calls.filter(c => c.args[0] === 'clone')).toHaveLength(1);
    expect(f.calls.some(c => c.args[0] === 'push' || c.args.includes('POST'))).toBe(false);
});

test.each(['candidate', 'attempt', 'uncertain', 'foreign-repo', 'branch', 'paused', 'draining'])('advanced adopted head preserves %s instead of rebinding ownership', kind => {
    const f = ciFixture(); f.job.existingPR = true; f.job.status = 'working'; f.pr.head.sha = newHead;
    if (kind === 'candidate') f.job.adoptedRepairCheckout = { id: 'retained', head: oldHead, branch: f.job.branch };
    if (kind === 'attempt') f.job.mergeAttempt = { head: oldHead, at: 'prior' };
    if (kind === 'uncertain') f.job.steps[0].result.receipts.push({ id: 'prior', action: 'write', target: '', verified: false, uncertain: true, detail: 'Unknown' });
    if (kind === 'foreign-repo') f.pr.head.repo.full_name = 'foreign/repo';
    if (kind === 'branch') f.pr.head.ref = 'another-branch';
    if (kind === 'paused') f.store.state.paused = true;
    if (kind === 'draining') f.store.state.draining = true;
    expect(() => trackAdoptedReview(f.store, f.delivery.jobs, f.job, f.pr)).toThrow();
    expect(f.job.head).toBe(oldHead); expect(f.calls).toHaveLength(0);
});
