import { refreshMergeReview } from '../../../../server/delivery/readiness/refresh-merge-review';
import { acceptStageResult } from '../../../../server/delivery/pipeline/accept-stage-result';
import { deliveryInputSha256 } from '../../../../server/github/github-context';
import { test, expect } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ciFixture, oldHead } from '../../../fixtures/ci-repair';
import { verifyCIHooks } from '../../../../server/delivery/repairs/ci-checkout';
import type { StageResult } from '../../../../src/shared';

function setup() {
    const f = ciFixture();
    Object.assign(f.job, { existingPR: true, status: 'working' });
    const path = resolve(f.artifactRoot, 'assessment.json'); writeFileSync(path, 'Synthetic read-only assessment');
    const result: StageResult = { ...f.job.steps[0].result, worktree: '', outcome: 'blocked', receipts: [],
        resolution: { kind: 'source-repair', findingIds: ['missing-package-checks'], evidenceIds: ['assessment'] },
        findings: [{ id: 'missing-package-checks', summary: 'Mandatory packed verification missing', expected: 'Passing receipts', actual: 'No receipt', status: 'open', attempts: 0 }],
        evidence: [{ id: 'assessment', kind: 'review', summary: 'Actual scoped assessment', path, commit: oldHead, environment: 'fixture', url: '', observedAt: '' }] };
    return { ...f, result };
}
test('adopted review findings create one guarded candidate and enter actual repair/check work on the same PR', async () => {
    const f = setup(), original = f.job.id;
    expect(await f.delivery.queueSourceRepair(f.job, f.result, f.artifactRoot)).toBe(true);
    expect(f.job).toMatchObject({ id: original, stage: 'update-base', status: 'queued', pr: 323, branch: f.pr.head.ref,
        repairReason: 'source', repairCycle: { publishedHead: oldHead, pendingFindingIds: ['missing-package-checks'] } });
    expect(f.result.worktree).toBe(''); expect(f.job.worktree.startsWith(f.artifactRoot)).toBe(true);
    expect(f.calls.filter(c => c.args[0] === 'clone')).toHaveLength(1);
    expect(f.calls.some(c => c.args[0] === 'push' || c.args.includes('POST'))).toBe(false);
    expect(f.job.adoptedRepairCheckout?.worktree).toBe(f.job.worktree);
    await verifyCIHooks(f.delivery, f.job);
    f.job.adoptedRepairCheckout!.hooksPath = '/disabled-hooks';
    await expect(verifyCIHooks(f.delivery, f.job)).rejects.toThrow('safeguards');
});
test.each(['permission', 'human-hold', 'scope'] as const)('adopted %s is never converted into a writer', async kind => {
    const f = setup(); f.result.resolution!.kind = kind;
    expect(await f.delivery.queueSourceRepair(f.job, f.result, f.artifactRoot)).toBe(false);
    expect(f.calls.some(c => c.args[0] === 'clone')).toBe(false);
});
test.each(['foreign-head', 'foreign-repo', 'uncertain', 'ownership', 'draining'])('adopted repair refuses %s before creating a candidate', async failure => {
    const f = setup();
    if (failure === 'foreign-head') f.pr.head.sha = 'd'.repeat(40);
    if (failure === 'foreign-repo') f.pr.head.repo.full_name = 'other/repo';
    if (failure === 'ownership') f.ownership.ownership.status = 'conflicting';
    if (failure === 'draining') f.store.state.draining = true;
    if (failure === 'uncertain') f.job.steps[0].result.receipts.push({ id: 'old', action: 'write', target: 'provider', detail: 'unknown', verified: false, uncertain: true });
    await expect(f.delivery.queueSourceRepair(f.job, f.result, f.artifactRoot)).rejects.toThrow();
    expect(f.calls.some(c => c.args[0] === 'clone')).toBe(false);
});

