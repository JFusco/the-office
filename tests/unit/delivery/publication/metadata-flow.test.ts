import { expect, test, vi } from 'vitest';
import { metadataFixture } from '../../../fixtures/pr-metadata';
import { assessPRMetadata } from '../../../../server/delivery/publication/metadata-assessment';
import { harnessPrepare } from '../../../../server/delivery/publication/prepare-stage';
import { acceptMetadataReview, requireMetadataReview } from '../../../../server/delivery/publication/metadata-review';
import { withAssignment } from '../../../../server/workers/assignment-context';
import type { StageResult } from '../../../../src/shared';
import { metadataScope } from '../../../../server/delivery/publication/metadata-provider';
import { digest } from '../../../../server/store/readback-evidence';
import { acceptStageResult } from '../../../../server/delivery/pipeline/accept-stage-result';
import { deliveryInputSha256 } from '../../../../server/github/github-context';

function leadResult(f: ReturnType<typeof metadataFixture>, changes: Partial<StageResult> = {}): StageResult {
    return { outcome: 'passed', commit: f.job.head, prId: f.job.pr, branch: f.job.branch, worktree: f.job.worktree,
        summary: 'Independently verified metadata and readiness', blocker: '', paidRuns: 0, previewUrl: '', qaRunDir: '', receipts: [],
        findings: [{ id: 'pr-metadata', status: 'verified', summary: 'Metadata verified', expected: 'Repository contract', actual: 'Exact selected metadata', attempts: 0 }],
        evidence: [{ id: 'checks', kind: 'provider', commit: f.job.head, summary: 'Current checks observed', path: '', url: f.job.prUrl, environment: 'fixture', observedAt: '' }],
        ...changes };
}

async function acceptLead(f: ReturnType<typeof metadataFixture>, result: StageResult) {
    f.job.stage = 'lead-pr'; f.job.status = 'working';
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, 'native-lead', 'lead-pr')!;
    const beforeWorkers = new Set(f.store.state.workLog?.map(w => w.id));
    const native = f.nativeAssessment(result, { stage: 'github-lead-pr', claim });
    await withAssignment(claim, 'delivery', () => acceptStageResult.call(f.delivery, { job: f.job, result, root: f.root, project: f.store.project,
        role: 'lead', issue: f.state.issue, continuation: undefined, reviewStart: f.pr, beforeWorkers, issueSha256: undefined,
        inputSha256: deliveryInputSha256(f.store, f.job.key), technicalPhase: false,
        candidateAtStart: JSON.stringify({ id: f.job.id, stage: f.job.stage, head: f.job.head, branch: f.job.branch, worktree: f.job.worktree }) }));
    f.store.finishClaim(claim.id, 'completed');
    return native;
}

test('one actual native read-only assessment is persisted and reused without another model', async () => {
    const f = metadataFixture(false), model = vi.spyOn(f.engine.agents, 'run').mockImplementation(async () => { f.nativeAssessment(); return f.verdict as any; });
    await f.run(() => assessPRMetadata(f.delivery, f.job, f.root));
    expect(f.record.phase).toBe('publish'); expect(f.record.assessment?.selected).toEqual(f.selected);
    await f.run(() => assessPRMetadata(f.delivery, f.job, f.root));
    expect(model).toHaveBeenCalledTimes(1); expect(model.mock.calls[0][3]).toMatchObject({ readOnly: true, requestId: f.job.id, stage: 'github-pr-metadata-assessment' });
    expect(f.writes.patches).toBe(0);
});

