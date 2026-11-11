import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { expect, test, vi } from 'vitest';
import { addMetadataHumanInput, metadataFixture } from '../../../fixtures/pr-metadata';
import { assessPRMetadata } from '../../../../server/delivery/publication/metadata-assessment';
import { harnessPrepare } from '../../../../server/delivery/publication/prepare-stage';
import { acceptMetadataReview, requireMetadataReview } from '../../../../server/delivery/publication/metadata-review';
import { withAssignment } from '../../../../server/workers/assignment-context';
import type { StageResult } from '../../../../src/shared';
import { metadataScope } from '../../../../server/delivery/publication/metadata-provider';
import { digest } from '../../../../server/store/readback-evidence';
import { acceptStageResult } from '../../../../server/delivery/pipeline/accept-stage-result';
import { deliveryInputSha256 } from '../../../../server/github/github-context';
import { publishMetadata } from '../../../../server/delivery/publication/publish-metadata';
import { metadataAppliesToHead } from '../../../../server/delivery/publication/metadata-context';
import { plan } from '../../../fixtures/ci-repair';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
    await claimedDelivery(f.store,f.job,()=>requireMetadataReview(f.delivery, f.job));
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
    await expect(claimedDelivery(f.store,f.job,()=>requireMetadataReview(f.delivery, f.job))).rejects.toThrow('Fresh independent');
    complete = true;
    await f.delivery.observe();
    expect(f.job).toMatchObject({ stage: 'lead-pr', status: 'queued' });
    await acceptLead(f, leadResult(f));
    expect(f.record.phase).toBe('done'); await claimedDelivery(f.store,f.job,()=>requireMetadataReview(f.delivery, f.job));
    expect(f.writes.patches).toBe(1); expect(model).not.toHaveBeenCalled(); expect(f.job.repairCycle).toBeUndefined();
});

test.each(['source-resolution', 'older-metadata'])('an unadmitted reserved metadata finding never falls through to source or CI repair: %s', async kind => {
    const f = metadataFixture();
    if (kind === 'older-metadata') await f.run(() => harnessPrepare(f.delivery, f.job, f.root, true));
    const record = structuredClone(f.record);
    f.store.finishClaim(f.claim.id, 'completed');
    if (kind === 'source-resolution') delete f.job.prMetadataRepair;
    else { f.record.phase = 'done'; f.job.head = f.pr.head.sha = 'd'.repeat(40); }
    const cycle = structuredClone(f.job.repairCycle), model = vi.spyOn(f.engine.agents, 'run'), ci = vi.spyOn(f.delivery, 'queueCIRepair'), source = vi.spyOn(f.delivery, 'queueSourceRepair');
    const result = leadResult(f, { outcome: 'blocked', resolution: kind === 'older-metadata' ? null : { kind: 'source-repair', findingIds: ['pr-metadata'], evidenceIds: ['checks'], release: null } });
    result.findings[0].status = 'open';
    await expect(acceptLead(f, result)).rejects.toThrow('Unadmitted reserved PR metadata');
    expect(f.job.steps.at(-1)?.result).toEqual(result); expect(f.job.repairCycle).toEqual(cycle); expect(f.job.ciRepairs).toBeUndefined();
    expect(source).not.toHaveBeenCalled(); expect(ci).not.toHaveBeenCalled(); expect(model).not.toHaveBeenCalled(); expect(f.writes.patches).toBe(kind === 'older-metadata' ? 1 : 0);
    if (kind === 'source-resolution') expect(f.job.prMetadataRepair).toBeUndefined();
    else expect(f.record).toEqual({ ...record, phase: 'done' });
});

test('fresh native Lead review accepts later authenticated human input while retaining the original binding', async () => {
    const f = metadataFixture(), binding = structuredClone(f.record.binding);
    await f.run(() => harnessPrepare(f.delivery, f.job, f.root, true)); f.store.finishClaim(f.claim.id, 'completed');
    addMetadataHumanInput(f);
    expect(deliveryInputSha256(f.store, f.job.key)).not.toBe(binding.inputSha256);
    await acceptLead(f, leadResult(f));
    expect(f.record.phase).toBe('done'); await claimedDelivery(f.store,f.job,()=>requireMetadataReview(f.delivery, f.job));
    expect(f.record.binding).toEqual(binding); expect(f.writes.patches).toBe(1);
});

test('authenticated human input before metadata dispatch retains the original input fence', async () => {
    const f = metadataFixture(); addMetadataHumanInput(f);
    expect(deliveryInputSha256(f.store, f.job.key)).not.toBe(f.record.binding.inputSha256);
    await expect(f.run(() => publishMetadata(f.delivery, f.job))).rejects.toThrow('inputs or controls changed');
    expect(f.writes.patches).toBe(0);
});