test('unknown paid runs refuses a checkout before any candidate is created', async () => {
    const f = setup(); f.result.paidRuns = null;
    expect(await f.delivery.queueSourceRepair(f.job, f.result, f.artifactRoot)).toBe(false);
    expect(f.job.worktree).toBe(''); expect(f.calls.some(c => c.args[0] === 'clone')).toBe(false);
});
test('a completed checkout survives a temporary post-clone ownership restriction and is reconciled once', async () => {
    const f = setup(), original = f.delivery.execute;
    f.delivery.execute = async (bin, args, options) => {
        const value = await original(bin, args, options);
        if (bin === 'git' && args[0] === 'checkout') f.ownership.ownership.status = 'conflicting';
        return value;
    };
    await expect(f.delivery.queueSourceRepair(f.job, f.result, f.artifactRoot)).rejects.toThrow('ownership');
    f.ownership.ownership.status = 'clear';
    expect(await f.delivery.queueSourceRepair(f.job, f.result, f.artifactRoot)).toBe(true);
    expect(f.calls.filter(c => c.args[0] === 'clone')).toHaveLength(1);
});
test('adopted conflicts enter full repair and independent review rather than the prior-acceptance shortcut', async () => {
    const f = setup(); f.pr.mergeable = false;
    f.result.resolution!.kind = 'conflict-repair';
    expect(await f.delivery.queueSourceRepair(f.job, f.result, f.artifactRoot)).toBe(true);
    expect(f.job).toMatchObject({ stage: 'update-base', repairReason: 'source', approach: { review: 'focused', validation: 'independent-checks' } });
    expect(f.result.resolution!.kind).toBe('conflict-repair');
});

