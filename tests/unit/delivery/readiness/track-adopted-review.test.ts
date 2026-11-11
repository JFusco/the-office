import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { test, expect, vi } from 'vitest';
import { writeFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ciFixture, oldHead, newHead } from '../../../fixtures/ci-repair';
import { trackAdoptedReview } from '../../../../server/delivery/readiness/track-adopted-review';
import { ProjectProgress } from '../../../../server/delivery/board/project-progress';

test.each(['none', 'clean', 'dirty', 'post-removal-failure'])('an advanced adopted PR reconciles its %s unused clone before fresh repair', async retained => {
    const f = ciFixture(); f.job.existingPR = true;
    f.delivery.queueCIRepair = async () => false;
    f.delivery.readinessPolicy = async () => ({}) as any;
    vi.spyOn(ProjectProgress.prototype, 'reviewStarted').mockResolvedValue(undefined);
    const assessment = (commit: string) => {
        const path = resolve(f.artifactRoot, `assessment-${commit}.json`); writeFileSync(path, 'Exact-head synthetic assessment');
        return { ...structuredClone(f.job.steps[0].result), commit, worktree: '', outcome: 'blocked',
            findings: [{ id: 'packed-checks', summary: 'Mandatory checks missing', expected: 'Passing receipts', actual: 'No receipts', status: 'open', attempts: 0 }],
            resolution: { kind: 'source-repair', findingIds: ['packed-checks'], evidenceIds: ['assessment'] },
            evidence: [{ id: 'assessment', kind: 'review', summary: 'Fresh assessment', path, commit, environment: 'fixture', url: '', observedAt: '' }] } as any;
    };
    let oldPath = '', oldId = '';
    if (retained !== 'none') {
        const verify = f.delivery.verifyPR.bind(f.delivery); let reads = 0;
        f.job.status = 'working';
        f.delivery.verifyPR = async (...args) => { if (++reads === 3) throw new Error('Post-checkout provider read failed'); return verify(...args); };
        await expect(claimedDelivery(f.store, f.job, () => f.delivery.queueSourceRepair(f.job, assessment(oldHead), f.artifactRoot))).rejects.toThrow('Post-checkout');
        oldPath = f.job.adoptedRepairCheckout!.worktree!; oldId = f.job.adoptedRepairCheckout!.id;
        expect(f.job.worktree).toBe(''); expect(existsSync(oldPath)).toBe(true);
        let failAfterRemoval = retained === 'post-removal-failure';
        f.delivery.verifyPR = async (...args) => {
            if (failAfterRemoval && !existsSync(oldPath)) { failAfterRemoval = false; throw new Error('Post-removal ownership read failed'); }
            return verify(...args);
        };
        f.job.status = 'watching';
        const execute = f.delivery.execute;
        f.delivery.execute = async (bin, args, options) => {
            if (bin === 'git' && options?.cwd === oldPath) {
                if (args[0] === 'rev-parse' && args[1] === 'HEAD') return oldHead;
                if (args[0] === 'status' && retained === 'dirty') return ' M package.json';
            }
            return execute(bin, args, options);
        };
    }
    f.pr.head.sha = newHead; f.check.head_sha = newHead; f.check.conclusion = 'success'; f.setGitHead(newHead);
    let runs = 0;
    f.engine.agents.run = async () => {
        runs++; expect(f.job.head).toBe(newHead);
        return assessment(newHead);
    };
    await f.delivery.observe(); expect(f.job).toMatchObject({ stage: 'lead-pr', status: 'queued', head: oldHead });
    expect(f.job.lastPRFingerprint).toContain(newHead);
    await claimedDelivery(f.store, f.job, () => f.delivery.step(f.job));
    expect(runs).toBe(1);
    if (retained === 'dirty' || retained === 'post-removal-failure') {
        expect(f.job).toMatchObject({ stage: 'lead-pr', status: 'blocked', head: newHead });
        expect(f.job.adoptedRepairCheckout?.id).toBe(oldId);
        expect(existsSync(oldPath)).toBe(retained === 'dirty');
        if (retained === 'post-removal-failure') {
            const receipts = readdirSync(f.artifactRoot).filter(name => name.startsWith('superseded-checkout-')).map(name => JSON.parse(readFileSync(resolve(f.artifactRoot, name), 'utf8')));
            expect(receipts).toContainEqual(expect.objectContaining({ prior: expect.objectContaining({ id: oldId }), removed: { worktree: true, local: false, remote: false } }));
        }
    } else {
        expect(f.job).toMatchObject({ stage: 'update-base', status: 'queued', head: newHead, repairCycle: { publishedHead: newHead } });
        if (oldPath) { expect(existsSync(oldPath)).toBe(false); expect(f.job.adoptedRepairCheckout?.id).not.toBe(oldId); }
    }
    expect(f.job.steps[0].result.commit).toBe(oldHead);
    expect(f.calls.filter(c => c.args[0] === 'clone')).toHaveLength(retained === 'clean' ? 2 : 1);
    expect(f.calls.some(c => c.args[0] === 'push' || c.args.includes('POST'))).toBe(false);
});

test.each(['cycle', 'attempt', 'uncertain', 'foreign-repo', 'branch', 'paused', 'draining'])('advanced adopted head preserves %s instead of rebinding ownership', async kind => {
    const f = ciFixture(); f.job.existingPR = true; f.job.status = 'working'; f.pr.head.sha = newHead;
    if (kind === 'cycle') f.job.repairCycle = { phase: 'repair' } as any;
    if (kind === 'attempt') f.job.mergeAttempt = { head: oldHead, at: 'prior' };
    if (kind === 'uncertain') f.job.steps[0].result.receipts.push({ id: 'prior', action: 'write', target: '', verified: false, uncertain: true, detail: 'Unknown' });
    if (kind === 'foreign-repo') f.pr.head.repo.full_name = 'foreign/repo';
    if (kind === 'branch') f.pr.head.ref = 'another-branch';
    if (kind === 'paused') f.store.state.paused = true;
    if (kind === 'draining') f.store.state.draining = true;
    const message = kind === 'paused' ? 'Office paused before a harness write' : 'Advanced adopted PR requires an unowned, settled same-repository review identity';
    await expect(claimedDelivery(f.store, f.job, async () => trackAdoptedReview(f.store, f.delivery.jobs, f.job, f.pr))).rejects.toThrow(message);
    expect(f.job.head).toBe(oldHead); expect(f.calls).toHaveLength(0);
});
test('an already handed-off candidate is never rebound to a bot update', () => {
    const f = ciFixture(); f.job.existingPR = true; f.job.worktree = '/retained/owned-candidate'; f.pr.head.sha = newHead;
    trackAdoptedReview(f.store, f.delivery.jobs, f.job, f.pr);
    expect(f.job.head).toBe(oldHead); expect(f.job.worktree).toBe('/retained/owned-candidate'); expect(f.calls).toHaveLength(0);
});