test.each(['blocked', 'failed'] as const)('a native metadata-verifying %s verdict reaches ordinary CI routing without merge proof', async outcome => {
    const f = metadataFixture(), model = vi.spyOn(f.engine.agents, 'run');
    await f.run(() => harnessPrepare(f.delivery, f.job, f.root, true)); f.store.finishClaim(f.claim.id, 'completed');
    const api = f.delivery.api.bind(f.delivery);
    f.delivery.api = async path => path.includes('/check-runs') ? { total_count: 1, check_runs: [{ id: 10, head_sha: f.job.head,
        name: 'unit', status: 'completed', conclusion: 'failure' }] } :
        path.endsWith('/status') ? { sha: f.job.head, total_count: 0, statuses: [], state: 'success' } : api(path);
    const ci = vi.spyOn(f.delivery, 'queueCIRepair');
    const native = await acceptLead(f, leadResult(f, { outcome, resolution: null, blocker: 'Exact-head unit check failed' }));
    expect(ci).toHaveBeenCalledWith(f.job); expect(f.job.ciRepairs?.at(-1)?.phase).toBe('diagnose');
    expect(f.job.steps.at(-1)).toMatchObject({ workerId: native.worker.id, nativeResultSha256: native.resultSha256 });
    expect(f.record.phase).toBe('review'); expect(f.record.review).toBeUndefined();
    await expect(claimedDelivery(f.store,f.job,()=>requireMetadataReview(f.delivery, f.job))).rejects.toThrow('Fresh independent');
    expect(f.writes.patches).toBe(1); expect(model).not.toHaveBeenCalled();
});

test.each([
    ['blocked', false], ['failed', false], ['blocked', true], ['failed', true],
] as const)('a native metadata-verifying %s source verdict uses bounded repair with failing CI=%s', async (outcome, failingCI) => {
    const f = metadataFixture(), model = vi.spyOn(f.engine.agents, 'run');
    await f.run(() => harnessPrepare(f.delivery, f.job, f.root, true)); f.store.finishClaim(f.claim.id, 'completed');
    const history = structuredClone(f.record), effectId = `harness:${f.job.id}:pr-metadata:${f.record.id}`, effect = structuredClone(f.store.getEffect(effectId));
    const api = f.delivery.api.bind(f.delivery);
    f.delivery.api = async path => path.includes('/check-runs') ? { total_count: 1, check_runs: [{ id: 10, head_sha: f.job.head,
        name: 'unit', status: 'completed', conclusion: failingCI ? 'failure' : 'success' }] } :
        path.endsWith('/status') ? { sha: f.job.head, total_count: 0, statuses: [], state: 'success' } : api(path);
    const path = resolve(f.root, 'source-review.json');
    writeFileSync(path, JSON.stringify({ head: f.job.head, finding: 'src', detail: 'Unrelated source defect requires repair' }));
    const result = leadResult(f, { outcome, blocker: 'Unrelated source defect requires repair',
        resolution: { kind: 'source-repair', findingIds: ['src'], evidenceIds: ['src-ev'], release: null } });
    result.findings.push({ id: 'src', status: 'open', summary: 'Unrelated source defect', expected: 'Correct source behavior', actual: 'Defect observed', attempts: 0 });
    result.evidence.push({ id: 'src-ev', kind: 'review', commit: f.job.head, path, summary: 'Exact-head source defect', url: '', environment: 'fixture', observedAt: '' });
    const ci = vi.spyOn(f.delivery, 'queueCIRepair'), source = vi.spyOn(f.delivery, 'queueSourceRepair');
    const native = await acceptLead(f, result);
    expect(ci).toHaveBeenCalledOnce(); expect(ci).toHaveBeenCalledWith(f.job);
    if (failingCI) {
        expect(source).not.toHaveBeenCalled(); expect(f.job).toMatchObject({ stage: 'lead-pr', status: 'queued' });
        expect(f.job.ciRepairs?.at(-1)?.phase).toBe('diagnose'); expect(f.job.repairCycle).toBeUndefined();
    } else {
        expect(source).toHaveBeenCalledOnce(); expect(source).toHaveBeenCalledWith(f.job, result, f.root);
        expect(ci.mock.invocationCallOrder[0]).toBeLessThan(source.mock.invocationCallOrder[0]);
        expect(f.job).toMatchObject({ stage: 'update-base', status: 'queued', repairReason: 'source',
            repairCycle: { pendingFindingIds: ['src'], attempts: 1, findingAttempts: { src: 1 }, phase: 'repair', publishedHead: f.job.head } });
        expect(f.job.ciRepairs).toBeUndefined();
    }
    expect(f.job.steps.at(-1)).toMatchObject({ workerId: native.worker.id, nativeResultSha256: native.resultSha256 });
    expect(f.store.state.knowledge?.learningConsumed?.some(id => id.startsWith(`job:${f.job.id}:lead-pr:`))).toBe(true);
    expect(f.record).toEqual(history); expect(f.record.phase).toBe('review'); expect(f.record.review).toBeUndefined();
    await expect(claimedDelivery(f.store,f.job,()=>requireMetadataReview(f.delivery, f.job))).rejects.toThrow('Fresh independent');
    expect(f.store.getEffect(effectId)).toEqual(effect); expect(f.writes.patches).toBe(1); expect(model).not.toHaveBeenCalled();
});