test('unchanged-head check repair obtains fresh Lead acceptance after independent review and QA', async () => {
    const f = setup(); f.job.steps = [{ stage: 'lead-pr', result: structuredClone(f.result) }];
    await f.delivery.queueSourceRepair(f.job, f.result, f.artifactRoot);
    f.store.state.coordination!.merges = { enabled: true, authorizedAt: 'fixture' };
    f.delivery.preparationChecksPending = async () => false;
    async function accept(kind: 'checks' | 'review') {
        f.job.status = 'working';
        const result: StageResult = { ...structuredClone(f.result), outcome: 'passed', blocker: '', resolution: null,
            worktree: f.job.worktree, branch: f.job.branch, findings: f.result.findings.map(f => ({ ...f, status: 'verified' })),
            evidence: [{ ...f.result.evidence[0], kind }] };
        await acceptStageResult.call(f.delivery, { job: f.job, result, project: f.store.project, root: f.artifactRoot,
            issue: f.issue, role: f.job.stage === 'review' || f.job.stage === 'lead-pr' ? 'lead' : 'developer',
            continuation: undefined, reviewStart: f.job.stage === 'lead-pr' ? f.pr : undefined,
            inputSha256: deliveryInputSha256(f.store, f.job.key), beforeWorkers: new Set<string>(), issueSha256: undefined,
            candidateAtStart: JSON.stringify({ id: f.job.id, stage: f.job.stage, head: f.job.head, branch: f.job.branch, worktree: f.job.worktree }), technicalPhase: false });
    }
    await accept('checks'); expect(f.job.stage).toBe('review');
    await accept('review'); expect(f.job.stage).toBe('validate');
    await accept('checks'); expect(f.job.stage).toBe('draft');
    // Model the unchanged remote head after ordinary publication/preparation read-back.
    f.job.stage = 'prepare-pr'; await accept('checks');
    expect(f.job.stage).toBe('lead-pr'); expect(f.job.head).toBe(oldHead);
    await accept('review'); expect(f.job).toMatchObject({ stage: 'merge', status: 'queued', head: oldHead });
    expect(f.job.steps[0].result.outcome).toBe('blocked');
    expect(f.calls.some(c => c.args[0] === 'push' || c.args.includes('PUT'))).toBe(false);
});
test.each(['hooks', 'clone'])('an absent checkout after a failed %s read can allocate one fresh local candidate', async phase => {
    const f = setup(), original = f.delivery.execute; let fail = true;
    f.delivery.execute = async (bin, args, options) => {
        if (fail && bin === 'git' && (phase === 'clone' ? args[0] === 'clone' : args[0] === 'rev-parse' && args.includes('--git-path'))) {
            fail = false; throw new Error('Transient local checkout preflight');
        }
        return original(bin, args, options);
    };
    await expect(f.delivery.queueSourceRepair(f.job, f.result, f.artifactRoot)).rejects.toThrow('Transient');
    const prior = f.job.adoptedRepairCheckout!.id;
    expect(await f.delivery.queueSourceRepair(f.job, f.result, f.artifactRoot)).toBe(true);
    expect(f.job.adoptedRepairCheckout!.id).not.toBe(prior); expect(f.job.stage).toBe('update-base');
    expect(f.calls.filter(c => c.args[0] === 'clone')).toHaveLength(1);
    expect(f.calls.some(c => c.args[0] === 'push' || c.args.includes('POST'))).toBe(false);
});
test.each(['dirty', 'changed-head'])('an existing %s checkout is preserved instead of being replaced', async failure => {
    const f = setup(), original = f.delivery.verifyPR.bind(f.delivery); let reads = 0;
    f.delivery.verifyPR = async (...args) => { if (++reads === 3) throw new Error('Provider read failed'); return original(...args); };
    await expect(f.delivery.queueSourceRepair(f.job, f.result, f.artifactRoot)).rejects.toThrow('Provider read failed');
    expect(f.job.worktree).toBe('');
    const id = f.job.adoptedRepairCheckout!.id, execute = f.delivery.execute;
    if (failure === 'changed-head') f.setGitHead('d'.repeat(40));
    f.delivery.execute = async (bin, args, options) => failure === 'dirty' && bin === 'git' && args[0] === 'status' ? ' M package.json' : execute(bin, args, options);
    await expect(f.delivery.queueSourceRepair(f.job, f.result, f.artifactRoot)).rejects.toThrow('dirty');
    expect(f.job.adoptedRepairCheckout!.id).toBe(id); expect(f.calls.filter(c => c.args[0] === 'clone')).toHaveLength(1);
});
test('a conflict handoff survives a provider failure after checkout without entering the legacy conflict shortcut', async () => {
    const f = setup(), original = f.delivery.verifyPR.bind(f.delivery); let reads = 0;
    f.pr.mergeable = false; f.result.resolution!.kind = 'conflict-repair';
    f.delivery.verifyPR = async (...args) => { if (++reads === 3) throw new Error('Provider read failed'); return original(...args); };
    await expect(f.delivery.queueSourceRepair(f.job, f.result, f.artifactRoot)).rejects.toThrow();
    expect(f.job.worktree).toBe(''); expect(f.job.repairCycle).toBeUndefined();
    expect(await f.delivery.queueSourceRepair(f.job, f.result, f.artifactRoot)).toBe(true);
    expect(f.job).toMatchObject({ stage: 'update-base', repairReason: 'source', approach: { review: 'focused', validation: 'independent-checks' } });
    expect(f.calls.filter(c => c.args[0] === 'clone')).toHaveLength(1);
});

test('a proven undispatched merge intent is retained as history without preventing adopted conflict repair', async () => {
    const f = setup(), intent = `merge:${f.job.id}:${oldHead}`;
    f.job.stage = 'merge'; f.job.status = 'blocked'; f.job.mergeIntentId = intent;
    f.job.reviewContext = { head: oldHead, baseSha: 'd'.repeat(40), target: 'main', prUpdatedAt: f.pr.updated_at, issueUpdatedAt: f.issue.updated_at, step: 0 };
    f.store.putEffect({ id: intent, work: { projectId: 'brain', kind: 'delivery', id: f.job.id }, status: 'rejected', dispatchedAt: '' } as any);
    expect(await refreshMergeReview(f.delivery, f.job, f.pr)).toBe(true);
    expect(f.job.mergeIntentId).toBeUndefined(); expect(f.store.getEffect(intent)).toMatchObject({ status: 'rejected', dispatchedAt: '' });
    f.job.status = 'working'; f.pr.mergeable = false; f.result.resolution!.kind = 'conflict-repair';
    expect(await f.delivery.queueSourceRepair(f.job, f.result, f.artifactRoot)).toBe(true);
    expect(f.job.stage).toBe('update-base'); expect(f.calls.filter(c => c.args[0] === 'clone')).toHaveLength(1);
});