test.each([false, true])('a completed metadata review accepts fresh same-head native proof with later comments=%s', async comments => {
    const f = metadataFixture(), model = vi.spyOn(f.engine.agents, 'run');
    const preparation = await f.run(() => harnessPrepare(f.delivery, f.job, f.root, true));
    f.job.steps.push({ stage: 'prepare-pr', result: preparation! }); f.store.finishClaim(f.claim.id, 'completed');
    if (comments) f.state.comments.push({ id: 500, user: { login: 'JFusco' }, body: 'Published metadata is ready for review' });
    const first = await acceptLead(f, leadResult(f)), priorIndex = f.record.reviewedAfterStep;
    expect(f.record.review?.workerId).toBe(first.worker.id); expect(f.record.phase).toBe('done');
    if (comments) f.state.comments.push({ id: 501, user: { login: 'JFusco' }, body: 'LGTM after the metadata repair' });
    f.pr.base.sha = 'c'.repeat(40);
    const next = await acceptLead(f, leadResult(f));
    expect(f.record.review?.workerId).toBe(next.worker.id); expect(f.record.reviewedAfterStep).toBe(f.job.steps.length - 1);
    expect(f.record.reviewedAfterStep).toBeGreaterThan(priorIndex!);
    await requireMetadataReview(f.delivery, f.job);
    expect(f.record.phase).toBe('done'); expect(f.writes.patches).toBe(1); expect(model).not.toHaveBeenCalled();
});

test('a native provider wait keeps metadata proof pending while ordinary observation queues fresh readiness', async () => {
    const f = metadataFixture(), model = vi.spyOn(f.engine.agents, 'run');
    const preparation = await f.run(() => harnessPrepare(f.delivery, f.job, f.root, true));
    f.job.steps.push({ stage: 'prepare-pr', result: preparation! }); f.store.finishClaim(f.claim.id, 'completed');
    const waiting = leadResult(f, { outcome: 'blocked', summary: 'Checks are running', blocker: 'Wait for exact-head checks',
        resolution: { kind: 'provider-wait', findingIds: ['checks'], evidenceIds: ['checks'], release: null } });
    waiting.findings.push({ id: 'checks', status: 'open', summary: 'Checks running', expected: 'Passed checks', actual: 'Queued', attempts: 0 });
    let complete = false;
    const api = f.delivery.api.bind(f.delivery);
    f.delivery.api = async path => path.includes('/check-runs') ? { total_count: 1, check_runs: [{ id: 10, head_sha: f.job.head,
        status: complete ? 'completed' : 'in_progress', conclusion: complete ? 'success' : null }] } :
        path.endsWith('/status') ? { sha: f.job.head, total_count: 0, statuses: [], state: 'success' } : api(path);
    await acceptLead(f, waiting);
    expect(f.job).toMatchObject({ stage: 'lead-pr', status: 'watching' }); expect(f.job.parked).toBeUndefined();
    expect(f.record.phase).toBe('review'); expect(f.record.review).toBeUndefined(); expect(f.record.reviewedAfterStep).toBeUndefined();
    await expect(requireMetadataReview(f.delivery, f.job)).rejects.toThrow('Fresh independent');
    complete = true;
    await f.delivery.observe();
    expect(f.job).toMatchObject({ stage: 'lead-pr', status: 'queued' });
    await acceptLead(f, leadResult(f));
    expect(f.record.phase).toBe('done'); await requireMetadataReview(f.delivery, f.job);
    expect(f.writes.patches).toBe(1); expect(model).not.toHaveBeenCalled(); expect(f.job.repairCycle).toBeUndefined();
});

test.each(['source-resolution', 'older-metadata'])('an unadmitted reserved metadata finding never falls through to source or CI repair: %s', async kind => {
    const f = metadataFixture(), record = structuredClone(f.record);
    f.store.finishClaim(f.claim.id, 'completed');
    if (kind === 'source-resolution') delete f.job.prMetadataRepair;
    else { f.record.phase = 'done'; f.job.head = f.pr.head.sha = 'd'.repeat(40); }
    const cycle = structuredClone(f.job.repairCycle), model = vi.spyOn(f.engine.agents, 'run'), ci = vi.spyOn(f.delivery, 'queueCIRepair'), source = vi.spyOn(f.delivery, 'queueSourceRepair');
    const result = leadResult(f, { outcome: 'blocked', resolution: kind === 'older-metadata' ? null : { kind: 'source-repair', findingIds: ['pr-metadata'], evidenceIds: ['checks'], release: null } });
    result.findings[0].status = 'open';
    await expect(acceptLead(f, result)).rejects.toThrow('Unadmitted reserved PR metadata');
    expect(f.job.steps.at(-1)?.result).toEqual(result); expect(f.job.repairCycle).toEqual(cycle); expect(f.job.ciRepairs).toBeUndefined();
    expect(source).not.toHaveBeenCalled(); expect(ci).not.toHaveBeenCalled(); expect(model).not.toHaveBeenCalled(); expect(f.writes.patches).toBe(0);
    if (kind === 'source-resolution') expect(f.job.prMetadataRepair).toBeUndefined();
    else expect(f.record).toEqual({ ...record, phase: 'done' });
});

