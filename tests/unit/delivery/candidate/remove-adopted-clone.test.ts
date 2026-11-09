import { recordCandidateCleanup } from '../../../../server/delivery/candidate/cleanup-status';
import { test, expect } from 'vitest';
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { ciFixture, oldHead, newHead } from '../../../fixtures/ci-repair';
import { removeCandidate } from '../../../../server/delivery/candidate/remove-candidate';

function setup() {
    const f = ciFixture(), path = resolve(f.artifactRoot, 'ci-review-fixture', 'candidate');
    mkdirSync(path, { recursive: true }); writeFileSync(resolve(path, 'package.json'), '{}');
    const evidence = resolve(f.artifactRoot, 'review.json'); writeFileSync(evidence, 'Retained assessment');
    Object.assign(f.job, { worktree: path, adoptedRepairCheckout: { id: 'review-fixture', head: oldHead, branch: f.job.branch, worktree: path } });
    return { ...f, path, evidence };
}
test('closeout removes only the clean recorded clone, retaining evidence and the adopted remote branch', async () => {
    const f = setup();
    expect(await removeCandidate(f.store, f.delivery.execute, f.job, () => {}, oldHead)).toEqual({ worktree: true, local: false, remote: false });
    expect(existsSync(f.path)).toBe(false); expect(existsSync(f.evidence)).toBe(true);
    expect(f.calls.some(c => c.args[0] === 'push' || c.args.includes('-D') || c.args[0] === 'worktree')).toBe(false);
});
test.each(['dirty', 'changed-head', 'foreign-path'])('cleanup preserves an adopted clone with %s', async kind => {
    const f = setup(), original = f.delivery.execute;
    if (kind === 'changed-head') f.setGitHead(newHead);
    if (kind === 'foreign-path') f.job.adoptedRepairCheckout!.worktree = f.store.project.repo;
    f.delivery.execute = async (bin, args, options) => kind === 'dirty' && bin === 'git' && args[0] === 'status' ? ' M package.json' : original(bin, args, options);
    await expect(removeCandidate(f.store, f.delivery.execute, f.job, () => {}, oldHead)).rejects.toThrow();
    expect(existsSync(f.path)).toBe(true); expect(existsSync(f.evidence)).toBe(true);
});

test.each([true, false])('an absent never-handed-off clone is done, including failed hook resolution (path recorded=%s)', async recorded => {
    const f = setup(); f.job.worktree = ''; rmSync(f.path, { recursive: true });
    if (!recorded) delete f.job.adoptedRepairCheckout!.worktree;
    const outcome = await removeCandidate(f.store, f.delivery.execute, f.job, () => {}, oldHead);
    recordCandidateCleanup(f.store, f.job, outcome);
    expect(f.job.candidateCleanup!.status).toBe('done'); expect(existsSync(f.evidence)).toBe(true);
});
test('an unused original clean clone is removed after the PR advances without adopting it', async () => {
    const f = setup(); f.job.worktree = ''; f.job.head = newHead;
    expect(await removeCandidate(f.store, f.delivery.execute, f.job, () => {}, newHead)).toMatchObject({ worktree: true });
    expect(existsSync(f.path)).toBe(false); expect(existsSync(f.evidence)).toBe(true);
});
test.each(['dirty', 'changed-head'])('an unused %s clone is preserved with pending cleanup', async kind => {
    const f = setup(), original = f.delivery.execute; f.job.worktree = '';
    if (kind === 'changed-head') f.setGitHead(newHead);
    f.delivery.execute = async (bin, args, options) => kind === 'dirty' && bin === 'git' && args[0] === 'status' ? ' M package.json' : original(bin, args, options);
    const outcome = await removeCandidate(f.store, f.delivery.execute, f.job, () => {}, oldHead).catch(e => e);
    recordCandidateCleanup(f.store, f.job, outcome);
    expect(f.job.candidateCleanup!.status).toBe('pending'); expect(existsSync(f.path)).toBe(true);
});