test.each(['review', 'done'] as const)('verified metadata in phase %s becomes retained history on a repaired source head', async phase => {
    const f = metadataFixture(); await f.run(() => harnessPrepare(f.delivery, f.job, f.root, true));
    f.record.phase = phase; f.job.head = 'd'.repeat(40);
    const history = structuredClone(f.record);
    expect(metadataAppliesToHead(f.store, f.job)).toBe(false);
    await requireMetadataReview(f.delivery,f.job);
    expect(f.record).toEqual(history); expect(f.writes.patches).toBe(1);
    const effect = f.store.getEffect(`harness:${f.job.id}:pr-metadata:${f.record.id}`)!;
    f.store.putEffect({ ...effect, status: 'uncertain' });
    expect(metadataAppliesToHead(f.store, f.job)).toBe(true);
});

test.each(['pr-metadata', 'source'] as const)('provider-wait CI diagnosis keeps the admitted one-shot boundary for %s plans', async kind => {
    const f = metadataFixture(false), model = vi.spyOn(f.engine.agents, 'run').mockImplementation(async () => { f.nativeAssessment(); return f.verdict as any; });
    await f.run(() => harnessPrepare(f.delivery, f.job, f.root, true)); f.store.finishClaim(f.claim.id, 'completed');
    const history = structuredClone(f.record), id = `harness:${f.job.id}:pr-metadata:${f.record.id}`, effect = structuredClone(f.store.getEffect(id));
    const execute = f.delivery.execute; let failing = false;
    f.delivery.execute = (async (program, args, options) => {
        if (program === 'gh' && args[1]?.includes('/check-runs')) return JSON.stringify({ total_count: 1, check_runs: [{ id: 10, head_sha: f.job.head, name: 'unit', status: failing ? 'completed' : 'in_progress', conclusion: failing ? 'failure' : null }] });
        if (program === 'gh' && args[1]?.endsWith('/status')) return JSON.stringify({ sha: f.job.head, total_count: 0, statuses: [], state: 'success' });
        return execute(program, args, options);
    }) as typeof execute;
    await acceptLead(f, leadResult(f, { outcome: 'blocked', resolution: { kind: 'provider-wait', findingIds: ['checks'], evidenceIds: ['checks'], release: null } }));
    failing = true;
    await f.delivery.observe(); expect(f.job.ciRepairs?.at(-1)?.phase).toBe('diagnose');
    model.mockImplementation(async (_role, prompt) => {
        expect(prompt).not.toContain('pr-metadata (return');
        return { ...plan(kind), title: f.selected.title, body: f.selected.body } as any;
    });
    await claimedDelivery(f.store,f.job,()=>f.delivery.step(f.job));
    expect(f.job.ciRepairs!.at(-1)?.phase).toBe(kind === 'pr-metadata' ? 'blocked' : 'apply');
    if (kind === 'pr-metadata') expect(f.job.detail).toContain('one-shot');
    expect(f.record).toEqual(history); expect(f.store.getEffect(id)).toEqual(effect);
    expect(f.writes.patches).toBe(1); expect(model).toHaveBeenCalledTimes(2);
    await expect(claimedDelivery(f.store,f.job,()=>requireMetadataReview(f.delivery, f.job))).rejects.toThrow('Fresh independent');
});

test.each(['permission', 'human-hold', 'scope', 'uncertain-effect', 'release'] as const)('metadata verification does not release a genuine %s gate', async kind => {
    const f = metadataFixture(); await f.run(() => harnessPrepare(f.delivery, f.job, f.root, true));
    f.store.finishClaim(f.claim.id, 'completed'); f.job.stage = 'lead-pr';
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, 'gated-lead', 'lead-pr')!;
    const result = leadResult(f, { outcome: 'failed', resolution: { kind: kind === 'release' ? 'provider-wait' : kind,
        findingIds: ['gate'], evidenceIds: ['checks'], release: kind === 'release' ? { registry: 'npm', package: 'fixture', minimum: '1.0.0' } : null } });
    f.job.steps.push({ stage: 'lead-pr', result });
    const before = new Set(f.store.state.workLog?.map(w => w.id));
    f.nativeAssessment(result, { stage: 'github-lead-pr', claim });
    await expect(withAssignment(claim, 'delivery', () => acceptMetadataReview(f.delivery, f.job, result, before))).rejects.toThrow('explicitly verify');
    expect(f.record.phase).toBe('review'); expect(f.record.review).toBeUndefined(); expect(f.writes.patches).toBe(1);
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
    await expect(f.run(() => claimedDelivery(f.store,f.job,()=>requireMetadataReview(f.delivery, f.job)))).rejects.toThrow('Fresh independent');
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
    await withAssignment(claim, 'delivery', () => claimedDelivery(f.store,f.job,()=>requireMetadataReview(f.delivery, f.job)));
    f.pr.body += '\nNew human edit';
    await expect(withAssignment(claim, 'delivery', () => claimedDelivery(f.store,f.job,()=>requireMetadataReview(f.delivery, f.job)))).rejects.toThrow('Reviewed metadata changed');
});