test('a completed original assessment is read back after a lost harness return without dispatching another model', async () => {
    const f = metadataFixture(false), model = vi.spyOn(f.engine.agents, 'run');
    f.record.assessmentStartedAt = f.store.clock.now().toISOString(); f.record.assessmentClaimId = f.claim.id;
    f.record.scopeSha256 = digest(await f.run(() => metadataScope(f.delivery, f.job)));
    const original = f.nativeAssessment();
    await f.run(() => assessPRMetadata(f.delivery, f.job, f.root));
    expect(f.record.assessment?.workerId).toBe(original.worker.id); expect(f.record.phase).toBe('publish');
    expect(model).not.toHaveBeenCalled(); expect(f.writes.patches).toBe(0);
});

test('already-ready preparation consumes actual saved metadata instead of returning before the PATCH', async () => {
    const f = metadataFixture(), model = vi.spyOn(f.engine.agents, 'run');
    const result = await f.run(() => harnessPrepare(f.delivery, f.job, f.root, true));
    expect(result?.outcome).toBe('passed'); expect(f.writes.patches).toBe(1); expect(f.pr.body).toBe(f.selected.body);
    expect(f.record.phase).toBe('review'); expect(model).not.toHaveBeenCalled();
    await expect(f.run(() => requireMetadataReview(f.delivery, f.job))).rejects.toThrow('Fresh independent');
});

test('publication alone cannot merge; a new native Lead must explicitly verify the original metadata finding', async () => {
    const f = metadataFixture();
    await f.run(() => harnessPrepare(f.delivery, f.job, f.root, true));
    f.store.finishClaim(f.claim.id, 'completed'); f.job.stage = 'lead-pr';
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, 'fresh-review', 'lead-pr')!;
    const result: StageResult = { outcome: 'passed', commit: f.job.head, prId: f.job.pr, branch: f.job.branch, worktree: f.job.worktree,
        summary: 'Native fixture independently verified the corrected metadata and readiness', evidence: [], findings: [], receipts: [], paidRuns: 0,
        blocker: '', approach: null, prerequisites: null, previewUrl: '', qaRunDir: '' };
    const before = new Set(f.store.state.workLog!.map(w => w.id));
    f.job.steps.push({ stage: 'lead-pr', result });
    await expect(withAssignment(claim, 'delivery', () => acceptMetadataReview(f.delivery, f.job, result, before))).rejects.toThrow('explicitly verify');
    result.findings = [{ id: 'pr-metadata', status: 'verified', summary: 'Canonical body verified', expected: 'Repository contract', actual: 'Exact selected content read back', attempts: 0 }];
    f.nativeAssessment(result, { stage: 'github-lead-pr', claim });
    await withAssignment(claim, 'delivery', () => acceptMetadataReview(f.delivery, f.job, result, before));
    expect(f.record.phase).toBe('done');
    await withAssignment(claim, 'delivery', () => requireMetadataReview(f.delivery, f.job));
    f.pr.body += '\nNew human edit';
    await expect(withAssignment(claim, 'delivery', () => requireMetadataReview(f.delivery, f.job))).rejects.toThrow('Reviewed metadata changed');
});
