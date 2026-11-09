import { test, expect } from 'vitest';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
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
